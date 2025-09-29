/* eslint-disable react-hooks/exhaustive-deps */
import { format } from "date-fns";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaGraduationCap,
  FaSearch,
  FaTasks,
  FaUserCheck,
} from "react-icons/fa";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// Utility to format date - handles both timestamp and ISO strings
const formatDate = (date) => {
  if (!date) return "N/A";

  try {
    let dateObj;

    // Check if it's a timestamp (number)
    if (typeof date === "number") {
      dateObj = new Date(date);
    } else if (typeof date === "string") {
      // Handle ISO string or date string
      dateObj = new Date(date);
    } else {
      return "N/A";
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }

    return format(dateObj, "dd/MM/yyyy, HH:mm:ss");
  } catch (error) {
    console.error("Date formatting error:", error, date);
    return "N/A";
  }
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, onClick }) => (
  <div
    className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 ${
      onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

function PenilaianTugas() {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const kelasId = searchParams.get("kelasId") || "";
  const tugasId = searchParams.get("tugasId") || "";
  const sortBy = searchParams.get("sortBy") || "submittedAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [search, setSearch] = useState(searchQuery);
  const { accessToken, user } = useAuthStore();
  const [data, setData] = useState(
    loaderData || {
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalSubmissions: 0,
        limit: 10,
      },
      summary: {
        totalSubmissions: 0,
        statusBreakdown: {
          pending: 0,
          submitted: 0,
          partiallyGraded: 0,
          graded: 0,
          late: 0,
        },
        needsGrading: 0,
      },
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [klasses, setKlasses] = useState([]);
  const [tugasList, setTugasList] = useState([]);
  const [isExpanded, setIsExpanded] = useState({});
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);

  const apiEndpoint = "/v1/tugas/my-tugas";

  // Initialize with loader data
  useEffect(() => {
    if (loaderData?.results && loaderData?.pagination) {
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
      });

      // Only add non-empty parameters
      if (status) params.append("status", status);
      if (searchQuery) params.append("search", searchQuery);
      if (kelasId) params.append("kelasId", kelasId);
      if (tugasId) params.append("tugasId", tugasId);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setData(response.data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      const message =
        err.response?.data?.error ||
        err.message ||
        "Failed to load submissions";
      setError(message);
      toast.error(message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    searchQuery,
    status,
    kelasId,
    tugasId,
    sortBy,
    sortOrder,
    accessToken,
  ]);

  // Fetch classes for filter
  const fetchKlasses = useCallback(async () => {
    try {
      const response = await api.get("/v1/kelas", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setKlasses(response.data?.kelas || response.data?.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  }, [accessToken]);

  // Fetch tugas for filter
  const fetchTugas = useCallback(async () => {
    try {
      const response = await api.get("/v1/tugas?myTugas=true", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTugasList(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching tugas:", err);
    }
  }, [accessToken]);

  // Handle bulk grading
  const handleBulkGrading = useCallback(() => {
    if (selectedSubmissions.length === 0) return;
    const firstSubmission = selectedSubmissions[0];
    navigate(
      `/teachers/tugas-submissions/grade/${firstSubmission.submissionId}`
    );
  }, [selectedSubmissions, navigate]);

  // Toggle submission selection for bulk grading
  const toggleSubmissionSelection = useCallback((submission) => {
    setSelectedSubmissions((prev) =>
      prev.some((s) => s.submissionId === submission.submissionId)
        ? prev.filter((s) => s.submissionId !== submission.submissionId)
        : [...prev, submission]
    );
  }, []);

  // Toggle expanded state for mobile cards
  const toggleExpanded = useCallback((submissionId) => {
    setIsExpanded((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  }, []);

  // Fetch data on component mount and parameter change
  useEffect(() => {
    if (user?.role === "Guru") {
      fetchSubmissions();
      fetchKlasses();
      fetchTugas();
    }
  }, [user, fetchSubmissions, fetchKlasses, fetchTugas]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        const params = {
          page: "1",
          status,
          kelasId,
          tugasId,
          sortBy,
          sortOrder,
        };
        if (value) params.search = value;
        setSearchParams(params);
      }, 500),
    [status, kelasId, tugasId, sortBy, sortOrder, setSearchParams]
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
        kelasId: filterName === "kelasId" ? value : kelasId,
        tugasId: filterName === "tugasId" ? value : tugasId,
        sortBy,
        sortOrder,
      };
      if (searchQuery) params.search = searchQuery;
      setSearchParams(params);
    },
    [status, kelasId, tugasId, sortBy, sortOrder, searchQuery, setSearchParams]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (field) => {
      const newSortOrder =
        sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";
      setSearchParams({
        page: "1",
        status,
        kelasId,
        tugasId,
        ...(searchQuery && { search: searchQuery }),
        sortBy: field,
        sortOrder: newSortOrder,
      });
    },
    [sortBy, sortOrder, status, kelasId, tugasId, searchQuery, setSearchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage) {
        setSearchParams({
          page: newPage.toString(),
          status,
          kelasId,
          tugasId,
          ...(searchQuery && { search: searchQuery }),
          sortBy,
          sortOrder,
        });
      }
    },
    [status, kelasId, tugasId, searchQuery, sortBy, sortOrder, setSearchParams]
  );

  // Get status details
  const getStatusDetails = useMemo(
    () => (status) => {
      switch (status) {
        case "pending":
          return {
            color:
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            icon: <FaClock className="w-3 h-3 mr-1" />,
            text: "Pending",
          };
        case "submitted":
          return {
            color:
              "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            icon: <FaExclamationTriangle className="w-3 h-3 mr-1" />,
            text: "Submitted",
          };
        case "partially_graded":
          return {
            color:
              "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
            icon: <FaTasks className="w-3 h-3 mr-1" />,
            text: "Partially Graded",
          };
        case "graded":
          return {
            color:
              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            icon: <FaCheckCircle className="w-3 h-3 mr-1" />,
            text: "Graded",
          };
        case "late":
          return {
            color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            icon: <FaExclamationTriangle className="w-3 h-3 mr-1" />,
            text: "Late",
          };
        default:
          return {
            color:
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            icon: <FaClock className="w-3 h-3 mr-1" />,
            text: status || "Unknown",
          };
      }
    },
    []
  );

  // Get submission type badges
  const getSubmissionTypeBadges = useMemo(
    () => (submission) => {
      const badges = [];
      if (submission.hasFileUpload) {
        badges.push(
          <span
            key="file"
            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded flex items-center gap-1"
          >
            <FaFileAlt className="w-3 h-3" />
            File
          </span>
        );
      }
      if (submission.hasEssayAnswers) {
        badges.push(
          <span
            key="essay"
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded flex items-center gap-1"
          >
            <FaGraduationCap className="w-3 h-3" />
            Essay ({submission.essayAnswersCount})
          </span>
        );
      }
      if (submission.hasShortAnswers) {
        badges.push(
          <span
            key="short"
            className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded flex items-center gap-1"
          >
            <FaTasks className="w-3 h-3" />
            Short Answer ({submission.shortAnswersCount})
          </span>
        );
      }
      if (submission.hasMultipleChoiceAnswers) {
        badges.push(
          <span
            key="mc"
            className="px-2 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded flex items-center gap-1"
          >
            <FaTasks className="w-3 h-3" />
            MC ({submission.multipleChoiceAnswersCount})
          </span>
        );
      }
      return badges;
    },
    []
  );

  // Get score color
  const getScoreColor = useMemo(
    () => (score) => {
      if (score == null) return "text-gray-500";
      if (score >= 80) return "text-green-600 dark:text-green-400";
      if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
      return "text-red-600 dark:text-red-400";
    },
    []
  );

  // Check if user is authorized
  if (user?.role !== "Guru") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600">Only teachers can access this page.</p>
      </div>
    );
  }

  const filteredSubmissions = data?.results || [];

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            <FaClipboardList className="inline mr-2" />
            Penilaian Tugas
          </h1>
        </div>
        {selectedSubmissions.length > 0 && (
          <button
            onClick={handleBulkGrading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaEdit className="h-4 w-4" />
            Grade Selected ({selectedSubmissions.length})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Submissions"
            value={data.summary.totalSubmissions}
            icon={<FaClipboardList className="w-8 h-8 text-blue-500" />}
            color="text-gray-900 dark:text-gray-100"
          />
          <SummaryCard
            title="Needs Grading"
            value={data.summary.needsGrading}
            icon={<FaExclamationTriangle className="w-8 h-8 text-orange-500" />}
            color="text-orange-600 dark:text-orange-400"
            onClick={() => handleFilterChange("status", "submitted")}
          />
          <SummaryCard
            title="Graded"
            value={data.summary.statusBreakdown.graded}
            icon={<FaUserCheck className="w-8 h-8 text-green-500" />}
            color="text-green-600 dark:text-green-400"
            onClick={() => handleFilterChange("status", "graded")}
          />
          <SummaryCard
            title="Late"
            value={data.summary.statusBreakdown.late}
            icon={<FaClock className="w-8 h-8 text-red-500" />}
            color="text-red-600 dark:text-red-400"
            onClick={() => handleFilterChange("status", "late")}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search submissions..."
            value={search}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="partially_graded">Partially Graded</option>
          <option value="graded">Graded</option>
          <option value="late">Late</option>
        </select>

        <select
          value={kelasId}
          onChange={(e) => handleFilterChange("kelasId", e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {klasses.map((kls) => (
            <option key={kls._id} value={kls._id}>
              {kls.name}
            </option>
          ))}
        </select>

        <select
          value={tugasId}
          onChange={(e) => handleFilterChange("tugasId", e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Assignments</option>
          {tugasList.map((tugas) => (
            <option key={tugas._id || tugas.id} value={tugas._id || tugas.id}>
              {tugas.title}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={
                      selectedSubmissions.length ===
                        filteredSubmissions.length &&
                      filteredSubmissions.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubmissions(filteredSubmissions);
                      } else {
                        setSelectedSubmissions([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSortChange("user.fullName")}
                >
                  Student
                  {sortBy === "user.fullName" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSortChange("tugas.title")}
                >
                  Assignment
                  {sortBy === "tugas.title" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSortChange("kelas.name")}
                >
                  Class
                  {sortBy === "kelas.name" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSortChange("status")}
                >
                  Status
                  {sortBy === "status" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSortChange("submittedAt")}
                >
                  Submitted
                  {sortBy === "submittedAt" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <FaClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No submissions found</p>
                    <p className="text-sm">
                      Try adjusting your search or filter criteria
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => {
                  const statusDetails = getStatusDetails(submission.status);
                  const isSelected = selectedSubmissions.some(
                    (s) => s.submissionId === submission.submissionId
                  );

                  return (
                    <tr
                      key={submission.submissionId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubmissionSelection(submission)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {submission.student?.fullName ||
                                submission.user?.fullName ||
                                "N/A"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.student?.email ||
                                submission.user?.email ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {submission.tugas?.title || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {submission.tugas?.dueDate || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {submission.kelas?.name ||
                          submission.class?.name ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}
                        >
                          {statusDetails.icon}
                          {statusDetails.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${getScoreColor(
                            submission.totalScore
                          )}`}
                        >
                          {submission.totalScore != null
                            ? `${submission.totalScore}%`
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {getSubmissionTypeBadges(submission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/teachers/tugas-submissions/view/${submission.submissionId}`
                              )
                            }
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="View Submission"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          {(submission.status === "submitted" ||
                            submission.status === "partially_graded") && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/teachers/tugas-submissions/grade/${submission.submissionId}`
                                )
                              }
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              title="Grade Submission"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                          )}
                          {submission.hasFileUpload && (
                            <a
                              href={submission.fileTugas}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                              title="View File"
                            >
                              <FaFileAlt className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <FaClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No submissions found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => {
            const statusDetails = getStatusDetails(submission.status);
            const isSelected = selectedSubmissions.some(
              (s) => s.submissionId === submission.submissionId
            );
            const expanded = isExpanded[submission.submissionId];

            return (
              <div
                key={submission.submissionId}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSubmissionSelection(submission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {submission.student?.fullName ||
                            submission.user?.fullName ||
                            "N/A"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {submission.student?.email ||
                            submission.user?.email ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpanded(submission.submissionId)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {expanded ? "−" : "+"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Assignment:
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {submission.tugas?.title || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Class:
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {submission.kelas?.name ||
                          submission.class?.name ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Status:
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDetails.color}`}
                      >
                        {statusDetails.icon}
                        {statusDetails.text}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Score:
                      </span>
                      <span
                        className={`text-xs font-medium ${getScoreColor(
                          submission.totalScore
                        )}`}
                      >
                        {submission.totalScore != null
                          ? `${submission.totalScore}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Submitted:
                        </span>
                        <span className="text-xs text-gray-900 dark:text-gray-100">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due Date:
                        </span>
                        <span className="text-xs text-gray-900 dark:text-gray-100">
                          {submission.tugas?.dueDate || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Type:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {getSubmissionTypeBadges(submission)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/teachers/tugas-submissions/view/${submission.submissionId}`
                        )
                      }
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center gap-1"
                    >
                      <FaEye className="h-3 w-3" />
                      View
                    </button>
                    {(submission.status === "submitted" ||
                      submission.status === "partially_graded") && (
                      <button
                        onClick={() =>
                          navigate(
                            `/teachers/tugas-submissions/grade/${submission.submissionId}`
                          )
                        }
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 flex items-center gap-1"
                      >
                        <FaEdit className="h-3 w-3" />
                        Grade
                      </button>
                    )}
                    {submission.hasFileUpload && (
                      <a
                        href={submission.fileTugas}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center gap-1"
                        title="View File"
                      >
                        <FaFileAlt className="h-3 w-3" />
                        File
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span>
              Showing{" "}
              {(data.pagination.currentPage - 1) * data.pagination.limit + 1} to{" "}
              {Math.min(
                data.pagination.currentPage * data.pagination.limit,
                data.pagination.totalSubmissions
              )}{" "}
              of {data.pagination.totalSubmissions} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(data.pagination.currentPage - 1)}
              disabled={data.pagination.currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
              .filter((pageNumber) => {
                const current = data.pagination.currentPage;
                return (
                  pageNumber === 1 ||
                  pageNumber === data.pagination.totalPages ||
                  (pageNumber >= current - 1 && pageNumber <= current + 1)
                );
              })
              .map((pageNumber, index, array) => (
                <React.Fragment key={pageNumber}>
                  {index > 0 && array[index - 1] !== pageNumber - 1 && (
                    <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNumber === data.pagination.currentPage
                        ? "text-blue-600 bg-blue-50 border border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-600"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => handlePageChange(data.pagination.currentPage + 1)}
              disabled={
                data.pagination.currentPage === data.pagination.totalPages
              }
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PenilaianTugas;
