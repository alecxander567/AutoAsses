// src/pages/Dashboard.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignOutAlt,
  FaSpinner,
  FaCheckCircle,
  FaClipboardCheck,
  FaCloudUploadAlt,
  FaRobot,
  FaUsers,
  FaHome,
  FaBook,
  FaChartLine,
  FaArrowLeft,
  FaFileImage,
  FaCheck,
  FaTrash,
  FaExclamationTriangle,
  FaLightbulb,
  FaExchangeAlt,
} from "react-icons/fa";
import { useAuthActions } from "../hooks/useAuthActions";
import { useClasses } from "../hooks/useClasses";
import { useUploadAnswerKey } from "../hooks/useUploadAnswerKey";
import AddClassModal from "../components/AddClassModal";
import AddStudentModal from "../components/AddStudentModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Alert from "../components/Alert";
import AddQuizModal from "../components/AddQuizModal";
import CompareStudentModal from "../components/CompareStudentModal";
import Profile from "../components/Profile";
import { analyzeQuizResults } from "../services/googleAIService";
import OverviewTab from "../components/OverViewTab";
import QuizzesTab from "../components/QuizzesTab";
import StudentsTab from "../components/StudentsTab";
import AnalyticsTab from "../components/AnalyticsTab";
import NotificationDropdown from "../components/NotificationDropdown";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuthActions();
  const {
    classes,
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
  const [classToDelete, setClassToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedQuizForCompare, setSelectedQuizForCompare] = useState(null);
  const [updatingStudentScore, setUpdatingStudentScore] = useState(false);

  const [quizAnalysis, setQuizAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [showProfile, setShowProfile] = useState(false);

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

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalQuizzes = classes.reduce(
    (acc, cls) => acc + (cls.quizzes?.length || 0),
    0,
  );
  const totalStudents = classes.reduce(
    (acc, cls) => acc + (cls.students?.length || 0),
    0,
  );

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

  let passed = 0;
  let failed = 0;
  classes.forEach((cls) => {
    cls.students?.forEach((student) => {
      if (
        student.avgScore !== undefined &&
        student.avgScore !== null &&
        student.avgScore !== 0
      ) {
        if (student.avgScore >= 70) passed++;
        else failed++;
      }
    });
  });
  const totalGraded = passed + failed;
  const passRate =
    totalGraded > 0 ? Math.round((passed / totalGraded) * 100) : 0;

  const pendingChecks = classes.reduce(
    (acc, cls) =>
      acc +
      (cls.students?.filter(
        (s) =>
          s.avgScore === undefined || s.avgScore === null || s.avgScore === 0,
      ).length || 0),
    0,
  );
  const completedChecks = totalGraded;
  const accuracyRate =
    studentsWithScores > 0 ? Math.round(totalScore / studentsWithScores) : 0;

  // ── AI Analysis ──────────────────────────────────────────────────────────────
  const generateFallbackAnalysis = (students, quiz) => {
    const scores = students
      .filter((s) => s.quizScores?.[quiz.id]?.score !== undefined)
      .map((s) => s.quizScores[quiz.id].score);

    if (scores.length === 0) return null;

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
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
      (s.quizScores?.[quiz.id]?.details || []).forEach((d) => {
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
      }))
      .sort((a, b) => a.percentCorrect - b.percentCorrect)
      .slice(0, 3);

    return {
      summary: `Class average is ${avg}% with ${passCount} students passing and ${failCount} students failing.`,
      totalStudents: scores.length,
      averageScore: avg,
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
        "Review the most difficult questions with the class.",
        "Consider providing additional practice materials.",
        "Focus on topics where students struggled the most.",
      ],
      insights: [
        `${passCount} out of ${scores.length} students passed this quiz.`,
        `The average score was ${avg}%.`,
        `${gradeDist.A} students got an A, ${gradeDist.F} students got an F.`,
      ],
    };
  };

  const loadQuizAnalysis = async (quiz, students) => {
    const quizId = quiz.id;

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
      if (selectedQuiz?.id !== quizId) return;

      setQuizAnalysis(result || generateFallbackAnalysis(students, quiz));
    } catch (error) {
      if (selectedQuiz?.id !== quizId) return;
      console.error("Analysis error:", error);
      setQuizAnalysis(generateFallbackAnalysis(students, quiz));
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedQuiz && activeTab === "quiz-details") {
      const quizId = selectedQuiz.id;
      const classData = getClassById(selectedQuiz.classId);
      const students = classData?.students || [];

      if (students.length > 0) {
        const timer = setTimeout(() => {
          if (selectedQuiz?.id === quizId) {
            loadQuizAnalysis(selectedQuiz, students);
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedQuiz, activeTab, getClassById]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      const result = await handleLogout();
      if (result.success) navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  // ── Alerts ───────────────────────────────────────────────────────────────────
  const showAlert = (type, message) => setAlert({ type, message });

  // ── Class handlers ───────────────────────────────────────────────────────────
  const handleAddClass = async (className, description) => {
    const result = await addClass(className, description);
    if (result.success)
      showAlert(
        "success",
        `Class "${className}" has been created successfully!`,
      );
    return result;
  };

  const handleEditClass = (cls) => {
    setClassToEdit(cls);
    setShowAddClassModal(true);
  };

  const handleModalSubmit = async (className, description) => {
    if (classToEdit) {
      const result = await editClass(classToEdit.id, className, description);
      if (result.success)
        showAlert(
          "success",
          `Class "${className}" has been updated successfully!`,
        );
      return result;
    }
    return await handleAddClass(className, description);
  };

  const handleViewClass = (classId) => setSelectedClassId(classId);
  const handleBackToClasses = () => setSelectedClassId(null);

  // FIX: "Manage Students" goes to the Students tab showing the CLASS LIST,
  // not a specific class's student list. selectedClassId is intentionally
  // cleared so StudentsTab renders the top-level class picker.
  const handleManageStudents = () => {
    setSelectedClassId(null);
    setActiveTab("students");
  };

  const handleRequestDelete = (classId) => {
    setClassToDelete(classes.find((c) => c.id === classId));
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setDeletingId(classToDelete.id);
    const result = await deleteClass(classToDelete.id);
    if (result.success)
      showAlert("success", `Class "${classToDelete.name}" has been deleted.`);
    setDeletingId(null);
    setClassToDelete(null);
  };

  // ── Student handlers ─────────────────────────────────────────────────────────
  const handleAddStudent = async (studentName, studentEmail) => {
    if (!selectedClassId) return { success: false, error: "No class selected" };
    const result = await addStudent(selectedClassId, studentName, studentEmail);
    if (result.success)
      showAlert(
        "success",
        `Student "${studentName}" has been added successfully!`,
      );
    return result;
  };

  const handleRemoveStudent = async (classId, studentId) => {
    const result = await removeStudent(classId, studentId);
    if (result.success)
      showAlert("success", "Student has been removed from the class.");
    return result;
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setShowEditStudentModal(true);
  };

  const handleEditStudentSubmit = async (studentName, studentEmail) => {
    if (!selectedClassId || !studentToEdit)
      return { success: false, error: "No class or student selected" };
    const result = await editStudent(
      selectedClassId,
      studentToEdit.id,
      studentName,
      studentEmail,
    );
    if (result.success)
      showAlert(
        "success",
        `Student "${studentName}" has been updated successfully!`,
      );
    return result;
  };

  // ── Quiz handlers ────────────────────────────────────────────────────────────
  const handleAddQuiz = async (classId, quizData) => {
    const result = await addQuiz(classId, quizData);
    if (result.success)
      showAlert(
        "success",
        `Quiz "${quizData.title}" has been created successfully!`,
      );
    return result;
  };

  const handleEditQuiz = async (classId, quizData) => {
    if (!quizToEdit) return { success: false, error: "No quiz selected" };
    const result = await editQuiz(classId, quizToEdit.id, quizData);
    if (result.success)
      showAlert(
        "success",
        `Quiz "${quizData.title}" has been updated successfully!`,
      );
    return result;
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const result = await deleteQuiz(quizToDelete.classId, quizToDelete.id);
    if (result.success)
      showAlert("success", `Quiz "${quizToDelete.title}" has been deleted.`);
    setQuizToDelete(null);
    return result;
  };

  const handleViewQuiz = useCallback(
    (quiz) => {
      setQuizAnalysis(null);
      setAnalysisLoading(false);
      resetUpload();
      setSelectedQuiz(quiz);
      setSelectedClassId(quiz.classId);
      if (quiz.answerKeyUrl) setAnswerKeyUrl(quiz.answerKeyUrl);
      setActiveTab("quiz-details");
    },
    [resetUpload, setAnswerKeyUrl],
  );

  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
    setQuizAnalysis(null);
    setAnalysisLoading(false);
    resetUpload();
    setActiveTab("quizzes");
  };

  useEffect(() => {
    window.handleViewQuizFromNotification = (quiz) => handleViewQuiz(quiz);
    window.setActiveTabFromNotification = (tab) => setActiveTab(tab);
    return () => {
      delete window.handleViewQuizFromNotification;
      delete window.setActiveTabFromNotification;
    };
  }, [handleViewQuiz]);

  // ── Image handlers ───────────────────────────────────────────────────────────
  const handleImageDeleteClick = () => setShowImageDeleteModal(true);
  const handleImageDeleteCancel = () => setShowImageDeleteModal(false);

  const handleImageDeleteConfirm = async () => {
    setIsDeletingImage(true);
    try {
      await deleteAnswerKey();
      if (selectedClassId && selectedQuiz) {
        await updateQuiz(selectedClassId, selectedQuiz.id, {
          answerKeyUrl: null,
        });
      }
      showAlert("success", "Image deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      showAlert(
        "error",
        error.message || "Failed to delete image. Please try again.",
      );
    } finally {
      setShowImageDeleteModal(false);
      setIsDeletingImage(false);
    }
  };

  // ── Compare / score handlers ─────────────────────────────────────────────────
  const handleCompareStudent = (student, quiz) => {
    setSelectedStudent(student);
    setSelectedQuizForCompare(quiz);
    setCompareModalOpen(true);
  };

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
            loadQuizAnalysis(selectedQuiz, classData?.students || []);
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

  // ── Render helpers ───────────────────────────────────────────────────────────
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

        {analysis.mostDifficultQuestions?.length > 0 && (
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

        {analysis.summary && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </div>
        )}

        {analysis.recommendations?.length > 0 && (
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

        {analysis.insights?.length > 0 && (
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
          error.message || "Failed to upload image. Please try again.",
        );
      }
      event.target.value = null;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100/50 p-4 sm:p-6">
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
          {/* ✅ Left Panel - Students List */}
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
                            const correct = details.filter(
                              (d) => d.isCorrect,
                            ).length;
                            return (
                              <>
                                <p className="text-sm font-bold text-emerald-600">
                                  {quizResult.score}%{" "}
                                  <span className="text-xs font-medium text-emerald-500">
                                    ({correct}/{details.length})
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

              {/* Rate limit notice */}
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
                      <span className="font-medium">Rate limit:</span> Gemini
                      Flash allows{" "}
                      <span className="font-medium">
                        15 requests per minute
                      </span>{" "}
                      on the free tier. If you hit the limit, wait a moment and
                      retry.
                    </li>
                    <li>
                      <span className="font-medium">Image quality:</span> Use a
                      clear, flat, well-lit photo of the answer key for best
                      results.
                    </li>
                  </ul>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
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
                    <p className="text-xs text-gray-400">
                      PNG, JPG up to 10 MB
                    </p>
                  </div>
                }
              </div>

              {answerKeyUrl && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleImageDeleteClick}
                    disabled={deleting}
                    className={`flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium ${
                      deleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}>
                    {deleting ?
                      <>
                        <FaSpinner className="animate-spin" /> Deleting...
                      </>
                    : <>
                        <FaTrash /> Delete Image
                      </>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Tab renderers ────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <OverviewTab
      classes={classes}
      totalQuizzes={totalQuizzes}
      totalStudents={totalStudents}
      totalGraded={totalGraded}
      pendingChecks={pendingChecks}
      completedChecks={completedChecks}
      accuracyRate={accuracyRate}
      avgScore={avgScore}
      passRate={passRate}
      passed={passed}
      failed={failed}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      setActiveTab={setActiveTab}
      setShowAddClassModal={setShowAddClassModal}
      handleViewQuiz={handleViewQuiz}
      // Pass this so OverviewTab's "Manage Students" button clears
      // selectedClassId and lands on the class list, not a student list.
      handleManageStudents={handleManageStudents}
    />
  );

  const renderQuizzes = () => (
    <QuizzesTab
      classes={classes}
      actionLoading={actionLoading}
      setShowAddQuizModal={setShowAddQuizModal}
      setQuizToEdit={setQuizToEdit}
      setQuizToDelete={setQuizToDelete}
      handleViewQuiz={handleViewQuiz}
    />
  );

  const renderStudents = () => (
    <StudentsTab
      classes={classes}
      selectedClassId={selectedClassId}
      actionLoading={actionLoading}
      deletingId={deletingId}
      getClassById={getClassById}
      setShowAddClassModal={setShowAddClassModal}
      setShowAddStudentModal={setShowAddStudentModal}
      setStudentToEdit={setStudentToEdit}
      setShowEditStudentModal={setShowEditStudentModal}
      handleRemoveStudent={handleRemoveStudent}
      handleEditStudent={handleEditStudent}
      handleRequestDelete={handleRequestDelete}
      handleEditClass={handleEditClass}
      handleViewClass={handleViewClass}
      handleBackToClasses={handleBackToClasses}
    />
  );

  const renderAnalytics = () => (
    <AnalyticsTab
      classes={classes}
      avgScore={avgScore}
      studentsWithScores={studentsWithScores}
      totalQuizzes={totalQuizzes}
      totalStudents={totalStudents}
      totalGraded={totalGraded}
      pendingChecks={pendingChecks}
      passed={passed}
      failed={failed}
    />
  );

  const renderContent = () => {
    if (activeTab === "quiz-details" && selectedQuiz)
      return renderQuizDetails();
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

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-seashell-white to-noon-warm/5">
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
              <NotificationDropdown classes={classes} />

              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition"
                title="Profile">
                {user?.photoURL ?
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-200 cursor-pointer"
                  />
                : <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center cursor-pointer">
                    <FaUser className="text-emerald-600 text-sm sm:text-base" />
                  </div>
                }
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-emerald-600">Teacher</p>
                </div>
              </button>

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

      {showProfile && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowProfile(false)}
            />
            <div className="relative w-full max-w-2xl">
              <Profile onClose={() => setShowProfile(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {activeTab !== "quiz-details" && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
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

        {activeTab !== "quiz-details" && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-8 bg-white rounded-xl p-1 shadow-sm border border-emerald-100/50">
            {[
              { id: "overview", label: "Overview", icon: FaHome },
              { id: "quizzes", label: "Quizzes", icon: FaBook },
              { id: "students", label: "Students", icon: FaUsers },
              { id: "analytics", label: "Analytics", icon: FaChartLine },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  // When clicking the Students tab from the nav, always
                  // reset to the class list (not a specific class's students).
                  if (tab.id === "students") {
                    setSelectedClassId(null);
                  }
                  setActiveTab(tab.id);
                }}
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
        )}

        {renderContent()}
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: "", message: "" })}
        duration={3000}
      />

      <ConfirmDeleteModal
        isOpen={showImageDeleteModal}
        onClose={handleImageDeleteCancel}
        onConfirm={handleImageDeleteConfirm}
        className="Answer Key Image"
        loading={isDeletingImage}
        type="image"
      />

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
          if (selectedStudent)
            handleStudentScoreUpdate(selectedStudent.id, score, details);
        }}
        loading={updatingStudentScore}
      />

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
        key={quizToEdit?.id || "add-new"}
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
