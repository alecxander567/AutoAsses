// src/services/firestoreService.js
import { db } from "../firebase/config"; // This should now work
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const COLLECTION = "classes";

// Get all classes for a teacher
export const getClasses = async (teacherId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("teacherId", "==", teacherId),
    );
    const querySnapshot = await getDocs(q);
    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { success: false, error: error.message };
  }
};

// Get a single class by ID
export const getClassById = async (classId) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: "Class not found" };
  } catch (error) {
    console.error("Error fetching class:", error);
    return { success: false, error: error.message };
  }
};

// Add a new class
export const addClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...classData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding class:", error);
    return { success: false, error: error.message };
  }
};

// Update a class
export const updateClass = async (classId, classData) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    await updateDoc(docRef, {
      ...classData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating class:", error);
    return { success: false, error: error.message };
  }
};

// Delete a class
export const deleteClass = async (classId) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting class:", error);
    return { success: false, error: error.message };
  }
};

// Add a student to a class
export const addStudentToClass = async (classId, studentData) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Class not found" };
    }

    const classData = docSnap.data();
    const students = classData.students || [];
    students.push(studentData);

    await updateDoc(docRef, {
      students: students,
      studentCount: students.length,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding student:", error);
    return { success: false, error: error.message };
  }
};

// Remove a student from a class
export const removeStudentFromClass = async (classId, studentId) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Class not found" };
    }

    const classData = docSnap.data();
    const students = (classData.students || []).filter(
      (s) => s.id !== studentId,
    );

    await updateDoc(docRef, {
      students: students,
      studentCount: students.length,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing student:", error);
    return { success: false, error: error.message };
  }
};

// Update a student in a class
export const updateStudentInClass = async (classId, studentId, studentData) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Class not found" };
    }

    const classData = docSnap.data();
    const students = (classData.students || []).map((s) =>
      s.id === studentId ? { ...s, ...studentData } : s,
    );

    await updateDoc(docRef, {
      students: students,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: error.message };
  }
};

// Add a quiz to a class
export const addQuizToClass = async (classId, quizData) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Class not found" };
    }

    const classData = docSnap.data();
    const quizzes = classData.quizzes || [];
    quizzes.push(quizData);

    await updateDoc(docRef, {
      quizzes: quizzes,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding quiz:", error);
    return { success: false, error: error.message };
  }
};

// Update a quiz in a class
export const updateQuizInClass = async (classId, quizId, quizData) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Class not found" };
    }

    const classData = docSnap.data();
    const quizzes = (classData.quizzes || []).map((q) =>
      q.id === quizId ? { ...q, ...quizData } : q,
    );

    await updateDoc(docRef, {
      quizzes: quizzes,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return { success: false, error: error.message };
  }
};

// Delete a quiz from a class
export const deleteQuizFromClass = async (classId, quizId) => {
  try {
    const docRef = doc(db, COLLECTION, classId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Class not found" };
    }

    const classData = docSnap.data();
    const quizzes = (classData.quizzes || []).filter((q) => q.id !== quizId);

    await updateDoc(docRef, {
      quizzes: quizzes,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: error.message };
  }
};
