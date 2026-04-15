import React from "react";
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  Camera,
  CheckCircle,
  DollarSign,
  MessageSquare,
  BarChart,
  LogOut,
  Bell,
  X,
  Banknote,
  Settings,
} from "lucide-react";

const Sidebar = ({
  role,
  activeTab,
  setActiveTab,
  onLogout,
  isOpen,
  onClose
}) => {
  const common = [
    { id: "dashboard", label: "Dashboard", icon: BookOpen },
  ];

  const adminTabs = [
    { id: "users", label: "Student Management", icon: Users },
    { id: "teachers", label: "Teacher Management", icon: Users },
    { id: "timetables", label: "Timetable", icon: Calendar }, // not wired yet
    { id: "attendance", label: "Attendance", icon: CheckCircle },
    { id: "leave", label: "Leave Request", icon: FileText },
    { id: "salary", label: "Salary", icon: Banknote },
    { id: "payments", label: "Payment & Ledger", icon: DollarSign },
    { id: "reports", label: "Reports", icon: BarChart },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const teacherTabs = [
    { id: "students", label: "My Students", icon: Users },
    { id: "activities", label: "Daily Activities", icon: Camera },
    { id: "attendance", label: "Attendance", icon: CheckCircle },
    { id: "timetables", label: "My Timetables", icon: Calendar },
    { id: "leave-request", label: "Leave Request", icon: FileText },
    { id: "salary", label: "Salary", icon: Banknote },
    { id: "progress", label: "Progress Reports", icon: FileText },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const parentTabs = [
    //{ id: "child-activities", label: "Child Activities", icon: Camera }, // placeholder
    //{ id: "child-attendance", label: "Attendance", icon: CheckCircle },  // placeholder
    { id: "progress", label: "Progress Reports", icon: FileText },       // placeholder
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const navItems =
    role === "admin"
      ? [...common, ...adminTabs]
      : role === "teacher"
        ? [...common, ...teacherTabs]
        : [...common, ...parentTabs];

  const content = (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">KMMS</h2>
        {/* Close button for mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-brand-bg"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-all duration-200 hover:translate-x-1
                ${isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-700 hover:bg-brand-bg"
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
              {label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="mt-4 w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-white shadow-md px-4 py-6 animate-in slide-in-from-left duration-500">
        {content}
      </aside>

      {/* Mobile overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden animate-in fade-in duration-200">
          <div className="w-64 bg-white shadow-md px-4 py-6 animate-in slide-in-from-left duration-300">
            {content}
          </div>
          <div
            className="flex-1 bg-black bg-opacity-40"
            onClick={onClose}
          />
        </div>
      )}
    </>
  );

};

export default Sidebar;
