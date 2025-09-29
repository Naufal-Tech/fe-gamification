import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaSync,
  FaTimes,
  FaTimesCircle,
  FaUser,
  FaUserCheck,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
  FaUserTimes,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const UserActivityPage = () => {
  const [userActivity, setUserActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "lastLogin",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    role: "",
    startDate: "",
    endDate: "",
    search: "",
    status: "",
    verified: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 20,
  });

  // Check if user is authorized
  const isAuthorized = useAuthStore((state) =>
    ["Admin", "Super"].includes(state.user?.role)
  );

  // Enhanced sorting functionality
  const sortedData = useMemo(() => {
    if (!userActivity || !sortConfig.key) return userActivity || [];

    return [...userActivity].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === "lastLogin") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [userActivity, sortConfig]);

  // Enhanced filtering
  const filteredData = useMemo(() => {
    if (!sortedData) return [];

    return sortedData.filter((user) => {
      const matchesSearch =
        !filters.search ||
        user.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus =
        !filters.status || user.lastActiveStatus === filters.status;
      const matchesVerified =
        !filters.verified ||
        (filters.verified === "verified" && user.isVerified) ||
        (filters.verified === "unverified" && !user.isVerified);

      return matchesSearch && matchesRole && matchesStatus && matchesVerified;
    });
  }, [sortedData, filters]);

  // Fetch user activity data
  const fetchUserActivity = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.role && { role: filters.role }),
        ...(filters.startDate &&
          filters.endDate && {
            startDate: new Date(filters.startDate).getTime(),
            endDate: new Date(filters.endDate).getTime(),
          }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await api.get("/v1/admin/user-activity", { params });
      if (response.data.success) {
        setUserActivity(response.data.data.users);
        setPagination({
          currentPage: response.data.data.pagination.currentPage,
          totalPages: response.data.data.pagination.totalPages,
          totalUsers: response.data.data.pagination.totalUsers,
          limit: response.data.data.pagination.limit,
        });
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to fetch user activity data");
      console.error("Error fetching user activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchUserActivity();
    }
  }, [isAuthorized]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <FaSort className="h-3 w-3 text-gray-400" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="h-3 w-3 text-indigo-600" />
    ) : (
      <FaSortDown className="h-3 w-3 text-indigo-600" />
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchUserActivity(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      role: "",
      startDate: "",
      endDate: "",
      search: "",
      status: "",
      verified: "",
    });
    fetchUserActivity(1);
  };

  const handlePageChange = (page) => {
    fetchUserActivity(page);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Today":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800";
      case "Active This Week":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "Active This Month":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
      case "Never Logged In":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "User":
        return <FaUserGraduate className="h-4 w-4" />;
      case "Guru":
        return <FaChalkboardTeacher className="h-4 w-4" />;
      case "Parents":
        return <FaUsers className="h-4 w-4" />;
      case "Admin":
      case "Super":
        return <FaUserShield className="h-4 w-4" />;
      default:
        return <FaUser className="h-4 w-4" />;
    }
  };

  const getActivityStats = () => {
    if (!filteredData)
      return {
        total: 0,
        activeToday: 0,
        activeWeek: 0,
        activeMonth: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
      };

    return {
      total: filteredData.length,
      activeToday: filteredData.filter(
        (u) => u.lastActiveStatus === "Active Today"
      ).length,
      activeWeek: filteredData.filter(
        (u) => u.lastActiveStatus === "Active This Week"
      ).length,
      activeMonth: filteredData.filter(
        (u) => u.lastActiveStatus === "Active This Month"
      ).length,
      inactive: filteredData.filter(
        (u) =>
          u.lastActiveStatus === "Inactive" ||
          u.lastActiveStatus === "Never Logged In"
      ).length,
      verified: filteredData.filter((u) => u.isVerified).length,
      unverified: filteredData.filter((u) => !u.isVerified).length,
    };
  };

  const stats = getActivityStats();

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-md border ${
              page === currentPage
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <FaUserShield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Restricted
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administrator privileges are required to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !userActivity) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 h-24"
              ></div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Error loading user activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={() => fetchUserActivity()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            User Activity Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor user engagement and track login activity across all roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${
              showFilters
                ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <FaFilter className="h-3 w-3" />
            Filters
          </button>
          <button
            onClick={() => fetchUserActivity()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <FaSync className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                Total Users
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {pagination.totalUsers || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-600 text-white">
              <FaUsers className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                Active Today
              </p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {stats.activeToday}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-600 text-white">
              <FaUserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                This Week
              </p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {stats.activeWeek}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-600 text-white">
              <FaClock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                Inactive
              </p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.inactive}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-600 text-white">
              <FaUserTimes className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                Verified
              </p>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {stats.verified}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-600 text-white">
              <FaCheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Unverified
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.unverified}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-600 text-white">
              <FaTimesCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 transition-all duration-300 transform">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-t-xl p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <FaFilter className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Advanced Filters
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Refine your search with multiple filter options
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleFilterSubmit} className="p-6">
            {/* First Row - Search and Primary Filters */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FaSearch className="inline h-4 w-4 mr-2 text-indigo-600" />
                    Search Users
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="pl-11 block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200 text-sm py-3"
                      placeholder="Search by name or email address..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FaUsers className="inline h-4 w-4 mr-2 text-indigo-600" />
                    User Role
                  </label>
                  <select
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200 text-sm py-3"
                  >
                    <option value="">All Roles</option>
                    <option value="User">👨‍🎓 Student</option>
                    <option value="Guru">👨‍🏫 Teacher</option>
                    <option value="Parents">👨‍👩‍👧‍👦 Parent</option>
                    <option value="Admin">🛡️ Admin</option>
                    <option value="Super">⚡ Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <FaClock className="inline h-4 w-4 mr-2 text-indigo-600" />
                    Activity Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200 text-sm py-3"
                  >
                    <option value="">All Status</option>
                    <option value="Active Today">🟢 Active Today</option>
                    <option value="Active This Week">
                      🔵 Active This Week
                    </option>
                    <option value="Active This Month">
                      🟡 Active This Month
                    </option>
                    <option value="Inactive">⚫ Inactive</option>
                    <option value="Never Logged In">🔴 Never Logged In</option>
                  </select>
                </div>
              </div>

              {/* Second Row - Secondary Filters */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <FaCheckCircle className="inline h-4 w-4 mr-2 text-indigo-600" />
                      Verification Status
                    </label>
                    <select
                      name="verified"
                      value={filters.verified}
                      onChange={handleFilterChange}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200 text-sm py-3"
                    >
                      <option value="">All Users</option>
                      <option value="verified">✅ Verified Only</option>
                      <option value="unverified">❌ Unverified Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <FaCalendarAlt className="inline h-4 w-4 mr-2 text-indigo-600" />
                      Date From
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200 text-sm py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <FaCalendarAlt className="inline h-4 w-4 mr-2 text-indigo-600" />
                      Date To
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200 text-sm py-3"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredData.length} user
                    {filteredData.length !== 1 ? "s" : ""} found
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center gap-2"
                    >
                      <FaTimes className="h-4 w-4" />
                      Reset All
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaFilter className="mr-2 h-3 w-3" />
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-2">
                    User
                    {getSortIcon("fullName")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center gap-2">
                    Role
                    {getSortIcon("role")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Verification
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-2">
                    Registered
                    {getSortIcon("created_at")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("lastLogin")}
                >
                  <div className="flex items-center gap-2">
                    Last Login
                    {getSortIcon("lastLogin")}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("lastActiveStatus")}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon("lastActiveStatus")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData?.length > 0 ? (
                filteredData.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "Admin" || user.role === "Super"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : user.role === "Guru"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : user.role === "Parents"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {user.role === "Guru" ? "Teacher" : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.className || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.isVerified ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <FaCheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 dark:text-red-400">
                            <FaTimesCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Unverified</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                          user.lastActiveStatus
                        )}`}
                      >
                        {user.lastActiveStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <FaUsers className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-lg font-medium mb-2">No users found</p>
                      <p className="text-sm">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  User Details
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center mr-4">
                    {getRoleIcon(selectedUser.role)}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {selectedUser.fullName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Role
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedUser.role === "Guru"
                          ? "Teacher"
                          : selectedUser.role}
                      </dd>
                    </div>

                    {selectedUser.className && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Class
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedUser.className}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </dt>
                      <dd>
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                            selectedUser.lastActiveStatus
                          )}`}
                        >
                          {selectedUser.lastActiveStatus}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Verification
                      </dt>
                      <dd className="flex items-center">
                        {selectedUser.isVerified ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <FaCheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 dark:text-red-400">
                            <FaTimesCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Unverified</span>
                          </div>
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Registration Date
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(selectedUser.created_at)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Last Login
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedUser.lastLogin
                          ? formatDate(selectedUser.lastLogin)
                          : "Never logged in"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityPage;
