const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    entryId: { type: Number, unique: true, required: true },
    timestamp: { type: Date, required: true },
    co2: { type: Number, default: null },
    temperature: { type: Number, default: null },
    humidity: { type: Number, default: null },
    co: { type: Number, default: null },
    occupancy: { type: Number, default: null },
    overallStatus: { type: String, default: 'Good' },
  },
  { timestamps: true }
);

sensorReadingSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
