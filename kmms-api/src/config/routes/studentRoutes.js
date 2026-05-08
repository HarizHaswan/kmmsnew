const express = require("express");
const Student = require("../models/Student");
const Class = require("../models/Class");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect, authorize } = require("../middleware/authMiddleware");
const { syncFeeTemplates } = require("../services/feeAutomationService");
const sendEmail = require("../services/emailService");

const router = express.Router();

/**
 * Helper: calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Helper: calculate age in months
 */
const calculateAgeInMonths = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  const years = today.getFullYear() - dob.getFullYear();
  const months = today.getMonth() - dob.getMonth();
  
  return years * 12 + months;
};

/**
 * Helper: auto-check graduation status based on age
 */
const checkGraduationStatus = (dateOfBirth, currentStatus) => {
  if (currentStatus !== "active") return currentStatus;
  
  const ageInMonths = calculateAgeInMonths(dateOfBirth);
  
  // If student is over 7 years old (84 months), auto-graduate
  if (ageInMonths > 84) {
    return "graduated";
  }
  
  return "active";
};

/**
 * Helper: remove empty string values
 */
const sanitize = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === "") {
      delete obj[key];
    }
  });
};

// =============================
// GET /api/students
// =============================
router.get("/", protect, async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === "teacher") {
      if (req.user.classAssigned) {
        const classDoc = await Class.findOne({
          className: req.user.classAssigned.trim()
        });
        if (classDoc) {
          query.classId = classDoc._id;
        } else {
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    } else if (req.user.role === "parent") {
      query.parentId = req.user._id;
    }

    const students = await Student.find(query)
      .populate("classId", "className yearGroup")
      .populate("parentId", "name email");

    const updatedStudents = [];
    for (const student of students) {
      const newStatus = checkGraduationStatus(student.dateOfBirth, student.status);
      if (newStatus !== student.status) {
        student.status = newStatus;
        await student.save();
      }
      updatedStudents.push(student);
    }

    res.json(updatedStudents);
  } catch (err) {
    next(err);
  }
});

// =============================
// POST /api/students (Admin)
// =============================
router.post("/", protect, authorize("admin"), async (req, res, next) => {
  try {
    let data = req.body;
    sanitize(data);

    if (!data.dateOfBirth) {
      return res.status(400).json({ message: "dateOfBirth is required" });
    }

    data.age = calculateAge(data.dateOfBirth);
    data.registrationDate = new Date();
    data.status = checkGraduationStatus(data.dateOfBirth, data.status || "active");

    if (data.parentEmail && data.parentPassword) {
      const existingParent = await User.findOne({ email: data.parentEmail.toLowerCase().trim() });
      if (existingParent) {
        data.parentId = existingParent._id;
      } else {
        const hashedPassword = await bcrypt.hash(data.parentPassword, 10);
        const parentUser = await User.create({
          name: data.parentName,
          email: data.parentEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: "parent",
          status: "Active"
        });
        data.parentId = parentUser._id;
      }
    }

    const student = await Student.create(data);
    await syncFeeTemplates({
      studentIds: [student._id],
      refreshExisting: true,
      triggeredBy: req.user._id,
    });
    return res.status(201).json(student);
  } catch (err) {
    next(err);
  }
});

// =============================
// PUT /api/students/:id (Admin)
// =============================
router.put("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    sanitize(req.body);
    if (req.body.dateOfBirth) {
      req.body.age = calculateAge(req.body.dateOfBirth);
      if (!req.body.status || req.body.status === "active") {
        req.body.status = checkGraduationStatus(req.body.dateOfBirth, req.body.status || "active");
      }
    }
    delete req.body.registrationDate;

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("classId", "className yearGroup")
      .populate("parentId", "name email");

    if (!updated) return res.status(404).json({ message: "Student not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// =============================
// DELETE /api/students/:id
// =============================
router.delete("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const removed = await Student.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student removed" });
  } catch (err) {
    next(err);
  }
});

