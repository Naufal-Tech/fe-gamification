/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useState } from "react";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaClock,
  FaEye,
  FaSearch,
  FaSync,
  FaUpload,
  FaUsers,
} from "react-icons/fa";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function KelasTugas() {
  const initialData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [search, setSearch] = useState(searchQuery);
  const { accessToken } = useAuthStore();

  // React Query for data fetching
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["kelasTugas", page, searchQuery, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: Math.max(1, page).toString(),
        sortBy,
        sortOrder,
      });
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(
        `/v1/kelas/tugas-info?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data.data;
    },
    initialData: initialData,
    refetchInterval: 300000, // 5 minutes
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
    onSuccess: (responseData) => {
      // Validate pagination - if current page exceeds total pages, redirect to last page
      if (
        responseData.pagination.currentPage >
          responseData.pagination.totalPages &&
        responseData.pagination.totalPages > 0
      ) {
        setSearchParams({
          page: responseData.pagination.totalPages.toString(),
          ...(searchQuery && { search: searchQuery }),
          sortBy,
          sortOrder,
        });
      }
    },
  });

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      const params = {
        page: "1", // Reset to first page on search
        sortBy,
        sortOrder,
      };
      if (value.trim()) params.search = value.trim();
      setSearchParams(params);
    }, 500),
    [sortBy, sortOrder, setSearchParams]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    setSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  // Handle sort change
  const handleSortChange = useCallback(
    (field) => {
      const newSortOrder =
        sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";
      setSearchParams({
        page: "1",
        ...(searchQuery && { search: searchQuery }),
        sortBy: field,
        sortOrder: newSortOrder,
      });
    },
    [sortBy, sortOrder, searchQuery, setSearchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage) => {
      if (
        newPage &&
        newPage > 0 &&
        newPage <= (data?.pagination?.totalPages || 1)
      ) {
        setSearchParams({
          page: newPage.toString(),
          ...(searchQuery && { search: searchQuery }),
          sortBy,
          sortOrder,
        });
      }
    },
    [
      searchQuery,
      sortBy,
      sortOrder,
      data?.pagination?.totalPages,
      setSearchParams,
    ]
  );

  // Format date
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusBadge = (tugas) => {
    return tugas.isOverdue
      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  const filteredTugas = data?.tugas || [];
  const currentPage = data?.pagination?.currentPage || 1;
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="p-3 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tugas Kelas Saya
            </h1>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Refresh data"
            >
              <FaSync
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <span>Semua tugas dari kelas yang Anda ikuti</span>
            {dataUpdatedAt && (
              <span className="text-xs">
                Update Terakhir: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaBookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Kelas Terdaftar
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {data?.summary?.totalClasses || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tugas
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {data?.summary?.totalTugas || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Tugas Aktif
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {filteredTugas.filter((t) => !t.isOverdue).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari Tugas..."
            value={search}
            onChange={handleSearchChange}
            className="w-full p-2 sm:p-3 pl-9 sm:pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="p-2 sm:p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex-1 text-sm sm:text-base"
          >
            <option value="title">Sort by Title</option>
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

      {/* Classes Overview */}
      {data?.classes?.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Kelas Terdaftar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.classes.map((kelas) => (
              <div
                key={kelas._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 border dark:border-gray-700"
              >
                <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  {kelas.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                    {kelas.tugasCount} Tugas
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
          {Array(3)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              ></div>
            ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load class assignments"}
          </span>
          <button
            onClick={refetch}
            className="text-red-600 dark:text-red-300 hover:underline text-xs sm:text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTugas.length === 0 ? (
        <div className="p-4 sm:p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <FaBookOpen className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
            Belum ada tugas saat ini.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            {searchQuery
              ? `No assignments match "${searchQuery}". Try adjusting your search.`
              : "Anda belum memiliki tugas apa pun di kelas yang Anda ikuti."}
          </p>
        </div>
      ) : (
        <>
          {/* Assignments List */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Tugas ({data?.pagination?.totalCount || 0})
            </h2>
            {filteredTugas.map((tugas) => (
              <div
                key={tugas._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 border dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {tugas.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${getStatusBadge(
                          tugas
                        )}`}
                      >
                        {tugas.isOverdue ? "Overdue" : "Active"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2">
                      {tugas.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <FaBookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span>Class: {tugas.kelas?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <FaUsers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span>By: {tugas.created_by?.fullName}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span>Due: {formatDate(tugas.due_date)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaClock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span>Created: {formatDate(tugas.created_at)}</span>
                      </div>
                    </div>
                    {tugas.requiresFileUpload && (
                      <div className="mt-2 sm:mt-3">
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded">
                          File Upload Required
                        </span>
                        {tugas.fileUploadInstructions && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Instructions: {tugas.fileUploadInstructions}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-start">
                    <Link
                      to={`/students/assignment/tugas/${tugas._id}`}
                      className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      title="View Details"
                    >
                      <FaEye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                    <Link
                      to={`/students/submit/tugas/${tugas._id}`}
                      className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      title="Submit Assignment"
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
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 sm:mt-6 gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredTugas.length} of{" "}
                {data?.pagination?.totalCount || 0} Tugas
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!data?.pagination?.hasPrevPage || isLoading}
                  className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 self-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data?.pagination?.hasNextPage || isLoading}
                  className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default KelasTugas;
