import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Enrollment from "./pages/Enrollment";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import http from "./api/http"; // IMPORTANT: import axios instance
import { ToastProvider } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/react";


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);  // NEW

  // Secure token verification
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await http.get("/auth/me");
        setCurrentUser(res.data);
      } catch (err) {
        localStorage.removeItem("kmms-token");
        localStorage.removeItem("kmms-user");
        setCurrentUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyUser();
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("kmms-user", JSON.stringify(userData));
    localStorage.setItem("kmms-token", userData.token);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("kmms-user");
    localStorage.removeItem("kmms-token");
    setCurrentUser(null);
  };

  // While verifying token → show loading screen
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Checking session...
      </div>
    );
  }

  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>

        {/* LANDING PAGE */}
        <Route path="/" element={<LandingPage />} />

        {/* ENROLLMENT PAGE */}
        <Route path="/enroll" element={<Enrollment />} />

        {/* PASSWORD RESET PAGES */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* LOGIN PAGE */}
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* DASHBOARD PAGE */}
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <Dashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

      </Routes>
    </BrowserRouter>
    <Toaster />
    <SpeedInsights />
    </ToastProvider>
  );
}

export default App;
