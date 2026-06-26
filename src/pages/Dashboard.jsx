// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaSpinner,
  FaUpload,
  FaFileAlt,
  FaCheckCircle,
  FaClipboardCheck,
  FaChartBar,
  FaHistory,
  FaPlus,
  FaCloudUploadAlt,
  FaRobot,
  FaGraduationCap,
  FaUsers,
  FaClock,
  FaStar,
  FaDownload,
  FaEye,
  FaTrash,
  FaEdit,
  FaSearch,
  FaFilter,
  FaBell,
  FaCog,
  FaHome,
  FaBook,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckDouble,
  FaChartLine,
  FaRocket,
} from "react-icons/fa";
import { useAuthActions } from "../hooks/useAuthActions";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, handleLogout } = useAuthActions();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogoutClick = async () => {
    const result = await handleLogout();
    if (result.success) {
      navigate("/login");
    }
  };

  // Mock Data
  const stats = {
    totalQuizzes: 24,
    pendingChecks: 7,
    completedChecks: 156,
    accuracyRate: 94.5,
    totalStudents: 89,
    averageScore: 82.3,
  };

  const recentActivities = [
    {
      id: 1,
      type: "upload",
      title: "Math Quiz #3 - Answer Key",
      time: "2 hours ago",
      status: "completed",
      quiz: "Algebra Basics",
    },
    {
      id: 2,
      type: "check",
      title: "Science Exam - Period 2",
      time: "4 hours ago",
      status: "pending",
      quiz: "Biology Chapter 5",
    },
    {
      id: 3,
      type: "upload",
      title: "History Test - Answer Sheets",
      time: "1 day ago",
      status: "completed",
      quiz: "World War II",
    },
    {
      id: 4,
      type: "check",
      title: "English Quiz - Period 1",
      time: "2 days ago",
      status: "completed",
      quiz: "Grammar & Composition",
    },
    {
      id: 5,
      type: "upload",
      title: "Physics Quiz #2",
      time: "3 days ago",
      status: "pending",
      quiz: "Mechanics",
    },
  ];

  const upcomingQuizzes = [
    {
      id: 1,
      title: "Chemistry Final",
      date: "2024-12-15",
      students: 32,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Math Quiz #4",
      date: "2024-12-18",
      students: 28,
      status: "upcoming",
    },
    {
      id: 3,
      title: "History Essay",
      date: "2024-12-20",
      students: 30,
      status: "upcoming",
    },
  ];

  const recentQuizResults = [
    {
      id: 1,
      title: "Biology Chapter 5",
      date: "2024-12-10",
      students: 25,
      average: 78.5,
      passRate: 72,
    },
    {
      id: 2,
      title: "Algebra Basics",
      date: "2024-12-08",
      students: 30,
      average: 84.2,
      passRate: 83,
    },
    {
      id: 3,
      title: "World War II",
      date: "2024-12-05",
      students: 28,
      average: 91.0,
      passRate: 89,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-seashell-cream">
        <FaSpinner className="animate-spin text-4xl text-emerald-600" />
      </div>
    );
  }

  // Tab content renderer
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "quizzes":
        return renderQuizzes();
      case "students":
        return renderStudents();
      case "analytics":
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  // Overview Tab
  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Total Quizzes</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-900">
            {stats.totalQuizzes}
          </p>
          <p className="text-xs text-emerald-600">↑ 12% this month</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-noon-warm/30">
          <p className="text-xs sm:text-sm text-gray-500">Pending Checks</p>
          <p className="text-xl sm:text-2xl font-bold text-noon-warm">
            {stats.pendingChecks}
          </p>
          <p className="text-xs text-noon-warm">⏳ Waiting for review</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">
            {stats.completedChecks}
          </p>
          <p className="text-xs text-emerald-600">✅ All checked</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-ocean-blue/30">
          <p className="text-xs sm:text-sm text-gray-500">Accuracy Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-ocean-blue">
            {stats.accuracyRate}%
          </p>
          <p className="text-xs text-ocean-blue">📈 Up 2.5%</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-purple-200">
          <p className="text-xs sm:text-sm text-gray-500">Students</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {stats.totalStudents}
          </p>
          <p className="text-xs text-purple-600">👨‍🎓 Active</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-pink-200">
          <p className="text-xs sm:text-sm text-gray-500">Avg. Score</p>
          <p className="text-xl sm:text-2xl font-bold text-pink-600">
            {stats.averageScore}%
          </p>
          <p className="text-xs text-pink-600">📊 Class average</p>
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
              <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3">
                <FaCloudUploadAlt />
                <span className="text-sm font-medium">Upload Answer Key</span>
              </button>
              <button className="w-full bg-gradient-to-r from-noon-warm to-noon-sun text-gray-800 p-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3">
                <FaFileAlt />
                <span className="text-sm font-medium">
                  Upload Answer Sheets
                </span>
              </button>
              <button className="w-full bg-gradient-to-r from-ocean-blue to-blue-400 text-white p-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-3">
                <FaRobot />
                <span className="text-sm font-medium">AI Summary</span>
              </button>
            </div>
          </div>

          {/* Upcoming Quizzes */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-noon-warm" />
              Upcoming Quizzes
            </h3>
            <div className="space-y-3">
              {upcomingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {quiz.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quiz.date} • {quiz.students} students
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-noon-warm/20 text-noon-warm text-xs rounded-full">
                    Upcoming
                  </span>
                </div>
              ))}
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
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between hover:bg-gray-50 transition gap-2">
                  <div className="flex items-center gap-3">
                    {activity.type === "upload" ?
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FaUpload className="text-emerald-600 text-sm" />
                      </div>
                    : <div className="w-8 h-8 bg-noon-warm/20 rounded-lg flex items-center justify-center">
                        <FaCheckCircle className="text-noon-warm text-sm" />
                      </div>
                    }
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.quiz} • {activity.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === "completed" ?
                        "bg-emerald-100 text-emerald-700"
                      : "bg-noon-warm/20 text-noon-warm"
                    }`}>
                    {activity.status === "completed" ?
                      "✅ Completed"
                    : "⏳ Pending"}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                View All Activity →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="mt-6 sm:mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FaChartBar className="text-ocean-blue" />
              Recent Quiz Results
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
                {recentQuizResults.map((result) => (
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
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-emerald-600 transition">
                          <FaEye className="text-sm" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-emerald-600 transition">
                          <FaDownload className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  // Quizzes Tab
  const renderQuizzes = () => (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FaBook className="text-emerald-600" />
          All Quizzes
        </h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm">
          <FaPlus />
          Create Quiz
        </button>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="text-emerald-600" />
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  Active
                </span>
              </div>
              <h4 className="font-semibold text-gray-800">
                Quiz #{i}: Subject Name
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Created: Dec {i + 5}, 2024
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>👨‍🎓 {Math.floor(Math.random() * 30) + 10} students</span>
                <span>📝 {Math.floor(Math.random() * 20) + 5} questions</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button className="flex-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                  View Details
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-600 transition">
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Students Tab
  const renderStudents = () => (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FaUsers className="text-emerald-600" />
          Students
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search students..."
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm">
            Add Student
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
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
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-gray-50 transition">
                <td className="px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-emerald-600 text-sm" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Student {i}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                  student{i}@example.com
                </td>
                <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                  {Math.floor(Math.random() * 15) + 5}
                </td>
                <td className="px-4 sm:px-6 py-3 text-sm font-medium text-ocean-blue">
                  {Math.floor(Math.random() * 30) + 65}%
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    Active
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-emerald-600 transition">
                      <FaEye className="text-sm" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-emerald-600 transition">
                      <FaEdit className="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Analytics Tab
  const renderAnalytics = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-emerald-900">82.3%</p>
          <p className="text-xs text-emerald-600">↑ 3.2% this month</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-noon-warm/30">
          <p className="text-xs sm:text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold text-noon-warm">78.5%</p>
          <p className="text-xs text-noon-warm">↑ 5.1% this month</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ocean-blue/30">
          <p className="text-xs sm:text-sm text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold text-ocean-blue">1,247</p>
          <p className="text-xs text-ocean-blue">↑ 12.8% this month</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
          <p className="text-xs sm:text-sm text-gray-500">Top Performer</p>
          <p className="text-lg font-bold text-purple-600">Student 5</p>
          <p className="text-xs text-purple-600">⭐ 97.5% average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Performance by Subject
          </h3>
          <div className="space-y-3">
            {["Mathematics", "Science", "History", "English", "Physics"].map(
              (subject, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{subject}</span>
                    <span className="font-medium text-gray-700">
                      {80 - i * 3}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full"
                      style={{ width: `${80 - i * 3}%` }}></div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
          <h3 className="font-bold text-gray-800 mb-4">Recent AI Insights</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-seashell-cream rounded-lg border border-emerald-100/50">
              <p className="text-sm font-medium text-gray-800">
                📊 Top Performer Trend
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Students are showing 15% improvement after using AI-powered
                feedback
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-noon-warm/10 to-noon-sun/10 rounded-lg border border-noon-warm/30">
              <p className="text-sm font-medium text-gray-800">
                ⚠️ Common Mistakes
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Most students struggle with questions 3 and 7 in Algebra Basics
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-ocean-blue/10 to-blue-100/20 rounded-lg border border-ocean-blue/30">
              <p className="text-sm font-medium text-gray-800">
                💡 Recommendation
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Consider reviewing Chapter 5 before the final exam
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-seashell-white to-noon-warm/5">
      {/* Top Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-emerald-100/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <FaClipboardCheck className="text-white text-base sm:text-xl" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-emerald-900">
                AutoAsses
              </h1>
              <span className="hidden sm:inline text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                v2.0
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaBell className="text-base sm:text-lg" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <FaCog className="text-lg" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                {user?.photoURL ?
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-200"
                  />
                : <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <FaUser className="text-emerald-600 text-sm sm:text-base" />
                  </div>
                }
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-emerald-600">Teacher</p>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                <FaSignOutAlt />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
          <div className="relative z-10">
            <h2 className="text-lg sm:text-2xl font-bold">
              Welcome back, {user?.displayName?.split(" ")[0] || "Teacher"}! 👋
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              You have {stats.pendingChecks} pending checks to review. Ready to
              grade some papers?
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
              <button className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-white/30 transition flex items-center gap-2">
                <FaUpload className="text-sm" />
                Upload New Quiz
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-white/30 transition flex items-center gap-2">
                <FaRobot className="text-sm" />
                AI Summary
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-8 bg-white rounded-xl p-1 shadow-sm border border-emerald-100/50">
          {[
            { id: "overview", label: "Overview", icon: FaHome },
            { id: "quizzes", label: "Quizzes", icon: FaBook },
            { id: "students", label: "Students", icon: FaUsers },
            { id: "analytics", label: "Analytics", icon: FaChartLine },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === tab.id ?
                  "bg-emerald-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
              }`}>
              <tab.icon className="text-sm sm:text-base" />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
