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

// Confidence threshold (0-100, as returned by Tesseract) below which we
// treat a recognized answer as "unclear" rather than trusting it. Single
// handwritten letters are exactly the case Tesseract is least confident
// about, so this matters more here than it would for printed text.
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

  // Reuse a single Tesseract worker for the lifetime of the modal instead
  // of spinning up + tearing down a new one on every comparison.
  const workerRef = useRef(null);

  // Shared worker configuration. PSM 11 ("sparse text, no particular
  // order") replaces the previous PSM 6 ("single uniform block"). PSM 6
  // assumes the page reads like a coherent paragraph -- fine for printed
  // text, but handwritten "1. B" / "2. D" lines are really isolated
  // fragments with inconsistent spacing and baselines, which PSM 6 tends
  // to merge or mis-split. PSM 11 looks for text wherever it can find it
  // without assuming a layout, which tolerates handwriting's irregularity
  // better.
  //
  // Declared above the effects that call it (and as a plain function
  // rather than relying on closures over component state) so it's fully
  // defined before anything references it, with no use-before-declaration
  // or stale-dependency concerns.
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

  // Preprocess the image before handing it to Tesseract. Handwriting OCR
  // accuracy is highly sensitive to contrast and resolution -- a normal
  // phone photo has soft grayscale gradients and JPEG noise around pencil/
  // pen strokes that confuse the model. Converting to high-contrast
  // black-and-white and upscaling small images gives Tesseract cleaner,
  // larger glyphs to work with.
  const preprocessImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          // Upscale small images; handwriting on a downscaled/compressed
          // photo loses the fine stroke detail OCR needs.
          const scale = img.width < 1200 ? 1200 / img.width : 1;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Convert to grayscale, then binarize with a fixed threshold.
          // This turns soft pencil/pen strokes and paper texture into
          // crisp black-on-white, which is what Tesseract's models were
          // primarily trained against.
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

  // OCR with per-word confidence. Returns { text, words } where words
  // carry Tesseract's own confidence score for each recognized token, so
  // parseAnswers can fall back to "unclear" instead of trusting a
  // low-confidence misread.
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
      // Look for patterns like "1. A", "1 A", "1) A", etc. No `$` anchor
      // at the end -- OCR frequently appends a stray trailing character
      // after a correctly-read letter, and anchoring the end would fail
      // the whole line on one noise character.
      const match = line.match(/^\s*(\d{1,2})[.):]?\s*([A-D])/i);
      if (match) {
        const questionNumber = parseInt(match[1], 10);
        const letter = match[2].toUpperCase();

        // Cross-check against word-level confidence when we have it. If
        // Tesseract itself wasn't confident about the recognized letter,
        // treat this as unreadable rather than silently trusting a guess
        // -- this matters far more for handwriting than printed text.
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

      // A line with just a question number and no letter at all means
      // the question was left blank. Record explicitly as `null` so
      // compareAnswers can tell "left blank" apart from "OCR found
      // nothing at all for this line".
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

    // Only count questions that actually exist on the answer key, so a
    // question the student left blank (and so never appears in their
    // parsed answers) still counts as wrong rather than being silently
    // excluded from the denominator.
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
      if (!correctAnswer) {
        // The key itself doesn't have a usable answer for this question
        // -- skip rather than penalize the student for an unreadable key.
        return;
      }

      total++;
      const studentAnswer = studentAnswerMap[questionNumber] ?? null;
      const isCorrect = studentAnswer === correctAnswer;
      if (isCorrect) correct++;

      details.push({
        questionNumber,
        studentAnswer, // may be null: left blank or unreadable
        correctAnswer,
        isCorrect,
      });
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const grade = getGrade(score);

    return {
      score,
      correct,
      total,
      details,
      grade,
    };
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
      const answerKeyResponse = await fetch(answerKeyUrl);
      if (!answerKeyResponse.ok) {
        throw new Error("Could not load the answer key image.");
      }
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
                          Use a clear, well-lit, flat photo with letters written
                          large and dark. Blurry, skewed, or faint handwriting
                          reduces OCR accuracy.
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
