import { format } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaArrowLeft,
  FaAward,
  FaCalendarAlt,
  FaCheckCircle,
  FaCrown,
  FaExclamationTriangle,
  FaFileUpload,
  FaGraduationCap,
  FaMedal,
  FaPercentage,
  FaTrophy,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { FaChartLine, FaRankingStar } from "react-icons/fa6";
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
    } else if (typeof date === "string") {
      dateObj = new Date(date);
    } else {
      return "N/A";
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
// Improved SummaryCard Component that properly handles 0 values
const SummaryCard = ({ title, value, icon, color, subtitle, bgColor }) => {
  // Ensure we properly display 0 values
  const displayValue =
    value === null || value === undefined ? "N/A" : String(value);

  return (
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
          <p className={`text-2xl font-semibold ${color}`}>{displayValue}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

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

const MyRankTugas = () => {
  const navigate = useNavigate();
  const { tugasId } = useParams();
  const { accessToken } = useAuthStore();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch my rank data
  const fetchMyRankData = useCallback(async () => {
    if (!tugasId) {
      setError("Tugas ID is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/v1/tugas/my-rank/${tugasId}`, {
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
        "Failed to load ranking data";
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
    fetchMyRankData();
  }, [fetchMyRankData]);

  // Render functions
  const renderHeader = () => (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Ranking
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your personal performance ranking for this assignment.
          </p>
        </div>
      </div>

      {data?.tugas && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <FaGraduationCap className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data.tugas.title}
                </h2>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <FaUser className="w-4 h-4 mr-1" />
                    {data.user?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRankingOverview = () => {
    if (!data?.ranking) return null;

    const { position, totalSubmissions, isHighest, isLowest } = data.ranking;

    if (isHighest) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaCrown className="text-yellow-500 dark:text-yellow-400 mr-2" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              Congratulations! You're ranked #1 out of {totalSubmissions}{" "}
              students.
            </span>
          </div>
        </div>
      );
    }

    if (isLowest) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaChartLine className="text-blue-500 dark:text-blue-400 mr-2" />
            <span className="font-medium text-blue-800 dark:text-blue-200">
              You're ranked #{position} out of {totalSubmissions} students.
              There are no students below you.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FaRankingStar className="text-green-500 dark:text-green-400 mr-2" />
          <span className="font-medium text-green-800 dark:text-green-200">
            You're ranked #{position} out of {totalSubmissions} students.
          </span>
        </div>
      </div>
    );
  };

  // Fixed renderScoreBreakdown function
  const renderScoreBreakdown = () => {
    if (!data?.scores) return null;

    const { total, multipleChoice, shortQuiz, essay, manual } = data.scores;
    const { hasMultipleChoice, hasShortQuiz, hasEssayQuiz } =
      data.tugas.components;

    // Debug logging
    console.log("Scores object:", data.scores);
    console.log("Components:", data.tugas.components);
    console.log("Multiple Choice Score:", multipleChoice);
    console.log("Type of multipleChoice:", typeof multipleChoice);

    // Create an array to hold the cards we want to show
    const scoreCards = [];

    // Always show total score first
    scoreCards.push(
      <SummaryCard
        key="total"
        title="Total Score"
        value={total}
        icon={
          <FaChartLine className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        }
        color={getScoreColor(total)}
        subtitle="Out of 100"
        bgColor="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800"
      />
    );

    // Add component-specific score cards based on what's available
    if (hasMultipleChoice) {
      scoreCards.push(
        <SummaryCard
          key="multipleChoice"
          title="Multiple Choice"
          value={multipleChoice}
          icon={
            <FaAward className="h-8 w-8 text-green-600 dark:text-green-400" />
          }
          color={getScoreColor(multipleChoice)}
          subtitle="MC Questions"
        />
      );
    }

    if (hasShortQuiz) {
      scoreCards.push(
        <SummaryCard
          key="shortQuiz"
          title="Short Quiz"
          value={shortQuiz}
          icon={
            <FaAward className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          }
          color={getScoreColor(shortQuiz)}
          subtitle="Short Quiz Questions"
        />
      );
    }

    if (hasEssayQuiz) {
      scoreCards.push(
        <SummaryCard
          key="essay"
          title="Essay"
          value={essay}
          icon={
            <FaAward className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          }
          color={getScoreColor(essay)}
          subtitle="Essay Questions"
        />
      );
    }

    // Add manual score if it exists (not null)
    if (manual !== null) {
      scoreCards.push(
        <SummaryCard
          key="manual"
          title="Manual Score"
          value={manual}
          icon={
            <FaAward className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          }
          color={getScoreColor(manual)}
          subtitle="Teacher Assigned"
        />
      );
    }

    // Determine grid layout based on number of cards
    const gridCols =
      scoreCards.length <= 2
        ? "grid-cols-1 md:grid-cols-2"
        : scoreCards.length === 3
        ? "grid-cols-1 md:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

    return <div className={`grid ${gridCols} gap-6 mb-8`}>{scoreCards}</div>;
  };

  const renderSubmissionDetails = () => {
    if (!data?.submissionDetails) return null;

    const { status, submissionTime, gradedAt, hasFileUpload, fileUploadUrl } =
      data.submissionDetails;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Submission Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`p-3 rounded-full ${
                  status === "graded"
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-yellow-100 dark:bg-yellow-900"
                }`}
              >
                <FaCheckCircle
                  className={`h-6 w-6 ${
                    status === "graded"
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Status
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {status}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <FaCalendarAlt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Submitted At
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(submissionTime)}
              </p>
            </div>
          </div>
          {gradedAt && (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                  <FaCalendarAlt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Graded At
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(gradedAt)}
                </p>
              </div>
            </div>
          )}
          {hasFileUpload && (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
                  <FaFileUpload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  File Upload
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {fileUploadUrl ? (
                    <a
                      href={fileUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Uploaded File
                    </a>
                  ) : (
                    "Uploaded"
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEssayDetails = () => {
    if (!data?.essayDetails || data.essayDetails.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Essay Details
        </h3>
        <div className="space-y-4">
          {data.essayDetails.map((essay, index) => (
            <div
              key={essay.questionId}
              className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Question {index + 1}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {essay.hasScore ? (
                      <>
                        Score:{" "}
                        <span className={getScoreColor(essay.score)}>
                          {essay.score}
                        </span>
                      </>
                    ) : (
                      "Not Graded"
                    )}
                  </p>
                </div>
                {essay.feedback && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Feedback: {essay.feedback}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Updated renderPerformanceInsights function with proper ranking logic and percentile color
  const renderPerformanceInsights = () => {
    if (!data?.ranking) return null;

    const { position, totalSubmissions, percentile } = data.ranking;

    // Calculate students below you (those with worse ranks)
    const studentsBelow = totalSubmissions - position;

    // Calculate students ahead of you (those with better ranks)
    const studentsAhead = position - 1;

    // Helper function to get rank description
    const getRankDescription = () => {
      if (position === 1 && totalSubmissions === 1) {
        return "You are the only participant";
      } else if (position === 1) {
        return "You are in 1st place!";
      } else if (position === totalSubmissions) {
        return "You are in the lowest position";
      } else {
        return `You are ranked ${position} out of ${totalSubmissions}`;
      }
    };

    // Helper function to get percentile description
    const getPercentileDescription = () => {
      if (percentile === 100) {
        return "You scored better than everyone else";
      } else if (percentile === 0) {
        return "You are in the lowest scoring group";
      } else if (percentile >= 90) {
        return "Excellent performance!";
      } else if (percentile >= 70) {
        return "Good performance";
      } else if (percentile >= 50) {
        return "Average performance";
      } else {
        return "Below average performance";
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Performance Insights
        </h3>

        {/* Ranking Summary */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Summary
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {getRankDescription()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getPercentileDescription()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Students Ahead */}
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <FaRankingStar className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {studentsAhead}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {studentsAhead === 1 ? "Student ahead" : "Students ahead"}
            </p>
            {studentsAhead === 0 && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                You're at the top! 🏆
              </p>
            )}
          </div>

          {/* Students Behind */}
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <FaUsers className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {studentsBelow}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {studentsBelow === 1 ? "Student behind" : "Students behind"}
            </p>
            {studentsBelow === 0 && totalSubmissions > 1 && (
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                Room for improvement 💪
              </p>
            )}
          </div>

          {/* Percentile - Now using the getPercentileColor function */}
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <FaPercentage className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p
              className={`text-2xl font-bold ${getPercentileColor(percentile)}`}
            >
              {percentile}%
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Percentile rank
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              {percentile === 0
                ? "You scored at or below the lowest scores"
                : `You scored better than ${percentile}% of participants`}
            </p>
          </div>
        </div>

        {/* Additional Insights */}
        {totalSubmissions > 1 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Quick Stats
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  Your Rank
                </p>
                <p className="text-blue-800 dark:text-blue-200">#{position}</p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  Total Participants
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  {totalSubmissions}
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  Percentile
                </p>
                <p className={`font-bold ${getPercentileColor(percentile)}`}>
                  {percentile}th
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  Your Score
                </p>
                <p className={`font-bold ${getScoreColor(data.scores?.total)}`}>
                  {data.scores?.total || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderError = () => (
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-red-400 dark:text-red-300" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading ranking data
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchMyRankData}
              className="bg-red-100 dark:bg-red-800 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mr-4"></div>
              <div>
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-80"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mr-4"></div>
                <div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking overview skeleton */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-80"></div>
            </div>
          </div>

          {/* Score cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submission details skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700 mb-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance insights skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  if (isLoading) {
    return renderLoadingState();
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderError()}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No ranking data available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderHeader()}
        {renderRankingOverview()}
        {renderScoreBreakdown()}
        {renderSubmissionDetails()}
        {renderEssayDetails()}
        {renderPerformanceInsights()}
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default MyRankTugas;
