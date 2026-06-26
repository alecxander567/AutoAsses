// src/pages/Signup.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaClipboardCheck,
  FaCheckDouble,
  FaRobot,
  FaChartLine,
  FaRocket,
} from "react-icons/fa";
import { useAuthForm } from "../hooks/useAuthForm";
import { useAuthActions } from "../hooks/useAuthActions";
import Alert from "../components/Alert";

const Signup = () => {
  const navigate = useNavigate();
  const {
    user,
    handleSignup,
    handleGoogleLogin,
    handleResendVerification,
    loading: authLoading,
  } = useAuthActions();

  const {
    formData,
    showPassword,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    handleChange,
    togglePasswordVisibility,
    validateSignupForm,
  } = useAuthForm();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateSignupForm()) {
      return;
    }

    setLoading(true);
    const result = await handleSignup(
      formData.email,
      formData.password,
      formData.name,
    );
    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
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

  const handleResendVerificationEmail = async () => {
    const result = await handleResendVerification();
    if (result.success) {
      alert("Verification email resent successfully! Please check your inbox.");
    } else {
      alert(result.error || "Failed to resend verification email.");
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-seashell-white to-noon-warm/10 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-emerald-100/50 flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Left Side - Branding */}
        <div className="hidden sm:flex md:w-2/5 lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-br from-emerald-600 to-emerald-400 text-white flex-col justify-between relative overflow-hidden min-h-[300px]">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-white/5 rounded-full -ml-18 sm:-ml-24 -mb-18 sm:-mb-24"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-white/5 rounded-full"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaClipboardCheck className="text-white text-lg sm:text-xl md:text-2xl" />
              </div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold">
                AutoAsses
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight">
              Join the Future of <br className="hidden xs:block" />
              Answer Checking!
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
              Start checking answer sheets with AI
            </p>

            <div className="space-y-2 sm:space-y-3 md:space-y-4 mt-4 sm:mt-6 md:mt-8">
              <div className="flex items-center gap-2 sm:gap-3 text-emerald-50 text-sm sm:text-base">
                <FaCheckDouble className="text-emerald-200 flex-shrink-0" />
                <span>Upload answer keys easily</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-emerald-50 text-sm sm:text-base">
                <FaRobot className="text-emerald-200 flex-shrink-0" />
                <span>AI-powered answer checking</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-emerald-50 text-sm sm:text-base">
                <FaChartLine className="text-emerald-200 flex-shrink-0" />
                <span>Get detailed analytics</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-emerald-50 text-sm sm:text-base">
                <FaRocket className="text-emerald-200 flex-shrink-0" />
                <span>Save hours of grading time</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 sm:mt-6 md:mt-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-emerald-100/80 text-xs sm:text-sm">
              <span>Free to start</span>
              <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-emerald-300 rounded-full"></span>
              <span>No credit card</span>
              <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-emerald-300 rounded-full"></span>
              <span>14-day trial</span>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full md:w-3/5 lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Logo */}
            <div className="sm:hidden text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
                <FaClipboardCheck className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-900">AutoAsses</h2>
              <p className="text-gray-500 text-sm mt-1">Create your account</p>
            </div>

            {/* Desktop Title */}
            <div className="hidden sm:block mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Create Account
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Start your journey with AutoAsses
              </p>
            </div>

            {/* Success Message with Verification Notice */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-3 sm:mb-4">
                <p className="font-semibold text-sm sm:text-base">
                  ✅ Account created successfully!
                </p>
                <p className="text-xs sm:text-sm mt-1">
                  We've sent a verification email to{" "}
                  <strong>{formData.email}</strong>. Please verify your email
                  before signing in.
                </p>
                <button
                  onClick={handleResendVerificationEmail}
                  className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-900 underline mt-2 font-medium">
                  Resend verification email
                </button>
              </div>
            )}

            {/* Error Alert */}
            <Alert
              type="error"
              message={error}
              onClose={() => setError("")}
            />

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all duration-300 mb-4 sm:mb-6 text-sm sm:text-base">
              <FaGoogle className="text-red-500 text-lg sm:text-xl flex-shrink-0" />
              <span>Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="bg-white px-3 sm:px-4 text-gray-500">
                  Or sign up with email
                </span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 text-sm sm:text-base" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 text-sm sm:text-base" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 text-sm sm:text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ?
                      <FaEyeSlash className="text-sm sm:text-base" />
                    : <FaEye className="text-sm sm:text-base" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 text-sm sm:text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside ml-1 sm:ml-2">
                  <li>At least 6 characters long</li>
                  <li>Contains at least one letter</li>
                  <li>Contains at least one number</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                {loading ?
                  <span className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Creating account...
                  </span>
                : "Create Account"}
              </button>
            </form>

            <p className="mt-4 sm:mt-6 text-center text-gray-600 text-sm sm:text-base">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-emerald-600 hover:text-emerald-800 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
