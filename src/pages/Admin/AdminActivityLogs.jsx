import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaHistory,
  FaMedal,
  FaSearch,
  FaShieldAlt,
  FaTasks,
  FaTrophy,
  FaUser,
  FaUserCheck,
  FaUserPlus,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const AdminActivityLogs = () => {
  const { accessToken, user } = useAuthStore();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const activitiesPerPage = 20;

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // Fetch activity logs
  const { data: activitiesData, isLoading: loadingActivities } = useQuery({
    queryKey: [
      "adminActivityLogs",
      currentPage,
      searchTerm,
      selectedUser,
      selectedAction,
      dateRange,
    ],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };

      let url = `/v1/activity-logs/logs?page=${currentPage}&limit=${activitiesPerPage}`;

      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (selectedAction) url += `&actionType=${selectedAction}`;
      if (dateRange.start) url += `&startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;

      const response = await api.get(url, config);
      return response.data;
    },
    enabled: !!accessToken && isAdmin,
  });

  // Fetch activity stats
  const { data: activityStats } = useQuery({
    queryKey: ["adminActivityStats", dateRange],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };

      let url = "/v1/activity-logs/stats";
      if (dateRange.start) url += `?startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;

      const response = await api.get(url, config);
      return response.data;
    },
    enabled: !!accessToken && isAdmin,
  });

  // Fetch users for filter
  const { data: usersData } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/users?limit=1000", config);
      return response.data;
    },
    enabled: !!accessToken && isAdmin,
  });

  // Handler functions
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedUser("");
    setSelectedAction("");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Helper functions
  const getActionIcon = (action) => {
    const icons = {
      task_completed: <FaCheckCircle className="text-green-500" />,
      daily_task_completed: <FaTasks className="text-blue-500" />,
      milestone_achieved: <FaTrophy className="text-yellow-500" />,
      badge_unlocked: <FaMedal className="text-purple-500" />,
      daily_login: <FaUserCheck className="text-indigo-500" />,
      manual_adjustment: <FaShieldAlt className="text-gray-500" />,
      penalty_applied: <FaExclamationTriangle className="text-red-500" />,
      user_registered: <FaUserPlus className="text-green-600" />,
      level_up: <FaChartLine className="text-orange-500" />,
      profile_updated: <FaUser className="text-teal-500" />,
    };
    return icons[action] || <FaHistory className="text-gray-500" />;
  };

  const getActionLabel = (action) => {
    const labels = {
      task_completed: "Task Completed",
      daily_task_completed: "Daily Task Completed",
      milestone_achieved: "Milestone Achieved",
      badge_unlocked: "Badge Unlocked",
      daily_login: "Daily Login",
      manual_adjustment: "Manual Adjustment",
      penalty_applied: "Penalty Applied",
      user_registered: "User Registered",
      level_up: "Level Up",
      profile_updated: "Profile Updated",
    };
    return (
      labels[action] ||
      action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getActionColor = (action) => {
    const colors = {
      task_completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      daily_task_completed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      milestone_achieved:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      badge_unlocked:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      daily_login:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      manual_adjustment:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      penalty_applied:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      user_registered:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      level_up:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      profile_updated:
        "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    };
    return (
      colors[action] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    );
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

  const formatRelativeDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(timestamp);
  };

  // Data extraction
  const activities = activitiesData?.data?.activities || [];
  const pagination = activitiesData?.data?.pagination || {};
  const stats = activityStats?.data || {};
  const usersList = usersData?.users || [];

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Activity Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Monitor all user activities and system events across the platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Activities
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalXPTransactions?.toLocaleString() || 0}
                </p>
              </div>
              <FaChartLine className="text-2xl md:text-3xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Registrations
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRegistrations?.toLocaleString() || 0}
                </p>
              </div>
              <FaUserPlus className="text-2xl md:text-3xl text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  XP Earned
                </p>
                <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                  +{stats.totalXPEarned?.toLocaleString() || 0}
                </p>
              </div>
              <FaTrophy className="text-2xl md:text-3xl text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Today
                </p>
                <p className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.activeUsersToday?.toLocaleString() || 0}
                </p>
              </div>
              <FaUserCheck className="text-2xl md:text-3xl text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <FaFilter className="inline mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm md:text-base flex-1 lg:flex-none"
                >
                  <FaFilter className="inline mr-2" />
                  Apply
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm md:text-base flex-1 lg:flex-none"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Advanced Filters - Collapsible on mobile */}
            <div
              className={`mt-4 ${showFilters ? "block" : "hidden lg:block"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
                <div className="flex flex-col justify-end space-y-2 md:space-y-0 md:flex-row md:space-x-2">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">All Users</option>
                    {usersList.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName || user.username}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">All Actions</option>
                    <option value="task_completed">Task Completed</option>
                    <option value="daily_task_completed">
                      Daily Task Completed
                    </option>
                    <option value="milestone_achieved">
                      Milestone Achieved
                    </option>
                    <option value="badge_unlocked">Badge Unlocked</option>
                    <option value="daily_login">Daily Login</option>
                    <option value="manual_adjustment">Manual Adjustment</option>
                    <option value="penalty_applied">Penalty Applied</option>
                    <option value="user_registered">User Registered</option>
                    <option value="level_up">Level Up</option>
                    <option value="profile_updated">Profile Updated</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activities
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loadingActivities ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading activities...
                </p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <FaChartLine className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No activities found
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <div className="min-w-full">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                        XP Change
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activities.map((activity) => (
                      <tr
                        key={activity._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {activity.userDetails?.img_profile ? (
                              <img
                                src={activity.userDetails.img_profile}
                                alt={
                                  activity.userDetails.fullName ||
                                  activity.userDetails.username
                                }
                                className="flex-shrink-0 h-8 w-8 rounded-full"
                              />
                            ) : (
                              <FaUser className="flex-shrink-0 h-8 w-8 text-gray-400 rounded-full bg-gray-200 p-1" />
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {activity.userDetails?.fullName ||
                                  activity.userDetails?.username ||
                                  "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Level {activity.userDetails?.currentLevel || 1}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getActionIcon(activity.action)}
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {getActionLabel(activity.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className="text-sm text-gray-900 dark:text-white max-w-48 md:max-w-xs truncate"
                            title={activity.description}
                          >
                            {activity.description}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          {activity.amount !== 0 && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.amount > 0
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {activity.amount > 0 ? "+" : ""}
                              {activity.amount} XP
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div title={formatDate(activity.timestamp)}>
                            {formatRelativeDate(activity.timestamp)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedActivity(activity)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                            title="View Details"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                  Showing page {pagination.currentPage} of{" "}
                  {pagination.totalPages} •{" "}
                  {pagination.totalActivities?.toLocaleString()} total
                  activities
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={!pagination.hasPrev}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Activity Details
              </h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User
                  </label>
                  <div className="mt-1 flex items-center">
                    {selectedActivity.userDetails?.img_profile ? (
                      <img
                        src={selectedActivity.userDetails.img_profile}
                        alt={
                          selectedActivity.userDetails.fullName ||
                          selectedActivity.userDetails.username
                        }
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    ) : (
                      <FaUser className="h-8 w-8 text-gray-400 rounded-full bg-gray-200 p-1 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedActivity.userDetails?.fullName ||
                          selectedActivity.userDetails?.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Level {selectedActivity.userDetails?.currentLevel || 1}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Action Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    {getActionIcon(selectedActivity.action)}
                    <span className="ml-2">
                      {getActionLabel(selectedActivity.action)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    XP Change
                  </label>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      selectedActivity.amount > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedActivity.amount > 0 ? "+" : ""}
                    {selectedActivity.amount} XP
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timestamp
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(selectedActivity.timestamp)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedActivity.description}
                </p>
              </div>

              {selectedActivity.metadata &&
                Object.keys(selectedActivity.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Additional Details
                    </label>
                    <div className="mt-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {JSON.stringify(selectedActivity.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
            <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogs;
