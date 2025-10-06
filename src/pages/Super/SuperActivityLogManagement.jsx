import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaCalendar,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaEye,
  FaFilter,
  FaHistory,
  FaSearch,
  FaSync,
  FaTasks,
  FaTimes,
  FaTrophy,
  FaUser,
  FaUserCheck,
  FaUserPlus,
} from "react-icons/fa";
import api from "../../utils/api";

const SuperActivityLogManagement = () => {
  const [filters, setFilters] = useState({
    search: "",
    actionType: "",
    userId: "",
    startDate: "",
    endDate: "",
    sort: "desc",
    page: 1,
    limit: 20,
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch activity logs
  const {
    data: activitiesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superActivityLogs", filters, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      // Add tab-specific filters
      if (activeTab === "registrations") {
        params.append("actionType", "user_registration");
      } else if (activeTab === "xp") {
        params.delete("actionType"); // Clear actionType for XP tab to show all XP-related activities
      }

      const response = await api.get(`/v1/dashboard/logs?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch activity statistics
  const { data: statsData } = useQuery({
    queryKey: ["activityStats", filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await api.get(`/v1/dashboard/stats?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
  });

  // Fetch users for filtering
  const { data: usersData } = useQuery({
    queryKey: ["superUsersForActivity"],
    queryFn: async () => {
      const response = await api.get(
        "/v1/users?limit=1000&fields=username,fullName,email,currentLevel",
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
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

  const formatRelativeTime = (timestamp) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getActionIcon = (action) => {
    const iconMap = {
      // XP-related actions
      task_completed: "📝",
      daily_task_completed: "✅",
      milestone_achieved: "🎯",
      badge_unlocked: "🏆",
      daily_login: "🔓",
      manual_adjustment: "✏️",
      penalty_applied: "⚠️",

      // User actions
      user_registered: "👤",
      user_updated: "✏️",

      // System actions
      system_action: "⚙️",
    };
    return iconMap[action] || "📊";
  };

  const getActionColor = (action) => {
    const colorMap = {
      task_completed: "blue",
      daily_task_completed: "green",
      milestone_achieved: "purple",
      badge_unlocked: "yellow",
      daily_login: "green",
      manual_adjustment: "orange",
      penalty_applied: "red",
      user_registered: "blue",
      user_updated: "indigo",
      system_action: "gray",
    };
    return colorMap[action] || "gray";
  };

  const getActionLabel = (action) => {
    const labelMap = {
      task_completed: "Task Completed",
      daily_task_completed: "Daily Task",
      milestone_achieved: "Milestone",
      badge_unlocked: "Badge Unlocked",
      daily_login: "Daily Login",
      manual_adjustment: "Manual XP",
      penalty_applied: "Penalty",
      user_registered: "User Registered",
      user_updated: "User Updated",
      system_action: "System",
    };
    return labelMap[action] || action.replace(/_/g, " ");
  };

  const stats = useMemo(() => {
    return {
      totalRegistrations: statsData?.data?.totalRegistrations || 0,
      totalXPTransactions: statsData?.data?.totalXPTransactions || 0,
      totalXPEarned: statsData?.data?.totalXPEarned || 0,
      activeUsersToday: statsData?.data?.activeUsersToday || 0,
      completedTasksToday: statsData?.data?.completedTasksToday || 0,
      unlockedBadgesToday: statsData?.data?.unlockedBadgesToday || 0,
    };
  }, [statsData]);

  const activities = activitiesData?.data?.activities || [];
  const totalPages = activitiesData?.data?.pagination?.totalPages || 1;
  const users = usersData?.users || [];

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaHistory className="h-8 w-8 text-indigo-600" />
              Activity Log Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor all user activities and system events across the platform
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-600 rounded-lg"
              title="Refresh Data"
            >
              <FaSync className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={<FaUserPlus />}
            title="Total Registrations"
            value={stats.totalRegistrations}
            color="blue"
          />
          <StatCard
            icon={<FaChartBar />}
            title="XP Transactions"
            value={stats.totalXPTransactions}
            color="green"
          />
          <StatCard
            icon={<FaTrophy />}
            title="Total XP Earned"
            value={stats.totalXPEarned?.toLocaleString()}
            color="yellow"
            subtitle="Overall XP"
          />
          <StatCard
            icon={<FaUserCheck />}
            title="Active Today"
            value={stats.activeUsersToday}
            color="purple"
          />
          <StatCard
            icon={<FaTasks />}
            title="Tasks Completed"
            value={stats.completedTasksToday}
            color="green"
            subtitle="Today"
          />
          <StatCard
            icon={<FaCrown />}
            title="Badges Unlocked"
            value={stats.unlockedBadgesToday}
            color="orange"
            subtitle="Today"
          />
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "all", name: "All Activities", icon: FaHistory },
                {
                  id: "registrations",
                  name: "Registrations",
                  icon: FaUserPlus,
                },
                { id: "xp", name: "XP Activities", icon: FaChartBar },
                { id: "tasks", name: "Tasks", icon: FaTasks },
                { id: "badges", name: "Badges", icon: FaCrown },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Filters Section */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <FaFilter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activitiesData?.data?.pagination?.totalActivities || 0}{" "}
                    activities found
                  </p>
                </div>
              </div>
              {(filters.search ||
                filters.userId ||
                filters.actionType ||
                filters.startDate ||
                filters.endDate) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      actionType: "",
                      userId: "",
                      startDate: "",
                      endDate: "",
                      sort: "desc",
                      page: 1,
                      limit: 20,
                    })
                  }
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.fullName})
                  </option>
                ))}
              </select>

              <select
                value={filters.actionType}
                onChange={(e) =>
                  handleFilterChange("actionType", e.target.value)
                }
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">All Actions</option>
                <option value="task_completed">Task Completed</option>
                <option value="daily_task_completed">Daily Task</option>
                <option value="milestone_achieved">Milestone</option>
                <option value="badge_unlocked">Badge Unlocked</option>
                <option value="daily_login">Daily Login</option>
                <option value="manual_adjustment">Manual XP</option>
                <option value="user_registered">User Registered</option>
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Activities List */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity._id}
                  activity={activity}
                  onView={handleViewDetails}
                />
              ))}
            </div>

            {activities.length === 0 && (
              <div className="text-center py-12">
                <FaHistory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activities found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {Object.values(filters).some((val) => val !== "")
                    ? "Try adjusting your filters to see more results"
                    : "There are no activities recorded yet"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(filters.page - 1) * filters.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.min(
                    filters.page * filters.limit,
                    activitiesData?.data?.pagination?.totalActivities || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {activitiesData?.data?.pagination?.totalActivities || 0}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="h-4 w-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          filters.page === pageNum
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <span className="sm:hidden text-sm text-gray-600 dark:text-gray-400">
                  Page {filters.page} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      {showDetailModal && selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Error State
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-96">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaTimes className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to Load Activities
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  </div>
);

// StatCard Component
const StatCard = ({ icon, title, value, color, subtitle }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
    indigo: "bg-indigo-500",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {value}
            </p>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-2.5 rounded-lg ${colorClasses[color]} text-white flex-shrink-0`}
        >
          {React.cloneElement(icon, { className: "h-4 w-4" })}
        </div>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity, onView }) => {
  const getActionColor = (action) => {
    const colorMap = {
      task_completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      daily_task_completed:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      milestone_achieved:
        "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      badge_unlocked:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      daily_login:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      manual_adjustment:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      penalty_applied:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      user_registered:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      user_updated:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
      system_action:
        "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
    };
    return (
      colorMap[activity.action] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const getActionLabel = (action) => {
    const labelMap = {
      task_completed: "Task Completed",
      daily_task_completed: "Daily Task",
      milestone_achieved: "Milestone",
      badge_unlocked: "Badge Unlocked",
      daily_login: "Daily Login",
      manual_adjustment: "Manual XP",
      penalty_applied: "Penalty",
      user_registered: "User Registered",
      user_updated: "User Updated",
      system_action: "System",
    };
    return labelMap[action] || activity.action.replace(/_/g, " ");
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-2xl flex-shrink-0">
            {getActionIcon(activity.action)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                  activity.action
                )}`}
              >
                {getActionLabel(activity.action)}
              </span>
              {activity.amount !== 0 && (
                <span
                  className={`text-xs font-semibold ${
                    activity.amount > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {activity.amount > 0 ? "+" : ""}
                  {activity.amount} XP
                </span>
              )}
            </div>

            <p className="text-sm text-gray-900 dark:text-white mb-1">
              {activity.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <FaUser className="h-3 w-3" />
                <span>{activity.userDetails?.username || "Unknown User"}</span>
                {activity.userDetails?.currentLevel && (
                  <span className="text-gray-400">
                    • Level {activity.userDetails.currentLevel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <FaCalendar className="h-3 w-3" />
                <span>{formatRelativeTime(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onView(activity)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          title="View Details"
        >
          <FaEye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Activity Detail Modal
const ActivityDetailModal = ({ activity, onClose }) => {
  const getActionColor = (action) => {
    const colorMap = {
      task_completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      daily_task_completed:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      milestone_achieved:
        "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      badge_unlocked:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      daily_login:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      manual_adjustment:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      penalty_applied:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      user_registered:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      user_updated:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
      system_action:
        "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
    };
    return (
      colorMap[activity.action] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const getActionLabel = (action) => {
    const labelMap = {
      task_completed: "Task Completed",
      daily_task_completed: "Daily Task",
      milestone_achieved: "Milestone",
      badge_unlocked: "Badge Unlocked",
      daily_login: "Daily Login",
      manual_adjustment: "Manual XP",
      penalty_applied: "Penalty",
      user_registered: "User Registered",
      user_updated: "User Updated",
      system_action: "System",
    };
    return labelMap[activity.action] || activity.action.replace(/_/g, " ");
  };

  const leveledUp =
    activity.metadata?.newLevel > activity.metadata?.previousLevel;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Activity Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Action Type
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                  activity.action
                )}`}
              >
                {getActionLabel(activity.action)}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Date & Time
              </h3>
              <p className="text-gray-900 dark:text-white">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>

            {activity.amount !== 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  XP Change
                </h3>
                <p
                  className={`text-lg font-semibold ${
                    activity.amount >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {activity.amount >= 0 ? "+" : ""}
                  {activity.amount} XP
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Source
              </h3>
              <p className="text-gray-900 dark:text-white capitalize">
                {activity.source}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Description
            </h3>
            <p className="text-gray-900 dark:text-white">
              {activity.description}
            </p>
          </div>

          {/* User Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Username
                </p>
                <p className="text-gray-900 dark:text-white">
                  {activity.userDetails?.username || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Full Name
                </p>
                <p className="text-gray-900 dark:text-white">
                  {activity.userDetails?.fullName || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-gray-900 dark:text-white">
                  {activity.userDetails?.email || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current Level
                </p>
                <p className="text-gray-900 dark:text-white">
                  {activity.userDetails?.currentLevel || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Level Progress (for XP transactions) */}
          {activity.metadata?.previousLevel && activity.metadata?.newLevel && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Level Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Before
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white">
                      Level:{" "}
                      <span className="font-semibold">
                        {activity.metadata.previousLevel}
                      </span>
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      XP:{" "}
                      <span className="font-semibold">
                        {activity.metadata.previousXP?.toLocaleString() ||
                          "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    After
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white">
                      Level:{" "}
                      <span className="font-semibold">
                        {activity.metadata.newLevel}
                      </span>
                      {leveledUp && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                          +
                          {activity.metadata.newLevel -
                            activity.metadata.previousLevel}
                        </span>
                      )}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      XP:{" "}
                      <span className="font-semibold">
                        {activity.metadata.newXP?.toLocaleString() || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Technical Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activity ID
                </p>
                <p className="text-gray-900 dark:text-white font-mono text-sm">
                  {activity._id}
                </p>
              </div>
              {activity.ipAddress && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    IP Address
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {activity.ipAddress}
                  </p>
                </div>
              )}
              {activity.userAgent && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    User Agent
                  </p>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {activity.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperActivityLogManagement;
