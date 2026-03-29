import React, { useState, useEffect } from "react";
import DashboardCard from "./DashboardCard";
import { Users, Camera, MessageSquare, Clock, Loader2 } from "lucide-react";
import LiveDateTime from "../Common/LiveDateTime";

import { getStudents } from "../../api/students";
import { getTeacherTimetable } from "../../api/timetables"; 

// 1. Accept 'user' as a prop
const TeacherDashboard = ({ setActiveTab, user }) => {
  const [stats, setStats] = useState({
    studentCount: 0,
    activityCount: 0,
    unreadMessages: 0,
  });
  
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 2. Use the prop directly (Safe & Fast)
        const assignedClass = user?.classAssigned ? user.classAssigned.trim() : ""; 

        // --- Fetch Students ---
        const studentsData = await getStudents();
        
        const myActiveStudents = studentsData.filter(student => {
          // Check Status
          const isActive = student.status && student.status.toLowerCase() === "active";
          
          // Check Class Match
          const studentClassName = student.classId?.className || "";
          const isMyClass = studentClassName.trim().toLowerCase() === assignedClass.toLowerCase();

          return isActive && isMyClass;
        });
        
        // --- Fetch Timetable ---
        const timetableData = await getTeacherTimetable();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayName = days[new Date().getDay()];
        
        const todaySlots = (timetableData || []).filter(
          (slot) => slot.day === todayName
        );
        todaySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

        setStats({
          studentCount: myActiveStudents.length,
          activityCount: 0, 
          unreadMessages: 0, 
        });

        setTodayTimetable(todaySlots);

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]); // Re-run if user changes

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveDateTime />
      <h2 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="My Students"
          value={stats.studentCount}
          icon={Users}
          color="bg-accent"
          onClick={() => setActiveTab("students")}
        />
        <DashboardCard
          title="Today's Activities"
          value={stats.activityCount}
          icon={Camera}
          color="bg-green-500"
          onClick={() => setActiveTab("activities")}
        />
        <DashboardCard
          title="Unread Messages"
          value={stats.unreadMessages}
          icon={MessageSquare}
          color="bg-purple-500"
          onClick={() => setActiveTab("messages")}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          <Clock className="w-5 h-5 text-indigo-600" /> Today's Timetable
        </h3>

        {todayTimetable.length > 0 ? (
          <div className="space-y-3">
            {todayTimetable.map((slot) => (
              <div
                key={slot._id || slot.id}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-indigo-900">
                    {slot.classId?.className || slot.subject || "Unknown Class"}
                  </p>
                  <p className="text-xs text-indigo-700 font-medium">
                    {slot.subject}
                  </p>
                </div>
                <div className="text-sm font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">
                  {slot.startTime} — {slot.endTime}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-4">
            No classes found for today ({["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]}).
          </p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;