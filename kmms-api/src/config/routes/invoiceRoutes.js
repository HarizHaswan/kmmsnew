// src/config/routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();

const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require("../controllers/invoiceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// GET all invoices (admin) — controller can optionally allow parent to view own invoices
router.get("/", protect, authorize("admin", "parent"), getInvoices);

// GET single invoice (admin or owner parent)
router.get("/:id", protect, authorize("admin", "parent"), getInvoice);

// Create invoice (admin)
router.post("/", protect, authorize("admin"), createInvoice);

// Update invoice (admin + parent — parent can mark as paid after paying)
router.put("/:id", protect, authorize("admin", "parent"), updateInvoice);

// Delete invoice (admin)
router.delete("/:id", protect, authorize("admin"), deleteInvoice);

module.exports = router;
