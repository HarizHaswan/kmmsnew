require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./config/middleware/errorHandler");
const http = require("http");

const app = express();

// Connect DB
connectDB();

// Middlewares
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ROUTES
app.use("/api/auth", require("./config/routes/authRoutes"));
app.use("/api/students", require("./config/routes/studentRoutes"));
app.use("/api/teachers", require("./config/routes/teacherRoutes"));
app.use("/api/announcements", require("./config/routes/announcementRoutes"));
app.use("/api/attendance", require("./config/routes/attendanceRoutes"));
app.use("/api/activities", require("./config/routes/activityRoutes"));
app.use("/api/classes", require("./config/routes/classRoutes"));
app.use("/api/progress", require("./config/routes/progressRoutes"));
app.use("/api/invoices", require("./config/routes/invoiceRoutes"));
app.use("/api/payments", require("./config/routes/paymentRoutes"));
app.use("/api/schedules", require("./config/routes/scheduleRoutes"));
app.use("/api/messages", require("./config/routes/messageRoutes"));
app.use("/api/notifications", require("./config/routes/notificationRoutes"));
app.use("/api/feedback", require("./config/routes/feedbackRoutes"));
const timetableRoutes = require("./config/routes/timetableRoutes");
app.use("/api/timetables", timetableRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/upload", require("./config/routes/uploadRoutes"));
app.use("/api/timetables", require("./config/routes/timetableRoutes"));
app.use("/api/attendance", require("./config/routes/attendanceRoutes"));
app.use("/api/sick-leave", require("./config/routes/sickLeaveRoutes"));
app.use("/api/salary", require("./config/routes/teacherSalaryRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "KMMS API running" });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// ------------------
// SOCKET.IO SETUP
// ------------------
const server = http.createServer(app);

const { initIO } = require("./utils/socket"); // PATH FIXED
initIO(server); // no need to store io globally here

// ------------------
// START SERVER (ONLY ONE)
// ------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`KMMS API + Socket.IO running on port ${PORT}`);
});
