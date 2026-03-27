const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadFolder = "uploads/profile";

// Ensure folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);  // save OUTSIDE src
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/profile", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user._id);

    user.profileImage = `/uploads/profile/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Profile picture updated",
      imageUrl: user.profileImage,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

const attachmentUploadFolder = "uploads/attachments";
if (!fs.existsSync(attachmentUploadFolder)) {
  fs.mkdirSync(attachmentUploadFolder, { recursive: true });
}

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentUploadFolder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `attachment_${Date.now()}${ext}`);
  },
});
const uploadAttachment = multer({ storage: attachmentStorage });

router.post("/attachment", protect, uploadAttachment.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `/uploads/attachments/${req.file.filename}`;
  res.json({ message: "File uploaded successfully", url: fileUrl });
});

module.exports = router;
