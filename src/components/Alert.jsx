// src/components/Alert.jsx
import { useEffect, useState, useCallback } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
} from "react-icons/fa";

const Alert = ({ type, message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss after duration
    if (duration > 0 && message) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, handleClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  const icon = isSuccess ? FaCheckCircle : FaExclamationCircle;
  const IconComponent = icon;

  const bgColor = isSuccess
    ? "bg-emerald-50 border-emerald-200"
    : "bg-red-50 border-red-200";

  const textColor = isSuccess ? "text-emerald-800" : "text-red-800";

  const iconColor = isSuccess ? "text-emerald-500" : "text-red-500";

  return (
    <div className={`alert-overlay ${isVisible ? "alert-overlay-visible" : ""} ${isExiting ? "alert-overlay-exit" : ""}`}>
      <div
        className={`alert-container ${isVisible ? "alert-enter" : ""} ${isExiting ? "alert-exit" : ""}`}
        role="alert">
        <div
          className={`flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-lg ${bgColor} max-w-md w-full`}>
          <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
            <IconComponent className="text-xl" />
          </div>
          <div className={`flex-1 min-w-0 ${textColor}`}>
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors duration-200 ${
              isSuccess
                ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100"
                : "text-red-400 hover:text-red-600 hover:bg-red-100"
            }`}
            aria-label="Close alert">
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;