// src/pages/Login.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaClipboardCheck,
  FaCheckDouble,
  FaRobot,
  FaChartLine,
} from "react-icons/fa";
import { useAuthForm } from "../hooks/useAuthForm";
import { useAuthActions } from "../hooks/useAuthActions";

const Login = () => {
  const navigate = useNavigate();
  const {
    user,
    handleLogin,
    handleGoogleLogin,
    loading: authLoading,
  } = useAuthActions();

  const {
    formData,
    showPassword,
    loading,
    setLoading,
    error,
    setError,
    handleChange,
    togglePasswordVisibility,
    validateLoginForm,
  } = useAuthForm();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    const result = await handleLogin(formData.email, formData.password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    const result = await handleGoogleLogin();
    if (!result.success) {
      setError(result.error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-seashell-cream">
        <FaSpinner className="animate-spin text-4xl text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-seashell-white to-noon-warm/10 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-emerald-100/50 flex flex-col md:flex-row">
        {/* Left Side - Branding */}
        <div className="md:w-1/2 p-8 md:p-12 bg-gradient-to-br from-emerald-600 to-emerald-400 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaClipboardCheck className="text-white text-2xl" />
              </div>
              <span className="text-2xl font-bold">AutoAsses</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Welcome Back!
            </h1>
            <p className="text-emerald-100 text-lg mb-6">
              AI-Powered Answer Sheet Checker
            </p>

            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3 text-emerald-50">
                <FaCheckDouble className="text-emerald-200" />
                <span>Upload answer keys easily</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-50">
                <FaRobot className="text-emerald-200" />
                <span>AI-powered answer sheet checking</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-50">
                <FaChartLine className="text-emerald-200" />
                <span>Get detailed performance analytics</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8">
            <div className="flex items-center gap-4 text-emerald-100/80 text-sm">
              <span>Secure</span>
              <span className="w-1 h-1 bg-emerald-300 rounded-full"></span>
              <span>Fast</span>
              <span className="w-1 h-1 bg-emerald-300 rounded-full"></span>
              <span>AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="max-w-sm mx-auto">
            {/* Mobile Logo */}
            <div className="md:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
                <FaClipboardCheck className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-900">AutoAsses</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
            </div>

            {/* Desktop Title */}
            <div className="hidden md:block mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">
                Welcome back! Please enter your details
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start justify-between">
                <span className="text-sm">{error}</span>
                <button
                  onClick={() => setError("")}
                  className="text-red-700 hover:text-red-900">
                  ×
                </button>
              </div>
            )}

            {/* Google Login Button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all duration-300 mb-6">
              <FaGoogle className="text-red-500 text-xl" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3.5 text-emerald-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3.5 text-emerald-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ?
                      <FaEyeSlash />
                    : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-800 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ?
                  <span className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Signing in...
                  </span>
                : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-emerald-600 hover:text-emerald-800 font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
