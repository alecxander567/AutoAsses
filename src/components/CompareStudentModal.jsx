// src/components/CompareStudentModal.jsx
import { useState, useRef, useEffect } from "react";
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

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const getGrade = (score) => {
    if (score >= 90)
      return { letter: "A", color: "text-green-600", label: "Excellent!" };
    if (score >= 80)
      return { letter: "B", color: "text-blue-600", label: "Good Job!" };
    if (score >= 70)
      return { letter: "C", color: "text-yellow-600", label: "Not Bad!" };
    if (score >= 60)
      return {
        letter: "D",
        color: "text-orange-600",
        label: "Need Improvement",
      };
    return { letter: "F", color: "text-red-600", label: "Needs More Practice" };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10 MB limit");
      return;
    }

    setStudentSheetFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
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
      // Fetch the stored answer key image and turn it into a File
      const res = await fetch(answerKeyUrl);
      if (!res.ok) throw new Error("Could not load the answer key image.");
      const blob = await res.blob();
      const answerKeyFile = new File([blob], "answer-key.jpg", {
        type: blob.type || "image/jpeg",
      });

      // Let Gemini Vision do all the heavy lifting
      const geminiResult = await compareAnswersWithGemini(
        answerKeyFile,
        studentSheetFile,
      );

      if (!geminiResult || !geminiResult.details?.length) {
        throw new Error(
          "Gemini could not read the answers. Make sure both images are clear and well-lit.",
        );
      }

      // Normalise the result shape to match what the rest of the UI expects
      const score = geminiResult.score ?? 0;
      const details = geminiResult.details.map((d) => ({
        questionNumber: d.questionNumber,
        studentAnswer: d.studentAnswer ?? null,
        correctAnswer: d.correctAnswer,
        isCorrect: d.isCorrect,
      }));
      const correct =
        geminiResult.correct ?? details.filter((d) => d.isCorrect).length;
      const total = geminiResult.total ?? details.length;
      const grade = getGrade(score);

      const comparison = { score, correct, total, details, grade };
      setResult(comparison);
      onCompareComplete?.(score, details);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const resetForAnother = () => {
    setResult(null);
    setStudentSheetFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Per-question card helpers
  const getStatus = (d) => {
    if (d.isCorrect) return "correct";
    if (d.studentAnswer === null || d.studentAnswer === "?") return "unclear";
    return "wrong";
  };

  const getUnclearLabel = (d) => {
    if (d.isCorrect) return null;
    if (d.studentAnswer === "?") return "not found";
    if (d.studentAnswer === null) return "blank";
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

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
                {quizTitle} — {student?.name}
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
            {/* Student info banner */}
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

            {!result ?
              /* ── Upload section ── */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaFileImage className="text-emerald-500" />
                  <span>
                    Upload the student's answer sheet — Gemini AI will read and
                    compare it against the answer key automatically.
                  </span>
                </div>

                {/* Tips */}
                <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <FaExclamationTriangle className="text-amber-500 text-lg mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-amber-800">
                      Tips for best results
                    </p>
                    <ul className="space-y-1 text-amber-700 text-xs leading-relaxed">
                      <li>
                        <span className="font-medium">Format:</span> PNG, JPG,
                        JPEG only — no PDFs.
                      </li>
                      <li>
                        <span className="font-medium">Max size:</span> 10 MB per
                        image.
                      </li>
                      <li>
                        <span className="font-medium">Layout:</span> One
                        question per line with the number on the left and the
                        letter on the right (e.g. "1. A").
                      </li>
                      <li>
                        <span className="font-medium">Writing:</span> Large,
                        dark, clearly formed A / B / C / D letters.
                      </li>
                      <li>
                        <span className="font-medium">Photo:</span> Flat,
                        well-lit, no skew or blur.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
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
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
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
                          PNG, JPG, JPEG up to 10 MB
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
                      Gemini is reading the answers…
                    </>
                  : <>
                      <FaEye />
                      Compare Answers
                    </>
                  }
                </button>
              </div>
            : /* ── Results section ── */
              <div className="space-y-6">
                {/* Score card */}
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
                      <p className={`text-6xl font-bold ${result.grade.color}`}>
                        {result.grade.letter}
                      </p>
                      <p className="text-emerald-100 text-sm">
                        {result.grade.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary counts */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-2xl font-bold text-green-600">
                      {result.details.filter((d) => d.isCorrect).length}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">Correct</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-2xl font-bold text-red-500">
                      {
                        result.details.filter(
                          (d) =>
                            !d.isCorrect &&
                            d.studentAnswer !== null &&
                            d.studentAnswer !== "?",
                        ).length
                      }
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">Wrong</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-2xl font-bold text-amber-500">
                      {
                        result.details.filter(
                          (d) =>
                            d.studentAnswer === null || d.studentAnswer === "?",
                        ).length
                      }
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">Unreadable</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                    Correct
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                    Wrong
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    Blank / unreadable
                  </span>
                </div>

                {/* Question breakdown grid */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaChartPie className="text-emerald-600" />
                    Question Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {result.details.map((detail, index) => {
                      const status = getStatus(detail);
                      const unclearLabel = getUnclearLabel(detail);

                      const cardClass =
                        status === "correct" ?
                          "bg-green-50 border border-green-200"
                        : status === "unclear" ?
                          "bg-amber-50 border border-amber-200"
                        : "bg-red-50 border border-red-200";

                      const ansColor =
                        status === "correct" ? "text-green-600"
                        : status === "unclear" ? "text-amber-500"
                        : "text-red-500";

                      const ansDisplay =
                        (
                          detail.studentAnswer === null ||
                          detail.studentAnswer === "?"
                        ) ?
                          "—"
                        : detail.studentAnswer;

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-center ${cardClass}`}>
                          {/* Question number */}
                          <p className="text-xs text-gray-400 mb-1">
                            Q{detail.questionNumber}
                          </p>

                          {/* Student answer — large */}
                          <div
                            className={`text-xl font-bold flex items-center justify-center gap-1 ${ansColor}`}>
                            <span>{ansDisplay}</span>
                            {status === "correct" && (
                              <FaCheck className="text-green-500 text-xs" />
                            )}
                            {status === "wrong" && (
                              <FaCross className="text-red-500 text-xs" />
                            )}
                            {status === "unclear" && (
                              <FaExclamationTriangle className="text-amber-400 text-xs" />
                            )}
                          </div>

                          {/* Correct answer — always visible */}
                          <p className="text-xs mt-1">
                            <span className="text-gray-400">Key: </span>
                            <span className="font-semibold text-gray-600">
                              {detail.correctAnswer}
                            </span>
                          </p>

                          {/* Blank / not found label */}
                          {unclearLabel && (
                            <p className="text-xs text-amber-500 mt-0.5 italic">
                              {unclearLabel}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForAnother}
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
