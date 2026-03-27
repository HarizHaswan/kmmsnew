const Student = require("../models/Student");
const User = require("../models/User");
const bcrypt = require("bcryptjs"); // Import bcryptjs

const calculateAge = (dob) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

exports.getStudents = async (req, res, next) => {
  try {
    let query = {};
    if (req.user && req.user.role === "teacher") query.teacherId = req.user._id;
    if (req.user && req.user.role === "parent") query.parentId = req.user._id;

    const students = await Student.find(query)
      .populate("teacherId", "name email")
      .populate("parentId", "name email")
      .populate("classId", "className level");

    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const s = await Student.findById(req.params.id)
      .populate("teacherId", "name")
      .populate("parentId", "name")
      .populate("classId", "className");
    if (!s) return res.status(404).json({ message: "Student not found" });
    res.json(s);
  } catch (err) { next(err); }
};

// CREATE STUDENT (With Manual Hashing Fix)
exports.createStudent = async (req, res, next) => {
  try {
    const {
      name, dateOfBirth, gender, registrationDate, classId,
      parentName, parentEmail, parentPassword, teacherId, status,
      isExistingParent
    } = req.body;

    console.log("--- CREATING STUDENT ---");

    // 1. Calculate Age
    const age = calculateAge(dateOfBirth);

    // 2. Validate Parent
    let existingParentUser = null;

    if (isExistingParent) {
      if (!parentEmail) return res.status(400).json({ message: "Existing parent email is required." });
      existingParentUser = await User.findOne({ email: parentEmail.toLowerCase().trim(), role: 'parent' });
      if (!existingParentUser) return res.status(404).json({ message: "Parent not found with that email." });
    } else {
      if (parentEmail && !parentPassword) {
        return res.status(400).json({ message: "Parent password is required for new parent." });
      }
      if (parentEmail) {
        const existingUser = await User.findOne({ email: parentEmail.toLowerCase().trim() });
        if (existingUser) {
          return res.status(400).json({ message: "Parent email already exists. Use 'Existing Parent' option." });
        }
      }
    }

    // 4. Create Student
    const newStudent = await Student.create({
      name, dateOfBirth, age, gender, registrationDate, classId,
      parentName: existingParentUser ? existingParentUser.name : parentName, 
      teacherId: teacherId || undefined, 
      status: status || "active",
      parentId: existingParentUser ? existingParentUser._id : undefined
    });

    // 5. Create Parent User (MANUALLY HASH PASSWORD) if new parent
    if (!isExistingParent && parentEmail && parentPassword) {
      const cleanEmail = parentEmail.toLowerCase().trim();
      const cleanPassword = parentPassword.trim();

      // Hash it here to be safe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(cleanPassword, salt);

      const newParent = new User({
        name: parentName,
        email: cleanEmail,
        password: hashedPassword, // Store the hash directly
        role: "parent",
        childStudentId: newStudent._id,
      });

      await newParent.save(); // User.js hook will skip hashing because it detects the hash
      
      console.log("✅ Parent Created:", cleanEmail);

      // Link Student back to new parent
      newStudent.parentId = newParent._id;
      await newStudent.save();
    } else if (isExistingParent && existingParentUser) {
      console.log("✅ Linked to Existing Parent ID:", existingParentUser._id);
    }

    res.status(201).json(newStudent);
  } catch (err) {
    console.error("Create Student Error:", err);
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    if (req.body.dateOfBirth) req.body.age = calculateAge(req.body.dateOfBirth);
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Student not found" });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student removed" });
  } catch (err) { next(err); }
};