// =============================
// POST /api/students/enroll (Public Enrollment)
// =============================
router.post("/enroll", async (req, res, next) => {
  try {
    let data = req.body;
    sanitize(data);
    const parentEmail = data.parentEmail?.toLowerCase().trim();
    const rawPassword = data.parentPassword;

    if (!data.dateOfBirth) {
      return res.status(400).json({ message: "dateOfBirth is required" });
    }

    data.age = calculateAge(data.dateOfBirth);
    data.registrationDate = new Date();
    data.status = "pending";

    if (parentEmail && rawPassword) {
      const existingParent = await User.findOne({ email: parentEmail });
      if (existingParent) {
        data.parentId = existingParent._id;
      } else {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const parentUser = await User.create({
          name: data.parentName,
          email: parentEmail,
          password: hashedPassword,
          role: "parent",
          status: "Pending",
        });
        data.parentId = parentUser._id;
      }
    }

    const student = await Student.create(data);
    const classInfo = await Class.findById(data.classId);

    // SEND EMAIL: Submission Received
    if (parentEmail) {
      await sendEmail({
        email: parentEmail,
        subject: "SmartKindy Enrollment - Application Received",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4f46e5;">Application Received!</h2>
            <p>Dear ${data.parentName},</p>
            <p>Thank you for choosing <strong>SmartKindy</strong>! We have received your enrollment application for <strong>${data.name}</strong>.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 16px;">Details Submitted:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Child Name:</strong> ${data.name}</li>
                <li><strong>Selected Class:</strong> ${classInfo?.className || 'N/A'}</li>
                <li><strong>Parent Name:</strong> ${data.parentName}</li>
              </ul>
            </div>
            <p>Our team will review your application shortly. You will receive another email once it has been approved.</p>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 SmartKindy</p>
          </div>
        `,
      });
    }

    res.status(201).json({ message: "Enrollment submitted successfully", student });
  } catch (err) {
    next(err);
  }
});

// =============================
// GET /api/students/pending (Admin)
// =============================
router.get("/pending", protect, authorize("admin"), async (req, res, next) => {
  try {
    const students = await Student.find({ status: "pending" })
      .populate("classId", "className yearGroup")
      .populate("parentId", "name email status");
    res.json(students);
  } catch (err) {
    next(err);
  }
});

// =============================
// PUT /api/students/:id/approve (Admin)
// =============================
router.put("/:id/approve", protect, authorize("admin"), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate("parentId").populate("classId");
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.status = "active";
    await student.save();

    if (student.parentId) {
      const parent = await User.findById(student.parentId);
      if (parent && parent.status === "Pending") {
        parent.status = "Active";
        await parent.save();

        // SEND EMAIL: Approval Successful
        await sendEmail({
          email: parent.email,
          subject: "SmartKindy Enrollment - Application Approved!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #10b981;">Congratulations!</h2>
              <p>Dear ${parent.name},</p>
              <p>We are happy to inform you that <strong>${student.name}</strong>'s enrollment at SmartKindy has been <strong>APPROVED</strong>!</p>
              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; font-size: 16px; color: #059669;">Your Portal Access:</h3>
                <p>You can now login to our parent portal using the following credentials:</p>
                <p><strong>URL:</strong> <a href="https://smartkindy.edu/login">smartkindy.edu/login</a></p>
                <p><strong>Email:</strong> ${parent.email}</p>
                <p><strong>Password:</strong> (The password you set during registration)</p>
              </div>
              <p>Welcome to the family!</p>
              <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 SmartKindy</p>
            </div>
          `,
        });
      }
    }

    await syncFeeTemplates({
      studentIds: [student._id],
      refreshExisting: true,
      triggeredBy: req.user._id,
    });

    res.json({ message: "Student approved successfully", student });
  } catch (err) {
    next(err);
  }
});

// =============================
// PUT /api/students/:id/reject (Admin)
// =============================
router.put("/:id/reject", protect, authorize("admin"), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate("parentId");
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.status = "withdrawn";
    await student.save();

    if (student.parentId) {
      const parent = await User.findById(student.parentId);
      // SEND EMAIL: Rejection
      await sendEmail({
        email: parent.email,
        subject: "SmartKindy Enrollment - Application Status",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #ef4444;">Enrollment Status Update</h2>
            <p>Dear ${parent.name},</p>
            <p>Thank you for your interest in SmartKindy. After reviewing your application for <strong>${student.name}</strong>, we regret to inform you that we cannot proceed with the enrollment at this time.</p>
            <p>This may be due to class capacity or other factors. If you have any questions, please contact our support team.</p>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 SmartKindy</p>
          </div>
        `,
      });
    }

    res.json({ message: "Student registration rejected", student });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
