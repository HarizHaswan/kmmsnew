const Payment = require("../models/Payment");
const { getUserIdsByRole, createNotificationsForUsers } = require('../../utils/notificationHelper');

// GET all payments
exports.getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("invoiceId");
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// CREATE payment
exports.createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create(req.body);

    // Notify Admins
    try {
      const adminIds = await getUserIdsByRole('admin');
      if (adminIds && adminIds.length > 0) {
        await createNotificationsForUsers(adminIds, {
          type: 'payment',
          title: 'New Payment Received',
          body: `A new fee payment of RM${payment.amount || '0'} was recorded.`,
          data: { paymentId: payment._id },
          createdBy: req.user ? req.user.id : null
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

// DELETE payment
exports.deletePayment = async (req, res, next) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payment not found" });

    res.json({ message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
};
