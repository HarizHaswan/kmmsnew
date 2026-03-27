const mongoose = require('mongoose');

const SickLeaveSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  reason: { type: String },
  attachment: { type: String },  // URL or path to the medical certificate
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
});

module.exports = mongoose.model('SickLeave', SickLeaveSchema);
