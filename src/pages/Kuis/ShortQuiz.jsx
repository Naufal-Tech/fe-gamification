/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
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

// Component for handling confirmation modals
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
            ) : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for mobile quiz card
const MobileQuizCard = ({
  quiz,
  onDelete,
  onStatusChange,
  user,
  publishMutation,
  draftMutation,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700">
      <div className="flex justify-between items-start">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
          {quiz.title}
        </h3>
        <StatusBadge status={quiz.status} />
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p className="truncate">
          <span className="font-semibold">Description:</span>{" "}
          {quiz.description || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Category:</span>{" "}
          {quiz.category?.name || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Class:</span>{" "}
          {Array.isArray(quiz.kelas)
            ? quiz.kelas.map((k) => k.name).join(", ")
            : quiz.kelas?.name || "N/A"}
        </p>
        <div className="flex justify-between">
          <p>
            <span className="font-semibold">Semester:</span>{" "}
            {quiz.semester || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Questions:</span>{" "}
            {quiz.questions?.length || 0}
          </p>
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-3">
        <Link
          to={`/teachers/short-quiz/detail/${quiz._id}`}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          title="View Details"
          aria-label="View quiz details"
        >
          <FaEye className="h-5 w-5" />
        </Link>
        {user?.role === "Guru" && (
          <>
            <Link
              to={`/teachers/short-quiz/edit/${quiz._id}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              title="Edit"
              aria-label="Edit quiz"
            >
              <FaEdit className="h-5 w-5" />
            </Link>
            <button
              onClick={() => onDelete(quiz)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title="Delete"
              aria-label="Delete quiz"
            >
              <FaTrash className="h-5 w-5" />
            </button>
            {quiz.status === "draft" ? (
              <button
                onClick={() => onStatusChange(quiz, "published")}
                disabled={publishMutation.isLoading}
                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Publish"
                aria-label="Publish quiz"
              >
                Publish
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(quiz, "draft")}
                disabled={draftMutation.isLoading}
                className="px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Set to Draft"
                aria-label="Set quiz to draft"
              >
                Draft
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
        status === "published"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      }`}
    >
      {status || "N/A"}
    </span>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className="h-24 sm:h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
        ></div>
      ))}
  </div>
);

// Real-time loading indicator
const RealTimeLoader = ({ isLoading, text = "Loading..." }) => {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
      <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-blue-600 rounded-full"></div>
      <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
        {text}
      </span>
    </div>
  );
};

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <nav className="flex items-center justify-center space-x-1">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        First
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 border-t border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {getPageNumbers().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`px-3 py-2 text-sm font-medium border-t border-b border-gray-300 dark:border-gray-600 ${
            pageNum === currentPage
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
              : "text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {pageNum}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 border-t border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Last
      </button>
    </nav>
  );
};

// Main ShortQuiz component
function ShortQuiz() {
  // Get initial data from loader
  const initialData = useLoaderData();

  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField") || "title";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const myQuizzes = searchParams.get("myQuizzes") || "false";

  // Local state
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  // Auth and query client
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  const apiEndpoint = "/v1/short-quiz";

  // Query key for caching
  const queryKey = [
    "shortQuizzes",
    page,
    searchQuery,
    searchField,
    sortBy,
    sortOrder,
    myQuizzes,
  ];

  // Debounced search handler
  const debouncedSearch = debounce((value, field) => {
    const params = {
      page: "1",
      searchField: field,
      myQuizzes,
    };
    if (value) params.search = value;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    setSearchParams(params);
  }, 500);

  useEffect(() => {
    setSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);

  // Fetch quizzes with React Query - with real-time updates
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      });

      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    // Use initial data from loader
    initialData: initialData,
    // Enable real-time updates
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab is not active
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnected to internet
    staleTime: 5000, // Data is fresh for 5 seconds
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(`${apiEndpoint}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries(queryKey);
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((quiz) => quiz._id !== id),
        };
      });
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Delete Error:", err.response?.data || err.message);
      queryClient.setQueryData(queryKey, context?.previousData);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete short quiz";
      toast.error(errorMessage);
    },
    onSuccess: (response) => {
      toast.success(
        response.data?.message || "Short quiz deleted successfully"
      );
      // Trigger immediate refresh
      queryClient.invalidateQueries(queryKey);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (id) =>
      api.put(
        `${apiEndpoint}/publish/${id}`,
        { status: "published" },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
    onMutate: async (id) => {
      await queryClient.cancelQueries(queryKey);
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((quiz) =>
            quiz._id === id ? { ...quiz, status: "published" } : quiz
          ),
        };
      });
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Publish Error:", err.response?.data || err.message);
      queryClient.setQueryData(queryKey, context?.previousData);
      toast.error("Failed to publish short quiz");
    },
    onSuccess: () => {
      toast.success("Short quiz published successfully");
      queryClient.invalidateQueries(queryKey);
    },
  });

  // Draft mutation
  const draftMutation = useMutation({
    mutationFn: (id) =>
      api.put(
        `${apiEndpoint}/draft/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
    onMutate: async (id) => {
      await queryClient.cancelQueries(queryKey);
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((quiz) =>
            quiz._id === id ? { ...quiz, status: "draft" } : quiz
          ),
        };
      });
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Draft Error:", err.response?.data || err.message);
      queryClient.setQueryData(queryKey, context?.previousData);
      toast.error("Failed to set short quiz to draft");
    },
    onSuccess: () => {
      toast.success("Short quiz reverted to draft successfully");
      queryClient.invalidateQueries(queryKey);
    },
  });

  // Manual refresh function
  const handleRefresh = () => {
    queryClient.invalidateQueries(queryKey);
  };

  // Event handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value, searchField);
  };

  const handleSearchFieldChange = (e) => {
    const newField = e.target.value;
    const params = { page: "1", searchField: newField, myQuizzes };
    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    setSearchParams(params);
  };

  const handleSortChange = (field) => {
    const newSortOrder =
      sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";

    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy: field,
      sortOrder: newSortOrder,
      myQuizzes,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage && newPage >= 1 && newPage <= (data?.totalPages || 1)) {
      setSearchParams({
        page: newPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      });
    }
  };

  const toggleMyQuizzes = () => {
    const newValue = myQuizzes === "true" ? "false" : "true";
    setSearchParams({
      page: "1",
      myQuizzes: newValue,
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy,
      sortOrder,
    });
  };

  const handleDeleteClick = (quiz) => {
    setQuizToDelete(quiz);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (quizToDelete) {
      deleteMutation.mutate(quizToDelete._id);
    }
    setIsModalOpen(false);
    setQuizToDelete(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setQuizToDelete(null);
  };

  const handleStatusChange = (quiz, newStatus) => {
    if (newStatus === "published") {
      publishMutation.mutate(quiz._id);
    } else {
      draftMutation.mutate(quiz._id);
    }
  };

  // Data processing
  const filteredQuizzes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || page;

  // Render functions
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {myQuizzes === "true"
            ? "Kuis Jawaban Singkat Saya"
            : "Kuis Jawab Singkat"}
        </h1>
        {user?.role === "Guru" && (
          <button
            onClick={toggleMyQuizzes}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              myQuizzes === "true"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {myQuizzes === "true" ? "Show All" : "My Quizzes"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {user?.role === "Guru" && (
          <Link
            to="/teachers/short-quiz/new"
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Tambah
          </Link>
        )}
        <button
          onClick={handleRefresh}
          disabled={isFetching || isLoading}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh data"
        >
          <FaSync
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
    </div>
  );

  const renderSearchControls = () => (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex gap-2">
        <select
          value={searchField}
          onChange={handleSearchFieldChange}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 text-sm sm:text-base w-40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="title">Title</option>
          <option value="category">Category</option>
          <option value="kelas">Class</option>
          <option value="status">Status</option>
        </select>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search by ${searchField}...`}
            value={search}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-2 md:col-span-2">
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 text-sm sm:text-base flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="title">Sort by Title</option>
          <option value="category">Sort by Category</option>
          <option value="kelas">Sort by Class</option>
          <option value="status">Sort by Status</option>
          <option value="created_at">Sort by Date</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSearchParams({
              page: "1",
              ...(searchQuery && { search: searchQuery }),
              searchField,
              sortBy,
              sortOrder: e.target.value,
              myQuizzes,
            });
          }}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 text-sm sm:text-base w-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );

  const renderDesktopTable = () => (
    <div className="hidden sm:block overflow-x-auto shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <tr>
            <th
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3 text-center">Semester</th>
            <th className="px-4 py-3 text-center">Questions</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredQuizzes.map((quiz) => (
            <tr
              key={quiz._id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {quiz.title}
              </td>
              <td className="px-4 py-3 max-w-xs truncate">
                {quiz.description || "N/A"}
              </td>
              <td className="px-4 py-3">{quiz.category?.name || "N/A"}</td>
              <td className="px-4 py-3">
                {Array.isArray(quiz.kelas)
                  ? quiz.kelas.map((k) => k.name).join(", ")
                  : quiz.kelas?.name || "N/A"}
              </td>
              <td className="px-4 py-3 text-center">
                {quiz.semester || "N/A"}
              </td>
              <td className="px-4 py-3 text-center">
                {quiz.questions?.length || 0}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={quiz.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <Link
                    to={`/teachers/short-quiz/detail/${quiz._id}`}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    title="View Details"
                    aria-label="View quiz details"
                  >
                    <FaEye className="h-5 w-5" />
                  </Link>
                  {user?.role === "Guru" && (
                    <>
                      <Link
                        to={`/teachers/short-quiz/edit/${quiz._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit"
                        aria-label="Edit quiz"
                      >
                        <FaEdit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(quiz)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete"
                        aria-label="Delete quiz"
                      >
                        <FaTrash className="h-5 w-5" />
                      </button>
                      {quiz.status === "draft" ? (
                        <button
                          onClick={() => handleStatusChange(quiz, "published")}
                          disabled={publishMutation.isLoading}
                          className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Publish"
                          aria-label="Publish quiz"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(quiz, "draft")}
                          disabled={draftMutation.isLoading}
                          className="px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Set to Draft"
                          aria-label="Set quiz to draft"
                        >
                          Draft
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="block sm:hidden space-y-4">
      {filteredQuizzes.map((quiz) => (
        <MobileQuizCard
          key={quiz._id}
          quiz={quiz}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
          user={user}
          publishMutation={publishMutation}
          draftMutation={draftMutation}
        />
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
        No short quizzes found
      </p>
      {user?.role === "Guru" && (
        <Link
          to="/teachers/short-quiz/new"
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
        >
          <FaPlus className="mr-2" />
          Create your first quiz
        </Link>
      )}
    </div>
  );

  const renderErrorState = () => (
    <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <span className="text-sm sm:text-base">
        {error?.response?.data?.error ||
          error?.message ||
          "Failed to load short quizzes"}
      </span>
      <button
        onClick={() => queryClient.invalidateQueries(queryKey)}
        className="text-red-600 dark:text-red-300 hover:underline text-sm sm:text-base"
      >
        Retry
      </button>
    </div>
  );

  // Main render
  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {renderHeader()}
      {renderSearchControls()}
      <RealTimeLoader
        isLoading={isFetching && !isLoading}
        text="Updating quizzes..."
      />
      {isLoading && <LoadingSkeleton />}
      {error && renderErrorState()}
      {!isLoading && filteredQuizzes.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {renderDesktopTable()}
          {renderMobileCards()}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the quiz "${quizToDelete?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}

export default ShortQuiz;
