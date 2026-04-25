const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Fetch latest reading
    const latest = await SensorReading.findOne().sort({ timestamp: -1 });

    // Fetch last 10 readings for trend context
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await SensorReading.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('timestamp co2 temperature humidity co occupancy overallStatus');

    // Fetch active alerts
    let activeAlerts = [];
    try {
      activeAlerts = await Alert.find({ resolved: false }).limit(5).select('metric severity title value');
    } catch (_) {}

    const dataContext = latest ? `
CURRENT SENSOR READINGS (as of ${new Date(latest.timestamp).toLocaleString()}):
- CO2: ${latest.co2 ?? 'N/A'} ppm
- Temperature: ${latest.temperature ?? 'N/A'} °C
- Humidity: ${latest.humidity ?? 'N/A'} %
- CO: ${latest.co ?? 'N/A'} ppm
- Occupancy: ${latest.occupancy ?? 'N/A'} people
- Overall Status: ${latest.overallStatus}

RECENT TREND (last 10 readings, newest first):
${recent.map(r => `  [${new Date(r.timestamp).toLocaleTimeString()}] CO2:${r.co2} Temp:${r.temperature}°C Humidity:${r.humidity}% CO:${r.co} Occupancy:${r.occupancy} Status:${r.overallStatus}`).join('\n')}

ACTIVE ALERTS: ${activeAlerts.length === 0 ? 'None' : activeAlerts.map(a => `${a.title} (${a.severity}) - ${a.value}`).join(', ')}

THRESHOLDS:
- CO2: Warning >1000ppm, Critical >1500ppm
- CO: Warning >9ppm, Critical >35ppm
- Temperature: Warning >28°C
- Humidity: Warning <30% or >70%
` : 'No sensor data available currently.';

    const systemPrompt = `You are AirSense AI, an intelligent air quality monitoring assistant embedded in the AirSense dashboard. You help users understand their indoor air quality data, explain trends, detect anomalies, and support decisions.

${dataContext}

DASHBOARD SECTIONS:
- Home: Real-time air quality overview with current metrics
- System Health: Sensor connectivity and system status
- Alerts: Active and historical alerts
- Analytics: Data charts, trends, CO2/CO levels, anomaly detection

GUIDELINES:
- Always base your answers on the real data provided above
- Explain trends, anomalies, and comparisons clearly
- Give actionable recommendations when conditions are poor
- If CO2 > 1000ppm suggest ventilation; if > 1500ppm urgently recommend leaving or ventilating
- If CO > 9ppm suggest investigating sources; if > 35ppm recommend evacuation
- Guide users to relevant dashboard sections when helpful
- Be concise but informative (2-4 sentences)
- If no data is available, say so honestly`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to get response. Please try again.' });
  }
});

module.exports = router;
