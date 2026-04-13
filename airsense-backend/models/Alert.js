const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true },
    title: { type: String, required: true },
    value: { type: String, required: true },
    severity: { type: String, enum: ['Warning', 'Critical'], required: true },
    entryId: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

alertSchema.index({ timestamp: -1 });
alertSchema.index({ resolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);
