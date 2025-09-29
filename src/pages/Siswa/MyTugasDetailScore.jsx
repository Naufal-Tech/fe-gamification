import { format } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCrown,
  FaExclamationTriangle,
  FaFileAlt,
  FaMedal,
  FaPaperclip,
  FaQuestionCircle,
  FaTimes,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { FaChartLine } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// Utility functions
const formatDate = (date) => {
  if (!date) return "N/A";

  try {
    let dateObj;
    if (typeof date === "number") {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }

    return format(dateObj, "dd/MM/yyyy, HH:mm");
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return "N/A";
  }
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, subtitle, bgColor }) => (
  <div
    className={`${
      bgColor || "bg-white dark:bg-gray-800"
    } p-6 rounded-lg shadow border dark:border-gray-700`}
  >
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
);

// Rank Badge Component
const RankBadge = ({ rank, size = "large" }) => {
  const sizeClasses = size === "large" ? "w-16 h-16" : "w-8 h-8";
  const iconSize = size === "large" ? "w-8 h-8" : "w-4 h-4";
  const textSize = size === "large" ? "text-lg" : "text-sm";

  if (rank === 1) {
    return (
      <div
        className={`flex items-center justify-center ${sizeClasses} bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg`}
      >
        <FaCrown className={`${iconSize} text-white`} />
      </div>
    );
  } else if (rank === 2) {
    return (
      <div
        className={`flex items-center justify-center ${sizeClasses} bg-gradient-to-r from-gray-300 to-gray-500 rounded-full shadow-lg`}
      >
        <FaMedal className={`${iconSize} text-white`} />
      </div>
    );
  } else if (rank === 3) {
    return (
      <div
        className={`flex items-center justify-center ${sizeClasses} bg-gradient-to-r from-amber-600 to-amber-800 rounded-full shadow-lg`}
      >
        <FaTrophy className={`${iconSize} text-white`} />
      </div>
    );
  } else {
    return (
      <div
        className={`flex items-center justify-center ${sizeClasses} bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg`}
      >
        <span className={`${textSize} font-bold text-white`}>{rank}</span>
      </div>
    );
  }
};

