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
  FaFileAlt,
  FaMedal,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
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
const SummaryCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  </div>
);

// Rank Badge Component
const RankBadge = ({ rank }) => {
  const sizeClasses = "w-8 h-8";
  const iconSize = "w-4 h-4";
  const textSize = "text-sm";

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

const TugasRankings = () => {
  const navigate = useNavigate();
  const { tugasId } = useParams();
  const { accessToken } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Fetch rankings data
  const fetchRankings = useCallback(async () => {
    if (!tugasId) {
      setError("Tugas ID is required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/v1/tugas/rankings/${tugasId}`, {
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
        "Failed to load rankings data";
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
    fetchRankings();
  }, [fetchRankings]);

  // Render header
  const renderHeader = () => (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tugas Rankings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Overall leaderboard for this assignment.
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {data.tugas.description}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <FaUsers className="w-4 h-4 mr-1" />
                    {data.tugas.kelas?.name}
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="w-4 h-4 mr-1" />
                    Due: {formatDate(data.tugas.due_date)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render summary statistics
  const renderStatistics = () => {
    // Safely destructure statistics with fallback
    const statistics = data?.statistics || {};
    const {
      totalParticipants = 0,
      averageScore = 0,
      highestScore = 0,
      lateSubmissions = 0,
    } = statistics;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Participants"
          value={totalParticipants}
          icon={
            <FaUsers className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          }
          color="text-gray-900 dark:text-white"
        />
        <SummaryCard
          title="Average Score"
          value={averageScore.toFixed(1)}
          icon={
            <FaAward className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          }
          color="text-gray-900 dark:text-white"
        />
        <SummaryCard
          title="Highest Score"
          value={highestScore}
          icon={
            <FaTrophy className="h-8 w-8 text-green-600 dark:text-green-400" />
          }
          color="text-gray-900 dark:text-white"
        />
        <SummaryCard
          title="Late Submissions"
          value={lateSubmissions}
          icon={<FaClock className="h-8 w-8 text-red-600 dark:text-red-400" />}
          color="text-gray-900 dark:text-white"
        />
      </div>
    );
  };

  // Render user ranking highlight
  const renderUserRanking = () => {
    if (!data?.userRanking) return null;

    const {
      rank,
      totalScore,
      user,
      submissionCompleteness,
      submittedAt,
      isLate,
    } = data.userRanking;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-8 mb-8 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <RankBadge rank={rank} />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Your Ranking
              </h3>
              <p className="text-blue-600 dark:text-blue-300">
                {user.fullName} (You)
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              #{rank}
            </p>
            <p className={`text-lg ${getScoreColor(totalScore)}`}>
              Score: {totalScore}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completeness: {submissionCompleteness}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Submitted: {formatDate(submittedAt)}
            </p>
            {isLate && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Late Submission
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render leaderboard
  const renderLeaderboard = () => {
    if (!data?.rankings || data.rankings.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Leaderboard
        </h3>
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
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completeness
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.rankings.map((submission) => (
                <tr
                  key={submission._id}
                  className={`${
                    submission.isCurrentUser
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "bg-white dark:bg-gray-800"
                  } hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <RankBadge rank={submission.rank} />
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        #{submission.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {submission.user.fullName}
                      {submission.isCurrentUser && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${getScoreColor(
                        submission.totalScore
                      )}`}
                    >
                      {submission.totalScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {submission.submissionCompleteness}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <FaCalendarAlt className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                      {formatDate(submission.submittedAt)}
                      {submission.isLate && (
                        <span className="ml-2 text-red-600 dark:text-red-400 text-xs">
                          Late
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.status === "graded"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      <FaCheckCircle className="w-3 h-3 mr-1" />
                      {submission.status.charAt(0).toUpperCase() +
                        submission.status.slice(1)}
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

  // Render error state
  const renderError = () => (
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
      <FaExclamationTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
        Error Loading Rankings
      </h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      <button
        onClick={fetchRankings}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border dark:border-gray-700">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading rankings...</p>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border dark:border-gray-700">
      <FaFileAlt className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No Rankings Available
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        No submissions have been ranked for this assignment yet.
      </p>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderHeader()}

        {error ? (
          renderError()
        ) : isLoading ? (
          renderLoading()
        ) : !data?.rankings || data.rankings.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderStatistics()}
            {renderUserRanking()}
            {renderLeaderboard()}
          </>
        )}
      </div>
    </div>
  );
};

export default TugasRankings;
