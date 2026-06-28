// src/components/tabs/AnalyticsTab.jsx
import { FaChartLine, FaStar } from "react-icons/fa";

const AnalyticsTab = ({
  classes,
  avgScore,
  studentsWithScores,
  totalQuizzes,
  totalStudents,
  totalGraded,
  pendingChecks,
  passed,
  failed,
}) => {
  const gradeA = classes.reduce(
    (acc, cls) =>
      acc +
      (cls.students?.filter((s) => s.avgScore >= 90 && s.avgScore <= 100)
        .length || 0),
    0,
  );
  const gradeB = classes.reduce(
    (acc, cls) =>
      acc +
      (cls.students?.filter((s) => s.avgScore >= 80 && s.avgScore < 90)
        .length || 0),
    0,
  );
  const gradeC = classes.reduce(
    (acc, cls) =>
      acc +
      (cls.students?.filter((s) => s.avgScore >= 70 && s.avgScore < 80)
        .length || 0),
    0,
  );
  const gradeD = classes.reduce(
    (acc, cls) =>
      acc +
      (cls.students?.filter((s) => s.avgScore >= 60 && s.avgScore < 70)
        .length || 0),
    0,
  );
  const gradeF = classes.reduce(
    (acc, cls) =>
      acc +
      (cls.students?.filter((s) => s.avgScore < 60 && s.avgScore > 0).length ||
        0),
    0,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-emerald-900">
            {avgScore.toFixed(1)}%
          </p>
          <p className="text-xs text-emerald-600">
            <FaChartLine className="inline mr-1" />
            {studentsWithScores} students
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-noon-warm/30">
          <p className="text-xs sm:text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold text-noon-warm">
            {totalGraded > 0 ? Math.round((passed / totalGraded) * 100) : 0}%
          </p>
          <p className="text-xs text-noon-warm">
            <FaChartLine className="inline mr-1" />
            {passed} passed / {failed} failed
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ocean-blue/30">
          <p className="text-xs sm:text-sm text-gray-500">Total Quizzes</p>
          <p className="text-2xl font-bold text-ocean-blue">{totalQuizzes}</p>
          <p className="text-xs text-ocean-blue">
            <FaChartLine className="inline mr-1" />
            {classes.length} classes
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
          <p className="text-xs sm:text-sm text-gray-500">Total Students</p>
          <p className="text-lg font-bold text-purple-600">{totalStudents}</p>
          <p className="text-xs text-purple-600">
            <FaStar className="inline mr-1" />
            {totalGraded} graded
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Score</span>
              <span className="text-sm font-bold text-emerald-600">
                {avgScore.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Pass Rate</span>
              <span className="text-sm font-bold text-blue-600">
                {totalGraded > 0 ? Math.round((passed / totalGraded) * 100) : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Graded</span>
              <span className="text-sm font-bold text-purple-600">
                {totalGraded} students
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-bold text-amber-600">
                {pendingChecks} students
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            {totalGraded > 0 ?
              <>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">A (90-100%)</span>
                  <span className="text-sm font-bold text-green-600">
                    {gradeA}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">B (80-89%)</span>
                  <span className="text-sm font-bold text-blue-600">
                    {gradeB}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">C (70-79%)</span>
                  <span className="text-sm font-bold text-yellow-600">
                    {gradeC}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">D (60-69%)</span>
                  <span className="text-sm font-bold text-orange-600">
                    {gradeD}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">F (Below 60%)</span>
                  <span className="text-sm font-bold text-red-600">
                    {gradeF}
                  </span>
                </div>
              </>
            : <p className="text-center text-gray-500 py-4">
                No grades available yet
              </p>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
