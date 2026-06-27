// src/components/LoadingSpinner.jsx
import { FaSpinner } from "react-icons/fa";

const LoadingSpinner = ({ size = "text-4xl", color = "text-emerald-600" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-seashell-cream">
      <div className="text-center">
        <FaSpinner className={`animate-spin ${size} ${color} mx-auto mb-4`} />
        <p className="text-emerald-700/70">Loading QuizChecker...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
