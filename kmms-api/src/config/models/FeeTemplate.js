const mongoose = require("mongoose");

const feeTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    feeType: {
      type: String,
      enum: ["monthly", "enrollment", "material", "custom"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    dueDay: {
      type: Number,
      min: 1,
      max: 28,
      default: 5,
    },
    appliesToAllStudents: {
      type: Boolean,
      default: false,
    },
    autoGenerate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    targetStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    startMonth: {
      type: Date,
      default: null,
    },
    endMonth: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeTemplate", feeTemplateSchema);
