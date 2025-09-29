import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaExclamationTriangle,
  FaEye,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminTeacherManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  const { accessToken, user, setUser, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const apiEndpoint = "/v1/admin/view-teachers";
  const hasAdminAccess = user && ["Admin", "Super"].includes(user.role);

  // Data fetching and mutations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["teachers", page, searchQuery],
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
    mutationFn: (user_id) => api.delete("/v1/users", { data: { user_id } }),
    onMutate: async (user_id) => {
      await queryClient.cancelQueries(["teachers", page, searchQuery]);
      const previousData = queryClient.getQueryData([
        "teachers",
        page,
        searchQuery,
      ]);
      queryClient.setQueryData(["teachers", page, searchQuery], (old) => ({
        ...old,
        data: old?.data?.filter((teacher) => teacher._id !== user_id) || [],
      }));
      return { previousData };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(
        ["teachers", page, searchQuery],
        context?.previousData
      );
      toast.error(err.response?.data?.error || "Failed to delete teacher");
    },
    onSuccess: () => {
      toast.success("Teacher deleted successfully");
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: (user_id) =>
      api.post("/v1/admin/toggle-verification", { user_id }),
    onMutate: async (user_id) => {
      await queryClient.cancelQueries(["teachers", page, searchQuery]);
      const previousData = queryClient.getQueryData([
        "teachers",
        page,
        searchQuery,
      ]);
      queryClient.setQueryData(["teachers", page, searchQuery], (old) => ({
        ...old,
        data:
          old?.data?.map((teacher) =>
            teacher._id === user_id
              ? { ...teacher, isVerified: !teacher.isVerified }
              : teacher
          ) || [],
      }));
      return { previousData };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(
        ["teachers", page, searchQuery],
        context?.previousData
      );
      toast.error(err.response?.data?.error || "Failed to toggle verification");
    },
    onSuccess: () => {
      toast.success("Verification status updated");
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

  const handleDeleteClick = (teacher) => {
    setTeacherToDelete(teacher);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) deleteMutation.mutate(teacherToDelete._id);
    setIsModalOpen(false);
    setTeacherToDelete(null);
  };

  const handleToggleVerification = (teacher) => {
    toggleVerificationMutation.mutate(teacher._id);
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

  const filteredTeachers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Teacher Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage teachers and their permissions
          </p>
        </div>
        <Link
          to="/admin/teachers/create"
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base shadow-sm"
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Add Teacher
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
            placeholder="Search teachers..."
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
              {error.response?.data?.message || "Failed to load teachers"}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTeachers.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPlus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No teachers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? `No teachers match your search "${searchQuery}"`
                : "Get started by adding your first teacher"}
            </p>
            <Link
              to="/admin/teachers/create"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Teacher
            </Link>
          </div>
        </div>
      )}

      {/* Teachers List */}
      {filteredTeachers.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Teacher</th>
                  <th className="px-6 py-4 font-medium">Username</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">ID Number</th>
                  <th className="px-6 py-4 font-medium">Classes</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {teacher.img_profile ? (
                          <img
                            src={teacher.img_profile}
                            alt={teacher.fullName}
                            className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                              {teacher.fullName?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {teacher.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {teacher.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                      @{teacher.username}
                    </td>
                    <td className="px-6 py-4">{teacher.email}</td>
                    <td className="px-6 py-4">{teacher.noIdentity}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {teacher.totalClasses || 0} classes
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teacher.isVerified
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {teacher.isVerified ? "✓ Verified" : "⏳ Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleVerification(teacher)}
                          className={`${
                            teacher.isVerified
                              ? "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                              : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          } transition-colors`}
                          title={teacher.isVerified ? "Unverify" : "Verify"}
                        >
                          {teacher.isVerified ? (
                            <FaTimes className="h-4 w-4" />
                          ) : (
                            <FaCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/teachers/detail/${teacher._id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(teacher)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3 mb-3">
                  {teacher.img_profile ? (
                    <img
                      src={teacher.img_profile}
                      alt={teacher.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                        {teacher.fullName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      {teacher.fullName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{teacher.username}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        teacher.isVerified
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {teacher.isVerified ? "✓ Verified" : "⏳ Pending"}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold">Email:</span>
                      <br />
                      <span className="break-all">{teacher.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold">ID:</span>
                      <br />
                      {teacher.noIdentity}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Classes:</span>{" "}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {teacher.totalClasses || 0}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => handleToggleVerification(teacher)}
                    className={`flex items-center px-3 py-2 text-sm ${
                      teacher.isVerified
                        ? "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                        : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    } transition-colors`}
                  >
                    {teacher.isVerified ? (
                      <>
                        <FaTimes className="h-4 w-4 mr-1" />
                        Unverify
                      </>
                    ) : (
                      <>
                        <FaCheck className="h-4 w-4 mr-1" />
                        Verify
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/admin/teachers/detail/${teacher._id}`)
                    }
                    className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <FaEye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteClick(teacher)}
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
                <span className="font-medium">{filteredTeachers.length}</span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                teachers
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
                  Delete Teacher
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {teacherToDelete?.fullName}
              </span>
              ? This action cannot be undone and will remove all associated
              data.
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

export default AdminTeacherManagement;
