// src/components/tabs/OverviewTab.jsx
import {
  FaFileAlt,
  FaChartBar,
  FaHistory,
  FaFilter,
  FaRocket,
  FaBook,
  FaUsers,
  FaPlus,
  FaChartLine,
  FaClock,
  FaCheck,
  FaChartPie,
  FaGraduationCap,
  FaEye,
} from "react-icons/fa";

const OverViewTab = ({
  classes,
  totalQuizzes,
  totalStudents,
  totalGraded,
  pendingChecks,
  completedChecks,
  accuracyRate,
  avgScore,
  passRate,
  passed,
  failed,
  searchQuery,
  setSearchQuery,
  setActiveTab,
  setShowAddClassModal,
  handleViewQuiz,
}) => {
  const recentQuizResultsDisplay = [];
  classes.forEach((cls) => {
    (cls.quizzes || []).forEach((quiz) => {
      const gradedStudents =
        cls.students?.filter((s) => s.quizScores?.[quiz.id]) || [];
      if (gradedStudents.length > 0) {
        const scores = gradedStudents.map((s) => s.quizScores[quiz.id].score);
        const avg = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length,
        );
        const passCount = scores.filter((s) => s >= 70).length;
        recentQuizResultsDisplay.push({
          id: quiz.id,
          title: quiz.title,
          date: quiz.date || quiz.createdAt?.split("T")[0] || "N/A",
          students: gradedStudents.length,
          average: avg,
          passRate: Math.round((passCount / scores.length) * 100),
        });
      }
    });
  });
  recentQuizResultsDisplay.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentQuizResultsFiltered = recentQuizResultsDisplay.slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Total Quizzes</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-900">
            {totalQuizzes}
          </p>
          <p className="text-xs text-emerald-600">{classes.length} classes</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-noon-warm/30">
          <p className="text-xs sm:text-sm text-gray-500">Pending Checks</p>
          <p className="text-xl sm:text-2xl font-bold text-noon-warm">
            {pendingChecks}
          </p>
          <p className="text-xs text-noon-warm">
            <FaClock className="inline mr-1" />
            Needs grading
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">
            {completedChecks}
          </p>
          <p className="text-xs text-emerald-600">
            <FaCheck className="inline mr-1" />
            Graded
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-ocean-blue/30">
          <p className="text-xs sm:text-sm text-gray-500">Accuracy Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-ocean-blue">
            {accuracyRate}%
          </p>
          <p className="text-xs text-ocean-blue">
            <FaChartLine className="inline mr-1" />
            Overall average
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-purple-200">
          <p className="text-xs sm:text-sm text-gray-500">Students</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {totalStudents}
          </p>
          <p className="text-xs text-purple-600">
            <FaGraduationCap className="inline mr-1" />
            {totalGraded} graded
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-pink-200">
          <p className="text-xs sm:text-sm text-gray-500">Pass Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-pink-600">
            {passRate}%
          </p>
          <p className="text-xs text-pink-600">
            <FaChartPie className="inline mr-1" />
            {passed} passed / {failed} failed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaRocket className="text-emerald-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab("quizzes")}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3">
                <FaBook />
                <span className="text-sm font-medium">View All Quizzes</span>
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-all flex items-center gap-3">
                <FaUsers />
                <span className="text-sm font-medium">Manage Students</span>
              </button>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white p-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3">
                <FaPlus />
                <span className="text-sm font-medium">Create New Class</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartBar className="text-noon-warm" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Classes</span>
                <span className="text-sm font-bold text-emerald-600">
                  {classes.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Students</span>
                <span className="text-sm font-bold text-purple-600">
                  {totalStudents}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Quizzes</span>
                <span className="text-sm font-bold text-blue-600">
                  {totalQuizzes}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className="text-sm font-bold text-emerald-600">
                  {avgScore.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaHistory className="text-emerald-600" />
                Recent Activity
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg">
                  <FaFilter />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentQuizResultsFiltered.length > 0 ?
                recentQuizResultsFiltered.map((result) => (
                  <div
                    key={result.id}
                    className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between hover:bg-gray-50 transition gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FaFileAlt className="text-emerald-600 text-sm" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.students} students • {result.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-emerald-600">
                        {result.average}%
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.passRate >= 80 ?
                            "bg-emerald-100 text-emerald-700"
                          : result.passRate >= 60 ?
                            "bg-noon-warm/20 text-noon-warm"
                          : "bg-red-100 text-red-700"
                        }`}>
                        {result.passRate}% pass
                      </span>
                    </div>
                  </div>
                ))
              : <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  <p>
                    No quiz results yet. Start grading students to see activity!
                  </p>
                </div>
              }
            </div>
            {recentQuizResultsFiltered.length > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setActiveTab("quizzes")}
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                  View All Quizzes →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Results Table */}
      {recentQuizResultsFiltered.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaChartBar className="text-ocean-blue" />
                Quiz Results Overview
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quiz Title
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Students
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Average
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pass Rate
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentQuizResultsFiltered.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-700">
                        {result.title}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                        {result.date}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                        {result.students}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm font-medium text-ocean-blue">
                        {result.average}%
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.passRate >= 80 ?
                              "bg-emerald-100 text-emerald-700"
                            : result.passRate >= 60 ?
                              "bg-noon-warm/20 text-noon-warm"
                            : "bg-red-100 text-red-700"
                          }`}>
                          {result.passRate}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <button
                          onClick={() => {
                            const quiz = classes
                              .flatMap((c) => c.quizzes || [])
                              .find((q) => q.id === result.id);
                            if (quiz) handleViewQuiz(quiz);
                          }}
                          className="p-1 text-gray-400 hover:text-emerald-600 transition">
                          <FaEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OverViewTab;
