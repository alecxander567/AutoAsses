// src/components/Alert.jsx
import { useEffect, useState, useCallback } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";

const Alert = ({ type, message, onClose, duration = 2000 }) => {
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
    if (message) {
      // Trigger enter animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });

      // Auto dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [message, duration, handleClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  const icon = isSuccess ? FaCheckCircle : FaExclamationCircle;
  const IconComponent = icon;

  const bgColor =
    isSuccess ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200";

  const textColor = isSuccess ? "text-emerald-800" : "text-red-800";

  const iconColor = isSuccess ? "text-emerald-500" : "text-red-500";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none ${
        isVisible || isExiting ? "pointer-events-auto" : ""
      }`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${isExiting ? "opacity-0" : ""}`}
        onClick={handleClose}
      />

      {/* Alert Modal */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isVisible ?
            "scale-100 opacity-100 translate-y-0"
          : "scale-95 opacity-0 translate-y-4"
        } ${isExiting ? "scale-95 opacity-0 translate-y-4" : ""}`}
        role="alert">
        <div
          className={`flex items-start gap-3 px-6 py-5 rounded-2xl border shadow-2xl ${bgColor} w-full`}>
          <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
            <IconComponent className="text-2xl" />
          </div>
          <div className={`flex-1 min-w-0 ${textColor}`}>
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors duration-200 ${
              isSuccess ?
                "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100"
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
