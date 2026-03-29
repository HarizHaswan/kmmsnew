const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { createNotificationsForUsers } = require("../../utils/notificationHelper");

// GET Attendance for a specific Date and Class
exports.getAttendance = async (req, res, next) => {
  try {
    const { date, classId } = req.query;

    if (!date || !classId) {
      return res.status(400).json({ message: "Date and Class ID are required" });
    }

    // 1. Fetch ALL currently active students for this class
    const currentStudents = await Student.find({ classId, status: "active" }).select("name _id status");

    // 2. Try to find an existing attendance record
    let attendance = await Attendance.findOne({ date, classId })
      .populate("records.studentId", "name status");

    // 3. If NO record exists, return fresh template
    if (!attendance) {
      return res.json({
        date,
        classId,
        records: currentStudents.map(s => ({
          studentId: s, 
          status: "Present",
          reason: ""
        })),
        isNew: true 
      });
    }

    // 4. If record EXISTS, check for missing students (e.g. new registrations)
    // Get list of Student IDs that are already in the attendance record
    const recordedIds = attendance.records.map(r => 
      r.studentId ? r.studentId._id.toString() : null
    );

    // Find active students who are NOT in the record
    const missingStudents = currentStudents.filter(s => 
      !recordedIds.includes(s._id.toString())
    );

    // Add missing students to the record (in memory only, User must click Save to persist)
    if (missingStudents.length > 0) {
      missingStudents.forEach(s => {
        attendance.records.push({
          studentId: s, // populated object
          status: "Present", // Default status
          reason: ""
        });
      });
    }

    res.json(attendance);
  } catch (err) {
    next(err);
  }
};

// ... (Keep saveAttendance and getMonthlyStats exactly as they were) ...
exports.saveAttendance = async (req, res, next) => {
  try {
    const { date, classId, records } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { date, classId },
      { records },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Notify Parents of Absentees
    try {
      const absentRecords = records.filter(r => r.status === 'Absent');
      if (absentRecords.length > 0) {
        const studentIds = absentRecords.map(r => r.studentId);
        const students = await Student.find({ _id: { $in: studentIds } });
        
        const parentIds = [];
        students.forEach(s => {
          if (s.parentId) parentIds.push(s.parentId);
        });

        if (parentIds.length > 0) {
           await createNotificationsForUsers(parentIds, {
              type: 'attendance',
              title: 'Student Absence Notice',
              body: `Your child was marked absent today (${date}).`,
              data: { classId, date },
              createdBy: req.user ? req.user.id : null
           });
        }
      }
    } catch (notifErr) { console.error("Attendance Notification Error:", notifErr); }

    res.json(attendance);
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyStats = async (req, res, next) => {
  try {
    const { classId, month } = req.query; 

    if (!classId || !month) {
      return res.status(400).json({ message: "Class ID and Month are required" });
    }

    const attendanceList = await Attendance.find({
      classId: classId,
      date: { $regex: `^${month}` } 
    });

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalRecords = 0;

    attendanceList.forEach((day) => {
      day.records.forEach((student) => {
        totalRecords++;
        if (student.status === "Present") {
          totalPresent++;
        } else {
          totalAbsent++;
        }
      });
    });

    const percentage = totalRecords === 0 ? 0 : Math.round((totalPresent / totalRecords) * 100);

    res.json({
      month,
      classId,
      totalDays: attendanceList.length,
      totalRecords,
      totalPresent,
      totalAbsent,
      percentage
    });

  } catch (err) {
    next(err);
  }
};