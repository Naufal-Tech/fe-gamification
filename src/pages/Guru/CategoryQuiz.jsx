/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEdit, FaEye, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function CategoryQuiz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField") || "name";
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const myCategories = searchParams.get("myCategories") || "false";
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  const apiEndpoint = "/v1/category-quiz";

  // Helper function to check if user can edit/delete a category
  const canEditCategory = (category) => {
    // Admin and Super roles can edit any category
    if (["Admin", "Super"].includes(user?.role)) {
      return true;
    }
    // Guru role can only edit their own categories
    if (user?.role === "Guru") {
      return category.creator?._id === user?._id;
    }
    return false;
  };

  // Debounced search handler
  const debouncedSearch = debounce((value, field) => {
    const params = {
      page: "1",
      searchField: field,
      myCategories,
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

  // Toggle function for myCategories filter
  const toggleMyCategories = () => {
    const newValue = myCategories === "true" ? "false" : "true";
    setSearchParams({
      page: "1",
      myCategories: newValue,
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy,
      sortOrder,
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "categories",
      page,
      searchQuery,
      searchField,
      sortBy,
      sortOrder,
      myCategories,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        searchField,
        sortBy,
        sortOrder,
        myCategories,
      });

      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
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
        "categories",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myCategories,
      ]);
      const previousData = queryClient.getQueryData([
        "categories",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        myCategories,
      ]);
      queryClient.setQueryData(
        [
          "categories",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myCategories,
        ],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((category) => category._id !== id),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Delete Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        [
          "categories",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          myCategories,
        ],
        context?.previousData
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete category";
      toast.error(errorMessage);
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Category deleted successfully");
    },
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value, searchField);
  };

  const handleSearchFieldChange = (e) => {
    const newField = e.target.value;
    const params = { page: "1", searchField: newField, myCategories };
    if (search) params.search = search;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    setSearchParams(params);
  };

  const handleSortChange = (field) => {
    const newSortOrder =
      sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy: field,
      sortOrder: newSortOrder,
      myCategories,
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
        myCategories,
      });
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete._id);
    }
    setIsModalOpen(false);
    setCategoryToDelete(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setCategoryToDelete(null);
  };

  const filteredCategories = data?.data || [];

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {myCategories === "true" ? "Kategori Kuis Saya" : "Kategori Kuis"}
          </h1>
          {["Guru", "Admin", "Super"].includes(user?.role) && (
            <button
              onClick={toggleMyCategories}
              className={`px-3 py-1 rounded-lg text-sm ${
                myCategories === "true"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {myCategories === "true" ? "Showing My Categories" : "Show All"}
            </button>
          )}
        </div>
        {["Guru", "Admin", "Super"].includes(user?.role) && (
          <Link
            to="/teachers/category-quiz/new"
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Tambah
          </Link>
        )}
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
            <option value="name">Name</option>
            <option value="description">Description</option>
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
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1"
          >
            <option value="name">Sort by Name</option>
            <option value="created_at">Sort by Created Date</option>
            <option value="updated_at">Sort by Updated Date</option>
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
              "Failed to load categories"}
          </span>
          <button
            onClick={() =>
              queryClient.invalidateQueries([
                "categories",
                page,
                searchQuery,
                searchField,
                sortBy,
                sortOrder,
                myCategories,
              ])
            }
            className="text-red-600 dark:text-red-300 hover:underline text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCategories.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            No categories found
          </p>
          {["Guru", "Admin", "Super"].includes(user?.role) && (
            <Link
              to="/teachers/category-quiz/new"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Create your first category
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
                    onClick={() => handleSortChange("name")}
                  >
                    <div className="flex items-center">
                      Name
                      {sortBy === "name" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr
                    key={category._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {category.description || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {category.creator?.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <Link
                        to={`/teachers/category-quiz/detail/${category._id}`}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="View Details"
                        aria-label="View category details"
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      {canEditCategory(category) && (
                        <>
                          <Link
                            to={`/teachers/category-quiz/edit/${category._id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                            aria-label="Edit category"
                          >
                            <FaEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(category)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                            aria-label="Delete category"
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

          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4">
            {filteredCategories.map((category) => (
              <div
                key={category._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700"
              >
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  {category.name}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="truncate">
                    <span className="font-semibold">Description:</span>{" "}
                    {category.description || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Creator:</span>{" "}
                    {category.creator?.fullName || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Created:</span>{" "}
                    {new Date(category.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex justify-end space-x-3 mt-3">
                  <Link
                    to={`/teachers/category-quiz/detail/${category._id}`}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    title="View Details"
                    aria-label="View category details"
                  >
                    <FaEye className="h-5 w-5" />
                  </Link>
                  {canEditCategory(category) && (
                    <>
                      <Link
                        to={`/teachers/category-quiz/edit/${category._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                        aria-label="Edit category"
                      >
                        <FaEdit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                        aria-label="Delete category"
                      >
                        <FaTrash className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredCategories.length} of{" "}
              {data?.pagination?.totalCategories || 0} categories
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
              Are you sure you want to delete the category{" "}
              <span className="font-medium">"{categoryToDelete?.name}"</span>?
              This action cannot be undone.
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

export default CategoryQuiz;
