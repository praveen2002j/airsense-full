const axios = require('axios');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const { getOverallStatus, generateAlerts } = require('../utils/thresholds');

const THINGSPEAK_BASE = 'https://api.thingspeak.com';

const fieldMap = () => ({
  co2: process.env.FIELD_CO2 || 'field1',
  temperature: process.env.FIELD_TEMPERATURE || 'field2',
  humidity: process.env.FIELD_HUMIDITY || 'field3',
  co: process.env.FIELD_CO || 'field4',
  occupancy: process.env.FIELD_OCCUPANCY || 'field5',
});

const parseField = (value) => {
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
};

const fetchLatestFeeds = async () => {
  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const apiKey = process.env.THINGSPEAK_READ_API_KEY;

  const url = `${THINGSPEAK_BASE}/channels/${channelId}/feeds.json`;
  const params = { results: 1 };
  if (apiKey) params.api_key = apiKey;

  const response = await axios.get(url, { params, timeout: 10000 });
  return response.data;
};

const processAndStore = async () => {
  try {
    const data = await fetchLatestFeeds();
    const feeds = data.feeds || [];

    if (!feeds.length) return;

    const feed = feeds[0];
    const fields = fieldMap();
    const entryId = feed.entry_id;

    const existing = await SensorReading.findOne({ entryId });
    if (existing) return;

    const reading = {
      entryId,
      timestamp: new Date(feed.created_at),
      co2: parseField(feed[fields.co2]),
      temperature: parseField(feed[fields.temperature]),
      humidity: parseField(feed[fields.humidity]),
      co: parseField(feed[fields.co]),
      occupancy: parseField(feed[fields.occupancy]),
    };

    reading.overallStatus = getOverallStatus(reading);

    const saved = await SensorReading.create(reading);
    console.log(`[ThingSpeak] Saved entry #${entryId} | Status: ${reading.overallStatus}`);

    await resolveOldAlerts(saved);
    const newAlerts = generateAlerts(reading);
    if (newAlerts.length) {
      const alertDocs = newAlerts.map((a) => ({
        ...a,
        entryId,
        timestamp: reading.timestamp,
      }));
      await Alert.insertMany(alertDocs);
      console.log(`[ThingSpeak] Generated ${alertDocs.length} alert(s)`);
    }
  } catch (err) {
    console.error('[ThingSpeak] Poll error:', err.message);
  }
};

const resolveOldAlerts = async (latestReading) => {
  const newAlertMetrics = generateAlerts(latestReading).map((a) => a.metric);
  await Alert.updateMany(
    { resolved: false, metric: { $nin: newAlertMetrics } },
    { resolved: true, resolvedAt: new Date() }
  );
};

const startPolling = () => {
  const interval = Number(process.env.THINGSPEAK_POLL_INTERVAL_MS) || 15000;
  console.log(`[ThingSpeak] Polling every ${interval / 1000}s`);
  processAndStore();
  setInterval(processAndStore, interval);
};

module.exports = { startPolling, fetchLatestFeeds };
