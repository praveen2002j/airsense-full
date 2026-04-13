const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts/active
router.get('/active', async (req, res) => {
  try {
    const alerts = await Alert.find({ resolved: false })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(alerts.map((a) => ({
      id: a._id,
      title: a.title,
      value: a.value,
      severity: a.severity,
      metric: a.metric,
      time: a.timestamp,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/history?limit=50
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const [total, critical, warning, recent] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ severity: 'Critical' }),
      Alert.countDocuments({ severity: 'Warning' }),
      Alert.find().sort({ timestamp: -1 }).limit(limit),
    ]);

    const dayAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRaw = await Alert.aggregate([
      { $match: { timestamp: { $gte: dayAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          alerts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      statistics: {
        total,
        critical,
        warning,
        safe: total - critical - warning,
      },
      chartData: weeklyRaw.map((d) => ({ day: d._id, alerts: d.alerts })),
      recent: recent.map((a) => ({
        id: a._id,
        title: a.title,
        value: a.value,
        severity: a.severity,
        metric: a.metric,
        time: a.timestamp,
        resolved: a.resolved,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
