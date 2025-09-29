/* eslint-disable react-hooks/exhaustive-deps */
import debounce from "lodash/debounce";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaSync,
  FaUpload,
  FaUsers,
} from "react-icons/fa";

import { useQuery } from "@tanstack/react-query";
import {
  Link,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const KelasExams = React.memo(() => {
  const initialData = useLoaderData();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [search, setSearch] = useState(searchQuery);
  const { accessToken, user } = useAuthStore();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // React Query fetch function
  const fetchKelasExams = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      sortBy,
      sortOrder,
    });

    if (searchQuery) params.append("search", searchQuery);

    const response = await api.get(`/v1/kelas/exam-info?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.data.data;
  };

  // React Query setup with refetch interval
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } =
    useQuery({
      queryKey: ["kelas-exams", page, searchQuery, sortBy, sortOrder],
      queryFn: fetchKelasExams,
      initialData: initialData,
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true, // Continue refetching when tab is not active
      staleTime: 10000, // Data is fresh for 10 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 errors
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      enabled: !!accessToken, // Only run query if we have access token
    });

  // Provide default data structure if data is undefined
  const safeData = data || {
    classes: [],
    exams: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10,
    },
    summary: {
      totalClasses: 0,
      totalExams: 0,
    },
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle exam submission
  const handleExamSubmitted = useCallback(
    (data) => {
      const { examId, userId: submittedUserId } = data;

      // Only update if it's the current user's submission
      if (submittedUserId === user?._id) {
        // Refetch data to get updated state
        refetch();

        const submittedExam = safeData.exams.find(
          (exam) => exam._id === examId
        );

        if (submittedExam) {
          toast.success(
            `Exam "${submittedExam.title}" submitted successfully!`
          );
        }
      }
    },
    [user?._id, refetch, safeData.exams]
  );

  // Handle authentication errors
  useEffect(() => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/sign-in";
    }
  }, [error]);

  // Initialize WebSocket and handle navigation state
  useEffect(() => {
    mountedRef.current = true;

    // Check if we came from a submission
    if (location.state?.refreshData || location.state?.submittedExamId) {
      // Immediately refresh data after submission
      refetch();
    }

    return () => {
      mountedRef.current = false;

      if (wsRef.current) {
        wsRef.current.close();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [refetch]);

  // Listen for custom events from other components
  useEffect(() => {
    const handleExamSubmittedEvent = (event) => {
      const { examId } = event.detail;
      handleExamSubmitted({ examId, userId: user?._id });
    };

    const handleExamCreatedEvent = () => {
      refetch();
    };

    window.addEventListener("examSubmitted", handleExamSubmittedEvent);
    window.addEventListener("examCreated", handleExamCreatedEvent);

    return () => {
      window.removeEventListener("examSubmitted", handleExamSubmittedEvent);
      window.removeEventListener("examCreated", handleExamCreatedEvent);
    };
  }, [user?._id, refetch]);

  const debouncedSearch = debounce((value) => {
    const params = {
      page: "1",
      sortBy,
      sortOrder,
    };
    if (value) params.search = value;
    setSearchParams(params);
  }, 500);

  useEffect(() => {
    setSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleSortChange = (field) => {
    const newSortOrder =
      sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";

    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      sortBy: field,
      sortOrder: newSortOrder,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage) {
      setSearchParams({
        page: newPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        sortOrder,
      });
    }
  };

  const getStatusBadge = (exam) => {
    if (exam.isOverdue) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  const filteredExams = useMemo(() => safeData?.exams || [], [safeData?.exams]);

  // Manual refresh function
  const handleRefresh = () => {
    refetch();
  };

  // Format last updated time
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="p-2 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header with connection status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              My Class Exams
            </h1>
            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="p-1 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <FaSync
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <span>All exams from your enrolled classes</span>
            {dataUpdatedAt && (
              <span className="text-xs">
                Last updated: {formatLastUpdate(dataUpdatedAt)}
              </span>
            )}
            {isFetching && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Updating...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaBookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Classes
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {safeData.summary.totalClasses}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Exams
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {safeData.summary.totalExams}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Exams
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {filteredExams.filter((e) => !e.isOverdue).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-3 sm:gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={handleSearchChange}
            className="w-full p-2 sm:p-3 pl-8 sm:pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="p-2 sm:p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex-1 text-sm sm:text-base"
          >
            <option value="due_date">Sort by Due Date</option>
            <option value="created_at">Sort by Created Date</option>
          </select>
          <select
            value={sortOrder}
            onChange={() => handleSortChange(sortBy)}
            className="p-2 sm:p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-24 sm:w-32 text-sm sm:text-base"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Classes Section */}
      {safeData.classes.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h2 className="text-md sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Your Classes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {safeData.classes.map((kelas) => (
              <div
                key={kelas._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 border dark:border-gray-700"
              >
                <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  {kelas.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {kelas.description}
                </p>
                <div className="flex justify-between items-center mt-2 sm:mt-3">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      kelas.userRole === "teacher"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {kelas.userRole === "teacher" ? "Teacher" : "Student"}
                  </span>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {kelas.examCount} exams
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3 sm:space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-20 sm:h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              ></div>
            ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load class exams"}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="text-red-600 dark:text-red-300 hover:underline text-xs sm:text-sm disabled:opacity-50 flex items-center gap-1"
          >
            <FaSync className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Retry
          </button>
        </div>
      )}

      {/* Exams List */}
      {!isLoading && filteredExams.length === 0 ? (
        <div className="p-4 sm:p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <FaBookOpen className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg mb-1 sm:mb-2">
            No exams found
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm">
            You don't have any exams in your enrolled classes yet.
          </p>
        </div>
      ) : (
        !isLoading && (
          <>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-md sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Exams ({filteredExams.length})
                </h2>
                {/* Additional Manual Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="px-2 py-1 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1 sm:gap-2"
                >
                  <FaSync
                    className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {exam.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded self-start ${getStatusBadge(
                            exam
                          )}`}
                        >
                          {exam.isOverdue ? "Overdue" : "Active"}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                        {exam.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <FaBookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="truncate">
                            Class: {exam.kelas?.name}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FaUsers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="truncate">
                            By: {exam.created_by?.fullName}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="truncate">
                            Due: {formatDate(exam.due_date)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FaClock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="truncate">
                            Created: {formatDate(exam.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FaClock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="truncate">
                            Duration: {exam.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-start">
                      <Link
                        to={`/students/submit/exam/${exam._id}`}
                        state={{ returnTo: "/students/kelas-exams" }}
                        className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Submit Exam"
                      >
                        <FaUpload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Submit</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 sm:mt-6 gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredExams.length} of{" "}
                {safeData?.pagination?.totalCount || 0} exams
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <button
                  onClick={() =>
                    handlePageChange(
                      safeData?.pagination?.hasPrevPage
                        ? safeData.pagination.currentPage - 1
                        : null
                    )
                  }
                  disabled={!safeData?.pagination?.hasPrevPage || isLoading}
                  className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
                >
                  Previous
                </button>
                <span className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 self-center text-center">
                  Page {safeData?.pagination?.currentPage || 1} of{" "}
                  {safeData?.pagination?.totalPages || 1}
                </span>
                <button
                  onClick={() =>
                    handlePageChange(
                      safeData?.pagination?.hasNextPage
                        ? safeData.pagination.currentPage + 1
                        : null
                    )
                  }
                  disabled={!safeData?.pagination?.hasNextPage || isLoading}
                  className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
});

export default KelasExams;
