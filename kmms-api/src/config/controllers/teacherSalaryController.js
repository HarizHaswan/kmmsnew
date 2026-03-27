const TeacherSalary = require('../models/TeacherSalary');
const { createNotification } = require('../../utils/notificationHelper');

// admin: generate a new salary record (payslip) for a teacher
exports.generateSalary = async (req, res) => {
  const { teacher, baseSalary, allowance, deduction, month, year } = req.body;

  // check if one already exists for this exact month/year
  const exists = await TeacherSalary.findOne({ teacher, month, year });
  if (exists) {
    return res.status(400).json({ message: 'A salary record for this month and year already exists for this teacher.' });
  }

  const s = new TeacherSalary({ teacher, baseSalary, allowance, deduction, month, year, status: 'unpaid' });
  await s.save();

  // notify teacher
  try {
    await createNotification({
      recipientId: teacher,
      type: 'salary',
      title: 'New Payslip Generated',
      body: `Your payslip for ${month} ${year} is now available.`,
      data: { salaryId: s._id },
      createdBy: req.user.id
    });
  } catch (err) {
    console.error("Failed to send notification", err);
  }

  res.status(201).json(s);
};

// admin: update existing unpaid salary (change allowances/deductions)
exports.updateSalary = async (req, res) => {
  const { salaryId } = req.params;
  const { baseSalary, allowance, deduction } = req.body;

  const salary = await TeacherSalary.findById(salaryId);
  if (!salary) return res.status(404).json({ message: 'Salary not found' });
  if (salary.status === 'paid') return res.status(400).json({ message: 'Cannot edit a paid salary record.' });

  if (baseSalary !== undefined) salary.baseSalary = baseSalary;
  if (allowance !== undefined) salary.allowance = allowance;
  if (deduction !== undefined) salary.deduction = deduction;

  await salary.save();
  res.json(salary);
};

// admin: endpoint to record payment
exports.recordPayment = async (req, res) => {
  const { salaryId } = req.params;
  const { paidAt } = req.body;

  const salary = await TeacherSalary.findById(salaryId);
  if (!salary) return res.status(404).json({ message: 'Salary not found' });
  if (salary.status === 'paid') return res.status(400).json({ message: 'Salary is already paid.' });

  salary.status = 'paid';
  salary.paidAt = paidAt || new Date();
  salary.paidBy = req.user.id;
  await salary.save();

  // notify teacher 
  try {
    await createNotification({
      recipientId: salary.teacher,
      type: 'salary',
      title: 'Salary Paid',
      body: `Your salary for ${salary.month} ${salary.year} has been paid.`,
      data: { salaryId: salary._id },
      createdBy: req.user.id
    });
  } catch (err) {
    console.error("Failed to send notification", err);
  }

  res.json(salary);
};

// admin: list all salaries
exports.getAllSalaries = async (req, res) => {
  const salaries = await TeacherSalary.find()
    .populate('teacher', 'name email profileImage')
    .sort({ year: -1, month: -1, createdAt: -1 });
  res.json(salaries);
};

// teacher: get my personal salaries
exports.getMySalaries = async (req, res) => {
  const teacherId = req.user.id;
  const salaries = await TeacherSalary.find({ teacher: teacherId })
    .populate('teacher', 'name email profileImage')
    .sort({ year: -1, month: -1, createdAt: -1 });
  res.json(salaries);
};

module.exports = exports;
