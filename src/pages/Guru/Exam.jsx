/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaClock,
  FaEdit,
  FaEye,
  FaPlus,
  FaSearch,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function Exam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField") || "title";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const myExams = searchParams.get("myExams") === "true";

  const loaderData = useLoaderData();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuthStore();
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  const apiEndpoint = "/v1/exam";

  // Define the query key based on parameters
  const queryKey = [
    "exams",
    page,
    searchQuery,
    searchField,
    sortBy,
    sortOrder,
    myExams,
  ];

  // React Query to fetch exams
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        searchField,
        sortBy,
        sortOrder,
        myExams: myExams.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    initialData: loaderData || {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalExams: 0,
        limit: 10,
        prevPage: null,
        nextPage: null,
      },
    },
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  const debouncedSearch = debounce((value, field) => {
    const params = {
      page: "1",
      searchField: field,
      myExams: myExams.toString(),
      ...(value && { search: value }),
      sortBy,
      sortOrder,
    };
    setSearchParams(params);
  }, 500);

  useEffect(() => {
    setSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  const toggleMyExams = () => {
    setSearchParams({
      page: "1",
      myExams: (!myExams).toString(),
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy,
      sortOrder,
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value, searchField);
  };

  const handleSearchFieldChange = (e) => {
    const newField = e.target.value;
    setSearchParams({
      page: "1",
      searchField: newField,
      ...(search && { search }),
      sortBy,
      sortOrder,
      myExams: myExams.toString(),
    });
  };

  const handleSortChange = (field) => {
    const newSortOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy: field,
      sortOrder: newSortOrder,
      myExams: myExams.toString(),
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage) {
      setSearchParams({
        page: newPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        searchField,
        sortBy,
        sortOrder,
        myExams: myExams.toString(),
      });
    }
  };

  const deleteExam = async (id) => {
    try {
      await api.delete(`${apiEndpoint}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Exam deleted successfully");
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      console.error("Delete Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to delete exam");
    }
  };

  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (examToDelete) deleteExam(examToDelete._id);
    setIsModalOpen(false);
    setExamToDelete(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setExamToDelete(null);
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const getStatusColor = (status, isExpired) => {
    if (isExpired)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = (status, isExpired) => {
    if (isExpired) return "Expired";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredExams = data?.data || [];

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {myExams ? "Ujian Dari Saya" : "Semua Ujian"}
          </h1>
          {user?.role === "Guru" && (
            <button
              onClick={toggleMyExams}
              className={`px-3 py-1 rounded-lg text-sm ${
                myExams
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {myExams ? "Semua Ujian" : "Perlihatkan Ujian Saya"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "Guru" && (
            <Link
              to="/teachers/exams/new"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Tambah
            </Link>
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
            title="Refresh Exams"
          >
            <FaSync
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex gap-2">
          <select
            value={searchField}
            onChange={handleSearchFieldChange}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-40"
          >
            <option value="title">Title</option>
            <option value="kelas">Class</option>
            <option value="creator">Creator</option>
            <option value="status">Status</option>
          </select>
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search by ${searchField}...`}
              value={search}
              onChange={handleSearchChange}
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
        </div>
        <div className="flex gap-2 md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1"
          >
            <option value="title">Sort by Title</option>
            <option value="kelas">Sort by Class</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="created_at">Sort by Created Date</option>
            <option value="duration">Sort by Duration</option>
            <option value="status">Sort by Status</option>
          </select>
          <select
            value={sortOrder}
            onChange={() => handleSortChange(sortBy)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-32"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array(5)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm sm:text-base">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load exams"}
          </span>
          <button
            onClick={() => refetch()}
            className="text-red-600 dark:text-red-300 hover:underline text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && filteredExams.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            No exams found
          </p>
          {user?.role === "Guru" && (
            <Link
              to="/teachers/exams/new"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Create your first exam
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => handleSortChange("title")}
                  >
                    <div className="flex items-center">
                      Title
                      {sortBy === "title" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Class</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => handleSortChange("duration")}
                  >
                    <div className="flex items-center">
                      Duration
                      {sortBy === "duration" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Due Date</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => handleSortChange("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortBy === "status" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Quiz Types</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr
                    key={exam._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {exam.title}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {exam.description || "N/A"}
                    </td>
                    <td className="px-4 py-3">{exam.creator?.name || "N/A"}</td>
                    <td className="px-4 py-3">{exam.kelas?.name || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FaClock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDuration(exam.duration)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDate(exam.due_date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${getStatusColor(
                          exam.status,
                          exam.isExpired
                        )}`}
                      >
                        {getStatusText(exam.status, exam.isExpired)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-1">
                        {exam.hasEssayQuiz && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                            Essay
                          </span>
                        )}
                        {exam.hasMultipleChoice && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded">
                            Multiple Choice
                          </span>
                        )}
                        {!exam.hasEssayQuiz && !exam.hasMultipleChoice && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                            No Quizzes
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <Link
                        to={`/teachers/exams/detail/${exam._id}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="View Details"
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      {user?.role === "Guru" && (
                        <>
                          <Link
                            to={`/teachers/exams/edit/${exam._id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <FaEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(exam)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="block sm:hidden space-y-4">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {exam.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${getStatusColor(
                      exam.status,
                      exam.isExpired
                    )}`}
                  >
                    {getStatusText(exam.status, exam.isExpired)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="truncate">
                    <span className="font-semibold">Description:</span>{" "}
                    {exam.description || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Creator:</span>{" "}
                    {exam.creator?.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Class:</span>{" "}
                    {exam.kelas?.name || "N/A"}
                  </p>
                  <div className="flex justify-between">
                    <p>
                      <span className="font-semibold">Duration:</span>{" "}
                      <span className="flex items-center">
                        <FaClock className="h-3 w-3 mr-1" />
                        {formatDuration(exam.duration)}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Due Date:</span>{" "}
                      {formatDate(exam.due_date)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exam.hasEssayQuiz && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                        Essay
                      </span>
                    )}
                    {exam.hasMultipleChoice && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded">
                        Multiple Choice
                      </span>
                    )}
                    {!exam.hasEssayQuiz && !exam.hasMultipleChoice && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                        No Quizzes
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-3">
                  <Link
                    to={`/teachers/exams/detail/${exam._id}`}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    title="View Details"
                  >
                    <FaEye className="h-5 w-5" />
                  </Link>
                  {user?.role === "Guru" && (
                    <>
                      <Link
                        to={`/teachers/exams/edit/${exam._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <FaEdit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(exam)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <FaTrash className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredExams.length} of{" "}
              {data?.pagination?.totalExams || 0} exams
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(data?.pagination?.prevPage)}
                disabled={!data?.pagination?.prevPage || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-gray-700 dark:border-gray-300 rounded-full" />
                )}
                Previous
              </button>
              <button
                onClick={() => handlePageChange(data?.pagination?.nextPage)}
                disabled={!data?.pagination?.nextPage || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-gray-700 dark:border-gray-300 rounded-full" />
                )}
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Deletion
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the exam{" "}
              <span className="font-medium">"{examToDelete?.title}"</span>? This
              action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 w-full sm:w-auto flex items-center justify-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exam;
