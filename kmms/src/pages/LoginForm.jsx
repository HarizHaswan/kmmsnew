import React, { useState } from "react";
import Spinner from "../components/Loader/Spinner";
import { Eye, EyeOff } from "lucide-react";

const LoginForm = ({ role, onSubmit, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    await onSubmit({ email, password, role, setError: setErrorMsg });

    setLoading(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-brand-bg">

      {/* LEFT SIDE PANEL (same as login main screen) */}
      <div className="hidden md:flex flex-col justify-center items-center text-white 
                      bg-gradient-to-br from-primary via-purple-500 to-orange-400 p-12">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎓</div>
          <h1 className="text-4xl font-bold mb-4">Kindergarten Management System</h1>
          <p className="text-lg opacity-90">
            Secure login to access your dashboard
          </p>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="flex items-center justify-center p-10">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center">

          <h2 className="text-3xl font-bold text-indigo-700 mb-2">
            {role} Login
          </h2>
          <p className="text-gray-500 mb-6">Enter your credentials</p>

          {/* ERROR MESSAGE */}
          {errorMsg && (
            <p className="mb-4 text-red-600 bg-red-100 p-2 rounded-lg text-sm">
              {errorMsg}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {/* Email */}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg pr-12"
                required
              />

              {/* Eye Icon */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-lg text-white flex justify-center items-center ${
                loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? <Spinner /> : "Login"}
            </button>
          </form>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="mt-4 text-indigo-600 hover:underline"
          >
            ← Back
          </button>

        </div>
      </div>

    </div>
  );
};

export default LoginForm;
