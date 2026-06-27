// src/components/ConfirmDeleteModal.jsx
import { FaTimes, FaTrash, FaExclamationTriangle } from "react-icons/fa";

const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  className = "",
  loading = false,
  type = "class",
}) => {
  if (!isOpen) return null;

  const isStudent = type === "student";
  const title = isStudent ? "Delete Student" : "Delete Class";
  const message =
    isStudent ?
      "Are you sure you want to remove this student from the class? This action cannot be undone."
    : "Are you sure you want to delete this class? This action cannot be undone and all associated data will be lost.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <FaExclamationTriangle className="text-red-500 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500">
                {isStudent ?
                  "Remove student from class"
                : "Delete class permanently"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600">{message}</p>
          {className && (
            <p className="mt-3 text-sm font-medium text-gray-800 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              {isStudent ? "Student: " : "Class: "}
              {className}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg transition text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ?
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isStudent ? "Removing..." : "Deleting..."}
                </>
              : <>
                  <FaTrash className="text-sm" />
                  {isStudent ? "Remove Student" : "Delete Class"}
                </>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
