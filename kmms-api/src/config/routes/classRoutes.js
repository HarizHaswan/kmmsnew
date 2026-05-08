// src/config/routes/classRoutes.js
const express = require("express");
const router = express.Router();

const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

const { protect, authorize } = require("../middleware/authMiddleware");

// GET all classes (admin/teacher)
router.get("/", protect, authorize("admin", "teacher"), getClasses);

// GET classes for public enrollment
router.get("/public", getClasses);

// GET single class by id (admin/teacher)
router.get("/:id", protect, authorize("admin", "teacher"), getClass);

// CREATE class (admin)
router.post("/", protect, authorize("admin"), createClass);

// UPDATE class (admin)
router.put("/:id", protect, authorize("admin"), updateClass);

// DELETE class (admin)
router.delete("/:id", protect, authorize("admin"), deleteClass);

module.exports = router;
