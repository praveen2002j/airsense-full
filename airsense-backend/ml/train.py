"""
Trains and persists ML models for AirSense.

Models saved to ml/models/:
  - scaler.joblib       (StandardScaler fit on FEATURES)
  - iforest.joblib      (IsolationForest)
  - kmeans.joblib       (KMeans on hour + co2)
  - hour_scaler.joblib  (StandardScaler for KMeans inputs)
  - meta.joblib         (training metadata)

Run:   python train.py
"""

import os
import sys
import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

HERE = os.path.dirname(__file__)
load_dotenv(os.path.join(HERE, "..", ".env"))

MODELS_DIR = os.path.join(HERE, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURES = ["co2", "co", "temperature", "humidity", "occupancy"]


def load_readings():
    uri = os.getenv("MONGO_URI")
    if not uri:
        sys.exit("MONGO_URI missing in .env")
    client = MongoClient(uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["airsense"]
    cur = db["sensorreadings"].find(
        {}, {"_id": 0, "entryId": 1, "timestamp": 1, **{f: 1 for f in FEATURES}}
    ).sort("timestamp", 1)
    df = pd.DataFrame(list(cur))
    if df.empty:
        sys.exit("No readings to train on.")
    for f in FEATURES:
        df[f] = pd.to_numeric(df[f], errors="coerce")
    df = df.dropna(subset=FEATURES)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def main():
    df = load_readings()
    print(f"Training on {len(df)} readings ({df['timestamp'].min()} to {df['timestamp'].max()}).")

    # Anomaly detector
    scaler = StandardScaler().fit(df[FEATURES])
    X = scaler.transform(df[FEATURES])
    iforest = IsolationForest(
        n_estimators=200, contamination=0.05, random_state=42
    ).fit(X)

    # Clustering on (hour, co2)
    hour_co2 = np.column_stack([df["timestamp"].dt.hour, df["co2"]])
    hour_scaler = StandardScaler().fit(hour_co2)
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=42).fit(
        hour_scaler.transform(hour_co2)
    )

    # Persist
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(iforest, os.path.join(MODELS_DIR, "iforest.joblib"))
    joblib.dump(hour_scaler, os.path.join(MODELS_DIR, "hour_scaler.joblib"))
    joblib.dump(kmeans, os.path.join(MODELS_DIR, "kmeans.joblib"))

    meta = {
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "samples": int(len(df)),
        "features": FEATURES,
        "dateRange": {
            "from": df["timestamp"].min().isoformat(),
            "to": df["timestamp"].max().isoformat(),
        },
        "models": {
            "iforest": {"type": "IsolationForest", "n_estimators": 200, "contamination": 0.05},
            "kmeans": {"type": "KMeans", "k": 3, "inputs": ["hour", "co2"]},
        },
    }
    with open(os.path.join(MODELS_DIR, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    joblib.dump(meta, os.path.join(MODELS_DIR, "meta.joblib"))

    print(f"Saved models to {MODELS_DIR}")
    for fn in os.listdir(MODELS_DIR):
        size = os.path.getsize(os.path.join(MODELS_DIR, fn))
        print(f"  {fn} ({size:,} bytes)")


if __name__ == "__main__":
    main()
