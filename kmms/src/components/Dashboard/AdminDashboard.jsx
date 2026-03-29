import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  CheckCircle,
  DollarSign,
  ClipboardList,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { getStudents } from "../../api/students";
import { getTeachers } from "../../api/teachers";
import { getClasses } from "../../api/classes";
import { getAttendance } from "../../api/attendance";
import { getAllLeaves, updateLeaveStatus } from "../../api/leaves";

import LiveDateTime from "../Common/LiveDateTime";

export default function AdminDashboard({ setActiveTab }) {
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeTeachers, setActiveTeachers] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState({
    present: 0,
    total: 0,
  });
  const [teacherAttendanceCount, setTeacherAttendanceCount] = useState({
    present: 0,
    total: 0,
  });
  const [pendingLeavesList, setPendingLeavesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------
  // LOAD DASHBOARD DATA
  // -----------------------
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // 1. Fetch & Filter Students (Active Only)
      const studentsData = await getStudents();
      const activeStudents = studentsData.filter(s =>
        s.status && s.status.toLowerCase() === "active"
      );
      setTotalStudents(activeStudents.length);

      // 2. Fetch & Filter Teachers (Active Only)
      const teachersData = await getTeachers();
      const activeTeachersList = teachersData.filter(t =>
        t.status && t.status.toLowerCase() === "active"
      );
      setActiveTeachers(activeTeachersList.length);

      // 3. Attendance Calculation
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      // A. Get all classes first
      const allClasses = await getClasses();

      // B. Fetch attendance for each class for TODAY in parallel
      const attendancePromises = allClasses.map(cls =>
        getAttendance(today, cls._id)
          .catch(() => null)
      );

      const results = await Promise.all(attendancePromises);

      // C. Sum up the "Present" counts strictly for ACTIVE students
      let totalPresent = 0;

      results.forEach((record) => {
        if (record && record.records && Array.isArray(record.records)) {

          const classPresent = record.records.filter(r => {
            // Check 1: Is the attendance status "Present"?
            const isMarkedPresent = r.status && r.status.toLowerCase() === "present";

            // Check 2: Is the Student Account "Active"?
            // (We use r.studentId.status because we populated it in the backend)
            const studentAccountStatus = r.studentId?.status || "active";
            const isAccountActive = studentAccountStatus.toLowerCase() === "active";

            return isMarkedPresent && isAccountActive;
          }).length;

          totalPresent += classPresent;
        }
      });

      setAttendanceToday({
        present: totalPresent,
        total: activeStudents.length, // Denominator: Total Active Students
      });

      // 4. Fetch Teacher Leaves & Calculate Teacher Attendance
      let teachersPresentToday = activeTeachersList.length; // Assume all present
      try {
        const leavesData = await getAllLeaves();

        // Find leaves that cover today and are 'approved'
        const todayDateStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const todayMs = new Date(todayDateStr).getTime();

        const absentTeachers = leavesData.filter(leave => {
          if (leave.status && leave.status.toLowerCase() === "approved") {
            const startObj = new Date(leave.startDate);
            const endObj = leave.endDate ? new Date(leave.endDate) : startObj;

            // Match dates by stripping time
            const st = new Date(startObj.toISOString().split('T')[0]).getTime();
            const en = new Date(endObj.toISOString().split('T')[0]).getTime();

            if (todayMs >= st && todayMs <= en) return true;
          }
          return false;
        });

        const pending = leavesData.filter(l => l.status && l.status.toLowerCase() === "pending");
        setPendingLeavesList(pending);

      } catch (leaveErr) {
        console.warn("Could not fetch leaves:", leaveErr);
      }

      setTeacherAttendanceCount({
        present: teachersPresentToday,
        total: activeTeachersList.length
      });

    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // HANDLERS
  // -----------------------
  const handleReviewLeave = async (id, action) => {
    try {
      await updateLeaveStatus(id, action);
      // Reload dashboard data instantly after review
      loadDashboardData();
    } catch (err) {
      console.error("Failed to review leave:", err);
      alert("Error updating leave status.");
    }
  };

  // -----------------------
  // STATS BOX DESIGN
  // -----------------------
  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "from-accent-light to-accent",
      onClick: () => setActiveTab("users"),
    },
    {
      title: "Active Teachers",
      value: activeTeachers,
      icon: BookOpen,
      color: "from-primary-light to-primary",
      onClick: () => setActiveTab("teachers"),
    },
    {
      title: "Today’s Attendance",
      value: `${attendanceToday.present}/${attendanceToday.total}`,
      icon: CheckCircle,
      color: "from-purple-400 to-purple-600",
      onClick: () => setActiveTab("attendance"),
    },
    {
      title: "Teacher Attendance",
      value: `${teacherAttendanceCount.present}/${teacherAttendanceCount.total}`,
      icon: ClipboardList,
      color: "from-yellow-400 to-yellow-600",
      onClick: () => setActiveTab("leave"),
    },
  ];

  if (loading) {
    return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <LiveDateTime />
      <h2 className="text-2xl font-bold">Administrator Dashboard</h2>

      {/* ---------------- STATS GRID ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              onClick={stat.onClick}
              className="cursor-pointer hover:shadow-lg transition"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <h3 className="text-gray-900 text-xl mb-1">{stat.value}</h3>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------------- 2 PANELS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">No recent activities to show.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLeavesList.length === 0 ? (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">No pending leave requests.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {pendingLeavesList.map(leave => (
                  <div key={leave._id} className="p-3 border rounded-lg bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{leave.teacher?.name || 'Unknown Teacher'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(leave.startDate).toLocaleDateString()}
                        {leave.endDate && ` to ${new Date(leave.endDate).toLocaleDateString()}`}
                      </p>
                      {leave.reason && (
                        <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Reason:</span> {leave.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 h-10" onClick={() => handleReviewLeave(leave._id, 'approve')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-10" onClick={() => handleReviewLeave(leave._id, 'reject')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}