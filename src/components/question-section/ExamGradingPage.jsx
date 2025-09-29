import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaSave, FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function ExamGradingPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [submission, setSubmission] = useState(null);
  const [essayScores, setEssayScores] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [gradingError, setGradingError] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedInput, setFocusedInput] = useState(null);

  // Fetch submission details
  const fetchSubmissionDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/v1/exam/submission/${submissionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSubmission(response.data);
      setEssayScores(
        response.data.essayQuestions.map((answer) => ({
          questionId: answer.questionId,
          score: answer.score || "", // Use empty string instead of 0
          displayValue: answer.score ? answer.score.toString() : "", // Track display value separately
        }))
      );
      setFeedback(response.data.overallFeedback || "");
      setGradingError(null);
    } catch (err) {
      const message =
        err.response?.data?.error || "Failed to load submission details";
      setGradingError(message);
      toast.error(message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, accessToken]);

  // Handle score change with better UX
  const handleScoreChange = useCallback((questionId, value) => {
    setEssayScores((prev) =>
      prev.map((s) => {
        if (s.questionId === questionId) {
          // Allow empty string for better UX
          if (value === "") {
            return { ...s, score: "", displayValue: "" };
          }

          // Parse and validate the number
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            return { ...s, displayValue: value }; // Keep typing state
          }

          // Clamp between 0-100
          const clampedScore = Math.max(0, Math.min(100, numValue));
          return {
            ...s,
            score: clampedScore,
            displayValue: value, // Keep original input for display
          };
        }
        return s;
      })
    );
  }, []);

  // Handle input focus
  const handleInputFocus = useCallback((questionId) => {
    setFocusedInput(questionId);
  }, []);

  // Handle input blur - finalize the score
  const handleInputBlur = useCallback((questionId) => {
    setFocusedInput(null);
    setEssayScores((prev) =>
      prev.map((s) => {
        if (s.questionId === questionId) {
          const numValue = parseFloat(s.displayValue);
          if (isNaN(numValue) || s.displayValue === "") {
            return { ...s, score: 0, displayValue: "0" };
          }
          const finalScore = Math.max(0, Math.min(100, numValue));
          return {
            ...s,
            score: finalScore,
            displayValue: finalScore.toString(),
          };
        }
        return s;
      })
    );
  }, []);

  // Calculate average essay score
  const averageEssayScore = useMemo(() => {
    const validScores = essayScores
      .map((s) =>
        typeof s.score === "number" ? s.score : parseFloat(s.score) || 0
      )
      .filter((score) => !isNaN(score));

    const total = validScores.reduce((sum, score) => sum + score, 0);
    return validScores.length > 0 ? total / validScores.length : 0;
  }, [essayScores]);

  // Calculate total score
  // Calculate total score
  const totalScore = useMemo(() => {
    if (!submission) return null;

    // Check if MC score exists and is greater than 0
    const hasMCScore =
      submission.mcScore !== null &&
      submission.mcScore !== undefined &&
      submission.mcScore > 0;

    let result;
    if (hasMCScore) {
      // Both MC and Essay exist - average them
      result = (submission.mcScore + averageEssayScore) / 2;
    } else {
      // Only Essay exists - use essay score
      result = averageEssayScore;
    }

    console.log("Frontend calculation:", {
      mcScore: submission.mcScore,
      averageEssayScore,
      hasMCScore,
      result: Math.round(result),
    });

    return Math.round(result);
  }, [submission, averageEssayScore]);

  // Validate grading form
  const isGradingValid = useMemo(() => {
    const scoresValid = essayScores.every((s) => {
      const score =
        typeof s.score === "number" ? s.score : parseFloat(s.score) || 0;
      return score >= 0 && score <= 100;
    });
    return scoresValid && feedback.length >= 10;
  }, [essayScores, feedback]);

  // Submit grading
  const submitGrading = useCallback(async () => {
    if (!submission || !isGradingValid) return;
    setIsGrading(true);
    setGradingError(null);

    try {
      // Ensure all scores are numbers and rounded
      const finalScores = essayScores.map((s) => ({
        questionId: s.questionId,
        score: Math.round(
          typeof s.score === "number" ? s.score : parseFloat(s.score) || 0
        ),
      }));

      await api.post(
        `/v1/exam/grade-essay/${submission.submissionId}`,
        {
          scores: finalScores,
          feedback,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success("Essay graded successfully!");
      navigate("/teachers/penilaian-exam");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to submit grades";
      setGradingError(message);
      toast.error(message);
    } finally {
      setIsGrading(false);
    }
  }, [
    submission,
    essayScores,
    feedback,
    isGradingValid,
    accessToken,
    navigate,
  ]);

  // Fetch submission details on mount
  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (gradingError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-300">{gradingError}</p>
        <button
          onClick={fetchSubmissionDetails}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Submission not found.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Toaster position="top-right" />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Grade Essay Submission
          </h2>
          <button
            onClick={() => navigate("/teachers/exam-submissions")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Submission Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Student
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {submission.student.fullName} ({submission.student.email})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Exam
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {submission.exam.title}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Class
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {submission.kelas.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                MC Score
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {submission.mcScore
                  ? `${Math.round(submission.mcScore)}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Essay Questions */}
        <div className="space-y-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
            Essay Questions
          </h3>
          {submission.essayQuestions.map((answer, index) => {
            const question = submission.essayQuiz.find(
              (q) => q.questionId === answer.questionId
            );
            const scoreData = essayScores.find(
              (s) => s.questionId === answer.questionId
            );
            const isFocused = focusedInput === answer.questionId;

            return (
              <div
                key={answer.questionId}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                    Question {index + 1}
                  </span>
                </div>

                {question?.questionText && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {question.questionText}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Student's Answer:
                  </p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-gray-300 dark:border-gray-500">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {answer.studentAnswer || "No answer provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-fit">
                    Score:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={scoreData?.displayValue || ""}
                      onChange={(e) =>
                        handleScoreChange(answer.questionId, e.target.value)
                      }
                      onFocus={() => handleInputFocus(answer.questionId)}
                      onBlur={() => handleInputBlur(answer.questionId)}
                      className={`w-20 p-2 border rounded-lg text-center font-medium transition-all
                        ${
                          isFocused
                            ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                            : "border-gray-300 dark:border-gray-600"
                        }
                        dark:bg-gray-700 dark:text-gray-200
                        focus:outline-none
                      `}
                      placeholder="0-100"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      %
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (0-100)
                  </span>
                  {scoreData?.score > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        scoreData.score >= 80
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : scoreData.score >= 60
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {scoreData.score >= 80
                        ? "Excellent"
                        : scoreData.score >= 60
                        ? "Good"
                        : "Needs Improvement"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback Section */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-2">
            Overall Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            rows={4}
            placeholder="Provide constructive feedback for the student's performance..."
          />
          <div className="flex justify-between items-center mt-1">
            <p
              className={`text-xs ${
                feedback.length >= 10
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {feedback.length} characters (minimum 10 required)
            </p>
          </div>
        </div>

        {/* Score Summary */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Score Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(averageEssayScore)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Essay Average
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {submission.mcScore
                  ? `${Math.round(submission.mcScore)}%`
                  : "N/A"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Multiple Choice
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalScore ? `${Math.round(totalScore)}%` : "N/A"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Final Score
              </p>
            </div>
          </div>
        </div>

        {gradingError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{gradingError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/teachers/exam-submissions")}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitGrading}
            disabled={isGrading || !isGradingValid}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2 transition-colors ${
              isGrading || !isGradingValid
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <FaSave className="h-4 w-4" />
            {isGrading ? "Submitting..." : "Submit Grades"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamGradingPage;
