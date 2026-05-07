const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const { getUserIdsByRole, createNotificationsForUsers, createNotification } = require('../../utils/notificationHelper');

// Only VERIFIED payments count toward invoice balance
async function syncInvoiceStatus(invoiceId) {
  if (!invoiceId) return null;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return null;
  if (invoice.status === "cancelled") return invoice;

  // Only count verified payments
  const payments = await Payment.find({ invoiceId, status: "verified" });
  const totalPaid = payments.reduce(
    (sum, payment) => sum + (Number(payment.amountPaid) || 0),
    0
  );

  let status = "unpaid";
  if (totalPaid >= Number(invoice.amount || 0) && totalPaid > 0) {
    status = "paid";
  } else if (totalPaid > 0) {
    status = "partial";
  }

  invoice.status = status;
  await invoice.save();
  return invoice;
}

// GET all payments
exports.getPayments = async (req, res, next) => {
  try {
    const query = {};

    if (req.user && String(req.user.role || "").toLowerCase() === "parent") {
      const children = await Student.find({ parentId: req.user._id }).select("_id");
      query.studentId = { $in: children.map((child) => child._id) };
    }

    const payments = await Payment.find(query)
      .populate("invoiceId")
      .populate("studentId", "name classId")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// CREATE payment
// - Admin-created: status = "verified" (immediate effect)
// - Parent-created: status = "pending_verification" (must be approved)
exports.createPayment = async (req, res, next) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    const isParent = role === "parent";

    const paymentData = {
      ...req.body,
      status: isParent ? "pending_verification" : "verified",
    };

    const payment = await Payment.create(paymentData);

    // Only sync invoice status if this is an admin-recorded payment
    if (!isParent) {
      await syncInvoiceStatus(payment.invoiceId);
    }

    // Notify admins either way
    try {
      const adminIds = await getUserIdsByRole('admin');
      if (adminIds && adminIds.length > 0) {
        await createNotificationsForUsers(adminIds, {
          type: 'payment',
          title: isParent ? 'Payment Pending Verification' : 'New Payment Recorded',
          body: isParent
            ? `A parent submitted a payment of RM${payment.amountPaid || '0'} — please review.`
            : `A new payment of RM${payment.amountPaid || '0'} was recorded.`,
          data: { paymentId: payment._id },
          createdBy: req.user ? req.user.id : null,
        });
      }
    } catch (notifErr) {
      console.error("Payment Notification Error:", notifErr);
    }

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// VERIFY payment (admin only)
// Marks payment as verified and syncs the invoice status
exports.verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "verified";
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user._id;
    await payment.save();

    const updatedInvoice = await syncInvoiceStatus(payment.invoiceId);

    // Notify the parent that payment was verified
    try {
      const student = await Student.findById(payment.studentId);
      if (student && student.parentId) {
        await createNotification({
          recipientId: student.parentId,
          type: "payment",
          title: "Payment Verified",
          body: `Your payment of RM${payment.amountPaid} has been verified by the admin.`,
          data: { paymentId: payment._id },
          createdBy: req.user._id,
        });
      }
    } catch (notifErr) {
      console.error("Verify Notification Error:", notifErr);
    }

    res.json({ payment, invoice: updatedInvoice });
  } catch (err) {
    next(err);
  }
};

// REJECT payment (admin only) — deletes the pending record
exports.rejectPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Only allow rejecting pending payments
    if (payment.status !== "pending_verification") {
      return res.status(400).json({ message: "Only pending payments can be rejected" });
    }

    // Notify parent of rejection
    try {
      const student = await Student.findById(payment.studentId);
      if (student && student.parentId) {
        await createNotification({
          recipientId: student.parentId,
          type: "payment",
          title: "Payment Not Verified",
          body: `Your submitted payment of RM${payment.amountPaid} could not be verified. Please contact the admin.`,
          data: { paymentId: payment._id },
          createdBy: req.user._id,
        });
      }
    } catch (notifErr) {
      console.error("Reject Notification Error:", notifErr);
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment rejected and removed" });
  } catch (err) {
    next(err);
  }
};

// DELETE payment (admin only)
exports.deletePayment = async (req, res, next) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payment not found" });

    await syncInvoiceStatus(deleted.invoiceId);

    res.json({ message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
};
