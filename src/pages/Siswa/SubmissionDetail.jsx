import { format } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaPaperclip,
  FaQuestionCircle,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// Utility functions
const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "N/A";
    return format(dateObj, "dd/MM/yyyy, HH:mm");
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return "N/A";
  }
};

// Status Badge Component
const StatusBadge = ({ status, isLate }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "graded":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          icon: <FaCheckCircle className="w-4 h-4" />,
        };
      case "submitted":
        return {
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          icon: <FaClock className="w-4 h-4" />,
        };
      case "partially_graded":
        return {
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          icon: <FaEdit className="w-4 h-4" />,
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          icon: <FaQuestionCircle className="w-4 h-4" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.icon}
        <span className="ml-2 capitalize">{status.replace("_", " ")}</span>
      </div>
      {isLate && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FaExclamationTriangle className="w-4 h-4 mr-2" />
          Late Submission
        </div>
      )}
    </div>
  );
};

// Score Display Component
const ScoreDisplay = ({ scores, needsGrading }) => {
  if (needsGrading) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-center">
          <FaClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Awaiting Grading
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This submission is pending teacher review and grading.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Score
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {scores.overall !== null ? scores.overall : scores.total || 0}
            </p>
          </div>
          <FaCheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Multiple Choice
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {scores.multipleChoice || 0}
            </p>
          </div>
          <FaQuestionCircle className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Short Quiz
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {scores.shortQuiz || 0}
            </p>
          </div>
          <FaFileAlt className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Essay Score
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {scores.essay || 0}
            </p>
          </div>
          <FaEdit className="w-8 h-8 text-orange-500" />
        </div>
      </div>
    </div>
  );
};

