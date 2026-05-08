const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: 4,
      max: 6,
    },

    // ✅ NEW: reference Class
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    parentName: {
      type: String,
      required: false,
      default: "",
    },
    parentIcNumber: {
      type: String,
      default: "",
      trim: true,
    },
    parentPhoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    homeAddress: {
      type: String,
      default: "",
      trim: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },


    dateOfBirth: Date,
    registrationDate: Date,
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },

    status: {
      type: String,
      enum: ["active", "graduated", "withdrawn", "pending"],
      default: "active",
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
