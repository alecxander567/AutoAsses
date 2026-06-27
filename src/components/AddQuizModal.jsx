// src/components/AddQuizModal.jsx
import { useState, useEffect } from "react";
import { FaTimes, FaQuestionCircle, FaEdit } from "react-icons/fa";

const AddQuizModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  quizToEdit = null,
  classId = null,
  classes = [],
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [status, setStatus] = useState("active");
  const [selectedClassId, setSelectedClassId] = useState(classId || "");
  const [error, setError] = useState("");

  const isEditMode = !!quizToEdit;

  // Use useEffect with a flag to prevent unnecessary updates
  useEffect(() => {
    // Only update when modal opens or quiz changes
    if (isOpen) {
      // Use a timeout to avoid synchronous state updates
      const timer = setTimeout(() => {
        if (quizToEdit) {
          setTitle(quizToEdit.title || "");
          setDescription(quizToEdit.description || "");
          setDate(quizToEdit.date || "");
          setTotalQuestions(quizToEdit.totalQuestions || 10);
          setStatus(quizToEdit.status || "active");
          setSelectedClassId(classId || "");
        } else {
          setTitle("");
          setDescription("");
          setDate(new Date().toISOString().split("T")[0]);
          setTotalQuestions(10);
          setStatus("active");
          setSelectedClassId(classId || "");
        }
        setError("");
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen, quizToEdit, classId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedClassId) {
      setError("Please select a class");
      return;
    }

    if (!title.trim()) {
      setError("Quiz title is required");
      return;
    }

    const result = await onSubmit(selectedClassId, {
      title: title.trim(),
      description: description.trim(),
      date,
      totalQuestions,
      status,
    });

    if (result && result.success) {
      // Reset form after successful submission
      setTitle("");
      setDescription("");
      setDate("");
      setTotalQuestions(10);
      setStatus("active");
      setSelectedClassId("");
      setError("");
      onClose();
    } else if (result && result.error) {
      setError(result.error);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTotalQuestions(10);
    setStatus("active");
    setSelectedClassId("");
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
              : <FaQuestionCircle className="text-emerald-600 text-lg" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {isEditMode ? "Edit Quiz" : "Create Quiz"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditMode ?
                  `Editing "${quizToEdit?.title || "quiz"}"`
                : "Add a new quiz to a class"}
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

          {!classId && (
            <div>
              <label
                htmlFor="classSelect"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                id="classSelect"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
                required>
                <option value="">Select a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.students?.length || 0} students)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="quizTitle"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              id="quizTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algebra Basics Quiz"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="quizDescription"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Description{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="quizDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the quiz..."
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="quizDate"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <input
                id="quizDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="totalQuestions"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Questions
              </label>
              <input
                id="totalQuestions"
                type="number"
                min="1"
                max="100"
                value={totalQuestions}
                onChange={(e) =>
                  setTotalQuestions(parseInt(e.target.value) || 1)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="quizStatus"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              id="quizStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition text-sm">
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
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
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              : <>{isEditMode ? "Save Changes" : "Create Quiz"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuizModal;
