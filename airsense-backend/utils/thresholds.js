const thresholds = () => ({
  co2: {
    warning: Number(process.env.CO2_WARNING) || 1000,
    critical: Number(process.env.CO2_CRITICAL) || 1500,
  },
  co: {
    warning: Number(process.env.CO_WARNING) || 9,
    critical: Number(process.env.CO_CRITICAL) || 35,
  },
  temperature: {
    warning: Number(process.env.TEMP_WARNING) || 28,
  },
  humidity: {
    low: Number(process.env.HUMIDITY_LOW) || 30,
    high: Number(process.env.HUMIDITY_HIGH) || 70,
  },
});

const getStatus = (value, metric) => {
  const t = thresholds();
  if (metric === 'co2') {
    if (value >= t.co2.critical) return 'Critical';
    if (value >= t.co2.warning) return 'Warning';
    if (value >= 800) return 'Moderate';
    return 'Good';
  }
  if (metric === 'co') {
    if (value >= t.co.critical) return 'Critical';
    if (value >= t.co.warning) return 'Warning';
    if (value >= 4) return 'Moderate';
    return 'Good';
  }
  if (metric === 'temperature') {
    if (value >= t.temperature.warning) return 'Warning';
    return 'Good';
  }
  if (metric === 'humidity') {
    if (value < t.humidity.low || value > t.humidity.high) return 'Warning';
    return 'Good';
  }
  return 'Good';
};

const getOverallStatus = (reading) => {
  const statuses = [
    getStatus(reading.co2, 'co2'),
    getStatus(reading.co, 'co'),
    getStatus(reading.temperature, 'temperature'),
    getStatus(reading.humidity, 'humidity'),
  ];
  if (statuses.includes('Critical')) return 'Critical';
  if (statuses.includes('Warning')) return 'Warning';
  if (statuses.includes('Moderate')) return 'Moderate';
  return 'Good';
};

const generateAlerts = (reading) => {
  const t = thresholds();
  const alerts = [];

  if (reading.co2 != null) {
    if (reading.co2 >= t.co2.critical) {
      alerts.push({ metric: 'co2', title: 'CO\u2082 Critical', value: `${reading.co2} ppm`, severity: 'Critical' });
    } else if (reading.co2 >= t.co2.warning) {
      alerts.push({ metric: 'co2', title: 'CO\u2082 Warning', value: `${reading.co2} ppm`, severity: 'Warning' });
    }
  }

  if (reading.co != null) {
    if (reading.co >= t.co.critical) {
      alerts.push({ metric: 'co', title: 'CO Critical', value: `${reading.co} ppm`, severity: 'Critical' });
    } else if (reading.co >= t.co.warning) {
      alerts.push({ metric: 'co', title: 'CO Warning', value: `${reading.co} ppm`, severity: 'Warning' });
    }
  }

  if (reading.temperature != null && reading.temperature >= t.temperature.warning) {
    alerts.push({ metric: 'temperature', title: 'High Temperature', value: `${reading.temperature} \u00b0C`, severity: 'Warning' });
  }

  if (reading.humidity != null) {
    if (reading.humidity < t.humidity.low) {
      alerts.push({ metric: 'humidity', title: 'Low Humidity', value: `${reading.humidity}%`, severity: 'Warning' });
    } else if (reading.humidity > t.humidity.high) {
      alerts.push({ metric: 'humidity', title: 'High Humidity', value: `${reading.humidity}%`, severity: 'Warning' });
    }
  }

  return alerts;
};

module.exports = { thresholds, getStatus, getOverallStatus, generateAlerts };
