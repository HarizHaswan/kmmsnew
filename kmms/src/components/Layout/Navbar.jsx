import React, { useState } from "react";
import { User, Menu, LogOut, Settings } from "lucide-react";
import NotificationBell from "../Common/NotificationBell"; // <-- added

const Navbar = ({ user, onMenuClick, onLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="w-full max-w-[95rem] px-4 md:px-6 py-3 flex items-center justify-between mx-auto">
        
        {/* Left: menu button (mobile) + title */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-brand-bg"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {user.role}
            </p>
            <h1 className="text-lg md:text-xl font-bold text-primary">
              Kindergarten Management System
            </h1>
          </div>
        </div>

        {/* Right: Notifications + User info */}
        <div className="relative flex items-center gap-4">

          {/* 🔔 Notification Bell */}
          <NotificationBell />

          {/* NAME + ROLE */}
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-medium text-gray-800">
              {user.name}
            </span>
            <span className="text-xs text-gray-500">{user.role}</span>
          </div>

          {/* Avatar button */}
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <span className="text-indigo-700 font-bold uppercase">
              {user.name?.charAt(0)}
            </span>
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200 slide-in-from-top-2">
              
              <button className="flex w-full items-center gap-2 px-4 py-2 text-gray-700 hover:bg-brand-bg transition-colors">
                <User className="w-4 h-4" />
                Profile
              </button>

              <button className="flex w-full items-center gap-2 px-4 py-2 text-gray-700 hover:bg-brand-bg transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <div className="border-t my-1"></div>

              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;
