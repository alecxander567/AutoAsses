// src/pages/Dashboard.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaSpinner,
  FaFileAlt,
  FaCheckCircle,
  FaClipboardCheck,
  FaChartBar,
  FaHistory,
  FaPlus,
  FaCloudUploadAlt,
  FaRobot,
  FaUsers,
  FaEye,
  FaFilter,
  FaBell,
  FaCog,
  FaHome,
  FaBook,
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
  FaExchangeAlt,
  FaLightbulb,
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
import CompareStudentModal from "../components/CompareStudentModal";
import { analyzeQuizResults } from "../services/googleAIService";

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
    updateQuiz,
    getClassById,
    updateStudentScore,
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

  // State for compare modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedQuizForCompare, setSelectedQuizForCompare] = useState(null);
  const [updatingStudentScore, setUpdatingStudentScore] = useState(false);

  // State for AI analysis
  const [quizAnalysis, setQuizAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Use the upload hook
  const {
    answerKeyUrl,
    uploading,
    deleting,
    uploadAnswerKey,
    deleteAnswerKey,
    resetUpload,
    setAnswerKeyUrl,
  } = useUploadAnswerKey();

  const fileInputRef = useRef(null);

  // ✅ Calculate stats at component level
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

  // Calculate pass/fail rates
  let passed = 0;
  let failed = 0;
  classes.forEach((cls) => {
    cls.students?.forEach((student) => {
      if (
        student.avgScore !== undefined &&
        student.avgScore !== null &&
        student.avgScore !== 0
      ) {
        if (student.avgScore >= 70) {
          passed++;
        } else {
          failed++;
        }
      }
    });
  });
  const totalGraded = passed + failed;
  const passRate =
    totalGraded > 0 ? Math.round((passed / totalGraded) * 100) : 0;

  // Calculate pending checks
  const pendingChecks = classes.reduce((acc, cls) => {
    return (
      acc +
      (cls.students?.filter(
        (s) =>
          s.avgScore === undefined || s.avgScore === null || s.avgScore === 0,
      ).length || 0)
    );
  }, 0);

  // Calculate completed checks (students with scores)
  const completedChecks = totalGraded;

  // Calculate accuracy rate
  const accuracyRate =
    studentsWithScores > 0 ? Math.round(totalScore / studentsWithScores) : 0;

  // ─── FIX 1: loadQuizAnalysis accepts quizId and bails if quiz changed ───────
  const loadQuizAnalysis = async (quiz, students) => {
    const quizId = quiz.id; // capture at call time

    if (!quiz || !students || students.length === 0) {
      setQuizAnalysis(null);
      setAnalysisLoading(false);
      return;
    }

    const hasGradedStudents = students.some((s) => s.quizScores?.[quiz.id]);
    if (!hasGradedStudents) {
      setQuizAnalysis(null);
      setAnalysisLoading(false);
      return;
    }

    setAnalysisLoading(true);
    try {
      const quizData = {
        quizTitle: quiz.title,
        totalStudents: students.length,
        studentScores: students.map((s) => ({
          name: s.name,
          score: s.quizScores?.[quiz.id]?.score || 0,
          details: s.quizScores?.[quiz.id]?.details || [],
        })),
        questions: quiz.totalQuestions || 10,
        questionDetails: students
          .filter((s) => s.quizScores?.[quiz.id]?.details)
          .flatMap((s) => s.quizScores[quiz.id].details || []),
      };

      const result = await analyzeQuizResults(quizData);

      // ✅ Don't update state if the user navigated to a different quiz
      if (selectedQuiz?.id !== quizId) return;

      if (result) {
        setQuizAnalysis(result);
      } else {
        setQuizAnalysis(generateFallbackAnalysis(students, quiz));
      }
    } catch (error) {
      // ✅ Same guard on the error path
      if (selectedQuiz?.id !== quizId) return;
      console.error("Analysis error:", error);
      setQuizAnalysis(generateFallbackAnalysis(students, quiz));
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Fallback analysis function
  const generateFallbackAnalysis = (students, quiz) => {
    const scores = students
      .filter((s) => s.quizScores?.[quiz.id]?.score !== undefined)
      .map((s) => s.quizScores[quiz.id].score);

    if (scores.length === 0) return null;

    const avgScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );
    const passCount = scores.filter((s) => s >= 70).length;
    const failCount = scores.filter((s) => s < 70).length;

    const gradeDist = {
      A: scores.filter((s) => s >= 90).length,
      B: scores.filter((s) => s >= 80 && s < 90).length,
      C: scores.filter((s) => s >= 70 && s < 80).length,
      D: scores.filter((s) => s >= 60 && s < 70).length,
      F: scores.filter((s) => s < 60).length,
    };

    const questionStats = {};
    students.forEach((s) => {
      const details = s.quizScores?.[quiz.id]?.details || [];
      details.forEach((d) => {
        if (!questionStats[d.questionNumber]) {
          questionStats[d.questionNumber] = { correct: 0, total: 0 };
        }
        questionStats[d.questionNumber].total++;
        if (d.isCorrect) questionStats[d.questionNumber].correct++;
      });
    });

    const difficultQuestions = Object.entries(questionStats)
      .map(([q, stats]) => ({
        questionNumber: parseInt(q),
        percentCorrect: Math.round((stats.correct / stats.total) * 100),
        total: stats.total,
      }))
      .sort((a, b) => a.percentCorrect - b.percentCorrect)
      .slice(0, 3);

    return {
      summary: `Class average is ${avgScore}% with ${passCount} students passing and ${failCount} students failing.`,
      totalStudents: scores.length,
      averageScore: avgScore,
      passRate: Math.round((passCount / scores.length) * 100),
      failRate: Math.round((failCount / scores.length) * 100),
      gradeDistribution: gradeDist,
      mostDifficultQuestions: difficultQuestions.map((q) => ({
        questionNumber: q.questionNumber,
        percentCorrect: q.percentCorrect,
        insight: `Only ${q.percentCorrect}% of students got this question correct.`,
        correctAnswer: "N/A",
        studentAnswers: {},
        commonWrongAnswer: "N/A",
      })),
      recommendations: [
        `Review the most difficult questions with the class.`,
        `Consider providing additional practice materials.`,
        `Focus on topics where students struggled the most.`,
      ],
      insights: [
        `${passCount} out of ${scores.length} students passed this quiz.`,
        `The average score was ${avgScore}%.`,
        `${gradeDist.A} students got an A, ${gradeDist.F} students got an F.`,
      ],
    };
  };

  // ─── FIX 2: useEffect captures quizId and guards against stale closures ──────
  useEffect(() => {
    if (selectedQuiz && activeTab === "quiz-details") {
      const quizId = selectedQuiz.id; // capture current quiz id
      const classData = getClassById(selectedQuiz.classId);
      const students = classData?.students || [];

      if (students.length > 0) {
        const timer = setTimeout(() => {
          // ✅ Only proceed if the user is still viewing the same quiz
          if (selectedQuiz?.id === quizId) {
            loadQuizAnalysis(selectedQuiz, students);
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedQuiz, activeTab, getClassById]);

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

  // ─── FIX 3: handleViewQuiz clears ALL stale state synchronously first ────────
  const handleViewQuiz = (quiz) => {
    // Clear stale state BEFORE setting the new quiz so the render never
    // briefly shows the previous quiz's analysis or answer key image.
    setQuizAnalysis(null);
    setAnalysisLoading(false);
    resetUpload(); // always wipe the previous image first

    setSelectedQuiz(quiz);
    setSelectedClassId(quiz.classId);

    // Now load the correct answer key for this quiz (if it has one)
    if (quiz.answerKeyUrl) {
      setAnswerKeyUrl(quiz.answerKeyUrl);
    }

    setActiveTab("quiz-details");
  };

  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
    setQuizAnalysis(null);
    setAnalysisLoading(false);
    resetUpload();
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
      if (selectedClassId && selectedQuiz) {
        await updateQuiz(selectedClassId, selectedQuiz.id, {
          answerKeyUrl: null,
        });
      }
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

  // Student score update handler
  const handleStudentScoreUpdate = async (studentId, score, details) => {
    setUpdatingStudentScore(true);
    try {
      if (selectedClassId && selectedQuizForCompare) {
        const result = await updateStudentScore(
          selectedClassId,
          studentId,
          selectedQuizForCompare.id,
          score,
          details,
        );

        if (result.success) {
          showAlert(
            "success",
            `Score of ${score}% recorded for ${selectedStudent?.name}`,
          );
          if (selectedQuiz) {
            const classData = getClassById(selectedQuiz.classId);
            const students = classData?.students || [];
            loadQuizAnalysis(selectedQuiz, students);
          }
        } else {
          showAlert("error", "Failed to update student score");
        }
      }
    } catch (error) {
      console.error("Error updating student score:", error);
      showAlert("error", "Failed to update student score");
    } finally {
      setUpdatingStudentScore(false);
    }
  };

  const handleCompareStudent = (student, quiz) => {
    setSelectedStudent(student);
    setSelectedQuizForCompare(quiz);
    setCompareModalOpen(true);
  };

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

  // Render analysis section
  const renderAnalysisSection = (quiz, students) => {
    if (analysisLoading) {
      return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 text-center">
          <FaSpinner className="animate-spin text-3xl text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">AI is analyzing quiz results...</p>
        </div>
      );
    }

    const hasGradedStudents = students.some((s) => s.quizScores?.[quiz.id]);

    if (!hasGradedStudents) {
      return (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-500">No students have been graded yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Use the Compare button to grade students
          </p>
        </div>
      );
    }

    if (!quizAnalysis) {
      return (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-500">No analysis available</p>
        </div>
      );
    }

    const analysis = quizAnalysis;

    return (
      <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-medium">AVG SCORE</p>
            <p className="text-2xl font-bold text-emerald-700">
              {analysis.averageScore || 0}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-600 font-medium">PASS RATE</p>
            <p className="text-2xl font-bold text-blue-700">
              {analysis.passRate || 0}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">FAIL RATE</p>
            <p className="text-2xl font-bold text-amber-700">
              {analysis.failRate || 0}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-600 font-medium">STUDENTS</p>
            <p className="text-2xl font-bold text-purple-700">
              {analysis.totalStudents || 0}
            </p>
          </div>
        </div>

        {/* Grade Distribution */}
        {analysis.gradeDistribution && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Grade Distribution
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(analysis.gradeDistribution).map(
                ([grade, count]) => (
                  <div key={grade} className="text-center">
                    <div
                      className={`rounded-lg p-2 ${
                        grade === "A" ? "bg-green-100"
                        : grade === "B" ? "bg-blue-100"
                        : grade === "C" ? "bg-yellow-100"
                        : grade === "D" ? "bg-orange-100"
                        : "bg-red-100"
                      }`}>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-gray-600">Grade {grade}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Most Difficult Questions */}
        {analysis.mostDifficultQuestions &&
          analysis.mostDifficultQuestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" />
                Most Difficult Questions
              </h4>
              <div className="space-y-2">
                {analysis.mostDifficultQuestions.slice(0, 3).map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        Question {q.questionNumber}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {q.percentCorrect}% correct
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{q.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Summary */}
        {analysis.summary && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FaLightbulb className="text-amber-500" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insights */}
        {analysis.insights && analysis.insights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FaCheckCircle className="text-emerald-500" />
              Key Insights
            </h4>
            <ul className="space-y-1">
              {analysis.insights.map((insight, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
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
        const url = await uploadAnswerKey(file);
        if (url && selectedClassId && selectedQuiz) {
          await updateQuiz(selectedClassId, selectedQuiz.id, {
            answerKeyUrl: url,
          });
        }
        showAlert("success", "Image uploaded successfully!");
      } catch (error) {
        console.error("Upload failed:", error);
        showAlert(
          "error",
          `${error.message || "Failed to upload image. Please try again."}`,
        );
      }

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
          {/* Left Panel - Students List + Analysis */}
          <div className="space-y-6">
            {/* Students List */}
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
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-emerald-600 text-sm" />
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
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {(() => {
                            const quizResult = student.quizScores?.[quiz.id];
                            if (!quizResult) {
                              return (
                                <p className="text-xs text-gray-400">
                                  Not graded yet
                                </p>
                              );
                            }
                            const details = quizResult.details || [];
                            const total = details.length;
                            const correct = details.filter(
                              (d) => d.isCorrect,
                            ).length;
                            return (
                              <>
                                <p className="text-sm font-bold text-emerald-600">
                                  {quizResult.score}%{" "}
                                  <span className="text-xs font-medium text-emerald-500">
                                    ({correct}/{total})
                                  </span>
                                </p>
                                <p className="text-xs text-gray-400">
                                  this quiz
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => handleCompareStudent(student, quiz)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition flex items-center gap-1">
                          <FaExchangeAlt className="text-xs" />
                          Compare
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

            {/* AI Analysis Section */}
            <div className="bg-white rounded-xl border border-purple-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaRobot className="text-purple-600" />
                <h3 className="font-bold text-gray-800">AI Quiz Analysis</h3>
                {quizAnalysis && !analysisLoading && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                    AI Generated
                  </span>
                )}
              </div>
              {renderAnalysisSection(quiz, students)}
            </div>
          </div>

          {/* Right Panel - Upload Area */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaFileImage className="text-noon-warm" />
                Answer Key Upload
              </h3>

              {/* Important Notice */}
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <FaExclamationTriangle className="text-amber-500 text-lg mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-800 text-sm">
                    Important — Before You Upload
                  </p>
                  <ul className="space-y-1 text-amber-700 text-xs leading-relaxed">
                    <li>
                      <span className="font-medium">Accepted formats:</span>{" "}
                      PNG, JPG, and JPEG only. PDFs are not supported.
                    </li>
                    <li>
                      <span className="font-medium">Max file size:</span> 10 MB
                      per image.
                    </li>
                    <li>
                      <span className="font-medium">Rate limit:</span> Up to{" "}
                      <span className="font-medium">10 uploads per minute</span>
                      . Exceeding this will temporarily pause uploads — wait a
                      moment and retry.
                    </li>
                    <li>
                      <span className="font-medium">Image quality:</span> Use a
                      clear, flat, well-lit photo of the answer key for best OCR
                      accuracy.
                    </li>
                  </ul>
                </div>
              </div>

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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Overview Tab
  const renderOverview = () => {
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
    recentQuizResultsDisplay.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
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
                      No quiz results yet. Start grading students to see
                      activity!
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
                      <tr
                        key={result.id}
                        className="hover:bg-gray-50 transition">
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
  const renderAnalytics = () => {
    const gradeA = classes.reduce((acc, cls) => {
      return (
        acc +
        (cls.students?.filter((s) => s.avgScore >= 90 && s.avgScore <= 100)
          .length || 0)
      );
    }, 0);
    const gradeB = classes.reduce((acc, cls) => {
      return (
        acc +
        (cls.students?.filter((s) => s.avgScore >= 80 && s.avgScore < 90)
          .length || 0)
      );
    }, 0);
    const gradeC = classes.reduce((acc, cls) => {
      return (
        acc +
        (cls.students?.filter((s) => s.avgScore >= 70 && s.avgScore < 80)
          .length || 0)
      );
    }, 0);
    const gradeD = classes.reduce((acc, cls) => {
      return (
        acc +
        (cls.students?.filter((s) => s.avgScore >= 60 && s.avgScore < 70)
          .length || 0)
      );
    }, 0);
    const gradeF = classes.reduce((acc, cls) => {
      return (
        acc +
        (cls.students?.filter((s) => s.avgScore < 60 && s.avgScore > 0)
          .length || 0)
      );
    }, 0);

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
            <h3 className="font-bold text-gray-800 mb-4">
              Performance Summary
            </h3>
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
                  {totalGraded > 0 ?
                    Math.round((passed / totalGraded) * 100)
                  : 0}
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
        {/* Welcome Banner */}
        {activeTab !== "quiz-details" && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <h2 className="text-lg sm:text-2xl font-bold">
                Welcome back, {user?.displayName?.split(" ")[0] || "Teacher"}!
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                You have {pendingChecks} pending checks to review. Ready to
                grade some papers?
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
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

      {/* Compare Student Modal */}
      <CompareStudentModal
        isOpen={compareModalOpen}
        onClose={() => {
          setCompareModalOpen(false);
          setSelectedStudent(null);
          setSelectedQuizForCompare(null);
        }}
        student={selectedStudent}
        quizTitle={selectedQuizForCompare?.title || ""}
        answerKeyUrl={answerKeyUrl}
        onCompareComplete={(score, details) => {
          if (selectedStudent) {
            handleStudentScoreUpdate(selectedStudent.id, score, details);
          }
        }}
        loading={updatingStudentScore}
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