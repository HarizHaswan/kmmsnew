const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  amountPaid: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  method: { type: String, default: "cash" },
  note: { type: String },
  receiptUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
