const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const { createNotification } = require('../../utils/notificationHelper');

// GET all invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate("studentId", "name");
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

// GET invoice by ID
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

// CREATE invoice
exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create(req.body);

    // Notify Parent
    try {
      if (invoice.studentId) {
        const student = await Student.findById(invoice.studentId);
        if (student && student.parentId) {
          await createNotification({
            recipientId: student.parentId,
            type: 'invoice',
            title: 'Pending Kindergarten Fee',
            body: `You have a new pending fee: ${invoice.feeItem || 'Invoice'} (RM${invoice.amount || 0}).`,
            data: { invoiceId: invoice._id },
            createdBy: req.user ? req.user.id : null
          });
        }
      }
    } catch (notifErr) {
      console.error("Invoice Notification Error:", notifErr);
    }

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

// UPDATE invoice
exports.updateInvoice = async (req, res, next) => {
  try {
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Invoice not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE invoice
exports.deleteInvoice = async (req, res, next) => {
  try {
    const deleted = await Invoice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Invoice not found" });

    res.json({ message: "Invoice deleted" });
  } catch (err) {
    next(err);
  }
};
