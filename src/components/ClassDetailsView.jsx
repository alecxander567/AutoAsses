// src/components/ClassDetailsView.jsx
import { useState } from "react";
import {
  FaUserGraduate,
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaUsers,
  FaCalendarAlt,
  FaEdit,
} from "react-icons/fa";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import AddStudentModal from "./AddStudentModal";

const ClassDetailsView = ({
  classData,
  onBack,
  onAddStudent,
  onRemoveStudent,
  onEditStudent,
  loading,
}) => {
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!classData) return null;

  const students = classData.students || [];

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    const result = await onRemoveStudent(classData.id, studentToDelete.id);
    if (result && result.success) {
      setStudentToDelete(null);
    }
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (name, email) => {
    if (!studentToEdit) return { success: false, error: "No student selected" };
    const result = await onEditStudent(
      classData.id,
      studentToEdit.id,
      name,
      email,
    );
    if (result && result.success) {
      setShowEditModal(false);
      setStudentToEdit(null);
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <FaArrowLeft />
            </button>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {classData.name}
              </h3>
              {classData.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {classData.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddStudent}
              disabled={loading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <FaPlus />
              Add Student
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <FaUsers className="text-xs" />
            {students.length} students
          </span>
          <span className="flex items-center gap-1">
            <FaCalendarAlt className="text-xs" />
            Created {new Date(classData.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <FaUserGraduate className="text-emerald-600" />
            Students
          </h4>
        </div>

        {students.length === 0 ?
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <FaUserGraduate className="text-emerald-400 text-3xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              No Students Yet
            </h4>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Add students to this class to start tracking their quiz
              performance.
            </p>
            <button
              onClick={onAddStudent}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              <FaPlus />
              Add Your First Student
            </button>
          </div>
        : <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quizzes Taken
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg. Score
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <FaUserGraduate className="text-emerald-600 text-sm" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                      {student.email || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                      {student.quizzesTaken || 0}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-ocean-blue">
                      {student.avgScore ? `${student.avgScore}%` : "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          student.status === "Active" || !student.status ?
                            "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                        }`}>
                        {student.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditStudent(student)}
                          disabled={loading}
                          className="p-1 text-gray-400 hover:text-emerald-600 transition disabled:opacity-50"
                          title="Edit student">
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(student)}
                          disabled={loading}
                          className="p-1 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                          title="Delete student">
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteStudent}
        className={studentToDelete?.name || ""}
        loading={loading}
        type="student"
      />

      {/* Edit Student Modal - Reusing AddStudentModal */}
      <AddStudentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setStudentToEdit(null);
        }}
        onSubmit={handleEditSubmit}
        loading={loading}
        studentToEdit={studentToEdit}
      />
    </div>
  );
};

export default ClassDetailsView;
