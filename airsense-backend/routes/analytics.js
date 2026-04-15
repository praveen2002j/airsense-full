const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');

const rangeToHours = (range) => {
  if (range === '7d') return 24 * 7;
  if (range === '30d') return 24 * 30;
  if (range === '90d') return 24 * 90;
  if (range === 'all') return 24 * 365 * 10;
  return 24;
};

// GET /api/analytics/summary?range=24h|7d|30d
router.get('/summary', async (req, res) => {
  try {
    const hours = rangeToHours(req.query.range);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [agg] = await SensorReading.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          co2Avg: { $avg: '$co2' }, co2Min: { $min: '$co2' }, co2Max: { $max: '$co2' },
          coAvg: { $avg: '$co' }, coMin: { $min: '$co' }, coMax: { $max: '$co' },
          tempAvg: { $avg: '$temperature' }, tempMin: { $min: '$temperature' }, tempMax: { $max: '$temperature' },
          humAvg: { $avg: '$humidity' }, humMin: { $min: '$humidity' }, humMax: { $max: '$humidity' },
          occAvg: { $avg: '$occupancy' }, occMax: { $max: '$occupancy' },
        },
      },
    ]);

    if (!agg) return res.json({ range: req.query.range || '24h', count: 0, metrics: {} });

    const round = (n, d = 1) => (n == null ? null : Number(n.toFixed(d)));

    res.json({
      range: req.query.range || '24h',
      count: agg.count,
      metrics: {
        co2: { avg: round(agg.co2Avg), min: round(agg.co2Min), max: round(agg.co2Max), unit: 'ppm' },
        co: { avg: round(agg.coAvg, 2), min: round(agg.coMin, 2), max: round(agg.coMax, 2), unit: 'ppm' },
        temperature: { avg: round(agg.tempAvg), min: round(agg.tempMin), max: round(agg.tempMax), unit: '°C' },
        humidity: { avg: round(agg.humAvg), min: round(agg.humMin), max: round(agg.humMax), unit: '%' },
        occupancy: { avg: round(agg.occAvg), max: round(agg.occMax), unit: 'people' },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/timeseries?range=24h|7d|30d&points=60
router.get('/timeseries', async (req, res) => {
  try {
    const hours = rangeToHours(req.query.range);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const points = Math.min(Math.max(Number(req.query.points) || 60, 10), 200);
    const bucketMs = Math.floor((hours * 60 * 60 * 1000) / points);

    const data = await SensorReading.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$timestamp' },
                { $mod: [{ $toLong: '$timestamp' }, bucketMs] },
              ],
            },
          },
          co2: { $avg: '$co2' },
          co: { $avg: '$co' },
          temperature: { $avg: '$temperature' },
          humidity: { $avg: '$humidity' },
          occupancy: { $avg: '$occupancy' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      data.map((d) => ({
        t: d._id,
        co2: d.co2 != null ? Number(d.co2.toFixed(1)) : null,
        co: d.co != null ? Number(d.co.toFixed(2)) : null,
        temperature: d.temperature != null ? Number(d.temperature.toFixed(1)) : null,
        humidity: d.humidity != null ? Number(d.humidity.toFixed(1)) : null,
        occupancy: d.occupancy != null ? Number(d.occupancy.toFixed(1)) : null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/correlation?x=co2&y=occupancy&range=7d
router.get('/correlation', async (req, res) => {
  try {
    const allowed = ['co2', 'co', 'temperature', 'humidity', 'occupancy'];
    const x = allowed.includes(req.query.x) ? req.query.x : 'co2';
    const y = allowed.includes(req.query.y) ? req.query.y : 'occupancy';
    const hours = rangeToHours(req.query.range);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({
      timestamp: { $gte: since },
      [x]: { $ne: null },
      [y]: { $ne: null },
    }).select(`${x} ${y} timestamp`).lean();

    const points = readings.map((r) => ({ x: r[x], y: r[y], t: r.timestamp }));

    let r = null;
    if (points.length > 1) {
      const n = points.length;
      const sx = points.reduce((s, p) => s + p.x, 0);
      const sy = points.reduce((s, p) => s + p.y, 0);
      const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
      const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
      const syy = points.reduce((s, p) => s + p.y * p.y, 0);
      const num = n * sxy - sx * sy;
      const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
      r = den === 0 ? 0 : Number((num / den).toFixed(3));
    }

    res.json({ x, y, count: points.length, pearson: r, points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/export?range=7d  -> CSV
router.get('/export', async (req, res) => {
  try {
    const hours = rangeToHours(req.query.range);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .select('timestamp co2 co temperature humidity occupancy overallStatus')
      .lean();

    const rows = [
      'timestamp,co2_ppm,co_ppm,temperature_c,humidity_pct,occupancy,status',
      ...readings.map((r) =>
        [
          new Date(r.timestamp).toISOString(),
          r.co2 ?? '', r.co ?? '', r.temperature ?? '', r.humidity ?? '', r.occupancy ?? '',
          r.overallStatus ?? '',
        ].join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="airsense_${req.query.range || '24h'}.csv"`);
    res.send(rows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/export-pdf?range=7d  -> PDF report
router.get('/export-pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const hours = rangeToHours(req.query.range);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const rangeLabel = req.query.range || '24h';

    const readings = await SensorReading.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .select('timestamp co2 co temperature humidity occupancy overallStatus')
      .lean();

    const db = require('mongoose').connection.db;
    const [anomalies, meta] = await Promise.all([
      db.collection('anomalies').find({ timestamp: { $gte: since } }).sort({ timestamp: -1 }).toArray(),
      db.collection('insights').findOne({ id: 'meta' }),
    ]);

    const stats = (key) => {
      const vals = readings.map((r) => r[key]).filter((v) => v != null);
      if (!vals.length) return { avg: '—', min: '—', max: '—' };
      return {
        avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
        min: Math.min(...vals).toFixed(1),
        max: Math.max(...vals).toFixed(1),
      };
    };

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="airsense_report_${rangeLabel}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#1976d2').text('AirSense Analytical Report', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#666')
      .text(`Range: ${rangeLabel}  |  Readings: ${readings.length}  |  Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor('#000').text('Air Quality Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    ['co2', 'co', 'temperature', 'humidity', 'occupancy'].forEach((k) => {
      const s = stats(k);
      const label = { co2: 'CO₂ (ppm)', co: 'CO (ppm)', temperature: 'Temperature (°C)', humidity: 'Humidity (%)', occupancy: 'Occupancy (people)' }[k];
      doc.text(`${label}:  avg ${s.avg}   min ${s.min}   max ${s.max}`);
    });
    doc.moveDown(1);

    doc.fontSize(14).text('Anomaly Detection (Isolation Forest)', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333').text(`${anomalies.length} anomalies flagged in the selected range.`);
    doc.moveDown(0.3);
    anomalies.slice(0, 15).forEach((a) => {
      const sev = a.score >= 0.7 ? 'CRITICAL' : 'BORDERLINE';
      const color = a.score >= 0.7 ? '#d32f2f' : '#f57c00';
      doc.fontSize(10).fillColor(color).text(`• [${sev}] ${new Date(a.timestamp).toLocaleString()}  score ${a.score?.toFixed(2)}`);
      doc.fontSize(9).fillColor('#555')
        .text(`   CO₂ ${a.co2} ppm, CO ${a.co}, ${a.temperature}°C, ${a.humidity}%, ${a.occupancy} people`);
      if (a.reason) doc.fontSize(9).fillColor('#777').text(`   Why: ${a.reason}`);
      doc.moveDown(0.2);
    });
    if (anomalies.length > 15) doc.fontSize(9).fillColor('#999').text(`(+ ${anomalies.length - 15} more not shown)`);
    doc.moveDown(1);

    if (meta?.correlations?.length) {
      doc.fontSize(14).fillColor('#000').text('Sensor Correlations (Pearson r)', { underline: true });
      doc.moveDown(0.3);
      meta.correlations.slice(0, 8).forEach((c) => {
        doc.fontSize(10).fillColor('#333').text(`${c.x} ↔ ${c.y}:  r = ${c.r?.toFixed(2)}`);
      });
      doc.moveDown(1);
    }

    if (meta?.clusters?.length) {
      doc.fontSize(14).fillColor('#000').text('Behavior Clusters (K-Means, k=3)', { underline: true });
      doc.moveDown(0.3);
      meta.clusters.forEach((c) => {
        doc.fontSize(10).fillColor('#333').text(`${c.label}:  ~hour ${Math.round(c.hour)},  avg ${Math.round(c.co2)} ppm,  n=${c.n}`);
      });
      doc.moveDown(1);
    }

    if (meta?.training) {
      doc.fontSize(9).fillColor('#888').text(
        `Models trained: ${new Date(meta.training.trainedAt).toLocaleString()} on ${meta.training.samples} samples`,
        { align: 'center' }
      );
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/insights  -> ML-derived insights
router.get('/insights', async (req, res) => {
  try {
    const db = require('mongoose').connection.db;
    const docs = await db.collection('insights').find({ type: { $ne: 'meta' } }).toArray();
    res.json(docs.map((d) => ({
      id: d.id || String(d._id),
      title: d.title,
      description: d.description,
      type: d.type,
      iconName: d.iconName,
      trend: d.trend,
      actionLabel: d.actionLabel,
      model: d.model,
      generatedAt: d.generatedAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/anomalies?range=all|7d|30d|90d
router.get('/anomalies', async (req, res) => {
  try {
    const hours = rangeToHours(req.query.range || 'all');
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const db = require('mongoose').connection.db;
    const docs = await db.collection('anomalies')
      .find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/meta -> model metadata, correlations, hourly pattern
router.get('/meta', async (req, res) => {
  try {
    const db = require('mongoose').connection.db;
    const meta = await db.collection('insights').findOne({ id: 'meta' });
    res.json(meta || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
