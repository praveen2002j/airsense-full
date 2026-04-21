import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getDashboardData = async () => {
  const { data } = await client.get('/readings/latest');
  return data;
};

export const getReadingHistory = async ({ limit = 100, hours = 24 } = {}) => {
  const { data } = await client.get('/readings/history', { params: { limit, hours } });
  return data;
};

export const getSystemHealth = async () => {
  const { data } = await client.get('/health');
  return data;
};

export const getActiveAlerts = async () => {
  const { data } = await client.get('/alerts/active');
  return data;
};

export const getAlertHistory = async ({ limit = 50 } = {}) => {
  const { data } = await client.get('/alerts/history', { params: { limit } });
  return data;
};

export const getAnalyticsSummary = async (range = '24h') => {
  const { data } = await client.get('/analytics/summary', { params: { range } });
  return data;
};

export const getAnalyticsTimeseries = async (range = '24h', points = 60) => {
  const { data } = await client.get('/analytics/timeseries', { params: { range, points } });
  return data;
};

export const getAnalyticsCorrelation = async (x = 'co2', y = 'occupancy', range = '7d') => {
  const { data } = await client.get('/analytics/correlation', { params: { x, y, range } });
  return data;
};

export const getAnalyticsExportUrl = (range = '7d') =>
  `${BASE_URL}/analytics/export?range=${encodeURIComponent(range)}`;

export const getAnalyticsPdfUrl = (range = '7d') =>
  `${BASE_URL}/analytics/export-pdf?range=${encodeURIComponent(range)}`;

export const getMLInsights = async () => {
  const { data } = await client.get('/analytics/insights');
  return data;
};

export const getAnomalies = async (range = 'all') => {
  const { data } = await client.get('/analytics/anomalies', { params: { range } });
  return data;
};

export const getMLMeta = async () => {
  const { data } = await client.get('/analytics/meta');
  return data;
};

export const getInsights = () => {
  return [
    { id: 1, title: 'CO\u2082 Rising Trend', description: 'CO\u2082 levels have increased by 15% in the last hour.', trend: 'up', type: 'info' },
    { id: 2, title: 'Peak Hours Pattern', description: 'High occupancy usually detected between 2 PM and 4 PM.', trend: 'up', type: 'info' },
    { id: 3, title: 'Temperature Stable', description: 'Temperature maintained within 21\u201324\u00b0C range.', trend: 'down', type: 'info' },
    { id: 4, title: 'Activate Ventilation', description: 'Recommended to turn on HVAC to improve air quality.', type: 'recommendation', actionLabel: 'Turn On Fan', onAction: () => console.log('Action triggered') },
  ];
};
