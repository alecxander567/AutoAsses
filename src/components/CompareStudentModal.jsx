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
import { createWorker } from "tesseract.js";

const MIN_WORD_CONFIDENCE = 55;

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
  const workerRef = useRef(null);

  const configureWorker = async (worker) => {
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789ABCD.) ",
      tessedit_pageseg_mode: "11",
    });
  };

  useEffect(() => {
    if (isOpen && !workerRef.current) {
      (async () => {
        try {
          const worker = await createWorker("eng");
          await configureWorker(worker);
          workerRef.current = worker;
        } catch (err) {
          console.error("Failed to initialize OCR worker:", err);
        }
      })();
    }

    return () => {
      if (!isOpen && workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const preprocessImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const scale = img.width < 1200 ? 1200 / img.width : 1;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const threshold = 150;
          for (let i = 0; i < data.length; i += 4) {
            const gray =
              data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const value = gray < threshold ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = value;
          }
          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error("Failed to preprocess image"));
              return;
            }
            resolve(
              new File([blob], file.name || "processed.png", {
                type: "image/png",
              }),
            );
          }, "image/png");
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for preprocessing"));
      };

      img.src = url;
    });
  };

  const extractTextFromImage = async (imageSource) => {
    try {
      if (!workerRef.current) {
        workerRef.current = await createWorker("eng");
        await configureWorker(workerRef.current);
      }
      const processed = await preprocessImage(imageSource);
      const { data } = await workerRef.current.recognize(processed);
      return { text: data.text, words: data.words || [] };
    } catch (err) {
      console.error("OCR Error:", err);
      return { text: "", words: [] };
    }
  };

  const parseAnswers = (text, words) => {
    const answers = {};
    const lines = text.split("\n");

    for (const line of lines) {
      const match = line.match(/^\s*(\d{1,2})[.):]?\s*([A-D])/i);
      if (match) {
        const questionNumber = parseInt(match[1], 10);
        const letter = match[2].toUpperCase();

        const matchingWord = words.find(
          (w) => w.text && w.text.toUpperCase().includes(letter),
        );
        if (matchingWord && matchingWord.confidence < MIN_WORD_CONFIDENCE) {
          answers[questionNumber] = null;
        } else {
          answers[questionNumber] = letter;
        }
        continue;
      }

      const blankMatch = line.match(/^\s*(\d{1,2})[.):]?\s*$/);
      if (blankMatch) {
        answers[parseInt(blankMatch[1], 10)] = null;
      }
    }

    return answers;
  };

  const compareAnswers = (answerKeyResult, studentResult) => {
    const answerKeyMap = parseAnswers(
      answerKeyResult.text,
      answerKeyResult.words,
    );
    const studentAnswerMap = parseAnswers(
      studentResult.text,
      studentResult.words,
    );

    const questionNumbers = Object.keys(answerKeyMap)
      .map(Number)
      .sort((a, b) => a - b);

    if (questionNumbers.length === 0) {
      throw new Error(
        'Could not read any answers from the answer key image. Make sure it\'s a clear photo of the answer list (e.g. "1. B", "2. D", ...).',
      );
    }

    let correct = 0;
    let total = 0;
    const details = [];

    questionNumbers.forEach((questionNumber) => {
      const correctAnswer = answerKeyMap[questionNumber];
      if (!correctAnswer) return;

      total++;

      // THREE states for student answer:
      //   string (e.g. "A")  → OCR read a letter
      //   null               → OCR found the line but answer was blank or low-confidence
      //   "?"                → OCR found no line at all for this question number
      const studentAnswer =
        questionNumber in studentAnswerMap ?
          studentAnswerMap[questionNumber]
        : "?";

      const isCorrect = studentAnswer === correctAnswer;
      if (isCorrect) correct++;

      details.push({
        questionNumber,
        studentAnswer,
        correctAnswer,
        isCorrect,
      });
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const grade = getGrade(score);

    return { score, correct, total, details, grade };
  };

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
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

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
      const answerKeyResponse = await fetch(answerKeyUrl);
      if (!answerKeyResponse.ok)
        throw new Error("Could not load the answer key image.");
      const answerKeyBlob = await answerKeyResponse.blob();
      const answerKeyFile = new File([answerKeyBlob], "answer-key.jpg", {
        type: answerKeyBlob.type || "image/jpeg",
      });

      const answerKeyResult = await extractTextFromImage(answerKeyFile);
      const studentResult = await extractTextFromImage(studentSheetFile);

      const comparison = compareAnswers(answerKeyResult, studentResult);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  // Helper: classify each question for styling
  const getQuestionStatus = (detail) => {
    if (detail.isCorrect) return "correct";
    if (detail.studentAnswer === null || detail.studentAnswer === "?")
      return "unclear";
    return "wrong";
  };

  const statusLabel = (detail) => {
    if (detail.isCorrect) return null;
    if (detail.studentAnswer === "?") return "not found";
    if (detail.studentAnswer === null) return "blank";
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

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

            {!result ?
              /* ── Upload Section ── */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaFileImage className="text-emerald-500" />
                  <span>
                    Upload the student's answer sheet image to compare with the
                    answer key
                  </span>
                </div>

                <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <FaExclamationTriangle className="text-amber-500 text-lg mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-amber-800">
                      Important — Before You Upload
                    </p>
                    <ul className="space-y-1 text-amber-700 text-xs leading-relaxed">
                      <li>
                        <span className="font-medium">Accepted formats:</span>{" "}
                        PNG, JPG, and JPEG only.
                      </li>
                      <li>
                        <span className="font-medium">Max file size:</span> 10
                        MB per image.
                      </li>
                      <li>
                        <span className="font-medium">Rate limit:</span> Up to{" "}
                        <span className="font-medium">
                          10 sheets per minute
                        </span>
                        .
                      </li>
                      <li>
                        <span className="font-medium">Image quality:</span> Use
                        a clear, well-lit, flat photo with letters written large
                        and dark.
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
                      <FaSpinner className="animate-spin" /> Comparing...
                    </>
                  : <>
                      <FaEye /> Compare Answers
                    </>
                  }
                </button>
              </div>
            : /* ── Results Section ── */
              <div className="space-y-6">
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
                      <p className={`text-6xl font-bold ${result.grade.color}`}>
                        {result.grade.letter}
                      </p>
                      <p className="text-emerald-100 text-sm">
                        {result.grade.label}
                      </p>
                    </div>
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

                {/* Detailed Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaChartPie className="text-emerald-600" />
                    Question Breakdown
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {result.details.map((detail, index) => {
                      const status = getQuestionStatus(detail);
                      const label = statusLabel(detail);

                      const cardClass =
                        status === "correct" ?
                          "bg-green-50 border border-green-200"
                        : status === "unclear" ?
                          "bg-amber-50 border border-amber-200"
                        : "bg-red-50 border border-red-200";

                      const answerColor =
                        status === "correct" ? "text-green-600"
                        : status === "unclear" ? "text-amber-500"
                        : "text-red-500";

                      const answerDisplay =
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

                          {/* Student's answer — large */}
                          <div
                            className={`text-xl font-bold flex items-center justify-center gap-1 ${answerColor}`}>
                            <span>{answerDisplay}</span>
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
                          {label && (
                            <p className="text-xs text-amber-500 mt-0.5 italic">
                              {label}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary row */}
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
                    <p className="text-xs text-amber-600 mt-0.5">
                      Blank / unreadable
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResult(null);
                      setStudentSheetFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
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
