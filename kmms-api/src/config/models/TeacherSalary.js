const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  baseSalary: { type: Number, required: true },
  allowance: { type: Number, default: 0 },
  deduction: { type: Number, default: 0 },
  month: { type: String, required: true }, // January, February...
  year: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paidAt: { type: Date },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model("TeacherSalary", salarySchema);
