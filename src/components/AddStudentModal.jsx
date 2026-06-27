// src/components/AddStudentModal.jsx
import { useState, useEffect, useRef } from "react";
import { FaTimes, FaUserGraduate, FaEdit } from "react-icons/fa";

const AddStudentModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  studentToEdit = null,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const isFirstRender = useRef(true);

  const isEditMode = !!studentToEdit;

  useEffect(() => {
    // Skip the first render to avoid unnecessary updates
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Use a timeout to avoid synchronous state updates
    if (isOpen) {
      const timer = setTimeout(() => {
        if (studentToEdit) {
          setName(studentToEdit.name || "");
          setEmail(studentToEdit.email || "");
        } else {
          setName("");
          setEmail("");
        }
        setError("");
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, studentToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Student name is required");
      return;
    }

    const result = await onSubmit(name.trim(), email.trim());

    if (result && result.success) {
      setName("");
      setEmail("");
      setError("");
      onClose();
    } else if (result && result.error) {
      setError(result.error);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              {isEditMode ?
                <FaEdit className="text-emerald-600 text-lg" />
              : <FaUserGraduate className="text-emerald-600 text-lg" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {isEditMode ? "Edit Student" : "Add Student"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditMode ?
                  `Editing ${studentToEdit?.name || "student"}`
                : "Add a new student to this class"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              id="studentName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="studentEmail"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="studentEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ?
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? "Saving..." : "Adding..."}
                </>
              : isEditMode ?
                "Save Changes"
              : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;
