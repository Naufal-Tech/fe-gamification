import { format } from "date-fns";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaAward,
  FaBookOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaGraduationCap,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaStar,
  FaTasks,
  FaUsers,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// Utility to format date - handles both timestamp and ISO strings
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

// Utility to format duration
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

// Helper function to calculate percentile
const calculatePercentile = (rank, totalSubmissions) => {
  if (!rank || !totalSubmissions || totalSubmissions === 0) return "N/A";
  const percentile = ((totalSubmissions - rank) / totalSubmissions) * 100;
  return `${Math.round(percentile)}th`;
};

// Helper function to normalize score to percentage
const normalizeToPercentage = (score, maxScore) => {
  if (score == null || maxScore == null || maxScore <= 0) return null;
  return Math.min(100, Math.max(0, (score / maxScore) * 100));
};

// Helper function to calculate normalized total score
const calculateNormalizedScore = (submission) => {
  const mcScore = submission.mcScore || 0;
  const essayScore = submission.essayScore || 0;
  const totalScore = submission.totalScore || 0;

  // Check if we have component information
  const hasMC =
    submission.mcAnswerCount > 0 ||
    submission.componentScores?.multipleChoice?.available;
  const hasEssay =
    submission.essayAnswerCount > 0 ||
    submission.componentScores?.essay?.available;

  // If totalScore is provided and greater than 0, use it directly as percentage
  if (totalScore > 0) {
    return Math.min(100, totalScore);
  }

  // Calculate based on components
  if (hasMC && hasEssay) {
    // Both components exist - average them to get percentage out of 100%
    const mcPercentage = Math.min(100, mcScore);
    const essayPercentage = Math.min(100, essayScore);
    return (mcPercentage + essayPercentage) / 2;
  } else if (hasMC) {
    // Only MC exists - use MC score as percentage
    return Math.min(100, mcScore);
  } else if (hasEssay) {
    // Only essay exists - use essay score as percentage
    return Math.min(100, essayScore);
  }

  // Fallback: return the higher of the component scores as percentage
  const maxComponentScore = Math.max(mcScore, essayScore);
  return Math.min(100, maxComponentScore);
};

