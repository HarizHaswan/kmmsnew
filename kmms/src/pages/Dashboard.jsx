import React, { useState } from "react";
import Sidebar from "../components/Layout/Sidebar";
import Navbar from "../components/Layout/Navbar";
import AdminDashboard from "../components/Dashboard/AdminDashboard";
import TeacherDashboard from "../components/Dashboard/TeacherDashboard";
import ParentDashboard from "../components/Dashboard/ParentDashboard";
import AdminTimetable from "../components/Timetable/AdminTimetable";
import Students from "./Students";

// 1. IMPORT BOTH ATTENDANCE COMPONENTS
import AdminAttendance from "../components/Attendance/AdminAttendance";
import TeacherAttendance from "../components/Attendance/TeacherAttendance";

import ActivitiesTracking from "../components/Activities/ActivitiesTracking";
import ParentActivities from "../components/Activities/ParentActivities";
import LeaveManagement from "../components/Leave/LeaveManagement";
import LeaveRequest from "../components/Leave/LeaveRequest";
import PaymentManagement from "../components/Payments/PaymentManagement";
import AdminPayroll from "../components/Salary/AdminPayroll";
import TeacherPayslips from "../components/Salary/TeacherPayslips";
import Reports from "../components/Reports/Reports";
import ProgressReports from "../components/Progress/ProgressReports";
import Announcements from "../components/Announcements/Announcements";
import Messages from "../components/Messages/Messages";
import TeacherStudentView from "../components/Teachers/TeacherStudentView";
import Settings from "../components/Settings/Settings";
import Teachers from "./Teachers";
import TeacherTimetable from "../components/Teachers/TeacherTimetable";
import ParentTimetable from "../components/Timetable/ParentTimetable";


const Dashboard = ({ user, onLogout }) => {
  console.log("📌 Dashboard loaded. User role =", user.role);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Normalize for logic only
  const role = user.role.toLowerCase();

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    // ========== ADMIN ==========
    if (role === "admin") {
      if (activeTab === "dashboard")
        return <AdminDashboard setActiveTab={setActiveTab} />;

      if (activeTab === "users")
        return <Students mode="admin" />;

      if (activeTab === "teachers")
        return <Teachers />;

      if (activeTab === "payments")
        return <PaymentManagement role="Admin" userId={user.id} user={user} />;

      if (activeTab === "leave")
        return <LeaveManagement />;

      if (activeTab === "salary")
        return <AdminPayroll />;

      if (activeTab === "reports")
        return <Reports />;

      if (activeTab === "announcements")
        return <Announcements />;

      if (activeTab === "messages")
        return <Messages user={user} />;

      if (activeTab === "timetables")
        return <AdminTimetable />;

      // ✅ ADMIN SEES ADMIN ATTENDANCE (All Classes)
      if (activeTab === "attendance")
        return <AdminAttendance />;

      if (activeTab === "settings")
        return <Settings user={user} />;

      return <AdminDashboard setActiveTab={setActiveTab} />;
    }

    // ========== TEACHER ==========
    if (role === "teacher") {
      if (activeTab === "dashboard")
        return <TeacherDashboard setActiveTab={setActiveTab} user={user} />;

      if (activeTab === "students")
        return <TeacherStudentView user={user} />;

      if (activeTab === "timetables")
        return <TeacherTimetable />;

      // ✅ TEACHER SEES TEACHER ATTENDANCE (Assigned Class Only)
      if (activeTab === "attendance")
        return <TeacherAttendance user={user} />;

      if (activeTab === "activities")
        return <ActivitiesTracking user={user} />;

      if (activeTab === "leave-request")
        return <LeaveRequest teacherId={user.id} />;

      if (activeTab === "salary")
        return <TeacherPayslips />;

      if (activeTab === "progress")
        return <ProgressReports role="Teacher" user={user} />;

      if (activeTab === "announcements")
        return <Announcements />;

      if (activeTab === "messages")
        return <Messages user={user} />;

      if (activeTab === "settings")
        return <Settings user={user} />;

      return <TeacherDashboard setActiveTab={setActiveTab} />;
    }

    // ========== PARENT ==========
    if (role === "parent") {
      if (activeTab === "dashboard")
        return <ParentDashboard setActiveTab={setActiveTab} />;

      if (activeTab === "timetables")
        return <ParentTimetable />;

      if (activeTab === "child-activities")
        return <ParentActivities user={user} />;

      if (activeTab === "payments")
        return <PaymentManagement role="Parent" userId={user.id} user={user} />;

      if (activeTab === "progress")
        return <ProgressReports role="Parent" user={user} />;

      if (activeTab === "announcements")
        return <Announcements />;

      if (activeTab === "messages")
        return <Messages user={user} />;

      if (activeTab === "settings")
        return <Settings user={user} />;

      return <ParentDashboard setActiveTab={setActiveTab} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <Sidebar
        role={user.role.toLowerCase()}   // 🔥 pass normalized role to sidebar
        activeTab={activeTab}
        setActiveTab={handleChangeTab}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col">
        <Navbar
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        <main className="p-4 md:p-6">
          <div key={activeTab} className="w-full max-w-[95rem] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
