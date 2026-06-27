// src/components/AddClassModal.jsx
import { useState } from "react";
import { FaTimes, FaChalkboardTeacher } from "react-icons/fa";

const AddClassModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  classToEdit = null,
}) => {
  const isEditing = !!classToEdit;

  // Use initial values from classToEdit or defaults
  const initialName = classToEdit?.name || "";
  const initialDescription = classToEdit?.description || "";

  const [className, setClassName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Class name is required");
      return;
    }

    const result = await onSubmit(className, description);

    if (result && result.success) {
      // Reset form on success
      setClassName("");
      setDescription("");
      setError("");
      onClose();
    } else if (result && result.error) {
      setError(result.error);
    }
  };

  const handleClose = () => {
    setClassName("");
    setDescription("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FaChalkboardTeacher className="text-emerald-600 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? "Edit Class" : "Add New Class"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditing ?
                  "Update the class name and description"
                : "Create a new class to organize your students"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="className"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              id="className"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Grade 10 - Section A"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Description{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Mathematics class, meets every Monday and Wednesday"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm resize-none"
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
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              : isEditing ?
                "Save Changes"
              : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClassModal;
