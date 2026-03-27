const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const teacherSalaryController = require('../controllers/teacherSalaryController');

// Admin Routes
router.post('/generate', protect, authorize('admin'), teacherSalaryController.generateSalary);
router.get('/all', protect, authorize('admin'), teacherSalaryController.getAllSalaries);
router.put('/:salaryId', protect, authorize('admin'), teacherSalaryController.updateSalary);
router.post('/:salaryId/pay', protect, authorize('admin'), teacherSalaryController.recordPayment);

// Teacher Routes
router.get('/my-salaries', protect, authorize('teacher'), teacherSalaryController.getMySalaries);

module.exports = router;
