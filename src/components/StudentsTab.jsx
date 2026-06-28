// src/components/tabs/StudentsTab.jsx
import { FaChalkboardTeacher, FaPlus } from "react-icons/fa";
import ClassCard from "./ClassCard";
import ClassDetailsView from "./ClassDetailsView";

const StudentsTab = ({
  classes,
  selectedClassId,
  actionLoading,
  deletingId,
  getClassById,
  setShowAddClassModal,
  setShowAddStudentModal,
  handleRemoveStudent,
  handleEditStudent,
  handleRequestDelete,
  handleEditClass,
  handleViewClass,
  handleBackToClasses,
}) => {
  const selectedClass = selectedClassId ? getClassById(selectedClassId) : null;

  if (selectedClass) {
    return (
      <ClassDetailsView
        classData={selectedClass}
        onBack={handleBackToClasses}
        onAddStudent={() => setShowAddStudentModal(true)}
        onRemoveStudent={handleRemoveStudent}
        onEditStudent={handleEditStudent}
        loading={actionLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FaChalkboardTeacher className="text-emerald-600" />
            My Classes
          </h3>
          <button
            onClick={() => setShowAddClassModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm">
            <FaPlus />
            Add Class
          </button>
        </div>

        {classes.length === 0 ?
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <FaChalkboardTeacher className="text-emerald-400 text-3xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              No Classes Yet
            </h4>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Create your first class to start organizing your students. Each
              class can have its own set of students and quizzes.
            </p>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium">
              <FaPlus />
              Create Your First Class
            </button>
          </div>
        : <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classData={cls}
                  onDelete={handleRequestDelete}
                  onEdit={handleEditClass}
                  onView={handleViewClass}
                  deleting={deletingId === cls.id}
                />
              ))}
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default StudentsTab;
