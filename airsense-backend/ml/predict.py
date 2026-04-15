"""
Loads pre-trained models and scores all readings, writes results to MongoDB.

Run after train.py. Idempotent — replaces anomalies/insights collections.

Run:   python predict.py
"""

import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

HERE = os.path.dirname(__file__)
load_dotenv(os.path.join(HERE, "..", ".env"))

MODELS_DIR = os.path.join(HERE, "models")
FEATURES = ["co2", "co", "temperature", "humidity", "occupancy"]


def require_models():
    paths = {
        "scaler": os.path.join(MODELS_DIR, "scaler.joblib"),
        "iforest": os.path.join(MODELS_DIR, "iforest.joblib"),
        "hour_scaler": os.path.join(MODELS_DIR, "hour_scaler.joblib"),
        "kmeans": os.path.join(MODELS_DIR, "kmeans.joblib"),
        "meta": os.path.join(MODELS_DIR, "meta.joblib"),
    }
    missing = [k for k, p in paths.items() if not os.path.exists(p)]
    if missing:
        sys.exit(f"Missing model files: {missing}. Run train.py first.")
    return {k: joblib.load(p) for k, p in paths.items()}


def main():
    models = require_models()
    scaler = models["scaler"]
    iforest = models["iforest"]
    hour_scaler = models["hour_scaler"]
    kmeans = models["kmeans"]
    train_meta = models["meta"]

    client = MongoClient(os.getenv("MONGO_URI"))
    try:
        db = client.get_default_database()
    except Exception:
        db = client["airsense"]
    readings_coll = db["sensorreadings"]
    anomalies_coll = db["anomalies"]
    insights_coll = db["insights"]

    cur = readings_coll.find(
        {}, {"_id": 0, "entryId": 1, "timestamp": 1, **{f: 1 for f in FEATURES}}
    ).sort("timestamp", 1)
    df = pd.DataFrame(list(cur))
    if df.empty:
        sys.exit("No readings to score.")
    for f in FEATURES:
        df[f] = pd.to_numeric(df[f], errors="coerce")
    df = df.dropna(subset=FEATURES)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    print(f"Scoring {len(df)} readings.")

    # Anomaly scoring
    X = scaler.transform(df[FEATURES])
    df["anomaly"] = iforest.predict(X) == -1
    df["anomaly_score"] = -iforest.score_samples(X)

    # Human-readable reasons: top deviating feature(s) by |z-score|
    UNITS = {"co2": "ppm", "co": "ppm", "temperature": "\u00b0C", "humidity": "%", "occupancy": "people"}
    LABELS = {"co2": "CO\u2082", "co": "CO", "temperature": "Temp", "humidity": "Humidity", "occupancy": "Occupancy"}
    reasons = []
    for i, row in df.reset_index(drop=True).iterrows():
        zs = X[i]
        order = np.argsort(-np.abs(zs))
        parts = []
        for j in order[:2]:
            if abs(zs[j]) < 1.0:
                continue
            f = FEATURES[j]
            direction = "above" if zs[j] > 0 else "below"
            parts.append(f"{LABELS[f]} {row[f]:.1f}{UNITS[f]} ({abs(zs[j]):.1f}\u03c3 {direction} mean)")
        reasons.append("; ".join(parts) if parts else "Multivariate outlier")
    df["reason"] = reasons

    # Cluster assignment
    hour_co2 = np.column_stack([df["timestamp"].dt.hour, df["co2"]])
    df["cluster"] = kmeans.predict(hour_scaler.transform(hour_co2))

    # Aggregations for insights
    df["hour"] = df["timestamp"].dt.hour
    hourly = df.groupby("hour").agg(
        co2_avg=("co2", "mean"),
        occupancy_avg=("occupancy", "mean"),
        temp_avg=("temperature", "mean"),
        hum_avg=("humidity", "mean"),
        n=("co2", "count"),
    ).reset_index()

    cluster_summary = df.groupby("cluster").agg(
        hour=("hour", "mean"),
        co2=("co2", "mean"),
        n=("co2", "count"),
    ).reset_index().sort_values("co2").reset_index(drop=True)
    cluster_summary["label"] = ["Low", "Medium", "High"][: len(cluster_summary)]

    cm = df[FEATURES].corr(method="pearson").round(3)
    pairs = []
    for a in FEATURES:
        for b in FEATURES:
            if a < b:
                pairs.append({"x": a, "y": b, "r": float(cm.loc[a, b])})
    pairs.sort(key=lambda p: abs(p["r"]), reverse=True)

    # Write anomalies
    anomalies_coll.delete_many({})
    anom_rows = df[df["anomaly"]].to_dict("records")
    if anom_rows:
        anomalies_coll.insert_many([
            {
                "entryId": int(r["entryId"]),
                "timestamp": r["timestamp"].to_pydatetime(),
                "co2": r["co2"], "co": r["co"],
                "temperature": r["temperature"], "humidity": r["humidity"],
                "occupancy": r["occupancy"],
                "score": float(r["anomaly_score"]),
                "reason": r["reason"],
                "model": "IsolationForest",
            } for r in anom_rows
        ])
    print(f"Wrote {len(anom_rows)} anomalies.")

    # Build insights
    now = datetime.now(timezone.utc)
    n_anom = int(df["anomaly"].sum())
    n_total = len(df)
    insights = [{
        "id": "anomalies-summary",
        "title": "Anomaly Detection",
        "description": f"Isolation Forest flagged {n_anom} of {n_total} readings ({n_anom / n_total:.1%}).",
        "type": "info",
        "iconName": "alert-circle-outline",
        "trend": "up" if n_anom > 0 else "down",
        "generatedAt": now,
        "model": "IsolationForest",
    }]

    if not hourly.empty:
        peak = hourly.loc[hourly["co2_avg"].idxmax()]
        low = hourly.loc[hourly["co2_avg"].idxmin()]
        insights.append({
            "id": "peak-hour",
            "title": "Peak CO\u2082 Hour",
            "description": f"Highest avg CO\u2082 around {int(peak['hour']):02d}:00 ({peak['co2_avg']:.0f} ppm). Lowest at {int(low['hour']):02d}:00 ({low['co2_avg']:.0f} ppm).",
            "type": "info",
            "iconName": "time-outline",
            "trend": "up",
            "generatedAt": now,
            "model": "GroupBy aggregation",
        })

    if len(cluster_summary) >= 2:
        high = cluster_summary.iloc[-1]
        insights.append({
            "id": "behavior-cluster",
            "title": "Behavior Cluster",
            "description": f"\"{high['label']}\" CO\u2082 cluster centers at hour {int(high['hour'])} with avg {high['co2']:.0f} ppm ({int(high['n'])} readings).",
            "type": "info",
            "iconName": "people-outline",
            "trend": "up",
            "generatedAt": now,
            "model": "KMeans (k=3)",
        })

    if pairs:
        top = pairs[0]
        insights.append({
            "id": "top-correlation",
            "title": "Strongest Correlation",
            "description": f"{top['x']} vs {top['y']} -> Pearson r = {top['r']:.2f}.",
            "type": "info",
            "iconName": "git-compare-outline",
            "trend": "up" if top["r"] > 0 else "down",
            "generatedAt": now,
            "model": "Pearson correlation",
        })

    if n_anom > n_total * 0.05:
        insights.append({
            "id": "rec-ventilation",
            "title": "Activate Ventilation",
            "description": "High anomaly rate detected. Recommend HVAC during peak CO\u2082 hours.",
            "type": "recommendation",
            "iconName": "flash-outline",
            "actionLabel": "Turn On Fan",
            "generatedAt": now,
            "model": "Rule from IsolationForest output",
        })

    insights_coll.delete_many({})
    insights_coll.insert_many(insights)
    print(f"Wrote {len(insights)} insights.")

    insights_coll.update_one(
        {"id": "meta"},
        {"$set": {
            "id": "meta",
            "title": "Model Metadata",
            "type": "meta",
            "lastRun": now,
            "readingsAnalyzed": int(n_total),
            "anomalyCount": n_anom,
            "correlations": pairs,
            "hourlyPattern": hourly.to_dict("records"),
            "clusters": cluster_summary.to_dict("records"),
            "training": {
                "trainedAt": train_meta.get("trainedAt"),
                "samples": train_meta.get("samples"),
                "models": train_meta.get("models"),
            },
        }},
        upsert=True,
    )

    print("Done.")


if __name__ == "__main__":
    main()
