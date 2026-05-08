const User = require("../models/User");
const generateToken = require("../../utils/generateToken");
const bcrypt = require("bcryptjs");

// REGISTER
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password: password.trim(),
      role: role.toLowerCase(),
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      classAssigned: user.classAssigned,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    console.log("--- LOGIN ATTEMPT ---");
    
    const cleanEmail = email ? email.toLowerCase().trim() : "";
    const cleanPassword = password ? password.trim() : "";

    console.log("Email:", cleanEmail);

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("✅ User found:", user.email);
    console.log("🔑 Stored Hash ends with:", user.password.slice(-5)); // Log partial hash for safety

    // Match Password
    const isMatch = await user.matchPassword(cleanPassword);
    
    if (isMatch) {
      // Check Account Approval Status
      if (user.status === "Pending") {
        console.log("❌ Account pending approval");
        return res.status(401).json({ message: "Your account is pending approval by the administration. Please wait for confirmation." });
      }

      // Check Role
      if (role && user.role !== role.toLowerCase() && user.role !== role) {
         console.log("❌ Role mismatch");
         return res.status(401).json({ message: "Role mismatch" });
      }

      console.log("✅ Login Successful");
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classAssigned: user.classAssigned,
        childStudentId: user.childStudentId,
        token: generateToken(user._id),
      });
    } else {
      console.log("❌ Password mismatch");
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

// --- NEW FUNCTION: UPDATE PASSWORD ---
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Get the user (req.user is set by the 'protect' middleware)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Verify current password
    // We use the same matchPassword method used in Login
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    // 3. Update to new password
    // The User model's pre-save hook will handle hashing this new password automatically
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Update Password Error:", err);
    res.status(500).json({ message: "Server error while updating password" });
  }
};