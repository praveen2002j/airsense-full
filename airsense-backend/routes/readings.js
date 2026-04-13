const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const { getStatus } = require('../utils/thresholds');

// GET /api/readings/latest
router.get('/latest', async (req, res) => {
  try {
    const reading = await SensorReading.findOne().sort({ timestamp: -1 });
    if (!reading) return res.status(404).json({ error: 'No readings found' });

    res.json({
      overview: {
        status: reading.overallStatus,
        score: calcAQScore(reading),
      },
      metrics: {
        co2: {
          value: reading.co2,
          unit: 'ppm',
          status: getStatus(reading.co2, 'co2'),
          icon: 'cloud-outline',
        },
        temperature: {
          value: reading.temperature,
          unit: '°C',
          status: getStatus(reading.temperature, 'temperature'),
          icon: 'thermometer-outline',
        },
        humidity: {
          value: reading.humidity,
          unit: '%',
          status: getStatus(reading.humidity, 'humidity'),
          icon: 'water-outline',
        },
        co: {
          value: reading.co,
          unit: 'ppm',
          status: getStatus(reading.co, 'co'),
          icon: 'flame-outline',
        },
      },
      occupancy: {
        value: reading.occupancy,
        unit: 'people',
      },
      timestamp: reading.timestamp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/readings/history?limit=100&hours=24
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const hours = Number(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('timestamp co2 temperature humidity co occupancy overallStatus');

    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const calcAQScore = (reading) => {
  let score = 100;
  if (reading.co2 != null) {
    if (reading.co2 >= 1500) score -= 40;
    else if (reading.co2 >= 1000) score -= 20;
    else if (reading.co2 >= 800) score -= 10;
  }
  if (reading.co != null) {
    if (reading.co >= 35) score -= 40;
    else if (reading.co >= 9) score -= 20;
    else if (reading.co >= 4) score -= 10;
  }
  if (reading.temperature != null && reading.temperature >= 28) score -= 10;
  if (reading.humidity != null) {
    if (reading.humidity < 30 || reading.humidity > 70) score -= 10;
  }
  return Math.max(score, 0);
};

module.exports = router;
