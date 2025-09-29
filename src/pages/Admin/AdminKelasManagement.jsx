import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBook,
  FaChalkboardTeacher,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminKelasManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  const { accessToken, user, setUser, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const apiEndpoint = "/v1/admin/all-kelas";
  const hasAdminAccess = user && ["Admin", "Super"].includes(user.role);

  // Data fetching and mutations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["classes", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString() });
      if (searchQuery) params.append("search", searchQuery);
      const response = await api.get(`${apiEndpoint}?${params.toString()}`);
      return response.data;
    },
    enabled: hasAdminAccess && !!accessToken && !isRefreshingUser,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (class_id) => api.delete(`/v1/kelas/${class_id}`),
    onMutate: async (class_id) => {
      await queryClient.cancelQueries(["classes", page, searchQuery]);
      const previousData = queryClient.getQueryData([
        "classes",
        page,
        searchQuery,
      ]);
      queryClient.setQueryData(["classes", page, searchQuery], (old) => ({
        ...old,
        data: old?.data?.filter((kelas) => kelas._id !== class_id) || [],
      }));
      return { previousData };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(
        ["classes", page, searchQuery],
        context?.previousData
      );
      toast.error(err.response?.data?.message || "Failed to delete class");
    },
    onSuccess: () => {
      toast.success("Class deleted successfully");
    },
  });

  // Helper functions
  const refreshUserData = async () => {
    if (!accessToken) return null;
    try {
      setIsRefreshingUser(true);
      const response = await api.get("/v1/users/info-user");
      setUser(response.data.data || response.data.user);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) clearAuth();
      throw error;
    } finally {
      setIsRefreshingUser(false);
    }
  };

  const debouncedSearch = debounce((value) => {
    setSearchParams({ page: "1", ...(value && { search: value }) });
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handlePageChange = (newPage) => {
    setSearchParams({
      page: newPage.toString(),
      ...(searchQuery && { search: searchQuery }),
    });
  };

  const handleDeleteClick = (kelas) => {
    setClassToDelete(kelas);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (classToDelete) deleteMutation.mutate(classToDelete._id);
    setIsModalOpen(false);
    setClassToDelete(null);
  };

  // Authentication check
  useEffect(() => {
    if (!accessToken) navigate("/sign-in");
    if (user && !hasAdminAccess) {
      toast.error("Admin privileges required");
      navigate("/");
    }
  }, [accessToken, user, navigate]);

  // Loading states
  if (!accessToken || isRefreshingUser) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const filteredClasses = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Class Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage classes, students, and teachers
          </p>
        </div>
        <Link
          to="/admin/kelas/create"
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base shadow-sm"
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Create Class
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={handleSearchChange}
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
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
                className="h-24 sm:h-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              ></div>
            ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {error.response?.data?.message || "Failed to load classes"}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredClasses.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBook className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No classes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? `No classes match your search "${searchQuery}"`
                : "Get started by creating your first class"}
            </p>
            <Link
              to="/admin/kelas/create"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Create Class
            </Link>
          </div>
        </div>
      )}

      {/* Classes List */}
      {filteredClasses.length > 0 && (
        <>
          {/* Desktop Grid */}
          <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {filteredClasses.map((kelas) => (
              <div
                key={kelas._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
              >
                {/* Class Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {kelas.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {kelas.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() =>
                          navigate(`/admin/kelas/detail/${kelas._id}`)
                        }
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="View Details"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/kelas/edit/${kelas._id}`)
                        }
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Edit Class"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(kelas)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Class"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {new Date(kelas.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Class Stats */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                        <FaUserGraduate className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {kelas.totalStudents}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Students
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                        <FaChalkboardTeacher className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {kelas.totalTeachers}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Teachers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student Preview */}
                  {kelas.students && kelas.students.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                        <FaUsers className="mr-1" />
                        Recent Students
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {kelas.students.slice(0, 3).map((student) => (
                          <span
                            key={student.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {student.name}
                          </span>
                        ))}
                        {kelas.students.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400">
                            +{kelas.students.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Teacher Preview */}
                  {kelas.teachers && kelas.teachers.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                        <FaChalkboardTeacher className="mr-1" />
                        Teachers
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {kelas.teachers.map((teacher) => (
                          <span
                            key={teacher.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          >
                            {teacher.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Class Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                  <Link
                    to={`/admin/kelas/detail/${kelas._id}`}
                    className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    View Details
                    <FaEye className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-4 mb-6">
            {filteredClasses.map((kelas) => (
              <div
                key={kelas._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {kelas.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {kelas.description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {new Date(kelas.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center">
                    <FaUserGraduate className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {kelas.totalStudents} Students
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaChalkboardTeacher className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {kelas.totalTeachers} Teachers
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => navigate(`/admin/kelas/detail/${kelas._id}`)}
                    className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <FaEye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/admin/kelas/edit/${kelas._id}`)}
                    className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  >
                    <FaEdit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(kelas)}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <FaTrash className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-medium">{filteredClasses.length}</span> of{" "}
                <span className="font-medium">{pagination.total}</span> classes
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                  {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={
                    pagination.page >= pagination.totalPages || isLoading
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Delete Class
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {classToDelete?.name}
              </span>
              ? This action cannot be undone and will remove all associated
              students, teachers, assignments, and exams.
            </p>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {deleteMutation.isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminKelasManagement;