// Answer Display Component
const AnswerSection = ({ answers, needsGrading }) => {
  if (
    !answers ||
    ((!answers.multipleChoice || answers.multipleChoice.length === 0) &&
      (!answers.shortAnswer || answers.shortAnswer.length === 0) &&
      (!answers.essay || answers.essay.length === 0))
  ) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Student Answers
      </h3>

      {/* Multiple Choice Answers */}
      {answers.multipleChoice && answers.multipleChoice.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <FaQuestionCircle className="w-5 h-5 text-blue-500 mr-2" />
            Multiple Choice Questions ({answers.multipleChoice.length})
          </h4>
          {answers.multipleChoice.map((answer, index) => (
            <div
              key={answer.questionId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold mr-3 ${
                      needsGrading
                        ? "bg-gray-500"
                        : answer.isCorrect
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {needsGrading ? (
                      <FaClock className="w-4 h-4" />
                    ) : answer.isCorrect ? (
                      <FaCheckCircle className="w-4 h-4" />
                    ) : (
                      <FaTimes className="w-4 h-4" />
                    )}
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question {index + 1}
                  </h5>
                </div>
                {!needsGrading && (
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      answer.isCorrect
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {answer.score} point{answer.score !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Selected Answer:
                </p>
                <p className="text-gray-900 dark:text-white">
                  Option {answer.selectedOption}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Short Answer Questions */}
      {answers.shortAnswer && answers.shortAnswer.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <FaFileAlt className="w-5 h-5 text-purple-500 mr-2" />
            Short Answer Questions ({answers.shortAnswer.length})
          </h4>
          {answers.shortAnswer.map((answer, index) => (
            <div
              key={answer.questionId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold mr-3 ${
                      needsGrading
                        ? "bg-gray-500"
                        : answer.isCorrect
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {needsGrading ? (
                      <FaClock className="w-4 h-4" />
                    ) : answer.isCorrect ? (
                      <FaCheckCircle className="w-4 h-4" />
                    ) : (
                      <FaTimes className="w-4 h-4" />
                    )}
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Short Answer {index + 1}
                  </h5>
                </div>
                {!needsGrading && (
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      answer.isCorrect
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {answer.score} point{answer.score !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Student Answer:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border dark:border-gray-600">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {answer.studentAnswer || "No answer provided"}
                    </p>
                  </div>
                </div>
                {!needsGrading && answer.correctAnswer && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Correct Answer:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {answer.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Essay Questions */}
      {answers.essay && answers.essay.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <FaEdit className="w-5 h-5 text-orange-500 mr-2" />
            Essay Questions ({answers.essay.length})
          </h4>
          {answers.essay.map((answer, index) => (
            <div
              key={answer.questionId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold mr-3 ${
                      !answer.isGraded
                        ? "bg-gray-500"
                        : answer.score >= 80
                        ? "bg-green-500"
                        : answer.score >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {!answer.isGraded ? (
                      <FaClock className="w-4 h-4" />
                    ) : (
                      <FaEdit className="w-4 h-4" />
                    )}
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Essay Question {index + 1}
                  </h5>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    !answer.isGraded
                      ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      : answer.score >= 80
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : answer.score >= 60
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {answer.isGraded
                    ? `${answer.score}/${answer.maxScore}`
                    : "Pending"}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Student Answer:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border dark:border-gray-600">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {answer.studentAnswer || "No answer provided"}
                    </p>
                  </div>
                </div>
                {answer.feedback && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
                    <div className="flex items-start">
                      <FaUser className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Teacher's Feedback
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                          {answer.feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// File Submission Component
const FileSubmissionSection = ({ fileSubmission }) => {
  if (!fileSubmission || !fileSubmission.hasFile) {
    return null;
  }

  const handleFileDownload = () => {
    if (fileSubmission.fileUrl) {
      window.open(fileSubmission.fileUrl, "_blank");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FaPaperclip className="w-5 h-5 text-gray-500 mr-2" />
        File Submission
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center">
            <FaFileAlt className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                File Submitted
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click to view or download
              </p>
            </div>
          </div>
          <button
            onClick={handleFileDownload}
            className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaEye className="w-4 h-4 mr-2" />
            View File
          </button>
        </div>

        {fileSubmission.score !== null && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                File Score
              </p>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {fileSubmission.score}
              </span>
            </div>
            {fileSubmission.feedback && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                {fileSubmission.feedback}
              </p>
            )}
            {fileSubmission.gradedAt && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Graded: {fileSubmission.gradedAt}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const SubmissionDetail = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { accessToken, user } = useAuthStore();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch submission detail
  const fetchSubmissionDetail = useCallback(async () => {
    if (!submissionId) {
      setError("Submission ID is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(
        `/v1/tugas/detail/submission/${submissionId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && response.data.success) {
        setData(response.data.data);
        setError(null);
      } else {
        throw new Error("No data received from server");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load submission details";
      setError(message);
      toast.error(message);

      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        navigate("/sign-in");
      }
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, accessToken, navigate]);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [fetchSubmissionDetail]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaClock className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading submission details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchSubmissionDetail}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="mr-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Submission Details
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                View detailed information about this submission.
              </p>
            </div>
          </div>

          {/* Assignment Info */}
          {data?.tugas && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FaFileAlt className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {data.tugas.title}
                    </h2>
                    {data.tugas.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {data.tugas.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <FaUser className="w-4 h-4 mr-1" />
                        {data.student?.fullName}
                      </div>
                      <div className="flex items-center">
                        <FaCalendarAlt className="w-4 h-4 mr-1" />
                        Due: {formatDate(data.tugas.dueDate)}
                      </div>
                      <div className="flex items-center">
                        <FaClock className="w-4 h-4 mr-1" />
                        Submitted: {formatDate(data.submittedAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <StatusBadge status={data.status} isLate={data.isLate} />
              </div>
            </div>
          )}
        </div>

        {/* Summary Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Submission Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Questions
                  </p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Multiple Choice:{" "}
                      {data?.summary?.totalQuestions?.multipleChoice || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Short Answer:{" "}
                      {data?.summary?.totalQuestions?.shortAnswer || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Essay: {data?.summary?.totalQuestions?.essay || 0}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Grading Progress
                  </p>
                  <div className="mt-1">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              data?.summary?.completionPercentage?.overall || 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {data?.summary?.completionPercentage?.overall || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Class & Teacher
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Class
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {data?.class?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Teacher
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {data?.teacher?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {data?.teacher?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scores Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Scores & Grading
          </h3>
          <ScoreDisplay
            scores={data?.scores || {}}
            needsGrading={data?.needsGrading}
          />
        </div>

        {/* Overall Feedback */}
        {/* Overall Feedback */}
        {data?.feedback?.overall && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaUser className="w-5 h-5 text-blue-500 mr-2" />
                Overall Feedback
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                  {data.feedback.overall}
                </p>
                {data.feedback.gradedAt && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                    Feedback given: {formatDate(data.feedback.gradedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Submission Section */}
        <FileSubmissionSection fileSubmission={data?.fileSubmission} />

        {/* Answers Section */}
        <div className="mb-8">
          <AnswerSection
            answers={data?.answers}
            needsGrading={data?.needsGrading}
          />
        </div>

        {/* Additional Information */}
        {data?.additionalInfo && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.additionalInfo.timeSpent && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Time Spent
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {Math.floor(data.additionalInfo.timeSpent / 60)} minutes
                    </p>
                  </div>
                )}
                {data.additionalInfo.attempts && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Attempts
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {data.additionalInfo.attempts}
                    </p>
                  </div>
                )}
                {data.additionalInfo.lastModified && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Last Modified
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(data.additionalInfo.lastModified)}
                    </p>
                  </div>
                )}
                {data.additionalInfo.ipAddress && user?.role === "teacher" && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      IP Address
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {data.additionalInfo.ipAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>

          {user?.role === "teacher" && data?.status === "submitted" && (
            <button
              onClick={() =>
                navigate(`/teacher/submissions/${submissionId}/grade`)
              }
              className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaEdit className="w-4 h-4 mr-2" />
              Grade Submission
            </button>
          )}

          {data?.fileSubmission?.fileUrl && (
            <button
              onClick={() => window.open(data.fileSubmission.fileUrl, "_blank")}
              className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FaDownload className="w-4 h-4 mr-2" />
              Download Files
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <FaFileAlt className="w-4 h-4 mr-2" />
            Print Details
          </button>
        </div>

        {/* Debug Information (only in development) */}
        {import.meta.env?.NODE_ENV && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400">
                Debug Information
              </summary>
              <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
