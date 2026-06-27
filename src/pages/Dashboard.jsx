// src/pages/Dashboard.jsx
import { useState, useRef } from "react";
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
  FaUsers,
  FaDownload,
  FaEye,
  FaFilter,
  FaBell,
  FaCog,
  FaHome,
  FaBook,
  FaCalendarAlt,
  FaChartLine,
  FaRocket,
  FaChalkboardTeacher,
  FaArrowLeft,
  FaFileImage,
  FaCheck,
  FaTrash,
  FaExclamationTriangle,
  FaClock,
  FaGraduationCap,
  FaChartPie,
  FaStar,
} from "react-icons/fa";
import { useAuthActions } from "../hooks/useAuthActions";
import { useClasses } from "../hooks/useClasses";
import { useUploadAnswerKey } from "../hooks/useUploadAnswerKey";
import AddClassModal from "../components/AddClassModal";
import ClassCard from "../components/ClassCard";
import ClassDetailsView from "../components/ClassDetailsView";
import AddStudentModal from "../components/AddStudentModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Alert from "../components/Alert";
import QuizCard from "../components/QuizCard";
import AddQuizModal from "../components/AddQuizModal";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, handleLogout } = useAuthActions();
  const {
    classes,
    loading: classesLoading,
    actionLoading,
    addClass,
    editClass,
    deleteClass,
    addStudent,
    removeStudent,
    editStudent,
    addQuiz,
    editQuiz,
    deleteQuiz,
    getClassById,
  } = useClasses();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [deletingId, setDeletingId] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);

  // State for viewing quiz details
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // State for image delete confirmation
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // State for logout loading
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use the upload hook
  const {
    answerKeyUrl,
    uploading,
    deleting,
    uploadAnswerKey,
    deleteAnswerKey,
    resetUpload,
  } = useUploadAnswerKey();

  const fileInputRef = useRef(null);

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      const result = await handleLogout();
      if (result.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const handleAddClass = async (className, description) => {
    const result = await addClass(className, description);
    if (result.success) {
      showAlert(
        "success",
        `Class "${className}" has been created successfully!`,
      );
    }
    return result;
  };

  const handleEditClass = (cls) => {
    setClassToEdit(cls);
    setShowAddClassModal(true);
  };

  const handleModalSubmit = async (className, description) => {
    if (classToEdit) {
      const result = await editClass(classToEdit.id, className, description);
      if (result.success) {
        showAlert(
          "success",
          `Class "${className}" has been updated successfully!`,
        );
      }
      return result;
    } else {
      return await handleAddClass(className, description);
    }
  };

  const handleViewClass = (classId) => {
    setSelectedClassId(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClassId(null);
  };

  const handleViewQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    resetUpload();
    setActiveTab("quiz-details");
  };

  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
    setActiveTab("quizzes");
  };

  const handleAddStudent = async (studentName, studentEmail) => {
    if (!selectedClassId) return { success: false, error: "No class selected" };
    const result = await addStudent(selectedClassId, studentName, studentEmail);
    if (result.success) {
      showAlert(
        "success",
        `Student "${studentName}" has been added successfully!`,
      );
    }
    return result;
  };

  const handleRemoveStudent = async (classId, studentId) => {
    const result = await removeStudent(classId, studentId);
    if (result.success) {
      showAlert("success", "Student has been removed from the class.");
    }
    return result;
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setShowEditStudentModal(true);
  };

  const handleEditStudentSubmit = async (studentName, studentEmail) => {
    if (!selectedClassId || !studentToEdit) {
      return { success: false, error: "No class or student selected" };
    }

    const result = await editStudent(
      selectedClassId,
      studentToEdit.id,
      studentName,
      studentEmail,
    );

    if (result.success) {
      showAlert(
        "success",
        `Student "${studentName}" has been updated successfully!`,
      );
    }
    return result;
  };

  const handleRequestDelete = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    setClassToDelete(cls);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setDeletingId(classToDelete.id);
    const result = await deleteClass(classToDelete.id);
    if (result.success) {
      showAlert("success", `Class "${classToDelete.name}" has been deleted.`);
    }
    setDeletingId(null);
    setClassToDelete(null);
  };

  // Quiz Handlers
  const handleAddQuiz = async (classId, quizData) => {
    const result = await addQuiz(classId, quizData);
    if (result.success) {
      showAlert(
        "success",
        `Quiz "${quizData.title}" has been created successfully!`,
      );
    }
    return result;
  };

  const handleEditQuiz = async (classId, quizData) => {
    if (!quizToEdit) return { success: false, error: "No quiz selected" };
    const result = await editQuiz(classId, quizToEdit.id, quizData);
    if (result.success) {
      showAlert(
        "success",
        `Quiz "${quizData.title}" has been updated successfully!`,
      );
    }
    return result;
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const result = await deleteQuiz(quizToDelete.classId, quizToDelete.id);
    if (result.success) {
      showAlert("success", `Quiz "${quizToDelete.title}" has been deleted.`);
    }
    setQuizToDelete(null);
    return result;
  };

  // Image delete handlers
  const handleImageDeleteClick = () => {
    setShowImageDeleteModal(true);
  };

  const handleImageDeleteConfirm = async () => {
    setIsDeletingImage(true);
    try {
      await deleteAnswerKey();
      setShowImageDeleteModal(false);
      setIsDeletingImage(false);
      showAlert("success", "Image deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      setShowImageDeleteModal(false);
      setIsDeletingImage(false);
      showAlert(
        "error",
        `${error.message || "Failed to delete image. Please try again."}`,
      );
    }
  };

  const handleImageDeleteCancel = () => {
    setShowImageDeleteModal(false);
  };

  // Calculate real stats from classes
  const totalQuizzes = classes.reduce(
    (acc, cls) => acc + (cls.quizzes?.length || 0),
    0,
  );
  const totalStudents = classes.reduce(
    (acc, cls) => acc + (cls.students?.length || 0),
    0,
  );

  // Calculate average score
  let totalScore = 0;
  let studentsWithScores = 0;
  classes.forEach((cls) => {
    cls.students?.forEach((student) => {
      if (student.avgScore) {
        totalScore += student.avgScore;
        studentsWithScores++;
      }
    });
  });
  const avgScore = studentsWithScores > 0 ? totalScore / studentsWithScores : 0;

  // Mock Data for overview (keep as fallback)
  const stats = {
    totalQuizzes: totalQuizzes || 0,
    pendingChecks: 7,
    completedChecks: 156,
    accuracyRate: 94.5,
    totalStudents: totalStudents || 0,
    averageScore: avgScore || 0,
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

  if (authLoading || classesLoading) {
    return <LoadingSpinner />;
  }

  // Show logout spinner
  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-seashell-cream">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-700/70">Logging out...</p>
        </div>
      </div>
    );
  }

  // Tab content renderer
  const renderContent = () => {
    if (activeTab === "quiz-details" && selectedQuiz) {
      return renderQuizDetails();
    }

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

  // Quiz Details View
  const renderQuizDetails = () => {
    const quiz = selectedQuiz;
    const classData = getClassById(quiz.classId);
    const students = classData?.students || [];

    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        await uploadAnswerKey(file);
        showAlert("success", "Image uploaded successfully!");
      } catch (error) {
        console.error("Upload failed:", error);
        showAlert(
          "error",
          `${error.message || "Failed to upload image. Please try again."}`,
        );
      }

      // Reset file input
      event.target.value = null;
    };

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToQuizzes}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <FaArrowLeft />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Students List */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUsers className="text-ocean-blue" />
                Students ({students.length})
              </h3>
              {students.length === 0 ?
                <p className="text-sm text-gray-400 text-center py-4">
                  No students in this class
                </p>
              : <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <FaEye className="text-emerald-600 text-sm" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {student.name}
                          </p>
                          {student.email && (
                            <p className="text-xs text-gray-400">
                              {student.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          {student.avgScore ? `${student.avgScore}%` : "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {student.quizzesTaken || 0} quizzes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>

          {/* Right Panel - Upload Area */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaFileImage className="text-noon-warm" />
                Answer Key Upload
              </h3>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition bg-white">
                {uploading ?
                  <div className="flex flex-col items-center gap-3">
                    <FaCloudUploadAlt className="text-emerald-500 text-4xl animate-bounce" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </div>
                : answerKeyUrl ?
                  <div className="flex flex-col items-center gap-3">
                    <FaCheck className="text-emerald-500 text-4xl" />
                    <p className="text-sm font-medium text-emerald-600">
                      Answer key uploaded
                    </p>
                    <img
                      src={answerKeyUrl}
                      alt="Answer key"
                      className="max-h-40 rounded-lg shadow-sm"
                    />
                  </div>
                : <div className="flex flex-col items-center gap-3">
                    <FaCloudUploadAlt className="text-gray-400 text-4xl" />
                    <p className="text-sm text-gray-600">
                      Click to select an image from your computer
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                  </div>
                }
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                {answerKeyUrl && (
                  <button
                    onClick={handleImageDeleteClick}
                    disabled={deleting}
                    className={`flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium ${
                      deleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}>
                    {deleting ?
                      <>
                        <FaSpinner className="animate-spin" />
                        Deleting...
                      </>
                    : <>
                        <FaTrash />
                        Delete Image
                      </>
                    }
                  </button>
                )}

                <button
                  onClick={() => {
                    showAlert("success", `Checking quiz: ${quiz.title}`);
                  }}
                  className={`${answerKeyUrl ? "flex-1" : "w-full"} bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium`}>
                  <FaCheck className="text-sm" />
                  Check
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
          <p className="text-xs text-noon-warm">
            <FaClock className="inline mr-1" />
            Waiting for review
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">
            {stats.completedChecks}
          </p>
          <p className="text-xs text-emerald-600">
            <FaCheck className="inline mr-1" />
            All checked
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-ocean-blue/30">
          <p className="text-xs sm:text-sm text-gray-500">Accuracy Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-ocean-blue">
            {stats.accuracyRate}%
          </p>
          <p className="text-xs text-ocean-blue">
            <FaChartLine className="inline mr-1" />
            Up 2.5%
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-purple-200">
          <p className="text-xs sm:text-sm text-gray-500">Students</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {stats.totalStudents}
          </p>
          <p className="text-xs text-purple-600">
            <FaGraduationCap className="inline mr-1" />
            Active
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-pink-200">
          <p className="text-xs sm:text-sm text-gray-500">Avg. Score</p>
          <p className="text-xl sm:text-2xl font-bold text-pink-600">
            {stats.averageScore.toFixed(1)}%
          </p>
          <p className="text-xs text-pink-600">
            <FaChartPie className="inline mr-1" />
            Class average
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
                    {activity.status === "completed" ? "Completed" : "Pending"}
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
  const renderQuizzes = () => {
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
                  loading={actionLoading}
                />
              ))}
            </div>
          }
        </div>
      </div>
    );
  };

  // Students Tab
  const renderStudents = () => {
    const selectedClass =
      selectedClassId ? getClassById(selectedClassId) : null;

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

  // Analytics Tab
  const renderAnalytics = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50">
          <p className="text-xs sm:text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-emerald-900">
            {stats.averageScore.toFixed(1)}%
          </p>
          <p className="text-xs text-emerald-600">
            <FaChartLine className="inline mr-1" />
            Up 3.2% this month
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-noon-warm/30">
          <p className="text-xs sm:text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold text-noon-warm">78.5%</p>
          <p className="text-xs text-noon-warm">
            <FaChartLine className="inline mr-1" />
            Up 5.1% this month
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-ocean-blue/30">
          <p className="text-xs sm:text-sm text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold text-ocean-blue">1,247</p>
          <p className="text-xs text-ocean-blue">
            <FaChartLine className="inline mr-1" />
            Up 12.8% this month
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
          <p className="text-xs sm:text-sm text-gray-500">Top Performer</p>
          <p className="text-lg font-bold text-purple-600">Student 5</p>
          <p className="text-xs text-purple-600">
            <FaStar className="inline mr-1" />
            97.5% average
          </p>
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
                <FaChartLine className="inline mr-2 text-emerald-600" />
                Top Performer Trend
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Students are showing 15% improvement after using AI-powered
                feedback
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-noon-warm/10 to-noon-sun/10 rounded-lg border border-noon-warm/30">
              <p className="text-sm font-medium text-gray-800">
                <FaExclamationTriangle className="inline mr-2 text-noon-warm" />
                Common Mistakes
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Most students struggle with questions 3 and 7 in Algebra Basics
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-ocean-blue/10 to-blue-100/20 rounded-lg border border-ocean-blue/30">
              <p className="text-sm font-medium text-gray-800">
                <FaRocket className="inline mr-2 text-ocean-blue" />
                Recommendation
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
                disabled={isLoggingOut}
                className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoggingOut ?
                  <>
                    <FaSpinner className="animate-spin" />
                    <span className="hidden sm:inline">Logging out...</span>
                  </>
                : <>
                    <FaSignOutAlt />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Welcome Banner - Hide when viewing quiz details */}
        {activeTab !== "quiz-details" && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <h2 className="text-lg sm:text-2xl font-bold">
                Welcome back, {user?.displayName?.split(" ")[0] || "Teacher"}!
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                You have {stats.pendingChecks} pending checks to review. Ready
                to grade some papers?
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
        )}

        {/* Navigation Tabs - Hide when viewing quiz details */}
        {activeTab !== "quiz-details" ?
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
        : null}

        {/* Tab Content */}
        {renderContent()}
      </div>

      {/* Alert Component */}
      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: "", message: "" })}
        duration={3000}
      />

      {/* Image Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showImageDeleteModal}
        onClose={handleImageDeleteCancel}
        onConfirm={handleImageDeleteConfirm}
        className="Answer Key Image"
        loading={isDeletingImage}
        type="image"
      />

      {/* Modals */}
      <AddClassModal
        key={classToEdit?.id || "add-new"}
        isOpen={showAddClassModal}
        onClose={() => {
          setShowAddClassModal(false);
          setClassToEdit(null);
        }}
        onSubmit={handleModalSubmit}
        loading={actionLoading}
        classToEdit={classToEdit}
      />

      <ConfirmDeleteModal
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={handleConfirmDelete}
        className={classToDelete?.name || ""}
        loading={actionLoading}
        type="class"
      />

      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSubmit={handleAddStudent}
        loading={actionLoading}
      />

      <AddStudentModal
        isOpen={showEditStudentModal}
        onClose={() => {
          setShowEditStudentModal(false);
          setStudentToEdit(null);
        }}
        onSubmit={handleEditStudentSubmit}
        loading={actionLoading}
        studentToEdit={studentToEdit}
      />

      <AddQuizModal
        isOpen={showAddQuizModal}
        onClose={() => {
          setShowAddQuizModal(false);
          setQuizToEdit(null);
        }}
        onSubmit={quizToEdit ? handleEditQuiz : handleAddQuiz}
        loading={actionLoading}
        quizToEdit={quizToEdit}
        classes={classes}
      />

      <ConfirmDeleteModal
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onConfirm={handleDeleteQuiz}
        className={`quiz "${quizToDelete?.title || ""}"`}
        loading={actionLoading}
        type="quiz"
      />
    </div>
  );
};

export default Dashboard;
