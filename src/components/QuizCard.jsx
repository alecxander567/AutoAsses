// src/components/QuizCard.jsx
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaQuestionCircle,
  FaUsers,
} from "react-icons/fa";

const QuizCard = ({
  quiz,
  onEdit,
  onDelete,
  onView,
  loading = false,
  studentCount = 0,
}) => {
  // If quiz is undefined or null, return null
  if (!quiz) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "upcoming":
        return "bg-noon-warm/20 text-noon-warm";
      case "completed":
        return "bg-ocean-blue/20 text-ocean-blue";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
      default:
        return status || "Active";
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <FaQuestionCircle className="text-emerald-600" />
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(quiz.status)}`}>
          {getStatusLabel(quiz.status)}
        </span>
      </div>
      <h4 className="font-semibold text-gray-800">
        {quiz.title || "Untitled Quiz"}
      </h4>
      {quiz.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {quiz.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FaCalendarAlt className="text-xs" />
          {quiz.date || "No date set"}
        </span>
        <span className="flex items-center gap-1">
          <FaQuestionCircle className="text-xs" />
          {quiz.totalQuestions || 0} questions
        </span>
        {studentCount > 0 && (
          <span className="flex items-center gap-1">
            <FaUsers className="text-xs" />
            {studentCount} students
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onView && onView(quiz)}
          className="flex-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center gap-1">
          <FaEye className="text-xs" />
          View Details
        </button>
        <button
          onClick={() => onEdit && onEdit(quiz)}
          disabled={loading}
          className="p-1.5 text-gray-400 hover:text-emerald-600 transition disabled:opacity-50"
          title="Edit quiz">
          <FaEdit className="text-sm" />
        </button>
        <button
          onClick={() => onDelete && onDelete(quiz.id)}
          disabled={loading}
          className="p-1.5 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
          title="Delete quiz">
          <FaTrash className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
