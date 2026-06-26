// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useAuthActions } from "../hooks/useAuthActions";
import Alert from "../components/Alert";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { handleResetPassword } = useAuthActions();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const result = await handleResetPassword(email);
    setLoading(false);

    if (result.success) {
      setMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-seashell-white to-noon-warm/10 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8 border border-emerald-100/50">
        <Link
          to="/login"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-800 mb-6 transition">
          <FaArrowLeft className="mr-2" />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-900">
            Reset Password
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        <Alert
          type="success"
          message={message}
          onClose={() => setMessage("")}
        />

        <Alert
          type="error"
          message={error}
          onClose={() => setError("")}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3.5 text-emerald-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-200 disabled:opacity-50">
            {loading ?
              <span className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" />
                Sending...
              </span>
            : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
