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

const MyRankExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { accessToken } = useAuthStore();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch my rank data
  const fetchMyRankData = useCallback(async () => {
    if (!examId) {
      setError("Exam ID is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/v1/exam/my-rank/${examId}`, {
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
  }, [examId, accessToken, navigate]);

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
            Your personal performance ranking for this exam.
          </p>
        </div>
      </div>

      {data?.exam && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <FaGraduationCap className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data.exam.title}
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

    const { position, totalSubmissions, percentile } = data.ranking;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-8 mb-8 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <RankBadge rank={position} size="large" />
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Your Position
              </h3>
              <p className="text-blue-600 dark:text-blue-300">
                Out of {totalSubmissions} participants
              </p>
              {position <= 3 && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <FaTrophy className="w-4 h-4 mr-1" />
                    Top {position} Performer
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rank
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    #{position}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Percentile
                  </p>
                  <p
                    className={`text-3xl font-bold ${getPercentileColor(
                      percentile
                    )}`}
                  >
                    {percentile}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScoreBreakdown = () => {
    if (!data?.scores) return null;

    const { total, multipleChoice } = data.scores;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Score"
          value={total}
          icon={
            <FaChartLine className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          }
          color={getScoreColor(total)}
          subtitle="Out of 100"
          bgColor="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800"
        />
        <SummaryCard
          title="Multiple Choice"
          value={multipleChoice}
          icon={
            <FaAward className="h-8 w-8 text-green-600 dark:text-green-400" />
          }
          color={getScoreColor(multipleChoice)}
          subtitle="MC Questions"
        />
        <SummaryCard
          title="Percentile Rank"
          value={`${data.ranking?.percentile || 0}%`}
          icon={
            <FaPercentage className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          }
          color={getPercentileColor(data.ranking?.percentile)}
          subtitle="Better than others"
        />
      </div>
    );
  };

  const renderSubmissionDetails = () => {
    if (!data?.submissionDetails) return null;

    const { status, submissionTime } = data.submissionDetails;

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
        </div>
      </div>
    );
  };

  const renderPerformanceInsights = () => {
    if (!data?.ranking) return null;

    const { position, totalSubmissions, percentile } = data.ranking;
    const betterThan = Math.round((percentile / 100) * totalSubmissions);
    const worseByCount = totalSubmissions - position;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <FaUsers className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {betterThan}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Students below you
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <FaRankingStar className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {worseByCount}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Students ahead of you
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <FaPercentage className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {percentile}%
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Percentile rank
            </p>
          </div>
        </div>
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
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking overview skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full mr-6"></div>
                <div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                <div className="flex space-x-6">
                  <div className="text-center">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score breakdown skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submission details skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 mb-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance insights skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-8 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mx-auto"></div>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderHeader()}

        {error ? (
          renderError()
        ) : (
          <>
            {renderRankingOverview()}
            {renderScoreBreakdown()}
            {renderSubmissionDetails()}
            {renderPerformanceInsights()}
          </>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default MyRankExam;
