import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaExclamationCircle,
  FaFileAlt,
  FaFileDownload,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaSave,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <FaExclamationCircle className="text-yellow-500 mr-3 text-2xl" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center transition-colors ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            )}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ScoreInput = React.memo(
  ({ questionId, value, onChange, label = "Score:", maxScore = 100 }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const handleFocus = () => {
      setIsFocused(true);
      if (inputValue === "0") {
        setInputValue("");
      }
    };

    const handleChange = (e) => {
      const newValue = e.target.value;
      if (newValue === "" || /^\d+$/.test(newValue)) {
        setInputValue(newValue);
        onChange(questionId, newValue);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (inputValue === "") {
        setInputValue("0");
        onChange(questionId, "0");
        return;
      }

      const numValue = parseInt(inputValue) || 0;
      const clampedValue = Math.min(maxScore, Math.max(0, numValue));
      setInputValue(clampedValue.toString());
      onChange(questionId, clampedValue.toString());
    };

    const isValid =
      inputValue === "" ||
      (!isNaN(parseInt(inputValue)) &&
        parseInt(inputValue) >= 0 &&
        parseInt(inputValue) <= maxScore);

    return (
      <div className="flex items-center">
        <label
          htmlFor={`score-${questionId}`}
          className="mr-4 font-medium text-gray-800 min-w-[60px]"
        >
          {label}
        </label>
        <div className="flex items-center">
          <input
            id={`score-${questionId}`}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-20 p-2 border rounded-lg focus:outline-none focus:ring-2 text-center transition-colors ${
              isValid
                ? "border-gray-300 focus:ring-blue-500"
                : "border-red-500 focus:ring-red-500 bg-red-50"
            }`}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={isFocused ? `0-${maxScore}` : ""}
          />
          <span className="ml-2 text-gray-600">/ {maxScore}</span>
        </div>
        {!isValid && (
          <span className="ml-2 text-sm text-red-500">
            Score must be 0-{maxScore}
          </span>
        )}
      </div>
    );
  }
);

const TugasGradingPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [submission, setSubmission] = useState();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [fileUploadFeedback, setFileUploadFeedback] = useState("");
  const [individualFeedbacks, setIndividualFeedbacks] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const getFileIcon = (url) => {
    const extension = url?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FaFilePdf className="text-red-500 text-2xl mr-2" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-500 text-2xl mr-2" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel className="text-green-500 text-2xl mr-2" />;
      case "ppt":
      case "pptx":
        return <FaFilePowerpoint className="text-orange-500 text-2xl mr-2" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FaFileImage className="text-purple-500 text-2xl mr-2" />;
      default:
        return <FaFileAlt className="text-gray-500 text-2xl mr-2" />;
    }
  };

  const fetchSubmission = useCallback(async () => {
    try {
      const response = await api.get(`/v1/tugas/submission/${submissionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = response.data;
      setSubmission(data);

      // Initialize scores and feedbacks
      const initialScores = {};
      const initialFeedbacks = {};

      // Initialize file upload score if exists
      if (data.fileUploadScore !== undefined) {
        initialScores.fileUpload = data.fileUploadScore.toString();
      } else if (data.submissionType === "file") {
        initialScores.fileUpload = "0";
      }

      // Initialize essay scores and feedbacks
      data.essayQuiz?.forEach((question) => {
        const answer = data.essayAnswers?.find(
          (ans) => ans.questionId === question.questionId
        );

        initialScores[question.questionId] = answer?.score?.toString() || "0";
        initialFeedbacks[question.questionId] = answer?.feedback || "";
      });

      setScores(initialScores);
      setIndividualFeedbacks(initialFeedbacks);
      setOverallFeedback(data.feedback || "");
      setFileUploadFeedback(data.feedback || ""); // Initialize with same as overall or separate if available
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to load submission");
      if (err.response?.status === 401) {
        toast.error("Your session has expired, please login again.");
        useAuthStore.getState().clearAuth();
        navigate("/sign-in");
      }
    } finally {
      setLoading(false);
    }
  }, [submissionId, accessToken, navigate]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleScoreChange = useCallback((questionId, value) => {
    setScores((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // After (correct)
  const handleIndividualFeedbackChange = useCallback((questionId, value) => {
    setIndividualFeedbacks((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const calculateAverageScore = (scores) => {
    const numericScores = Object.values(scores)
      .map((score) => parseInt(score))
      .filter((score) => !isNaN(score));

    if (numericScores.length === 0) return 0;

    const sum = numericScores.reduce((total, score) => total + score, 0);
    return Math.round(sum / numericScores.length);
  };

  const validateScores = () => {
    // Validate all scores are between 0-100
    const allScoresValid = Object.values(scores).every((score) => {
      const numScore = parseInt(score);
      return !isNaN(numScore) && numScore >= 0 && numScore <= 100;
    });

    if (!allScoresValid) {
      toast.error("All scores must be between 0-100");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateScores() || !submission) return;

    setSubmitting(true);
    try {
      const payload = {
        feedback: overallFeedback.trim(),
      };

      // Add file upload score and feedback if this is a file submission
      if (submission.submissionType === "file") {
        payload.fileUploadScore = parseInt(scores.fileUpload);
        payload.fileUploadFeedback = fileUploadFeedback.trim();
      }

      // Add essay scores if there are essay questions
      if (submission.essayQuiz?.length > 0) {
        payload.scores = submission.essayQuiz.map((question) => ({
          questionId: question.questionId,
          score: parseInt(scores[question.questionId]) || 0,
          feedback: individualFeedbacks[question.questionId] || "",
        }));
      }

      // Calculate and include overall score
      const averageScore = calculateAverageScore(scores);
      payload.score = averageScore;

      // The actual submission - we don't need to store the response
      await api.post(`/v1/tugas/grade/${submissionId}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      toast.success("Grading submitted successfully!");
      navigate("/teachers/penilaian-tugas");
    } catch (err) {
      console.error("Grading error:", err);
      toast.error(err.response?.data?.error || "Failed to submit grading");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">Submission not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasEssayQuestions = submission.essayQuiz?.length > 0;
  const isFileUpload = submission.submissionType === "file";
  const averageScore = calculateAverageScore(scores);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Grade Submission</h1>
      </div>

      {/* Student Info Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start mb-6">
          <div className="mr-4 mb-4 sm:mb-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              {submission.student?.avatar ? (
                <img
                  src={submission.student.avatar}
                  alt={submission.student.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-xl font-semibold text-gray-600">
                  {submission.student?.name?.charAt(0) || "S"}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {submission.student?.name || "Name not available"}
            </h2>
            <p className="text-gray-600">
              {submission.student?.email || "Email not available"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Class:{" "}
              {submission.assignment?.class?.name || "Class not available"}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-sm text-gray-500">Submission Status</div>
            <div
              className={`text-sm font-medium ${
                new Date(submission.submissionDate) <=
                new Date(submission.assignment?.dueDate)
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {new Date(submission.submissionDate) <=
              new Date(submission.assignment?.dueDate)
                ? "On Time"
                : "Late"}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            {submission.assignment?.title || "Assignment title not available"}
          </h3>
          <p className="text-gray-700 mb-4">
            {submission.assignment?.description || "No description available"}
          </p>
          <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Due Date:</span>{" "}
              {submission.assignment?.dueDate
                ? new Date(submission.assignment.dueDate).toLocaleDateString(
                    "en-US",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "Not available"}
            </div>
            <div>
              <span className="font-medium">Submitted:</span>{" "}
              {submission.submissionDate
                ? new Date(submission.submissionDate).toLocaleDateString(
                    "en-US",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "Not available"}
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      {isFileUpload && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            File Upload Grading
          </h2>

          {submission.fileUrl ? (
            <>
              <div className="mb-4">
                <h3 className="font-medium mb-2 text-gray-800">
                  Submitted File:
                </h3>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                  {getFileIcon(submission.fileUrl)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 break-all">
                      {submission.fileUrl.split("/").pop()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted:{" "}
                      {new Date(submission.submissionDate).toLocaleString(
                        "en-US"
                      )}
                    </p>
                  </div>
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 flex items-center"
                  >
                    <FaFileDownload className="mr-1" />
                    Open
                  </a>
                </div>
              </div>

              <div className="mb-6">
                <ScoreInput
                  questionId="fileUpload"
                  value={scores.fileUpload || "0"}
                  onChange={handleScoreChange}
                  label="File Upload Score:"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="fileUploadFeedback"
                  className="block font-medium mb-2 text-gray-800"
                >
                  File Upload Feedback:
                </label>
                <textarea
                  id="fileUploadFeedback"
                  value={fileUploadFeedback}
                  onChange={(e) => setFileUploadFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide specific feedback for the file upload..."
                />
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">
                No File Submitted
              </h3>
              <p className="text-yellow-600">
                The student hasn't submitted a file for this assignment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Essay Questions Section */}
      {hasEssayQuestions && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Essay Questions Grading ({submission.essayQuiz.length} questions)
          </h2>

          {submission.essayQuiz.map((question, index) => {
            const answer = submission.essayAnswers?.find(
              (a) => a.questionId === question.questionId
            );

            return (
              <div
                key={question.questionId}
                className="mb-8 pb-6 border-b last:border-b-0 border-gray-200"
              >
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-gray-800 text-lg">
                    Question {index + 1}:
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{question.questionText}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-gray-800">
                    Student Answer:
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border min-h-[100px]">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {answer?.studentAnswer || "No answer provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  <ScoreInput
                    questionId={question.questionId}
                    value={scores[question.questionId] || "0"}
                    onChange={handleScoreChange}
                    maxScore={question.maxScore || 100}
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`individual-feedback-${question.questionId}`}
                    className="block font-medium mb-2 text-gray-800"
                  >
                    Question-specific Feedback:
                  </label>
                  <textarea
                    id={`individual-feedback-${question.questionId}`}
                    value={individualFeedbacks[question.questionId] || ""}
                    onChange={(e) =>
                      handleIndividualFeedbackChange(
                        question.questionId,
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide specific feedback for this answer..."
                  />
                </div>
              </div>
            );
          })}

          {hasEssayQuestions && (
            <div className="mt-6">
              <div className="flex items-center mb-2">
                <label className="font-medium mr-4 text-gray-800">
                  Average Essay Score:
                </label>
                <div
                  className={`text-2xl font-bold ${
                    averageScore >= 75
                      ? "text-green-600"
                      : averageScore >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {averageScore}
                </div>
                <span className="ml-2 text-gray-600">/ 100</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* General Feedback Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Overall Feedback
        </h2>
        <textarea
          value={overallFeedback}
          onChange={(e) => setOverallFeedback(e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Provide general feedback for this submission..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={submitting}
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center ${
            submitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              Submit Grading
            </>
          )}
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Grading"
        message="Are you sure you want to submit this grading? Once submitted, the grades cannot be changed."
        onConfirm={handleSubmit}
        onCancel={() => setIsConfirmModalOpen(false)}
        isSubmitting={submitting}
      />
    </div>
  );
};

export default TugasGradingPage;
