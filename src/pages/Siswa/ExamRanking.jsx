import { format } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaArrowLeft,
  FaAward,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCrown,
  FaExclamationTriangle,
  FaGraduationCap,
  FaMedal,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import { FaArrowTrendUp, FaChartLine } from "react-icons/fa6";
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

const formatDuration = (durationMinutes) => {
  if (!durationMinutes || durationMinutes <= 0) return "N/A";

  const totalSeconds = Math.round(durationMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0 || seconds >= 60) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
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
const RankBadge = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full">
        <FaCrown className="w-4 h-4 text-white" />
      </div>
    );
  } else if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full">
        <FaMedal className="w-4 h-4 text-white" />
      </div>
    );
  } else if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full">
        <FaTrophy className="w-4 h-4 text-white" />
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {rank}
        </span>
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

const ExamRanking = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { accessToken } = useAuthStore();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ranking data
  const fetchRankingData = useCallback(async () => {
    if (!examId) {
      setError("Exam ID is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/v1/exam/overall-ranking/${examId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        setData(response.data);
        setError(null);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch ranking data"
        );
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
    fetchRankingData();
  }, [fetchRankingData]);

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
            Exam Rankings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View overall performance rankings for this exam.
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {data.exam.description}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <FaUsers className="w-4 h-4 mr-1" />
                    {data.exam.kelas?.name}
                  </div>
                  <div className="flex items-center">
                    <FaClock className="w-4 h-4 mr-1" />
                    {data.exam.duration} hour
                    {data.exam.duration !== 1 ? "s" : ""}
                  </div>
                  {data.exam.due_date && (
                    <div className="flex items-center">
                      <FaCalendarAlt className="w-4 h-4 mr-1" />
                      Due: {formatDate(data.exam.due_date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => {
    if (!data?.statistics) return null;

    const stats = data.statistics;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Participants"
          value={stats.totalParticipants || 0}
          icon={
            <FaUsers className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          }
          color="text-gray-900 dark:text-white"
        />
        <SummaryCard
          title="Average Score"
          value={stats.averageScore?.toFixed(1) || "0.0"}
          icon={
            <FaChartLine className="h-8 w-8 text-green-600 dark:text-green-400" />
          }
          color="text-gray-900 dark:text-white"
          subtitle="Class Average"
        />
        <SummaryCard
          title="Highest Score"
          value={stats.highestScore || "N/A"}
          icon={
            <FaTrophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          }
          color="text-gray-900 dark:text-white"
          subtitle="Best Performance"
        />
        <SummaryCard
          title="Lowest Score"
          value={stats.lowestScore || "N/A"}
          icon={
            <FaArrowTrendUp className="h-8 w-8 text-red-600 dark:text-red-400" />
          }
          color="text-gray-900 dark:text-white"
          subtitle="Needs Improvement"
        />
      </div>
    );
  };

  const renderUserRanking = () => {
    if (!data?.userRanking) return null;

    const userRank = data.userRanking;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-6 mb-8 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <RankBadge rank={userRank.rank} />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Your Ranking
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {userRank.user?.fullName || "You"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300">Rank</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  #{userRank.rank}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Score
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userRank.totalScore}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Duration
                </p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {formatDuration(userRank.durationTaken)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRankingsTable = () => {
    if (!data?.rankings || data.rankings.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border dark:border-gray-700">
          <div className="text-center py-12">
            <FaAward className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No rankings available
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No students have submitted this exam yet.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Overall Rankings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ranked by total score and completion time
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MC Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.rankings.map((ranking) => (
                <tr
                  key={ranking._id}
                  className={`${
                    ranking.isCurrentUser
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                      : "bg-white dark:bg-gray-800"
                  } hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <RankBadge rank={ranking.rank} />
                      {ranking.rank <= 3 && (
                        <span className="ml-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          Top {ranking.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {ranking.user?.fullName?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ranking.user?.fullName || "Anonymous"}
                          {ranking.isCurrentUser && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`text-lg font-bold ${getScoreColor(
                          ranking.totalScore
                        )}`}
                      >
                        {ranking.totalScore}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                        /100
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {ranking.mcScore || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <FaClock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      {formatDuration(ranking.durationTaken)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <FaCalendarAlt className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      {formatDate(ranking.endTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <FaCheckCircle className="w-3 h-3 mr-1" />
                      {ranking.status === "graded" ? "Graded" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              onClick={fetchRankingData}
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
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-96"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mr-4"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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

          {/* User ranking skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full mr-4"></div>
                <div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                </div>
              </div>
              <div className="flex space-x-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 mb-1"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
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
            {renderStatistics()}
            {renderUserRanking()}
            {renderRankingsTable()}
          </>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default ExamRanking;
