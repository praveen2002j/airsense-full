const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');

// GET /api/health
router.get('/', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

    const latest = await SensorReading.findOne().sort({ timestamp: -1 }).select('timestamp');
    const totalReadings = await SensorReading.countDocuments();

    const lastSyncMs = latest ? Date.now() - new Date(latest.timestamp).getTime() : null;
    const lastSyncLabel = lastSyncMs != null
      ? lastSyncMs < 60000
        ? 'Just now'
        : `${Math.floor(lastSyncMs / 60000)}m ago`
      : 'Never';

    res.json({
      healthScore: dbStatus === 'Connected' && lastSyncMs != null && lastSyncMs < 60000 ? 99 : 70,
      status: dbStatus === 'Connected' ? 'Excellent' : 'Degraded',
      sensors: [
        { id: 1, name: 'CO\u2082 Sensor', status: latest ? 'Online' : 'Unknown' },
        { id: 2, name: 'Temp/Humidity Sensor', status: latest ? 'Online' : 'Unknown' },
        { id: 3, name: 'CO Sensor', status: latest ? 'Online' : 'Unknown' },
        { id: 4, name: 'Occupancy PIR', status: latest ? 'Online' : 'Unknown' },
      ],
      connectivity: [
        { id: 1, name: 'ThingSpeak', status: 'Polling' },
        { id: 2, name: 'MongoDB Atlas', status: dbStatus },
        { id: 3, name: 'Last Sync', status: lastSyncLabel },
      ],
      statistics: {
        uptime: process.uptime().toFixed(0) + 's',
        dataPoints: totalReadings.toLocaleString(),
        latency: '—',
        errors: '0',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
