// src/components/ClassCard.jsx
import {
  FaChalkboardTeacher,
  FaTrash,
  FaEdit,
  FaUsers,
  FaCalendarAlt,
} from "react-icons/fa";

const ClassCard = ({ classData, onDelete, onEdit, onView, deleting }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition group relative">
      {deleting && (
        <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center z-10">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <FaChalkboardTeacher className="text-emerald-600" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(classData)}
            disabled={deleting}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit class">
            <FaEdit className="text-xs" />
          </button>
          <button
            onClick={() => onDelete(classData.id)}
            disabled={deleting}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete class">
            <FaTrash className="text-xs" />
          </button>
        </div>
      </div>
      <h4 className="font-semibold text-gray-800">{classData.name}</h4>
      {classData.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {classData.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <FaUsers className="text-xs" />
          {classData.studentCount} students
        </span>
        <span className="flex items-center gap-1">
          <FaCalendarAlt className="text-xs" />
          {new Date(classData.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onView(classData.id)}
          className="w-full text-sm text-emerald-600 hover:text-emerald-800 font-medium text-center">
          View Class Details →
        </button>
      </div>
    </div>
  );
};

export default ClassCard;
