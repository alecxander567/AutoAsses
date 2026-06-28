// src/hooks/useClasses.js
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import * as firestoreService from "../services/firestoreService";

export const useClasses = () => {
  const { user } = useAuth();
  const teacherId = user?.uid;

  const [classes, setClasses] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Helpers (must be declared before useEffect) ──────────────────────────────

  const getQuizStatus = (quiz, students = []) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const quizDate = quiz.date ? new Date(quiz.date) : null;
    const totalStudents = students.length;
    const checkedCount = quiz.checkedStudents?.length || 0;
    const allStudentsChecked =
      totalStudents > 0 && checkedCount >= totalStudents;

    if (allStudentsChecked) return "completed";
    if (!quizDate) return "active";

    const quizDateOnly = new Date(quizDate);
    quizDateOnly.setHours(0, 0, 0, 0);

    return quizDateOnly > today ? "upcoming" : "active";
  };

  const updateAllQuizStatuses = (classesData) => {
    return classesData.map((cls) => {
      const updatedQuizzes = (cls.quizzes || []).map((quiz) => ({
        ...quiz,
        status: getQuizStatus(quiz, cls.students || []),
      }));
      return { ...cls, quizzes: updatedQuizzes };
    });
  };

  const updateQuizStatusesForClass = (classData) => {
    const updatedQuizzes = (classData.quizzes || []).map((quiz) => ({
      ...quiz,
      status: getQuizStatus(quiz, classData.students || []),
    }));
    return { ...classData, quizzes: updatedQuizzes };
  };

  // ── Load classes from Firestore on mount or when teacherId changes ───────────

  useEffect(() => {
    const loadClasses = async () => {
      if (!teacherId) {
        setClasses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await firestoreService.getClasses(teacherId);
      if (result.success) {
        const updatedClasses = updateAllQuizStatuses(result.data);
        setClasses(updatedClasses);
      } else {
        console.error("Failed to load classes:", result.error);
        setClasses([]);
      }
      setLoading(false);
    };

    loadClasses();
  }, [teacherId]);

  // ── Class actions ────────────────────────────────────────────────────────────

  const addClass = useCallback(
    async (className, description = "") => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!className || !className.trim()) {
        return { success: false, error: "Class name is required" };
      }

      setActionLoading(true);
      try {
        const newClass = {
          name: className.trim(),
          description: description.trim(),
          teacherId,
          studentCount: 0,
          students: [],
          quizzes: [],
        };

        const result = await firestoreService.addClass(newClass);
        if (result.success) {
          const reloadResult = await firestoreService.getClasses(teacherId);
          if (reloadResult.success) {
            const updatedClasses = updateAllQuizStatuses(reloadResult.data);
            setClasses(updatedClasses);
          }
          return { success: true, class: { id: result.id, ...newClass } };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in addClass:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const deleteClass = useCallback(
    async (classId) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };

      setActionLoading(true);
      try {
        const result = await firestoreService.deleteClass(classId);
        if (result.success) {
          setClasses((prev) => prev.filter((c) => c.id !== classId));
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in deleteClass:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const editClass = useCallback(
    async (classId, newName, newDescription = "") => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!newName || !newName.trim()) {
        return { success: false, error: "Class name is required" };
      }

      setActionLoading(true);
      try {
        const result = await firestoreService.updateClass(classId, {
          name: newName.trim(),
          description: newDescription.trim(),
        });

        if (result.success) {
          setClasses((prev) =>
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  name: newName.trim(),
                  description: newDescription.trim(),
                }
              : c,
            ),
          );
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in editClass:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  // ── Student actions ──────────────────────────────────────────────────────────

  const addStudent = useCallback(
    async (classId, studentName, studentEmail = "") => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!studentName || !studentName.trim()) {
        return { success: false, error: "Student name is required" };
      }

      setActionLoading(true);
      try {
        const newStudent = {
          id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: studentName.trim(),
          email: studentEmail.trim(),
          quizzesTaken: 0,
          avgScore: 0,
          status: "Active",
          quizScores: {},
        };

        const result = await firestoreService.addStudentToClass(
          classId,
          newStudent,
        );
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  students: [...(c.students || []), newStudent],
                  studentCount: (c.students?.length || 0) + 1,
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true, student: newStudent };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in addStudent:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const removeStudent = useCallback(
    async (classId, studentId) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };

      setActionLoading(true);
      try {
        const result = await firestoreService.removeStudentFromClass(
          classId,
          studentId,
        );
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  students: (c.students || []).filter(
                    (s) => s.id !== studentId,
                  ),
                  studentCount: Math.max((c.students?.length || 0) - 1, 0),
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in removeStudent:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const editStudent = useCallback(
    async (classId, studentId, studentName, studentEmail = "") => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!studentName || !studentName.trim()) {
        return { success: false, error: "Student name is required" };
      }

      setActionLoading(true);
      try {
        const result = await firestoreService.updateStudentInClass(
          classId,
          studentId,
          {
            name: studentName.trim(),
            email: studentEmail.trim(),
          },
        );

        if (result.success) {
          setClasses((prev) =>
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  students: (c.students || []).map((s) =>
                    s.id === studentId ?
                      {
                        ...s,
                        name: studentName.trim(),
                        email: studentEmail.trim(),
                      }
                    : s,
                  ),
                }
              : c,
            ),
          );
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in editStudent:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const updateStudentScore = useCallback(
    async (classId, studentId, quizId, score, details) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };

      setActionLoading(true);
      try {
        const classData = classes.find((c) => c.id === classId);
        if (!classData) return { success: false, error: "Class not found" };

        const student = classData.students?.find((s) => s.id === studentId);
        if (!student) return { success: false, error: "Student not found" };

        const quiz = classData.quizzes?.find((q) => q.id === quizId);
        if (!quiz) return { success: false, error: "Quiz not found" };

        const quizScores = { ...student.quizScores };
        quizScores[quizId] = { score, details, date: new Date().toISOString() };

        const scores = Object.values(quizScores).map((q) => q.score);
        const avgScore =
          scores.length > 0 ?
            Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        const updatedStudent = {
          ...student,
          quizScores,
          avgScore,
          quizzesTaken: scores.length,
          lastUpdated: new Date().toISOString(),
        };

        const checkedStudents = [...(quiz.checkedStudents || [])];
        if (!checkedStudents.includes(studentId)) {
          checkedStudents.push(studentId);
        }

        const updatedQuiz = { ...quiz, checkedStudents };

        const studentResult = await firestoreService.updateStudentInClass(
          classId,
          studentId,
          updatedStudent,
        );
        if (!studentResult.success)
          return { success: false, error: studentResult.error };

        const quizResult = await firestoreService.updateQuizInClass(
          classId,
          quizId,
          {
            checkedStudents,
          },
        );

        if (quizResult.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  students: (c.students || []).map((s) =>
                    s.id === studentId ? updatedStudent : s,
                  ),
                  quizzes: (c.quizzes || []).map((q) =>
                    q.id === quizId ? updatedQuiz : q,
                  ),
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true, student: updatedStudent };
        }
        return { success: false, error: quizResult.error };
      } catch (error) {
        console.error("Error in updateStudentScore:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId, classes],
  );

  // ── Quiz actions ─────────────────────────────────────────────────────────────

  const addQuiz = useCallback(
    async (classId, quizData) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!quizData.title || !quizData.title.trim()) {
        return { success: false, error: "Quiz title is required" };
      }

      setActionLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const quizDate = quizData.date ? new Date(quizData.date) : null;

        let initialStatus = "active";
        if (quizDate) {
          const quizDateOnly = new Date(quizDate);
          quizDateOnly.setHours(0, 0, 0, 0);
          if (quizDateOnly > today) initialStatus = "upcoming";
        }

        const newQuiz = {
          id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: quizData.title.trim(),
          description: quizData.description?.trim() || "",
          date: quizData.date || new Date().toISOString().split("T")[0],
          totalQuestions: parseInt(quizData.totalQuestions) || 10,
          status: initialStatus,
          createdAt: new Date().toISOString(),
          checkedStudents: [],
        };

        const result = await firestoreService.addQuizToClass(classId, newQuiz);
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  quizzes: [...(c.quizzes || []), newQuiz],
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true, quiz: newQuiz };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in addQuiz:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId, classes],
  );

  const editQuiz = useCallback(
    async (classId, quizId, quizData) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!quizData.title || !quizData.title.trim()) {
        return { success: false, error: "Quiz title is required" };
      }

      setActionLoading(true);
      try {
        const updatedQuiz = {
          title: quizData.title.trim(),
          description: quizData.description?.trim() || "",
          date: quizData.date,
          totalQuestions: parseInt(quizData.totalQuestions) || 10,
          status: quizData.status,
        };

        const result = await firestoreService.updateQuizInClass(
          classId,
          quizId,
          updatedQuiz,
        );
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  quizzes: (c.quizzes || []).map((q) =>
                    q.id === quizId ? { ...q, ...updatedQuiz } : q,
                  ),
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in editQuiz:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const deleteQuiz = useCallback(
    async (classId, quizId) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };

      setActionLoading(true);
      try {
        const result = await firestoreService.deleteQuizFromClass(
          classId,
          quizId,
        );
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  quizzes: (c.quizzes || []).filter((q) => q.id !== quizId),
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in deleteQuiz:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const updateQuiz = useCallback(
    async (classId, quizId, quizData) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };

      setActionLoading(true);
      try {
        const result = await firestoreService.updateQuizInClass(
          classId,
          quizId,
          quizData,
        );
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) => {
              if (c.id === classId) {
                const updatedClass = {
                  ...c,
                  quizzes: (c.quizzes || []).map((q) =>
                    q.id === quizId ? { ...q, ...quizData } : q,
                  ),
                };
                return updateQuizStatusesForClass(updatedClass);
              }
              return c;
            }),
          );
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Error in updateQuiz:", error);
        return { success: false, error: error.message };
      } finally {
        setActionLoading(false);
      }
    },
    [teacherId],
  );

  const getClassById = useCallback(
    (classId) => classes.find((c) => c.id === classId) || null,
    [classes],
  );

  return {
    classes,
    loading,
    actionLoading,
    addClass,
    deleteClass,
    editClass,
    addStudent,
    removeStudent,
    editStudent,
    updateStudentScore,
    addQuiz,
    editQuiz,
    deleteQuiz,
    updateQuiz,
    getClassById,
  };
};

export default useClasses;
