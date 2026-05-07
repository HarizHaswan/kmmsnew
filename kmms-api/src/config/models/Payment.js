const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  amountPaid: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  method: { type: String, default: "cash" },
  note: { type: String },
  receiptUrl: { type: String },
  // "pending_verification" = submitted by parent, awaiting admin approval
  // "verified" = admin approved, counts toward invoice balance
  status: {
    type: String,
    enum: ["pending_verification", "verified"],
    default: "verified",   // Admin-recorded payments are auto-verified
  },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
