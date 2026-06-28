// src/components/CompareStudentModal.jsx
import { useState, useRef } from "react";
import {
  FaTimes,
  FaUpload,
  FaSpinner,
  FaCheck,
  FaTimes as FaCross,
  FaUser,
  FaFileImage,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGraduationCap,
  FaChartPie,
} from "react-icons/fa";
import { compareAnswersWithGemini } from "../services/googleAIService";

const CompareStudentModal = ({
  isOpen,
  onClose,
  student,
  quizTitle,
  answerKeyUrl,
  onCompareComplete,
}) => {
  const [studentSheetFile, setStudentSheetFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // NOTE: OCR (Tesseract) has been removed entirely. Gemini Vision reads
  // both images directly and does extraction + comparison in one call,
  // which handles handwriting far better than Tesseract's printed-text
  // model ever could. See googleAIService.compareAnswersWithGemini.

  const getGrade = (score) => {
    if (score >= 90)
      return {
        letter: "A",
        color: "text-green-600",
        bg: "bg-green-100",
        label: "Excellent!",
      };
    if (score >= 80)
      return {
        letter: "B",
        color: "text-blue-600",
        bg: "bg-blue-100",
        label: "Good Job!",
      };
    if (score >= 70)
      return {
        letter: "C",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        label: "Not Bad!",
      };
    if (score >= 60)
      return {
        letter: "D",
        color: "text-orange-600",
        bg: "bg-orange-100",
        label: "Need Improvement",
      };
    return {
      letter: "F",
      color: "text-red-600",
      bg: "bg-red-100",
      label: "Needs More Practice",
    };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setStudentSheetFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCompare = async () => {
    if (!studentSheetFile) {
      setError("Please select a student answer sheet image");
      return;
    }

    if (!answerKeyUrl) {
      setError("Please upload an answer key first");
      return;
    }

    setComparing(true);
    setError(null);

    try {
      // Fetch the answer key image from Cloudinary so we have a File
      // object to hand to Gemini, same as before.
      const answerKeyResponse = await fetch(answerKeyUrl);
      if (!answerKeyResponse.ok) {
        throw new Error("Could not load the answer key image.");
      }
      const answerKeyBlob = await answerKeyResponse.blob();
      const answerKeyFile = new File([answerKeyBlob], "answer-key.jpg", {
        type: answerKeyBlob.type || "image/jpeg",
      });

      const geminiResult = await compareAnswersWithGemini(
        answerKeyFile,
        studentSheetFile,
      );

      // compareAnswersWithGemini can come back undefined if Gemini's
      // response wasn't valid JSON (logged inside the service). Guard
      // against that instead of crashing on `.score`.
      if (!geminiResult || typeof geminiResult.score !== "number") {
        throw new Error(
          "Could not read the answer sheets clearly. Please try a clearer photo.",
        );
      }

      const comparison = {
        score: geminiResult.score,
        correct: geminiResult.correct,
        total: geminiResult.total,
        details: geminiResult.details || [],
        grade: getGrade(geminiResult.score),
      };

      setResult(comparison);

      if (onCompareComplete) {
        onCompareComplete(comparison.score, comparison.details);
      }
    } catch (err) {
      console.error("Comparison failed:", err);
      setError(err.message || "Failed to compare answers. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  const handleClose = () => {
    setStudentSheetFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setComparing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}></div>

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaGraduationCap className="text-emerald-600" />
                Compare Student Answers
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {quizTitle} - {student?.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <FaTimes className="text-lg" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <FaUser className="text-emerald-600 text-xl" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{student?.name}</p>
                <p className="text-sm text-gray-500">
                  {student?.email || "No email provided"}
                </p>
              </div>
              {student?.avgScore !== undefined && (
                <div className="ml-auto text-right">
                  <p className="text-sm text-gray-500">Previous Score</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {student.avgScore}%
                  </p>
                </div>
              )}
            </div>

            {/* Upload Section */}
            {
              !result ?
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaFileImage className="text-emerald-500" />
                    <span>
                      Upload the student's answer sheet image to compare with
                      the answer key
                    </span>
                  </div>

                  {/* Important Notice */}
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <FaExclamationTriangle className="text-amber-500 text-lg mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-amber-800">
                        Important — Before You Upload
                      </p>
                      <ul className="space-y-1 text-amber-700 text-xs leading-relaxed">
                        <li>
                          <span className="font-medium">Accepted formats:</span>{" "}
                          PNG, JPG, and JPEG only. PDFs and other file types are
                          not supported.
                        </li>
                        <li>
                          <span className="font-medium">Max file size:</span> 10
                          MB per image. Larger files will be rejected.
                        </li>
                        <li>
                          <span className="font-medium">Rate limit:</span> You
                          can compare up to{" "}
                          <span className="font-medium">
                            10 sheets per minute
                          </span>
                          . Uploading too quickly will temporarily pause
                          processing — wait a moment and try again.
                        </li>
                        <li>
                          <span className="font-medium">Image quality:</span>{" "}
                          Use a clear, well-lit, flat photo. Blurry or skewed
                          images reduce accuracy.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div
                    onClick={handleUploadClick}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition group">
                    {previewUrl ?
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={previewUrl}
                          alt="Student sheet preview"
                          className="max-h-48 rounded-lg shadow-sm"
                        />
                        <p className="text-sm text-emerald-600 font-medium">
                          {studentSheetFile?.name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudentSheetFile(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700">
                          Remove file
                        </button>
                      </div>
                    : <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition">
                          <FaUpload className="text-emerald-600 text-2xl" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Click to select an image
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, JPEG up to 10MB
                          </p>
                        </div>
                      </div>
                    }
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <FaExclamationTriangle />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCompare}
                    disabled={!studentSheetFile || comparing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium">
                    {comparing ?
                      <>
                        <FaSpinner className="animate-spin" />
                        Comparing...
                      </>
                    : <>
                        <FaEye />
                        Compare Answers
                      </>
                    }
                  </button>
                </div>
                // Results Section
              : <div className="space-y-6">
                  {/* Score Card */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm">Score</p>
                        <div className="flex items-baseline gap-3">
                          <p className="text-5xl font-bold">{result.score}%</p>
                          <p className="text-2xl font-semibold text-emerald-100">
                            ({result.correct}/{result.total})
                          </p>
                        </div>
                        <p className="text-emerald-100 text-sm mt-1">
                          {result.correct} out of {result.total} correct
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-6xl font-bold ${result.grade.color}`}>
                          {result.grade.letter}
                        </p>
                        <p className="text-emerald-100 text-sm">
                          {result.grade.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaChartPie className="text-emerald-600" />
                      Question Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {result.details.map((detail, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-center ${
                            detail.isCorrect ?
                              "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                          }`}>
                          <p className="text-xs text-gray-500">
                            Q{detail.questionNumber}
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-sm font-medium">
                              {detail.studentAnswer ?? "—"}
                            </span>
                            {detail.isCorrect ?
                              <FaCheck className="text-green-500 text-xs" />
                            : <FaCross className="text-red-500 text-xs" />}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Correct: {detail.correctAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResult(null);
                        setStudentSheetFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                      Compare Another
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition">
                      <FaCheckCircle className="inline mr-2" />
                      Done
                    </button>
                  </div>
                </div>

            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareStudentModal;
