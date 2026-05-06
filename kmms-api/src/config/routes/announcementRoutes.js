const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const Announcement = require("../models/Announcement");
const { notifyRole } = require("../../utils/notificationHelper");

// GET announcements (Filtered by Role)
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    // If NOT admin, restrict what they can see
    if (req.user.role !== "admin") {
      if (req.user.role === "teacher") {
        query.$or = [
          { 
            targetRole: { $in: ["all", "teacher"] },
            targetClass: { $in: ["", null] }
          },
          { createdBy: req.user._id }
        ];
      } else if (req.user.role === "parent") {
        query.targetRole = { $in: ["all", "parent"] };
        
        const Student = require("../models/Student");
        const students = await Student.find({ parentId: req.user._id }).populate("classId");
        const parentClasses = students.map(s => s.classId?.className).filter(Boolean);
        
        let classConditions = [
          { targetClass: { $in: ["", null] } }
        ];
        if (parentClasses.length > 0) {
          classConditions.push({ targetClass: { $in: parentClasses } });
        }
        query.$or = classConditions;
      }
    }

    const list = await Announcement.find(query)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// ADMIN & TEACHER: Create announcement
router.post("/", protect, authorize("admin", "teacher"), async (req, res) => {
  const { title, message, targetRole, targetClass } = req.body;

  const newA = await Announcement.create({
    title,
    message,
    targetRole: targetRole || "all",
    targetClass: targetClass || "",
    createdBy: req.user._id, // This is coming from req.user
  });

  // Notifications
  try {
    const role = req.user.role; // Assume role exists
    const safeTitle = `New Announcement: ${title}`;
    
    if (targetRole === "all") {
      if (role === "admin") {
        await notifyRole("teacher", "announcement", safeTitle, message, { id: newA._id }, req.user._id);
        await notifyRole("parent", "announcement", safeTitle, message, { id: newA._id }, req.user._id);
      } else if (role === "teacher") {
        await notifyRole("admin", "announcement", safeTitle, message, { id: newA._id }, req.user._id);
        await notifyRole("parent", "announcement", safeTitle, message, { id: newA._id }, req.user._id);
      }
    } else if (targetRole === "parent") {
      await notifyRole("parent", "announcement", safeTitle, message, { id: newA._id }, req.user._id);
    } else if (targetRole === "teacher") {
      await notifyRole("teacher", "announcement", safeTitle, message, { id: newA._id }, req.user._id);
    }
  } catch (err) {
    console.error("Failed to notify users for announcement", err);
  }

  res.status(201).json(newA);
});

// ADMIN: delete announcement
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: "Announcement removed" });
});

module.exports = router;