// src/components/QuizAnalysis.jsx
import { useState, useEffect } from "react";
import {
  FaSpinner,
  FaChartBar,
  FaGraduationCap,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaRobot,
  FaChartPie,
  FaTimes
} from "react-icons/fa";
import { analyzeQuizResults } from "../services/googleAIService";

const QuizAnalysis = ({ quiz, students, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!quiz || !students || students.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Prepare the data for analysis
        const quizData = {
          quizTitle: quiz.title,
          totalStudents: students.length,
          studentScores: students.map((s) => ({
            name: s.name,
            score: s.avgScore || 0,
            details: s.quizScores?.[quiz.id]?.details || [],
          })),
          questions: quiz.totalQuestions || 10,
          // If you have question-level data, include it
          questionDetails: students
            .filter((s) => s.quizScores?.[quiz.id]?.details)
            .flatMap((s) => s.quizScores[quiz.id].details || []),
        };

        const result = await analyzeQuizResults(quizData);
        setAnalysis(result);
      } catch (err) {
        console.error("Analysis error:", err);
        setError(err.message || "Failed to analyze quiz results");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [quiz, students]);

  // Calculate stats locally if AI fails or as fallback
  const calculateLocalStats = () => {
    const scores = students
      .filter((s) => s.avgScore !== undefined && s.avgScore !== null)
      .map((s) => s.avgScore);

    if (scores.length === 0) return null;

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passCount = scores.filter((s) => s >= 70).length;
    const failCount = scores.filter((s) => s < 70).length;

    const gradeDist = {
      A: scores.filter((s) => s >= 90).length,
      B: scores.filter((s) => s >= 80 && s < 90).length,
      C: scores.filter((s) => s >= 70 && s < 80).length,
      D: scores.filter((s) => s >= 60 && s < 70).length,
      F: scores.filter((s) => s < 60).length,
    };

    return {
      totalStudents: scores.length,
      averageScore: Math.round(average),
      passRate: Math.round((passCount / scores.length) * 100),
      failRate: Math.round((failCount / scores.length) * 100),
      gradeDistribution: gradeDist,
    };
  };

  const localStats = calculateLocalStats();

  if (!quiz || !students || students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">No student data available for analysis</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FaRobot className="text-purple-600 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">AI Quiz Analysis</h3>
            <p className="text-xs text-gray-500">{quiz.title}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <FaTimes />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ?
          <div className="text-center py-12">
            <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">AI is analyzing quiz results...</p>
            <p className="text-sm text-gray-400 mt-2">
              This may take a few seconds
            </p>
          </div>
        : error ?
          <div className="text-center py-12">
            <FaExclamationTriangle className="text-4xl text-amber-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Analysis Failed</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <p className="text-xs text-gray-400 mt-4">
              Showing basic statistics instead
            </p>
            {/* Fallback to local stats */}
            {localStats && (
              <div className="mt-6 text-left">
                <BasicStats stats={localStats} students={students} />
              </div>
            )}
          </div>
        : <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                  <FaGraduationCap className="text-lg" />
                  <span className="text-xs font-medium">AVG SCORE</span>
                </div>
                <p className="text-3xl font-bold text-emerald-700">
                  {analysis?.averageScore || localStats?.averageScore || 0}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                  <FaUsers className="text-lg" />
                  <span className="text-xs font-medium">PASS RATE</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {analysis?.passRate || localStats?.passRate || 0}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-600 mb-1">
                  <FaTimesCircle className="text-lg" />
                  <span className="text-xs font-medium">FAIL RATE</span>
                </div>
                <p className="text-3xl font-bold text-amber-700">
                  {analysis?.failRate || localStats?.failRate || 0}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-purple-600 mb-1">
                  <FaChartBar className="text-lg" />
                  <span className="text-xs font-medium">TOTAL STUDENTS</span>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {analysis?.totalStudents || localStats?.totalStudents || 0}
                </p>
              </div>
            </div>

            {/* Grade Distribution */}
            {(analysis?.gradeDistribution || localStats?.gradeDistribution) && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaChartPie className="text-purple-600" />
                  Grade Distribution
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(
                    analysis?.gradeDistribution ||
                      localStats?.gradeDistribution ||
                      {},
                  ).map(([grade, count]) => (
                    <div key={grade} className="text-center">
                      <div
                        className={`rounded-lg p-2 ${
                          grade === "A" ? "bg-green-100"
                          : grade === "B" ? "bg-blue-100"
                          : grade === "C" ? "bg-yellow-100"
                          : grade === "D" ? "bg-orange-100"
                          : "bg-red-100"
                        }`}>
                        <p className="text-xl font-bold">{count}</p>
                        <p className="text-xs font-medium text-gray-600">
                          Grade {grade}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Difficult Questions */}
            {analysis?.mostDifficultQuestions &&
              analysis.mostDifficultQuestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-500" />
                    Most Difficult Questions
                  </h4>
                  <div className="space-y-3">
                    {analysis.mostDifficultQuestions
                      .slice(0, 3)
                      .map((q, idx) => (
                        <div
                          key={idx}
                          className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">
                              Question {q.questionNumber}
                            </span>
                            <span className="text-sm font-semibold text-red-600">
                              {q.percentCorrect}% correct
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{q.insight}</p>
                          {q.commonWrongAnswer && (
                            <p className="text-xs text-gray-500 mt-1">
                              Common wrong answer: {q.commonWrongAnswer}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Recommendations */}
            {analysis?.recommendations &&
              analysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaLightbulb className="text-amber-500" />
                    Recommendations for Teacher
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Insights */}
            {analysis?.insights && analysis.insights.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  Key Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis?.summary && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <p className="text-sm text-gray-700">{analysis.summary}</p>
              </div>
            )}
          </div>
        }
      </div>
    </div>
  );
};

// Fallback Basic Stats Component
const BasicStats = ({ stats }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-700">
            {stats.averageScore}%
          </p>
          <p className="text-xs text-gray-500">Average</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-700">{stats.passRate}%</p>
          <p className="text-xs text-gray-500">Pass Rate</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
          <div key={grade} className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold">{count}</p>
            <p className="text-xs text-gray-500">{grade}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizAnalysis;
