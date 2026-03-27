const SickLeave = require('../models/TeacherSickLeave');
const { getUserIdsByRole, createNotificationsForUsers, createNotification } = require('../../utils/notificationHelper');

// teacher submits
exports.submitSickLeave = async (req, res) => {
  const teacherId = req.user.id;
  const { startDate, endDate, reason, attachment } = req.body;
  const sl = new SickLeave({ teacher: teacherId, startDate, endDate, reason, attachment });
  await sl.save();

  // notify admins
  const adminIds = await getUserIdsByRole('admin');
  await createNotificationsForUsers(adminIds, {
    type: 'sickleave',
    title: 'Sick leave request',
    body: `${req.user.name} submitted a sick leave request (${startDate} to ${endDate}).`,
    data: { sickLeaveId: sl._id },
    createdBy: teacherId
  });

  res.status(201).json(sl);
};

// teacher adds attachment later
exports.addAttachment = async (req, res) => {
  const teacherId = req.user.id;
  const { id } = req.params;
  const { attachment } = req.body;

  const sl = await SickLeave.findOne({ _id: id, teacher: teacherId });
  if (!sl) return res.status(404).json({ message: 'Sick leave request not found' });

  sl.attachment = attachment;
  await sl.save();

  res.json(sl);
};

// admin review
exports.reviewSickLeave = async (req, res) => {
  const adminId = req.user.id;
  const { id } = req.params; // sickLeave id
  const { action } = req.body; // 'approve' or 'reject'
  const sl = await SickLeave.findById(id);
  if (!sl) return res.status(404).json({ message: 'Not found' });
  sl.status = action === 'approve' ? 'approved' : 'rejected';
  sl.reviewedBy = adminId;
  sl.reviewedAt = new Date();
  await sl.save();

  // notify the teacher about the outcome
  await createNotification({
    recipientId: sl.teacher,
    type: 'sickleave',
    title: `Sick leave ${sl.status}`,
    body: `Your sick leave request has been ${sl.status}.`,
    data: { sickLeaveId: sl._id },
    createdBy: adminId
  });

  res.json(sl);
};

// get all leaves for admin
exports.getAllLeaves = async (req, res) => {
  const leaves = await SickLeave.find().populate('teacher', 'name email').sort({ submittedAt: -1 });
  res.json(leaves);
};

// get my leaves (teacher)
exports.getTeacherLeaves = async (req, res) => {
  const teacherId = req.user.id;
  const leaves = await SickLeave.find({ teacher: teacherId }).sort({ submittedAt: -1 });
  res.json(leaves);
};

module.exports = exports;
