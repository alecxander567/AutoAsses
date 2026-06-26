// src/hooks/useAuthActions.js
import { useAuth } from "../context/AuthContext";

export const useAuthActions = () => {
  const {
    user,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerificationEmail,
    clearError,
  } = useAuth();

  // Signup with email/password
  const handleSignup = async (email, password, name) => {
    const result = await signup(email, password, name);
    return result;
  };

  // Login with email/password
  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    return result;
  };

  // Login with Google
  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    return result;
  };

  // Logout
  const handleLogout = async () => {
    const result = await logout();
    return result;
  };

  // Reset password
  const handleResetPassword = async (email) => {
    const result = await resetPassword(email);
    return result;
  };

  // Resend verification email
  const handleResendVerification = async () => {
    const result = await resendVerificationEmail();
    return result;
  };

  // Clear error
  const handleClearError = () => {
    clearError();
  };

  return {
    user,
    loading,
    error,
    handleSignup,
    handleLogin,
    handleGoogleLogin,
    handleLogout,
    handleResetPassword,
    handleResendVerification,
    handleClearError,
  };
};
