// src/hooks/useAuthForm.js
import { useState, useCallback } from "react";

export const useAuthForm = (initialState = {}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    ...initialState,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    });
    setLoading(false);
    setError("");
    setSuccess(false);
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateLoginForm = useCallback(() => {
    const { email, password } = formData;

    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  }, [formData]);

  const validateSignupForm = useCallback(() => {
    const { email, password, confirmPassword, name } = formData;

    if (!email || !password || !confirmPassword || !name) {
      setError("Please fill in all fields");
      return false;
    }

    if (name.length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  }, [formData]);

  return {
    formData,
    setFormData,
    showPassword,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    handleChange,
    togglePasswordVisibility,
    resetForm,
    validateLoginForm,
    validateSignupForm,
    validateEmail,
    validatePassword,
  };
};
