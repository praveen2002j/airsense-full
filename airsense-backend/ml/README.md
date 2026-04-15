# AirSense ML Pipeline

Offline ML layer that runs on top of the MongoDB `sensorreadings` collection.
Produces anomalies, insights, clusters, and correlations consumed by the mobile app.

## Scripts

| Script | Purpose |
|--------|---------|
| `train.py` | Fits models on all historical readings, persists to `models/` |
| `predict.py` | Loads saved models, scores every reading, writes results to Mongo |
| `analyze.py` | Legacy one-shot (train + predict in a single run) |
| `run_predict.bat` | Wrapper for Windows Task Scheduler (runs `predict.py` hourly) |

## Models

| File | Algorithm | Role |
|------|-----------|------|
| `models/iforest.joblib` | IsolationForest (n_estimators=200, contamination=0.05) | Anomaly detection on 5 features |
| `models/scaler.joblib` | StandardScaler | Z-scores CO₂/CO/temp/humidity/occupancy for IForest + reason field |
| `models/kmeans.joblib` | KMeans (k=3) | Behavior clusters on (hour, CO₂) |
| `models/hour_scaler.joblib` | StandardScaler | Normalizes hour+CO₂ before KMeans |
| `models/meta.json` | JSON | Human-readable training metadata |

## Mongo outputs

- `anomalies` — one doc per flagged reading (score, reason, feature values)
- `insights` — summary cards shown in ML Analytics screen
- `insights` (id=`meta`) — hourly pattern, cluster summary, correlations, last-run time

## Run

```bash
pip install -r requirements.txt
python train.py      # one-time / retrain after new data
python predict.py    # score + write to Mongo
```

Scheduled hourly via Windows Task Scheduler (`AirSense ML Predict` task → `run_predict.bat`).
Logs to `predict.log`.
