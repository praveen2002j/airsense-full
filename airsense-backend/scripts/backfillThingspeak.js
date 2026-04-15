require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');
const { getOverallStatus, generateAlerts } = require('../utils/thresholds');

const MAX_RESULTS = 8000;

const fieldMap = () => ({
  co2: process.env.FIELD_CO2 || 'field1',
  temperature: process.env.FIELD_TEMPERATURE || 'field2',
  humidity: process.env.FIELD_HUMIDITY || 'field3',
  co: process.env.FIELD_CO || 'field4',
  occupancy: process.env.FIELD_OCCUPANCY || 'field5',
});

const parseField = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Fetching ThingSpeak history...');

  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const apiKey = process.env.THINGSPEAK_READ_API_KEY;

  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
  const params = { results: MAX_RESULTS };
  if (apiKey) params.api_key = apiKey;

  const { data } = await axios.get(url, { params, timeout: 30000 });
  const feeds = data.feeds || [];
  console.log(`Fetched ${feeds.length} feeds from ThingSpeak`);

  if (!feeds.length) {
    console.log('No feeds to import.');
    await mongoose.disconnect();
    return;
  }

  const fields = fieldMap();
  const existingIds = new Set(
    (await SensorReading.find({ entryId: { $gt: 0 } }).select('entryId').lean()).map((r) => r.entryId)
  );

  const docs = [];
  const alertDocs = [];

  for (const feed of feeds) {
    const entryId = feed.entry_id;
    if (existingIds.has(entryId)) continue;

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
    docs.push(reading);

    const alerts = generateAlerts(reading);
    for (const a of alerts) {
      alertDocs.push({ ...a, entryId, timestamp: reading.timestamp, resolved: true, resolvedAt: reading.timestamp });
    }
  }

  if (docs.length) {
    await SensorReading.insertMany(docs, { ordered: false });
    console.log(`Inserted ${docs.length} new readings`);
  } else {
    console.log('All ThingSpeak entries already exist in DB.');
  }

  if (alertDocs.length) {
    await Alert.insertMany(alertDocs, { ordered: false });
    console.log(`Inserted ${alertDocs.length} historical alerts (resolved)`);
  }

  // Date range summary
  const oldest = await SensorReading.findOne().sort({ timestamp: 1 }).select('timestamp');
  const newest = await SensorReading.findOne().sort({ timestamp: -1 }).select('timestamp');
  if (oldest && newest) {
    const days = ((newest.timestamp - oldest.timestamp) / (1000 * 60 * 60 * 24)).toFixed(1);
    console.log(`Data range: ${oldest.timestamp.toISOString()} → ${newest.timestamp.toISOString()} (${days} days)`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
