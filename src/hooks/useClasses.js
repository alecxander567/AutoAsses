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

  // Load classes from Firestore on mount or when teacherId changes
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
        setClasses(result.data);
      } else {
        console.error("Failed to load classes:", result.error);
        setClasses([]);
      }
      setLoading(false);
    };

    loadClasses();
  }, [teacherId]);

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
          // Reload classes to get the latest data
          const reloadResult = await firestoreService.getClasses(teacherId);
          if (reloadResult.success) {
            setClasses(reloadResult.data);
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
        };

        const result = await firestoreService.addStudentToClass(
          classId,
          newStudent,
        );
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  students: [...(c.students || []), newStudent],
                  studentCount: (c.students?.length || 0) + 1,
                }
              : c,
            ),
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
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  students: (c.students || []).filter(
                    (s) => s.id !== studentId,
                  ),
                  studentCount: Math.max((c.students?.length || 0) - 1, 0),
                }
              : c,
            ),
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

  const addQuiz = useCallback(
    async (classId, quizData) => {
      if (!teacherId) return { success: false, error: "No teacher logged in" };
      if (!quizData.title || !quizData.title.trim()) {
        return { success: false, error: "Quiz title is required" };
      }

      setActionLoading(true);
      try {
        const newQuiz = {
          id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: quizData.title.trim(),
          description: quizData.description?.trim() || "",
          date: quizData.date || new Date().toISOString().split("T")[0],
          totalQuestions: parseInt(quizData.totalQuestions) || 10,
          status: quizData.status || "active",
          createdAt: new Date().toISOString(),
        };

        const result = await firestoreService.addQuizToClass(classId, newQuiz);
        if (result.success) {
          setClasses((prev) =>
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  quizzes: [...(c.quizzes || []), newQuiz],
                }
              : c,
            ),
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
    [teacherId],
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
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  quizzes: (c.quizzes || []).map((q) =>
                    q.id === quizId ? { ...q, ...updatedQuiz } : q,
                  ),
                }
              : c,
            ),
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
            prev.map((c) =>
              c.id === classId ?
                {
                  ...c,
                  quizzes: (c.quizzes || []).filter((q) => q.id !== quizId),
                }
              : c,
            ),
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

  const getClassById = useCallback(
    (classId) => {
      return classes.find((c) => c.id === classId) || null;
    },
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
    addQuiz,
    editQuiz,
    deleteQuiz,
    getClassById,
  };
};
