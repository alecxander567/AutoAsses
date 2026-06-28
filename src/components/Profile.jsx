// src/components/Profile.jsx
import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaSave,
  FaTimes,
  FaUserCircle,
  FaSpinner,
  FaSignOutAlt,
  FaKey,
} from "react-icons/fa";
import { useAuthActions } from "../hooks/useAuthActions";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";

const Profile = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, loading, handleLogout } = useAuthActions();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const showAlert = (type, message) => setAlert({ type, message });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showAlert("success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      showAlert("error", err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      const result = await handleLogout();
      if (result.success) navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: "", message: "" })}
        duration={3000}
      />

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-100/50">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-emerald-100/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <FaUser className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Profile</h3>
              <p className="text-xs text-gray-500">
                Manage your account settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Profile Photo - Display Only */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center overflow-hidden border-4 border-emerald-100">
              {user?.photoURL ?
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              : <FaUserCircle className="text-5xl text-emerald-600" />}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {user?.displayName || "User"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Display Name
              </label>
              <div className="flex items-center gap-2">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing}
                  className={`flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm ${
                    isEditing ?
                      "border-gray-300 bg-white text-gray-800"
                    : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  }`}
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                  placeholder="Your email"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {isEditing ?
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user?.displayName || "");
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isSaving ?
                      <>
                        <FaSpinner className="animate-spin" /> Saving...
                      </>
                    : <>
                        <FaSave /> Save Changes
                      </>
                    }
                  </button>
                </>
              : <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium flex items-center justify-center gap-2">
                  <FaUser />
                  Edit Profile
                </button>
              }
            </div>
          </form>

          {/* Reset Password */}
          <div className="border-t border-emerald-100/50 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  showAlert(
                    "success",
                    "Password reset link sent to your email!",
                  )
                }
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-sm">
                <FaKey className="text-gray-600" />
                <span className="text-gray-700 font-medium">
                  Reset Password
                </span>
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoggingOut ?
              <>
                <FaSpinner className="animate-spin" /> Logging out...
              </>
            : <>
                <FaSignOutAlt /> Logout
              </>
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default Profile;
