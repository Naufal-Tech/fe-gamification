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
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function MultipleChoice() {
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

  const apiEndpoint = "/v1/multiple-choice";

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

  // Toggle function for myQuizzes filter
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "multipleChoiceQuizzes",
      page,
      searchQuery,
      searchField,
      sortBy,
      sortOrder,
      myQuizzes,
    ],
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
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(`${apiEndpoint}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
      const previousData = queryClient.getQueryData([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
      queryClient.setQueryData(
        [
          "multipleChoiceQuizzes",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myQuizzes,
        ],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((quiz) => quiz._id !== id),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Delete Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        [
          "multipleChoiceQuizzes",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myQuizzes,
        ],
        context?.previousData
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete multiple-choice quiz";
      toast.error(errorMessage);
    },
    onSuccess: (response) => {
      toast.success(
        response.data?.message || "Multiple-choice quiz deleted successfully"
      );
    },
  });

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
      await queryClient.cancelQueries([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
      const previousData = queryClient.getQueryData([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
      queryClient.setQueryData(
        [
          "multipleChoiceQuizzes",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myQuizzes,
        ],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((quiz) =>
              quiz._id === id ? { ...quiz, status: "published" } : quiz
            ),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Publish Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        [
          "multipleChoiceQuizzes",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myQuizzes,
        ],
        context?.previousData
      );
      toast.error("Failed to publish multiple-choice quiz");
    },
    onSuccess: () => {
      toast.success("Multiple-choice quiz published successfully");
      queryClient.invalidateQueries([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
    },
  });

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
      await queryClient.cancelQueries([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
      const previousData = queryClient.getQueryData([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
      queryClient.setQueryData(
        [
          "multipleChoiceQuizzes",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myQuizzes,
        ],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((quiz) =>
              quiz._id === id ? { ...quiz, status: "draft" } : quiz
            ),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Draft Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        [
          "multipleChoiceQuizzes",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myQuizzes,
        ],
        context?.previousData
      );
      toast.error("Failed to set multiple-choice quiz to draft");
    },
    onSuccess: () => {
      toast.success("Multiple-choice quiz reverted to draft successfully");
      queryClient.invalidateQueries([
        "multipleChoiceQuizzes",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myQuizzes,
      ]);
    },
  });

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

  const handleManualRefetch = () => {
    refetch();
    toast.success("Data refreshed successfully");
  };

  const filteredQuizzes = data?.data || [];

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {myQuizzes === "true"
              ? "Kuis Pilihan Ganda Saya"
              : "Kuis Pilihan Ganda"}
          </h1>
          {user?.role === "Guru" && (
            <button
              onClick={toggleMyQuizzes}
              className={`px-3 py-1 rounded-lg text-sm ${
                myQuizzes === "true"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {myQuizzes === "true" ? "Showing My Quizzes" : "Show All"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "Guru" && (
            <Link
              to="/teachers/multiple-choice/new"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Tambah
            </Link>
          )}
          <button
            onClick={handleManualRefetch}
            disabled={isLoading}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input with Field Selector */}
        <div className="flex gap-2">
          <select
            value={searchField}
            onChange={handleSearchFieldChange}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-40"
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
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="p-2 border rounded-lg dark-Vis:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1"
          >
            <option value="title">Sort by Title</option>
            <option value="category">Sort by Category</option>
            <option value="kelas">Sort by Class</option>
            <option value="status">Sort by Status</option>
            <option value="created_at">Sort by Date</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(sortBy, e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-32"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array(5)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              ></div>
            ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm sm:text-base">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load multiple-choice quizzes"}
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
            No multiple-choice quizzes found
          </p>
          {user?.role === "Guru" && (
            <Link
              to="/teachers/multiple-choice/new"
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
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3 text-center">Semester</th>
                  <th className="px-4 py-3 text-center">Questions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((quiz) => (
                  <tr
                    key={quiz._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
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
                      {quiz.kelas &&
                      Array.isArray(quiz.kelas) &&
                      quiz.kelas.length > 0
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
                        to={`/teachers/multiple-choice/detail/${quiz._id}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="View Details"
                        aria-label="View quiz details"
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      {user?.role === "Guru" && (
                        <>
                          <Link
                            to={`/teachers/multiple-choice/edit/${quiz._id}`}
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
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                          {quiz.status === "draft" ? (
                            <button
                              onClick={() =>
                                handleStatusChange(quiz, "published")
                              }
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700"
              >
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
                    {quiz.kelas &&
                    Array.isArray(quiz.kelas) &&
                    quiz.kelas.length > 0
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
                    to={`/teachers/multiple-choice/detail/${quiz._id}`}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    title="View Details"
                    aria-label="View quiz details"
                  >
                    <FaEye className="h-5 w-5" />
                  </Link>
                  {user?.role === "Guru" && (
                    <>
                      <Link
                        to={`/teachers/multiple-choice/edit/${quiz._id}`}
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
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredQuizzes.length} of{" "}
              {data?.pagination?.totalBundles || 0} quizzes
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(data?.pagination?.prevPage)}
                disabled={!data?.pagination?.prevPage || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && !data?.pagination?.prevPage ? (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-gray-700 dark:border-gray-300 rounded-full"></div>
                ) : null}
                Previous
              </button>
              <button
                onClick={() => handlePageChange(data?.pagination?.nextPage)}
                disabled={!data?.pagination?.nextPage || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && !data?.pagination?.nextPage ? (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-gray-700 dark:border-gray-300 rounded-full"></div>
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
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
              >
                {deleteMutation.isLoading ? (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
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

export default MultipleChoice;
