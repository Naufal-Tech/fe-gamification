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
  FaSpinner,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function EssayQuiz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField") || "title";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const myQuizzes = searchParams.get("myQuizzes") || "false";
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loadingProgress, setLoadingProgress] = useState(0);

  const apiEndpoint = "/v1/essay-quiz";
  const queryKey = [
    "essayQuizzes",
    page,
    searchQuery,
    searchField,
    sortBy,
    sortOrder,
    myQuizzes,
  ];

  // Fetch quizzes with refetch interval
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
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching in background
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnReconnect: true, // Refetch on reconnect
    staleTime: 5000, // Data is fresh for 5 seconds
    retry: 3, // Retry failed fetches up to 3 times
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
      toast.error("Failed to refresh quizzes. Retrying...");
    },
    keepPreviousData: true,
  });

  // Manual refetch function
  const handleManualRefetch = () => {
    queryClient.invalidateQueries(queryKey);
    toast.success("Refreshing quiz list...");
  };

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
        "Failed to delete essay quiz";
      toast.error(errorMessage);
    },
    onSuccess: (response) => {
      toast.success(
        response.data?.message || "Essay quiz deleted successfully"
      );
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
      toast.error("Failed to publish essay quiz");
    },
    onSuccess: () => {
      toast.success("Essay quiz published successfully");
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
      toast.error("Failed to set essay quiz to draft");
    },
    onSuccess: () => {
      toast.success("Essay quiz reverted to draft successfully");
      queryClient.invalidateQueries(queryKey);
    },
  });

  // Track all mutations loading state
  const isAnyMutationLoading =
    deleteMutation.isLoading ||
    publishMutation.isLoading ||
    draftMutation.isLoading;

  // Progress loader effect
  useEffect(() => {
    let interval;
    if (isLoading || isFetching) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
    } else {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
    }
    return () => clearInterval(interval);
  }, [isLoading, isFetching]);

  // Mutation progress effect
  useEffect(() => {
    if (isAnyMutationLoading) {
      setLoadingProgress(30);
    } else if (loadingProgress > 0 && loadingProgress < 100) {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 300);
    }
  }, [isAnyMutationLoading, loadingProgress]);

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

  // Toggle myQuizzes filter
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
    if (newPage) {
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

  const filteredQuizzes = data?.data || [];

  // Skeleton loader for table rows
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-1/2"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-1/2"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen relative">
      {/* Global Loading Indicator */}
      {(isLoading || isAnyMutationLoading || isFetching) && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
            role="progressbar"
            aria-valuenow={loadingProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {myQuizzes === "true" ? "Kuis Essay Saya" : "Kuis Essay"}
          </h1>
          {user?.role === "Guru" && (
            <button
              onClick={toggleMyQuizzes}
              className={`px-3 py-1 rounded-lg text-sm ${
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
              to="/teachers/essay-quiz/new"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Tambah
            </Link>
          )}
          <button
            onClick={handleManualRefetch}
            disabled={isFetching || isLoading}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <FaSync
              className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex gap-2">
          <select
            value={searchField}
            onChange={handleSearchFieldChange}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading || isFetching}
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
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading || isFetching}
            />
          </div>
        </div>

        <div className="flex gap-2 md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading || isFetching}
          >
            <option value="title">Sort by Title</option>
            <option value="category">Sort by Category</option>
            <option value="kelas">Sort by Class</option>
            <option value="status">Sort by Status</option>
            <option value="created_at">Sort by Date</option>
          </select>
          <select
            value={sortOrder}
            onChange={() => handleSortChange(sortBy)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading || isFetching}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Real-Time Update Indicator */}
      {isFetching && !isLoading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
          <FaSync className="animate-spin h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
            Updating quizzes... Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm sm:text-base">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load essay quizzes"}
          </span>
          <button
            onClick={handleManualRefetch}
            className="text-red-600 dark:text-red-300 hover:underline text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredQuizzes.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            No essay quizzes found
          </p>
          {user?.role === "Guru" && (
            <Link
              to="/teachers/essay-quiz/new"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Create your first quiz
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
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
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3 text-center">Semester</th>
                  <th className="px-4 py-3 text-center">Questions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading && !isFetching
                  ? Array(5)
                      .fill()
                      .map((_, i) => <SkeletonRow key={i} />)
                  : filteredQuizzes.map((quiz) => (
                      <tr
                        key={quiz._id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                      >
                        {(deleteMutation.variables === quiz._id &&
                          deleteMutation.isLoading) ||
                        (publishMutation.variables === quiz._id &&
                          publishMutation.isLoading) ||
                        (draftMutation.variables === quiz._id &&
                          draftMutation.isLoading) ? (
                          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-70 flex items-center justify-center z-10">
                            <FaSpinner className="animate-spin h-5 w-5 text-indigo-600" />
                          </div>
                        ) : null}

                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {quiz.title}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          {quiz.description || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {quiz.category?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {quiz.kelas?.length > 0
                            ? quiz.kelas.map((k) => k.name).join(", ")
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {quiz.semester || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {quiz.questions?.length || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                              quiz.status === "published"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {quiz.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex space-x-2">
                          <Link
                            to={`/teachers/essay-quiz/detail/${quiz._id}`}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="View Details"
                            aria-label="View quiz details"
                          >
                            <FaEye className="h-5 w-5" />
                          </Link>
                          {user?.role === "Guru" && (
                            <>
                              <Link
                                to={`/teachers/essay-quiz/edit/${quiz._id}`}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                                aria-label="Edit quiz"
                              >
                                <FaEdit className="h-5 w-5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(quiz)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                                aria-label="Delete quiz"
                                disabled={deleteMutation.isLoading}
                              >
                                <FaTrash className="h-5 w-5" />
                              </button>
                              {quiz.status === "draft" ? (
                                <button
                                  onClick={() =>
                                    handleStatusChange(quiz, "published")
                                  }
                                  disabled={publishMutation.isLoading}
                                  className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                                  title="Publish"
                                  aria-label="Publish quiz"
                                >
                                  {publishMutation.variables === quiz._id &&
                                  publishMutation.isLoading ? (
                                    <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                                  ) : null}
                                  Publish
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleStatusChange(quiz, "draft")
                                  }
                                  disabled={draftMutation.isLoading}
                                  className="px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                                  title="Set to Draft"
                                  aria-label="Set quiz to draft"
                                >
                                  {draftMutation.variables === quiz._id &&
                                  draftMutation.isLoading ? (
                                    <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                                  ) : null}
                                  Draft
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4">
            {isLoading && !isFetching
              ? Array(3)
                  .fill()
                  .map((_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700 animate-pulse"
                    >
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                      <div className="flex justify-end space-x-3">
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                    </div>
                  ))
              : filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700 relative"
                  >
                    {(deleteMutation.variables === quiz._id &&
                      deleteMutation.isLoading) ||
                    (publishMutation.variables === quiz._id &&
                      publishMutation.isLoading) ||
                    (draftMutation.variables === quiz._id &&
                      draftMutation.isLoading) ? (
                      <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                        <FaSpinner className="animate-spin h-5 w-5 text-indigo-600" />
                      </div>
                    ) : null}

                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                        {quiz.title}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          quiz.status === "published"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {quiz.status || "N/A"}
                      </span>
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
                        <span className="font-semibold">Classes:</span>{" "}
                        {quiz.kelas?.length > 0
                          ? quiz.kelas.map((k) => k.name).join(", ")
                          : "N/A"}
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
                        to={`/teachers/essay-quiz/detail/${quiz._id}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="View Details"
                        aria-label="View quiz details"
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      {user?.role === "Guru" && (
                        <>
                          <Link
                            to={`/teachers/essay-quiz/edit/${quiz._id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                            aria-label="Edit quiz"
                          >
                            <FaEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(quiz)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                            aria-label="Delete quiz"
                            disabled={deleteMutation.isLoading}
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                          {quiz.status === "draft" ? (
                            <button
                              onClick={() =>
                                handleStatusChange(quiz, "published")
                              }
                              disabled={publishMutation.isLoading}
                              className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                              title="Publish"
                              aria-label="Publish quiz"
                            >
                              {publishMutation.variables === quiz._id &&
                              publishMutation.isLoading ? (
                                <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                              ) : null}
                              Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(quiz, "draft")}
                              disabled={draftMutation.isLoading}
                              className="px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px]"
                              title="Set to Draft"
                              aria-label="Set quiz to draft"
                            >
                              {draftMutation.variables === quiz._id &&
                              draftMutation.isLoading ? (
                                <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                              ) : null}
                              Draft
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredQuizzes.length} of{" "}
              {data?.pagination?.totalQuizzes || 0} quizzes
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(data?.pagination?.prevPage)}
                disabled={
                  !data?.pagination?.prevPage || isLoading || isFetching
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && !data?.pagination?.prevPage ? (
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                ) : null}
                Previous
              </button>
              <button
                onClick={() => handlePageChange(data?.pagination?.nextPage)}
                disabled={
                  !data?.pagination?.nextPage || isLoading || isFetching
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && !data?.pagination?.nextPage ? (
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                ) : null}
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Deletion
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the quiz{" "}
              <span className="font-medium">"{quizToDelete?.title}"</span>? This
              action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
                disabled={deleteMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
              >
                {deleteMutation.isLoading ? (
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EssayQuiz;