// Helper function to calculate average ranking
const calculateAverageRanking = (data) => {
  if (!data.data?.length || !data.rankings) return "Not ranked";

  const validSubmissions = data.data.filter(
    (submission) => data.rankings[submission.exam._id]?.userRanking?.rank
  );

  if (!validSubmissions.length) return "Not ranked";

  const totalRank = validSubmissions.reduce((sum, submission) => {
    const examId = submission.exam._id;
    return sum + (data.rankings[examId]?.userRanking?.rank || 0);
  }, 0);

  return (totalRank / validSubmissions.length).toFixed(1);
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, onClick }) => (
  <div
    className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border dark:border-gray-700 ${
      onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-3 sm:ml-4 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
          {title}
        </p>
        <p className={`text-lg sm:text-2xl font-semibold ${color} truncate`}>{value}</p>
      </div>
    </div>
  </div>
);

// Sort Header Component
const SortHeader = ({ field, currentSort, currentOrder, onSort, children }) => {
  const getSortIcon = () => {
    if (currentSort !== field) {
      return <FaSort className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return currentOrder === "asc" ? (
      <FaSortUp className="w-3 h-3 ml-1 text-blue-600" />
    ) : (
      <FaSortDown className="w-3 h-3 ml-1 text-blue-600" />
    );
  };

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center text-left font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {children}
      {getSortIcon()}
    </button>
  );
};

const MyExamSubmission = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const status = searchParams.get("status") || "graded";
  const sortBy = searchParams.get("sortBy") || "totalScore";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [search, setSearch] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const { accessToken } = useAuthStore();
  const [data, setData] = useState(
    loaderData || {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalSubmissions: 0,
        limit: 10,
      },
      summary: {
        totalGradedSubmissions: 0,
        averageScore: 0,
      },
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiEndpoint = "/v1/exam/my-submission";

  // Initialize with loader data
  useEffect(() => {
    if (loaderData?.data && loaderData?.pagination) {
      setData(loaderData);
      setError(null);
    }
  }, [loaderData]);

  // Fetch submissions data
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sortBy,
        sortOrder,
        limit: "10",
        status,
      });

      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("API Response:", JSON.stringify(response.data, null, 2));

      setData(response.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load submissions";
      setError(message);
      toast.error(message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        navigate("/sign-in");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, status, sortBy, sortOrder, accessToken, navigate]);

  // Handle ranking navigation
  const handleUserRank = (submission) => {
    const examId = submission?.exam?._id;

    if (!examId) {
      console.error("Exam ID not found in submission:", submission);
      toast.error("Unable to view ranking: Exam ID missing");
      return;
    }

    console.log("Navigating to user rank page for exam ID:", examId);
    navigate(`/students/exam/my-rank/${examId}`);
  };

  const handleOverallRanking = (submission) => {
    const examId = submission?.exam?._id;

    if (!examId) {
      console.error("Exam ID not found in submission:", submission);
      toast.error("Unable to view ranking: Exam ID missing");
      return;
    }

    console.log("Navigating to overall rankings page for exam ID:", examId);
    navigate(`/students/exam/rankings/${examId}`);
  };

  // Fetch data on component mount and parameter change
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        const params = {
          page: "1",
          status,
          sortBy,
          sortOrder,
        };
        if (value) params.search = value;
        setSearchParams(params);
      }, 500),
    [status, sortBy, sortOrder, setSearchParams]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    setSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearch(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterName, value) => {
      const params = {
        page: "1",
        status: filterName === "status" ? value : status,
        sortBy: filterName === "sortBy" ? value : sortBy,
        sortOrder: filterName === "sortOrder" ? value : sortOrder,
      };
      if (searchQuery) params.search = searchQuery;
      setSearchParams(params);
    },
    [status, sortBy, sortOrder, searchQuery, setSearchParams]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (field) => {
      const newSortOrder =
        sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";
      setSearchParams({
        page: "1",
        status,
        ...(searchQuery && { search: searchQuery }),
        sortBy: field,
        sortOrder: newSortOrder,
      });
    },
    [sortBy, sortOrder, status, searchQuery, setSearchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage) {
        setSearchParams({
          page: newPage.toString(),
          status,
          ...(searchQuery && { search: searchQuery }),
          sortBy,
          sortOrder,
        });
      }
    },
    [status, searchQuery, sortBy, sortOrder, setSearchParams]
  );

  // Get grading status details
  const getGradingStatusBadge = useMemo(
    () => (status) => {
      switch (status) {
        case "fully_graded":
          return {
            color:
              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            icon: <FaCheckCircle className="w-3 h-3 mr-1" />,
            text: "Fully Graded",
          };
        case "partially_graded":
          return {
            color:
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            icon: <FaExclamationTriangle className="w-3 h-3 mr-1" />,
            text: "Partially Graded",
          };
        default:
          return {
            color:
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            icon: <FaExclamationTriangle className="w-3 h-3 mr-1" />,
            text: "Unknown",
          };
      }
    },
    []
  );

  // Get performance label
  const getPerformanceLabel = useMemo(
    () => (averageScore) => {
      if (averageScore >= 80) return "Excellent";
      if (averageScore >= 60) return "Good";
      return "Needs Improvement";
    },
    []
  );

  // Get score color based on percentage
  const getScoreColor = (percentage) => {
    if (percentage == null) return "text-gray-500 dark:text-gray-400";

    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Get ranking color
  const getRankingColor = useMemo(
    () => (position) => {
      if (!position) return "text-gray-500 dark:text-gray-400";
      if (position === 1) return "text-yellow-600 dark:text-yellow-400";
      if (position <= 3) return "text-gray-600 dark:text-gray-400";
      if (position <= 10) return "text-blue-600 dark:text-blue-400";
      return "text-gray-500 dark:text-gray-400";
    },
    []
  );

  // Component renderers
  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      <SummaryCard
        title="Total Submissions"
        value={data.summary?.totalGradedSubmissions ?? 0}
        icon={
          <FaBookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
        }
        color="text-gray-900 dark:text-white"
      />
      <SummaryCard
        title="Average Score"
        value={`${(data.summary?.averageScore ?? 0).toFixed(1)}%`}
        icon={
          <FaStar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
        }
        color="text-gray-900 dark:text-white"
      />
      <SummaryCard
        title="Average Ranking"
        value={calculateAverageRanking(data)}
        icon={
          <FaAward className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
        }
        color="text-gray-900 dark:text-white"
      />
      <SummaryCard
        title="Performance"
        value={getPerformanceLabel(data.summary?.averageScore)}
        icon={
          <FaArrowTrendUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
        }
        color="text-gray-900 dark:text-white"
      />
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6 border dark:border-gray-700">
      {/* Search Bar */}
      <div className="relative mb-4">
        <FaSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={16}
        />
        <input
          type="text"
          placeholder="Search exams..."
          className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Mobile Filter Toggle */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <div className="flex items-center">
            <FaFilter className="h-4 w-4 mr-2" />
            <span>Filters & Sort</span>
          </div>
          {showFilters ? (
            <FaChevronUp className="h-4 w-4" />
          ) : (
            <FaChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Filter Options */}
      <div
        className={`${
          showFilters ? "block" : "hidden"
        } sm:block mt-4 sm:mt-0 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between`}
      >
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            value={status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="graded">Graded Only</option>
            <option value="all">All Submissions</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            value={sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="totalScore">Sort by Score</option>
            <option value="submittedAt">Sort by Date</option>
            <option value="examTitle">Sort by Exam Title</option>
            <option value="duration">Sort by Duration</option>
            <option value="ranking">Sort by Ranking</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            value={sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderTableHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="examTitle"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Exam Title
          </SortHeader>
        </th>
        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="totalScore"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Score (%)
          </SortHeader>
        </th>
        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="ranking"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Ranking
          </SortHeader>
        </th>
        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="submittedAt"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Submitted At
          </SortHeader>
        </th>
        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="duration"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Duration
          </SortHeader>
        </th>
        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Status
        </th>
        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  const renderTableRow = (submission) => {
    const statusBadge = getGradingStatusBadge(submission.gradingStatus);
    const examId = submission?.exam?._id;
    const rankingData = examId && data.rankings?.[examId];

    // Calculate normalized percentage score
    const normalizedScore = calculateNormalizedScore(submission);

    return (
      <tr
        key={submission._id}
        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
      >
        <td className="px-3 sm:px-6 py-4">
          <div className="flex items-start">
            <FaGraduationCap className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                {submission.exam?.title || "N/A"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                {submission.exam?.description || "No description"}
              </div>

              {/* Mobile-only details */}
              <div className="sm:hidden mt-2 space-y-1">
                {normalizedScore !== null && normalizedScore !== undefined ? (
                  <div className="flex items-center text-sm">
                    <span
                      className={`font-bold ${getScoreColor(normalizedScore)}`}
                    >
                      {normalizedScore.toFixed(1)}%
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      / 100%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Not graded
                  </span>
                )}

                {rankingData?.userRanking && (
                  <div className="flex items-center text-xs">
                    <FaAward
                      className={`h-3 w-3 mr-1 ${getRankingColor(
                        rankingData.userRanking.rank
                      )}`}
                    />
                    <span
                      className={getRankingColor(rankingData.userRanking.rank)}
                    >
                      #{rankingData.userRanking.rank} of{" "}
                      {rankingData.totalSubmissions}
                    </span>
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <FaCalendarAlt className="h-3 w-3 mr-1" />
                  {formatDate(submission.endTime)}
                </div>

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <FaClock className="h-3 w-3 mr-1" />
                  {formatDuration(submission.durationTaken)}
                </div>
              </div>
            </div>
          </div>
        </td>

        {/* Desktop-only columns */}
        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {normalizedScore !== null && normalizedScore !== undefined ? (
              <>
                <span
                  className={`text-xl sm:text-2xl font-bold ${getScoreColor(
                    normalizedScore
                  )}`}
                >
                  {normalizedScore.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  / 100%
                </span>

                {/* Component breakdown */}
                <div className="hidden lg:block ml-4 text-xs text-gray-500 dark:text-gray-400">
                  {(submission.mcAnswerCount > 0 ||
                    submission.componentScores?.multipleChoice?.available) && (
                    <div>
                      MC:{" "}
                      {normalizeToPercentage(
                        submission.mcScore,
                        submission.exam?.maxMCScore || 100
                      ).toFixed(1)}
                      %
                    </div>
                  )}
                  {(submission.essayAnswerCount > 0 ||
                    submission.componentScores?.essay?.available) && (
                    <div>
                      Essay:{" "}
                      {normalizeToPercentage(
                        submission.essayScore,
                        submission.exam?.maxEssayScore || 100
                      ).toFixed(1)}
                      %
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Not graded
              </span>
            )}
          </div>
        </td>

        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
          {rankingData?.userRanking ? (
            <div className="flex items-center">
              <FaAward
                className={`h-4 w-4 mr-2 ${getRankingColor(
                  rankingData.userRanking.rank
                )}`}
              />
              <div>
                <span
                  className={`text-lg font-semibold ${getRankingColor(
                    rankingData.userRanking.rank
                  )}`}
                >
                  #{rankingData.userRanking.rank}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {rankingData.totalSubmissions}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {calculatePercentile(
                    rankingData.userRanking.rank,
                    rankingData.totalSubmissions
                  )}{" "}
                  percentile
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Not ranked
            </span>
          )}
        </td>

        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaCalendarAlt className="h-4 w-4 mr-2" />
            {formatDate(submission.endTime)}
          </div>
        </td>

        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaClock className="h-4 w-4 mr-2" />
            {formatDuration(submission.durationTaken)}
          </div>
        </td>

        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
          >
            {statusBadge.icon}
            {statusBadge.text}
          </span>
        </td>

        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {rankingData?.userRanking && (
              <button
                onClick={() => handleUserRank(submission)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
              >
                <FaUsers className="h-3 w-3 mr-1" />
                My Rank
              </button>
            )}

            {rankingData?.totalSubmissions && (
              <button
                onClick={() => handleOverallRanking(submission)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-colors"
              >
                <FaTasks className="h-3 w-3 mr-1" />
                All Ranks
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderPagination = () => {
    const { currentPage, totalPages } = data.pagination;
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate start and end pages
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-md"
        >
          Previous
        </button>
      );
    }

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          1
        </button>
      );

      if (startPage > 2) {
        pages.push(
          <span
            key="ellipsis-start"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            i === currentPage
              ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span
            key="ellipsis-end"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-md"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-b-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          {currentPage > 1 && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
          )}
          {currentPage < totalPages && (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          )}
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * data.pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  currentPage * data.pagination.limit,
                  data.pagination.totalSubmissions
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {data.pagination.totalSubmissions}
              </span>{" "}
              results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {pages}
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <FaBookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No submissions found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {searchQuery || status !== "graded"
          ? "Try adjusting your search or filter criteria."
          : "You haven't submitted any exams yet."}
      </p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading submissions...
      </p>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Error loading submissions
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
      <button
        onClick={fetchSubmissions}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Exam Submissions
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View your exam performance and rankings
          </p>
        </div>

        {renderSummaryCards()}
        {renderFilters()}

        {isLoading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : !data.data?.length ? (
          renderEmptyState()
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                {renderTableHeader()}
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.data.map(renderTableRow)}
                </tbody>
              </table>
            </div>
            {data.pagination &&
              data.pagination.totalPages > 1 &&
              renderPagination()}
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default MyExamSubmission;