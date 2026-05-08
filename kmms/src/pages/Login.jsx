import React, { useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import {
  Loader2,
  User,
  Lock,
  ChevronLeft,
  School,
  GraduationCap,
  Users,
  Eye,      // <--- Added
  EyeOff    // <--- Added
} from "lucide-react";

// --- FIXED INPUT COMPONENT ---
const InputField = ({ icon: Icon, type, placeholder, value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative mb-4">
      {/* Left Icon (User/Lock) */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>

      <input
        // If it's a password field, toggle between 'text' and 'password'
        type={isPassword ? (showPassword ? "text" : "password") : type}
        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white hover:bg-white"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />

      {/* Right Icon (Eye Toggle) - Only appears for password fields */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
};

const RoleCard = ({ role, icon: Icon, title, description, onClick }) => (
  <button
    onClick={() => onClick(role)}
    className="w-full flex items-center p-4 mb-3 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-primary-light hover:bg-brand-bg transition-all group text-left"
  >
    <div className="h-12 w-12 rounded-full bg-primary-light text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
      <Icon className="h-6 w-6" />
    </div>
    <div className="ml-4">
      <h3 className="text-gray-900 font-semibold">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </button>
);

const Login = ({ onLogin }) => {
  const [role, setRole] = useState(null); // 'admin' | 'teacher' | 'parent'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await http.post("/auth/login", { email, password, role });
      onLogin(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <School className="w-8 h-8" />
            <span>Kindergarten Management & Monitoring System</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            SmartKindy
          </h1>
          <p className="text-brand-bg text-lg leading-relaxed">
            Streamline your kindergarten management in one unified platform.
          </p>
        </div>

        <div className="relative z-10 text-sm text-brand-bg/80">
          © {new Date().getFullYear()} Kindergarten Management System
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {!role ? "Welcome Back" : `${role.charAt(0).toUpperCase() + role.slice(1)} Login`}
            </h2>
            <p className="text-gray-500 mt-2">
              {!role ? "Please select your login type to continue" : "Enter your credentials to access your dashboard"}
            </p>
          </div>

          {!role ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RoleCard
                role="admin"
                icon={School}
                title="Administrator Portal"
                description="System management & oversight"
                onClick={setRole}
              />
              <RoleCard
                role="teacher"
                icon={GraduationCap}
                title="Teacher Portal"
                description="Classroom & student management"
                onClick={setRole}
              />
              <RoleCard
                role="parent"
                icon={Users}
                title="Parent Portal"
                description="View child's progress & updates"
                onClick={setRole}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-8 duration-300">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
                  {error}
                </div>
              )}

              <InputField
                icon={User}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <InputField
                icon={Lock}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole(null);
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="w-full mt-4 text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Role Selection
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              New parent?{" "}
              <Link to="/enroll" className="text-primary-dark font-bold hover:underline">
                Enroll your child here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;