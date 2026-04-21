require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startPolling } = require('./services/thingspeak');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/readings', require('./routes/readings'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/health', require('./routes/health'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/', (req, res) => res.json({ status: 'AirSense Backend running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startPolling();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
