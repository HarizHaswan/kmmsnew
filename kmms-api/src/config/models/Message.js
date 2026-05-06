const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String },
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
