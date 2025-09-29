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
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaStar,
  FaTasks,
  FaUpload,
  FaUsers,
  FaBars,
  FaTimes,
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

// Check if assignment is overdue
const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  const now = new Date().getTime();
  const due =
    typeof dueDate === "number" ? dueDate : new Date(dueDate).getTime();
  return now > due;
};

// Helper function to calculate percentile
const calculatePercentile = (rank, totalSubmissions) => {
  if (!rank || !totalSubmissions || totalSubmissions === 0) return "N/A";
  const percentile = ((totalSubmissions - rank) / totalSubmissions) * 100;
  return `${Math.round(percentile)}th`;
};

// Summary Card Component - now with responsive sizing
const SummaryCard = ({ title, value, icon, color, onClick }) => (
  <div
    className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border dark:border-gray-700 ${
      onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-3 sm:ml-4">
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
          {title}
        </p>
        <p className={`text-xl sm:text-2xl font-semibold ${color} truncate`}>
          {value}
        </p>
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
      className="flex items-center text-left font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs sm:text-sm"
    >
      {children}
      {getSortIcon()}
    </button>
  );
};

const MyTugasSubmission = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const status = searchParams.get("status") || "graded";
  const sortBy = searchParams.get("sortBy") || "totalScore";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchQuery);
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
        totalSubmissions: 0,
        averageScore: 0,
        averageRanking: "N/A",
      },
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiEndpoint = "/v1/tugas/my-submission";

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
    const tugasId = submission?.tugas?._id;

    if (!tugasId) {
      console.error("Tugas ID not found in submission:", submission);
      toast.error("Unable to view ranking: Tugas ID missing");
      return;
    }

    console.log("Navigating to user rank page for tugas ID:", tugasId);
    navigate(`/students/tugas/my-rank/${tugasId}`);
  };

  const handleOverallRanking = (submission) => {
    const tugasId = submission?.tugas?._id;

    if (!tugasId) {
      console.error("Tugas ID not found in submission:", submission);
      toast.error("Unable to view ranking: Tugas ID missing");
      return;
    }

    console.log("Navigating to overall rankings page for tugas ID:", tugasId);
    navigate(`/students/tugas/rankings/${tugasId}`);
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
    () => (submission) => {
      const status = submission?.status;
      const gradingStatus = submission?.gradingStatus;

      if (status === "graded" && gradingStatus === "fully_graded") {
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          icon: <FaCheckCircle className="w-3 h-3 mr-1" />,
          text: "Fully Graded",
        };
      } else if (status === "graded" && gradingStatus === "partially_graded") {
        return {
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          icon: <FaExclamationTriangle className="w-3 h-3 mr-1" />,
          text: "Partially Graded",
        };
      } else if (status === "submitted") {
        return {
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          icon: <FaClock className="w-3 h-3 mr-1" />,
          text: "Submitted",
        };
      } else {
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

  // Get score color
  const getScoreColor = useMemo(
    () => (score) => {
      if (score == null) return "text-gray-500 dark:text-gray-400";
      if (score >= 80) return "text-green-600 dark:text-green-400";
      if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
      return "text-red-600 dark:text-red-400";
    },
    []
  );

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

  const calculateAverageRanking = () => {
    if (!data.data.length) return "N/A";
    const totalRankings = data.data.reduce((sum, submission) => {
      const tugasId = submission.tugas?._id;
      const rank = data.rankings?.[tugasId]?.userRanking?.rank || 0;
      return sum + rank;
    }, 0);
    const count = data.data.filter(
      (submission) => data.rankings?.[submission.tugas?._id]?.userRanking?.rank
    ).length;
    return count ? (totalRankings / count).toFixed(1) : "null";
  };

  // Component renderers
  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <SummaryCard
        title="Total Submissions"
        value={data.summary?.totalSubmissions ?? 0}
        icon={
          <FaFileAlt className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
        }
        color="text-gray-900 dark:text-white"
      />
      <SummaryCard
        title="Average Score"
        value={`${data.summary?.averageScore?.toFixed(1) || "0.0"}%`}
        icon={
          <FaStar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
        }
        color="text-gray-900 dark:text-white"
      />
      <SummaryCard
        title="Average Ranking"
        value={calculateAverageRanking()}
        icon={<FaAward className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />}
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
    <>
      {/* Mobile filter button */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center justify-center w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {mobileFiltersOpen ? (
            <>
              <FaTimes className="mr-2" />
              Close Filters
            </>
          ) : (
            <>
              <FaBars className="mr-2" />
              Open Filters
            </>
          )}
        </button>
      </div>

      {/* Filter panel */}
      <div
        className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6 border dark:border-gray-700`}
      >
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search Assignments..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="graded">Graded Only</option>
                <option value="all">All Submissions</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="totalScore">Score</option>
                <option value="submittedAt">Submission Date</option>
                <option value="tugasTitle">Assignment Title</option>
                <option value="dueDate">Due Date</option>
                <option value="ranking">Ranking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderTableHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="tugasTitle"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Assignment
          </SortHeader>
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="totalScore"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Score
          </SortHeader>
        </th>
        <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="ranking"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Rank
          </SortHeader>
        </th>
        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="submittedAt"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Submitted
          </SortHeader>
        </th>
        <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
          <SortHeader
            field="dueDate"
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={handleSortChange}
          >
            Due Date
          </SortHeader>
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Status
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  const renderTableRow = (submission) => {
    const statusBadge = getGradingStatusBadge(submission);
    const hasFileUpload = submission?.tugas?.requiresFileUpload;
    const isAssignmentOverdue = isOverdue(submission?.tugas?.due_date);
    const tugasId = submission?.tugas?._id;
    const rankingData = tugasId && data.rankings?.[tugasId];

    return (
      <tr
        key={submission?._id}
        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
      >
        <td className="px-4 py-4">
          <div className="flex items-center">
            <FaFileAlt className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {submission.tugas?.title || "N/A"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {submission.tugas?.description || "No description"}
              </div>
              {hasFileUpload && (
                <div className="flex items-center mt-1">
                  <FaUpload className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    File required
                  </span>
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center">
            {submission.totalScore != null ? (
              <>
                <span
                  className={`text-lg font-bold ${getScoreColor(
                    submission.totalScore
                  )}`}
                >
                  {submission.totalScore}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  /100
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Not graded
              </span>
            )}
          </div>
        </td>
        <td className="hidden sm:table-cell px-4 py-4">
          {rankingData?.userRanking ? (
            <div className="flex items-center">
              <FaAward
                className={`h-4 w-4 mr-2 ${getRankingColor(
                  rankingData.userRanking.rank
                )}`}
              />
              <div>
                <span
                  className={`text-sm font-semibold ${getRankingColor(
                    rankingData.userRanking.rank
                  )}`}
                >
                  #{rankingData.userRanking.rank}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  of {rankingData.totalSubmissions}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Not ranked
            </span>
          )}
        </td>
        <td className="hidden md:table-cell px-4 py-4 text-xs text-gray-900 dark:text-white">
          <div className="flex items-center">
            <FaCalendarAlt className="h-3 w-3 text-gray-400 dark:text-gray-500 mr-1" />
            {formatDate(submission.submittedAt).split(",")[0]}
          </div>
        </td>
        <td className="hidden lg:table-cell px-4 py-4 text-xs text-gray-900 dark:text-white">
          <div className="flex items-center">
            <FaCalendarAlt className="h-3 w-3 text-gray-400 dark:text-gray-500 mr-1" />
            <div>
              <div>{formatDate(submission.tugas?.due_date).split(",")[0]}</div>
              {isAssignmentOverdue && (
                <div className="text-xs text-red-500 dark:text-red-400">
                  Overdue
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
          >
            {statusBadge.icon}
            <span className="hidden sm:inline ml-1">{statusBadge.text}</span>
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() =>
                navigate(`/students/tugas/detail-score/${submission.tugas._id}`)
              }
              className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs rounded-md text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <FaTasks className="h-3 w-3 mr-1" />
              Details
            </button>

            {submission.totalScore != null && (
              <>
                <button
                  onClick={() => handleUserRank(submission)}
                  className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs rounded-md text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800"
                >
                  <FaAward className="h-3 w-3 mr-1" />
                  Rank
                </button>
              </>
            )}

            {hasFileUpload && submission?.fileUpload && (
              <button
                onClick={() => {
                  window.open(submission.fileUpload.url, "_blank");
                }}
                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs rounded-md text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <FaDownload className="h-3 w-3 mr-1" />
                File
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTable = () => (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {renderTableHeader()}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.data?.map(renderTableRow)}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (!data.pagination || data.pagination.totalPages <= 1) return null;
    const { currentPage, totalPages } = data.pagination;
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return (
      <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-lg">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center px-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {currentPage} of {totalPages}
            </span>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-3 py-2 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
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
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {startPage > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      ...
                    </span>
                  )}
                </>
              )}

              {pages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === currentPage
                      ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-200"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Error state rendering
  const renderError = () => (
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
      <FaExclamationTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
        Error Loading Submissions
      </h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      <button
        onClick={fetchSubmissions}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
      > Retry
      </button>
    </div>
  );

  // Loading state rendering
  const renderLoading = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Empty state rendering
  const renderEmptyState = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden text-center py-12">
      <FaBookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
        No submissions found
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {searchQuery
          ? "Try adjusting your search or filter criteria"
          : "You haven't submitted any assignments yet"}
      </p>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Submissions
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View and manage all your assignment submissions
          </p>
        </div>

        {renderSummaryCards()}
        {renderFilters()}

        {error ? (
          renderError()
        ) : isLoading ? (
          renderLoading()
        ) : !data.data?.length ? (
          renderEmptyState()
        ) : (
          <>
            {renderTable()}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default MyTugasSubmission;