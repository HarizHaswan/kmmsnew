const express = require("express");
const router = express.Router();

const {
  getPayments,
  createPayment,
  deletePayment,
  verifyPayment,
  rejectPayment,
} = require("../controllers/paymentController");

const { protect, authorize } = require("../middleware/authMiddleware");

// GET all payments (admin + teacher + parent)
router.get("/", protect, authorize("admin", "teacher", "parent"), getPayments);

// CREATE payment (admin + parent — parent submits receipt)
router.post("/", protect, authorize("admin", "parent"), createPayment);

// VERIFY payment (admin only)
router.put("/:id/verify", protect, authorize("admin"), verifyPayment);

// REJECT payment (admin only)
router.put("/:id/reject", protect, authorize("admin"), rejectPayment);

// DELETE payment (admin only)
router.delete("/:id", protect, authorize("admin"), deletePayment);

module.exports = router;
