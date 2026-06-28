// src/components/QuizzesTab.jsx
import { FaBook, FaPlus } from "react-icons/fa";
import QuizCard from "./QuizCard";

const QuizzesTab = ({
  classes,
  actionLoading,
  setShowAddQuizModal,
  setQuizToEdit,
  setQuizToDelete,
  handleViewQuiz,
}) => {
  const allQuizzes = [];
  classes.forEach((cls) => {
    (cls.quizzes || []).forEach((quiz) => {
      allQuizzes.push({
        ...quiz,
        className: cls.name,
        classId: cls.id,
        studentCount: cls.students?.length || 0,
      });
    });
  });

  const sortedQuizzes = allQuizzes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FaBook className="text-emerald-600" />
          All Quizzes
        </h3>
        <button
          onClick={() => {
            setShowAddQuizModal(true);
            setQuizToEdit(null);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm">
          <FaPlus />
          Create Quiz
        </button>
      </div>
      <div className="p-4 sm:p-6">
        {sortedQuizzes.length === 0 ?
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <FaBook className="text-emerald-400 text-3xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              No Quizzes Yet
            </h4>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Create your first quiz and associate it with a class to start
              tracking student performance.
            </p>
            <button
              onClick={() => {
                setShowAddQuizModal(true);
                setQuizToEdit(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition text-sm font-medium">
              <FaPlus />
              Create Your First Quiz
            </button>
          </div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                classId={quiz.classId}
                onEdit={() => {
                  setQuizToEdit(quiz);
                  setShowAddQuizModal(true);
                }}
                onDelete={(quizId) => {
                  setQuizToDelete({
                    id: quizId,
                    classId: quiz.classId,
                    title: quiz.title,
                  });
                }}
                onView={handleViewQuiz}
                onCompare={(quiz) => {
                  handleViewQuiz(quiz);
                }}
                loading={actionLoading}
              />
            ))}
          </div>
        }
      </div>
    </div>
  );
};

export default QuizzesTab;
