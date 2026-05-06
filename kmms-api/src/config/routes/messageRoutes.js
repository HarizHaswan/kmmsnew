// src/config/routes/messageRoutes.js
const express = require("express");
const router = express.Router();

const {
  getMessages,
  getMessage,
  createMessage,
  deleteMessage,
  getUsersForMessaging,
  markAsRead,
} = require("../controllers/messageController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Get messages (user's inbox) - all authenticated users
router.get("/", protect, getMessages);

// Get users available to message
router.get("/users", protect, getUsersForMessaging);

// Mark messages as read
router.put("/read/:senderId", protect, markAsRead);

// Get single message (owner)
router.get("/:id", protect, getMessage);

// Send message (authenticated user)
router.post("/", protect, createMessage);

// Delete message (admin or owner) - controller should check ownership
router.delete("/:id", protect, deleteMessage);

module.exports = router;
