"""
Evaluates a temporal CO2 regression model using actual MongoDB sensor readings.

Outputs:
  - temporal_metrics.json
  - temporal_metrics.csv
  - temporal_actual_vs_predicted.png

Run: python evaluate_temporal.py
"""

import json
import os
import sys
from datetime import datetime, timezone

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

HERE = os.path.dirname(__file__)
load_dotenv(os.path.join(HERE, "..", ".env"))

FEATURES = ["co2", "co", "temperature", "humidity", "occupancy"]


def load_readings():
    uri = os.getenv("MONGO_URI")
    if not uri:
        sys.exit("MONGO_URI missing in .env")

    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["airsense"]

    cur = db["sensorreadings"].find(
        {},
        {"_id": 0, "entryId": 1, "timestamp": 1, **{feature: 1 for feature in FEATURES}},
    ).sort("timestamp", 1)

    df = pd.DataFrame(list(cur))
    if df.empty:
        sys.exit("No sensor readings found.")

    for feature in FEATURES:
        df[feature] = pd.to_numeric(df[feature], errors="coerce")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df.dropna(subset=FEATURES).sort_values("timestamp").reset_index(drop=True)


def build_features(df):
    data = df.copy()
    data["hour"] = data["timestamp"].dt.hour
    data["dayofweek"] = data["timestamp"].dt.dayofweek
    data["month"] = data["timestamp"].dt.month
    data["elapsed_minutes"] = (
        data["timestamp"] - data["timestamp"].min()
    ).dt.total_seconds() / 60

    data["co2_lag_1"] = data["co2"].shift(1)
    data["co2_lag_3"] = data["co2"].shift(3)
    data["co2_roll_3"] = data["co2"].shift(1).rolling(3).mean()
    data["co2_lag_2"] = data["co2"].shift(2)
    data["co2_lag_6"] = data["co2"].shift(6)
    data["co2_lag_12"] = data["co2"].shift(12)
    data["co2_roll_6"] = data["co2"].shift(1).rolling(6).mean()
    data["co2_roll_12"] = data["co2"].shift(1).rolling(12).mean()
    data["target_next_co2"] = data["co2"].shift(-1)

    return data.dropna().reset_index(drop=True)


def main():
    df = build_features(load_readings())

    feature_cols = [
        "co2",
        "co2_lag_1",
        "co2_lag_2",
        "co2_lag_3",
        "co2_lag_6",
        "co2_lag_12",
        "co2_roll_3",
        "co2_roll_6",
        "co2_roll_12",
    ]

    split_idx = int(len(df) * 0.8)
    train = df.iloc[:split_idx]
    test = df.iloc[split_idx:]

    model = LinearRegression()
    model.fit(train[feature_cols], train["target_next_co2"])
    predictions = model.predict(test[feature_cols])

    rmse = float(np.sqrt(mean_squared_error(test["target_next_co2"], predictions)))
    mae = float(mean_absolute_error(test["target_next_co2"], predictions))
    r2 = float(r2_score(test["target_next_co2"], predictions))

    metrics = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "model": "Autoregressive LinearRegression",
        "target": "next co2",
        "features": feature_cols,
        "rowsUsed": int(len(df)),
        "trainRows": int(len(train)),
        "testRows": int(len(test)),
        "dateRange": {
            "from": df["timestamp"].min().isoformat(),
            "to": df["timestamp"].max().isoformat(),
        },
        "parameters": {
            "estimator": "LinearRegression",
            "current_features": ["co2"],
            "lags": [1, 2, 3, 6, 12],
            "rolling_windows": [3, 6, 12],
            "split": "chronological 80/20",
        },
        "metrics": {
            "rmse": rmse,
            "mae": mae,
            "r2": r2,
        },
    }

    with open(os.path.join(HERE, "temporal_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    pd.DataFrame(
        [
            {"Metric": "RMSE", "Value": rmse, "Unit": "ppm"},
            {"Metric": "MAE", "Value": mae, "Unit": "ppm"},
            {"Metric": "R2 Score", "Value": r2, "Unit": ""},
        ]
    ).to_csv(os.path.join(HERE, "temporal_metrics.csv"), index=False)

    chart_df = test[["timestamp", "target_next_co2"]].copy()
    chart_df["predicted_co2"] = predictions

    plt.figure(figsize=(16, 6))
    plt.plot(
        chart_df["timestamp"],
        chart_df["target_next_co2"],
        label="Actual next CO2",
        linewidth=2,
    )
    plt.plot(
        chart_df["timestamp"],
        chart_df["predicted_co2"],
        label="Predicted CO2",
        linewidth=2,
        alpha=0.8,
    )
    plt.title("Actual vs Predicted Next CO2 Trend - Real Sensor Readings")
    plt.xlabel("Timestamp")
    plt.ylabel("CO2 concentration (ppm)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, "temporal_actual_vs_predicted.png"), dpi=300)

    print(f"Rows used: {len(df)}")
    print(f"Train rows: {len(train)}")
    print(f"Test rows: {len(test)}")
    print("Model: Autoregressive LinearRegression")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"RMSE: {rmse:.4f} ppm")
    print(f"MAE: {mae:.4f} ppm")
    print(f"R2 Score: {r2:.4f}")
    print("Saved temporal_metrics.json")
    print("Saved temporal_metrics.csv")
    print("Saved temporal_actual_vs_predicted.png")


if __name__ == "__main__":
    main()
