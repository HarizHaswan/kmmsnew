const express = require("express");
const Student = require("../models/Student");
const Class = require("../models/Class");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect, authorize } = require("../middleware/authMiddleware");

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
      // Filter by teacher's assigned class
      if (req.user.classAssigned) {
        const classDoc = await Class.findOne({
          className: req.user.classAssigned.trim()
        });
        if (classDoc) {
          query.classId = classDoc._id;
        } else {
          // Class not found — return empty
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

    // Check and update graduation status for all students
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

    // BULK INSERT
    if (Array.isArray(data)) {
      for (const s of data) {
        sanitize(s);

        if (!s.dateOfBirth) {
          return res.status(400).json({
            message: "dateOfBirth is required",
          });
        }

        s.age = calculateAge(s.dateOfBirth);
        s.registrationDate = new Date(); // Always use current date
        
        // Check graduation status
        s.status = checkGraduationStatus(s.dateOfBirth, s.status || "active");
      }

      const students = await Student.insertMany(data, {
        runValidators: true,
      });

      return res.status(201).json(students);
    }

    // SINGLE INSERT
    sanitize(data);

    if (!data.dateOfBirth) {
      return res.status(400).json({
        message: "dateOfBirth is required",
      });
    }

    data.age = calculateAge(data.dateOfBirth);
    data.registrationDate = new Date(); // Always use current date
    
    // Check graduation status
    data.status = checkGraduationStatus(data.dateOfBirth, data.status || "active");

    // Create parent user account if email and password provided
    if (data.parentEmail && data.parentPassword) {
      try {
        // Check if parent email already exists
        const existingParent = await User.findOne({ email: data.parentEmail });
        
        if (existingParent) {
          // If parent exists, link to existing parent
          data.parentId = existingParent._id;
        } else {
          // Create new parent account
          const hashedPassword = await bcrypt.hash(data.parentPassword, 10);
          
          const parentUser = await User.create({
            name: data.parentName,
            email: data.parentEmail,
            password: hashedPassword,
            role: "parent",
          });
          
          data.parentId = parentUser._id;
        }
        
        // Remove email and password from student data
        delete data.parentEmail;
        delete data.parentPassword;
      } catch (err) {
        return res.status(400).json({
          message: "Failed to create parent account: " + err.message,
        });
      }
    }

    const student = await Student.create(data);
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
      
      // Check if status should be auto-updated to graduated
      if (!req.body.status || req.body.status === "active") {
        req.body.status = checkGraduationStatus(req.body.dateOfBirth, req.body.status || "active");
      }
    }

    // Don't allow updating registrationDate
    delete req.body.registrationDate;

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).populate("classId", "className yearGroup")
      .populate("parentId", "name email");

    if (!updated) {
      return res.status(404).json({ message: "Student not found" });
    }

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

    if (!removed) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student removed" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;