// Score Color Helper
const getScoreColor = (score) => {
  if (score == null) return "text-gray-500 dark:text-gray-400";
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

// Percentile Color Helper
const getPercentileColor = (percentile) => {
  if (percentile == null) return "text-gray-500 dark:text-gray-400";
  if (percentile >= 90) return "text-green-600 dark:text-green-400";
  if (percentile >= 70) return "text-blue-600 dark:text-blue-400";
  if (percentile >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

// Multiple Choice Question Component
const MultipleChoiceQuestion = ({ question, index }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold mr-3 ${
              question.userAnswer.isCorrect ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {question.userAnswer.isCorrect ? (
              <FaCheckCircle className="w-4 h-4" />
            ) : (
              <FaTimes className="w-4 h-4" />
            )}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Question {index + 1}
          </h4>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            question.userAnswer.isCorrect
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {question.score} / 1 point
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-900 dark:text-white text-base leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-3">
        {question.options.map((option, optionIndex) => {
          const isSelected = option.isSelected;
          const isCorrect = option.isCorrect;

          let optionClass =
            "border-2 rounded-lg p-4 transition-all duration-200 ";
          let iconClass = "";
          let icon = null;

          if (isSelected && isCorrect) {
            optionClass += "border-green-500 bg-green-50 dark:bg-green-900/20";
            iconClass = "text-green-600 dark:text-green-400";
            icon = <FaCheckCircle className="w-25 h-25" />;
          } else if (isSelected && !isCorrect) {
            optionClass += "border-red-500 bg-red-50 dark:bg-red-900/20";
            iconClass = "text-red-600 dark:text-red-400";
            icon = <FaTimes className="w-25 h-25" />;
          } else if (!isSelected && isCorrect) {
            optionClass +=
              "border-green Blaine300 bg-green-25 dark:bg-green-900/10";
            iconClass = "text-green-600 dark:text-green-400";
            icon = <FaCheckCircle className="w-25 h-25" />;
          } else {
            optionClass +=
              "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700";
            iconClass = "text-gray-400 dark:text-gray-500";
          }

          return (
            <div key={option.id} className={optionClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {option.text}
                  </span>
                </div>
                <div className={`flex items-center ${iconClass}`}>
                  {icon}
                  {isSelected && (
                    <span className="ml-2 text-sm font-medium">
                      Your Answer
                    </span>
                  )}
                  {!isSelected && isCorrect && (
                    <span className="ml-2 text-sm font-medium">
                      Correct Answer
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!question.userAnswer.isCorrect && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start">
            <FaQuestionCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Correct Answer
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                The correct answer was:{" "}
                <strong>{question.correctAnswer.text}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Short Answer Question Component
const ShortAnswerQuestion = ({ question, index }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold mr-3 ${
              question.isCorrect ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {question.isCorrect ? (
              <FaCheckCircle className="w-4 h-4" />
            ) : (
              <FaTimes className="w-4 h-4" />
            )}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Short Answer Question {index + 1}
          </h4>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            question.isCorrect
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {question.score} / {question.maxScore} point
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-900 dark:text-white text-base leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Answer
          </h5>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border dark:border-gray-600">
            {question.userAnswer ? (
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {question.userAnswer}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No answer provided
              </p>
            )}
          </div>
        </div>

        {question.correctAnswer && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
            <div className="flex items-start">
              <FaQuestionCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Correct Answer
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 whitespace-pre-wrap">
                  {question.correctAnswer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Essay Question Component
const EssayQuestion = ({ question, index }) => {
  const scorePercentage =
    question.maxScore > 0 ? (question.score / question.maxScore) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold mr-3 ${
              scorePercentage >= 80
                ? "bg-green-500"
                : scorePercentage >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          >
            <FaFileAlt className="w-4 h-4" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Essay Question {index + 1}
          </h4>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            scorePercentage >= 80
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : scorePercentage >= 60
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {question.score} / {question.maxScore} points
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-900 dark:text-white text-base leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Answer
          </h5>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border dark:border-gray-600">
            {question.userAnswer ? (
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {question.userAnswer}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No answer provided
              </p>
            )}
          </div>
        </div>

        {question.feedback && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
            <div className="flex items-start">
              <FaUser className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Teacher's Feedback
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                  {question.feedback}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MyTugasDetailScore = () => {
  const navigate = useNavigate();
  const { tugasId } = useParams();
  const { accessToken } = useAuthStore();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch detail score data
  const fetchDetailScoreData = useCallback(async () => {
    if (!tugasId) {
      setError("Tugas ID is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/v1/tugas/detail-score/${tugasId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data) {
        setData(response.data);
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
        "Failed to load tugas details";
      setError(message);
      toast.error(message);

      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        navigate("/sign-in");
      }
    } finally {
      setIsLoading(false);
    }
  }, [tugasId, accessToken, navigate]);

  useEffect(() => {
    fetchDetailScoreData();
  }, [fetchDetailScoreData]);

  // Render header
  const renderHeader = () => (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="mr-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Detailed Score Review
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Review your answers and see detailed feedback for this assignment.
          </p>
        </div>
      </div>

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
                    {data.student?.name}
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="w-4 h-4 mr-1" />
                    Due: {formatDate(data.tugas.dueDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render score overview
  const renderScoreOverview = () => {
    // Safely destructure scores and ranking
    const scores = data?.scores || {};
    const {
      total = { score: 0, maxScore: 0, percentage: 0 },
      multipleChoice = {
        score: 0,
        maxScore: 0,
        questionsCorrect: 0,
        totalQuestions: 0,
        percentage: 0,
      },
      shortAnswer = {
        score: 0,
        maxScore: 0,
        questionsCorrect: 0,
        totalQuestions: 0,
        percentage: 0,
      },
      essay = { score: 0, maxScore: 0, totalQuestions: 0, percentage: 0 },
    } = scores;
    const ranking = data?.ranking || {
      position: 1,
      percentile: 0,
      totalSubmissions: 1,
    };

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-8 mb-8 border border-blue-200 dark:border-blue-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-6">
          <div className="flex items-center">
            <RankBadge rank={ranking.position} size="large" />
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Rank #{ranking.position}
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                You scored better than {ranking.percentile}% of students
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                {ranking.totalSubmissions} total submissions
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {total.percentage}%
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {total.score} / {total.maxScore} points
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Overall Score"
            value={`${total.score}/${total.maxScore}`}
            icon={<FaTrophy className="w-6 h-6 text-yellow-500" />}
            color={getScoreColor(total.percentage)}
            subtitle={`${total.percentage}% correct`}
            bgColor="bg-white/80 dark:bg-gray-800/80"
          />

          {multipleChoice.totalQuestions > 0 && (
            <SummaryCard
              title="Multiple Choice"
              value={`${multipleChoice.questionsCorrect}/${multipleChoice.totalQuestions}`}
              icon={<FaCheckCircle className="w-6 h-6 text-green-500" />}
              color={getScoreColor(multipleChoice.percentage)}
              subtitle={`${multipleChoice.percentage}% accuracy`}
              bgColor="bg-white/80 dark:bg-gray-800/80"
            />
          )}

          {shortAnswer.totalQuestions > 0 && (
            <SummaryCard
              title="Short Answer"
              value={`${shortAnswer.questionsCorrect}/${shortAnswer.totalQuestions}`}
              icon={<FaFileAlt className="w-6 h-6 text-blue-500" />}
              color={getScoreColor(shortAnswer.percentage)}
              subtitle={`${shortAnswer.percentage}% accuracy`}
              bgColor="bg-white/80 dark:bg-gray-800/80"
            />
          )}

          {essay.totalQuestions > 0 && (
            <SummaryCard
              title="Essay Questions"
              value={`${essay.score}/${essay.maxScore}`}
              icon={<FaFileAlt className="w-6 h-6 text-purple-500" />}
              color={getScoreColor(essay.percentage)}
              subtitle={`${essay.totalQuestions} questions`}
              bgColor="bg-white/80 dark:bg-gray-800/80"
            />
          )}

          {data?.fileUpload?.required && (
            <SummaryCard
              title="File Submission"
              value={data.fileUpload.submitted ? "Submitted" : "Not Submitted"}
              icon={<FaPaperclip className="w-6 h-6 text-gray-500" />}
              color={
                data.fileUpload.submitted
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
              subtitle={
                data.fileUpload.submitted ? "File received" : "File required"
              }
              bgColor="bg-white/80 dark:bg-gray-800/80"
            />
          )}

          <SummaryCard
            title="Percentile Rank"
            value={`${ranking.percentile}th`}
            icon={<FaChartLine className="w-6 h-6 text-blue-500" />}
            color={getPercentileColor(ranking.percentile)}
            subtitle="Better than others"
            bgColor="bg-white/80 dark:bg-gray-800/80"
          />
        </div>

        {data?.grading?.generalFeedback && (
          <div className="mt-6 bg-white/80 dark:bg-gray-800/80 rounded-md p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start">
              <FaUser className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  General Feedback
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                  {data.grading.generalFeedback}
                </p>
              </div>
            </div>
          </div>
        )}

        {data?.grading?.gradedBy && (
          <div className="mt-4 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
            <div className="flex items-center">
              <FaUser className="w-3 h-3 mr-1" />
              Graded by: {data.grading.gradedBy.name}
            </div>
            {data.grading.gradedAt && (
              <div className="flex items-center">
                <FaCalendarAlt className="w-3 h-3 mr-1" />
                {formatDate(data.grading.gradedAt)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render submission details
  const renderSubmissionDetails = () => {
    if (!data?.submission || !data?.tugas) return null;

    const { submission, tugas } = data;
    const isLate = submission.submittedAt > tugas.dueDate;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaClock className="w-5 h-5 text-blue-500 mr-2" />
          Submission Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status
            </p>
            <div className="flex items-center mt-1">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  submission.status === "graded"
                    ? "bg-green-500"
                    : submission.status === "submitted"
                    ? "bg-blue-500"
                    : "bg-yellow-500"
                }`}
              />
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {submission.status}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Submitted At
            </p>
            <p className="text-sm text-gray-900 dark:text-white mt-1">
              {formatDate(submission.submittedAt)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Due Date
            </p>
            <p className="text-sm text-gray-900 dark:text-white mt-1">
              {formatDate(tugas.dueDate)}
            </p>
          </div>
        </div>

        {(isLate || data?.fileUpload) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {isLate && (
              <div className="flex items-center mb-4">
                <FaExclamationTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  Late Submission
                </p>
              </div>
            )}

            {data.fileUpload && (
              <div className="flex items-start">
                <FaPaperclip className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    File Submission
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {data.fileUpload.submitted
                      ? `File submitted: ${
                          data.fileUpload.fileName || "Unnamed file"
                        }`
                      : "No file submitted"}
                  </p>
                  {data.fileUpload.instructions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Instructions: {data.fileUpload.instructions}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render question review
  const renderQuestionReview = () => {
    if (
      !data?.multipleChoiceQuestions &&
      !data?.shortAnswerQuestions &&
      !data?.essayQuestions
    )
      return null;

    const accuracy =
      data?.statistics?.multipleChoiceAccuracy ||
      data?.statistics?.shortAnswerAccuracy ||
      0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Question Review
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <FaCheckCircle className="w-4 h-4 text-green-500 mr-1" />
              Accuracy: {accuracy || 0}%
            </div>
            <div className="flex items-center">
              <FaQuestionCircle className="w-4 h-4 text-blue-500 mr-1" />
              Total: {data?.statistics?.totalQuestions || 0}
            </div>
          </div>
        </div>

        {data?.multipleChoiceQuestions &&
          data.multipleChoiceQuestions.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FaCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Multiple Choice Questions ({data.multipleChoiceQuestions.length}
                )
              </h4>
              {data.multipleChoiceQuestions.map((question, index) => (
                <MultipleChoiceQuestion
                  key={question.questionId}
                  question={question}
                  index={index}
                />
              ))}
            </div>
          )}

        {data?.shortAnswerQuestions && data.shortAnswerQuestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FaFileAlt className="w-5 h-5 text-blue-500 mr-2" />
              Short Answer Questions ({data.shortAnswerQuestions.length})
            </h4>
            {data.shortAnswerQuestions.map((question, index) => (
              <ShortAnswerQuestion
                key={question.questionId}
                question={question}
                index={index}
              />
            ))}
          </div>
        )}

        {data?.essayQuestions && data.essayQuestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FaFileAlt className="w-5 h-5 text-purple-500 mr-2" />
              Essay Questions ({data.essayQuestions.length})
            </h4>
            {data.essayQuestions.map((question, index) => (
              <EssayQuestion
                key={question.questionId}
                question={question}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Loading and Error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaClock className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading tugas details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDetailScoreData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Toaster position="top-right" />

        {renderHeader()}
        {renderScoreOverview()}
        {renderSubmissionDetails()}
        {renderQuestionReview()}
      </div>
    </div>
  );
};

export default MyTugasDetailScore;
