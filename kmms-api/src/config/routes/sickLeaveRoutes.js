const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const sickLeaveController = require('../controllers/sickLeaveController');

router.post('/', protect, authorize('teacher'), sickLeaveController.submitSickLeave);
router.get('/my-leaves', protect, authorize('teacher'), sickLeaveController.getTeacherLeaves);
router.put('/:id/attachment', protect, authorize('teacher'), sickLeaveController.addAttachment);

router.get('/all', protect, authorize('admin'), sickLeaveController.getAllLeaves);
router.post('/:id/review', protect, authorize('admin'), sickLeaveController.reviewSickLeave);

module.exports = router;
