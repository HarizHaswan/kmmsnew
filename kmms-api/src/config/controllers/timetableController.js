const Timetable = require("../models/Timetable");
const { createNotification } = require("../../utils/notificationHelper");

/**
 * ADMIN — Create timetable slot
 */
exports.createTimetable = async (req, res) => {
  const {
    classId,
    day,
    subject,
    startTime,
    endTime,
    teacherId,
    color,
  } = req.body;

  const slot = await Timetable.create({
    classId,
    day,
    subject,
    startTime,
    endTime,
    teacherId,
    color,
    createdBy: req.user._id,
  });

  // Notify Teacher
  try {
    if (teacherId) {
      await createNotification({
        recipientId: teacherId,
        type: 'timetable',
        title: 'Timetable Updated',
        body: `You have a new class sequence added on ${day} at ${startTime}.`,
        data: { timetableId: slot._id },
        createdBy: req.user._id
      });
    }
  } catch (notifErr) {
    console.error("Timetable Notification Error:", notifErr);
  }

  res.status(201).json(slot);
};

/**
 * ADMIN — Get timetable by class + day
 */
    exports.getTimetableByClass = async (req, res) => {
      const filter = {};

      if (req.query.classId) {
        filter.classId = req.query.classId;
      }

      if (req.query.day) {
        filter.day = req.query.day;
      }

      const timetable = await Timetable.find(filter)
        .populate("teacherId", "name")
        .populate("classId", "className")
        .sort({ startTime: 1 });

      res.json(timetable);
    };

/**
 * ADMIN — Delete timetable
 */
exports.deleteTimetable = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: "Timetable slot deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete slot" });
  }
};

/**
 * TEACHER — View own timetable
 */
exports.getTeacherTimetable = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const timetable = await Timetable.find({ teacherId })
      .populate("classId", "className")
      .populate("teacherId", "name");

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to load teacher timetable" });
  }
};


/**
 * PARENT — View child's timetable (today)
 */
exports.getParentTimetableToday = async (req, res) => {
  try {
    // 1️⃣ Get parent user
    const parent = req.user;

    if (!parent.childStudentId) {
      return res.json([]);
    }

    // 2️⃣ Get student
    const student = await Student.findById(parent.childStudentId);
    if (!student || !student.classId) {
      return res.json([]);
    }

    // 3️⃣ Get today (Monday, Tuesday, ...)
    const DAYS = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = DAYS[new Date().getDay()];

    // 4️⃣ Get timetable for today
    const timetable = await Timetable.find({
      classId: student.classId,
      day: today,
    })
      .populate("teacherId", "name")
      .populate("classId", "className");

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to load parent timetable" });
  }
};

