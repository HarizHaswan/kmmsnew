const Message = require("../models/Message");
const { createNotification } = require("../../utils/notificationHelper");
const User = require("../models/User");

// GET messages (optional filter)
const getMessages = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.query;

    const filter = {};
    if (req.user.role !== "admin") {
      filter.$or = [
        { senderId: req.user._id },
        { receiverId: req.user._id },
      ];
      // Additional query params can further restrict inside their own messages
      if (senderId || receiverId) {
        const subFilter = {};
        if (senderId) subFilter.senderId = senderId;
        if (receiverId) subFilter.receiverId = receiverId;
        filter.$and = [ { $or: filter.$or }, subFilter ];
        delete filter.$or;
      }
    } else {
      if (senderId) filter.senderId = senderId;
      if (receiverId) filter.receiverId = receiverId;
    }

    const messages = await Message.find(filter)
      .populate("senderId", "name role")
      .populate("receiverId", "name role")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// GET single message
const getMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id)
      .populate("senderId", "name role")
      .populate("receiverId", "name role");

    if (!msg) return res.status(404).json({ message: "Message not found" });

    res.json(msg);
  } catch (err) {
    next(err);
  }
};

// CREATE message (fixed)
const createMessage = async (req, res, next) => {
  try {
    // Save message
    const msg = await Message.create(req.body);

    // Fetch sender details
    const sender = await User.findById(msg.senderId);

    // Create notification for receiver (MSG1)
    await createNotification({
      recipientId: msg.receiverId,
      type: "message",
      title: `New message from ${sender?.name || "Someone"}`,
      body: msg.content?.slice(0, 200) || "",
      data: { messageId: msg._id },
      createdBy: msg.senderId,
    });

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

// DELETE message
const deleteMessage = async (req, res, next) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Message not found" });

    res.json({ message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};

// GET users available to message
const getUsersForMessaging = async (req, res, next) => {
  try {
    let query = {};
    let activeParentIds = [];
    const studentMap = {};
    
    if (req.user.role === "admin") {
      query = { role: { $in: ["teacher", "parent"] } };
    } else if (req.user.role === "teacher") {
      const Student = require("../models/Student");
      const Class = require("../models/Class");
      const classRecord = await Class.findOne({ className: req.user.classAssigned });
      if (classRecord) {
         const students = await Student.find({ 
           classId: classRecord._id,
           status: { $regex: /^active$/i }
         }).select("parentId name");
         
         students.forEach(s => {
           if (s.parentId) {
             const pid = s.parentId.toString();
             activeParentIds.push(pid);
             if (!studentMap[pid]) studentMap[pid] = [];
             studentMap[pid].push(s.name);
           }
         });
         query = { _id: { $in: activeParentIds } };
      } else {
         query = { _id: null };
      }
    } else if (req.user.role === "parent") {
      const Student = require("../models/Student");
      const students = await Student.find({ 
        parentId: req.user._id,
        status: { $regex: /^active$/i }
      }).populate("classId");
      const classNames = students.map(s => s.classId?.className).filter(Boolean);
      query = { role: "teacher", classAssigned: { $in: classNames } };
    }

    const users = await User.find(query).select("name role classAssigned profileImage").lean();
    
    const unreadCounts = await Message.aggregate([
      { 
        $match: { 
          receiverId: req.user._id, 
          isRead: false,
          senderId: { $in: users.map(u => u._id) }
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    unreadCounts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    const enrichedUsers = users.map(u => ({
      ...u,
      studentNames: studentMap[u._id.toString()] ? studentMap[u._id.toString()].join(", ") : null,
      unreadCount: countMap[u._id.toString()] || 0
    }));

    res.json(enrichedUsers);
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await Message.updateMany(
      { senderId: req.params.senderId, receiverId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "Messages marked as read" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMessages,
  getMessage,
  createMessage,
  deleteMessage,
  getUsersForMessaging,
  markAsRead,
};
