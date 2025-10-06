// components/Dashboard.jsx
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaBolt,
  FaCheckCircle,
  FaCrown,
  FaFire,
  FaGem,
  FaMedal,
  FaStar,
  FaTasks,
  FaTrophy,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const UserDashboardHome = () => {
  const { accessToken } = useAuthStore();

  // State for filters and pagination
  const [filters, setFilters] = useState({
    view: "today", // 'today', 'upcoming', 'overdue', 'completed', 'all'
    startDate: "",
    endDate: "",
    search: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.append(key, value);
      }
    });
    Object.entries(pagination).forEach(([key, value]) => {
      params.append(key, value);
    });
    return params.toString();
  }, [filters, pagination]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard", queryParams],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        `/v1/dashboard/user-dashboard?${queryParams}`,
        config
      );
      return response.data;
    },
    enabled: !!accessToken,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Handler functions
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return <div>Error loading dashboard</div>;
  }

  const {
    user,
    overview,
    tasks,
    milestones,
    badges,
    recentActivity,
    quickStats,
    pagination: paginationInfo,
  } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={user.img_profile || "https://placehold.co/100x100"}
                alt={user.fullName}
                className="w-16 h-16 rounded-full border-4 border-yellow-400"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user.fullName || user.username}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.activeTitle || "Quest Master"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {user.totalXP?.toLocaleString()} XP
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Level {user.currentLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<FaBolt className="text-yellow-500" />}
            title="Today's XP"
            value={quickStats.xpEarnedToday}
            subtitle="XP earned today"
          />
          <StatCard
            icon={<FaCheckCircle className="text-green-500" />}
            title="Tasks Done"
            value={quickStats.tasksCompletedToday}
            subtitle={`of ${tasks.stats.activeTasks} completed`}
          />
          <StatCard
            icon={<FaFire className="text-orange-500" />}
            title="Current Streak"
            value={user.currentStreak}
            subtitle={`Longest: ${user.longestStreak} days`}
          />
          <StatCard
            icon={<FaMedal className="text-purple-500" />}
            title="Near Completion"
            value={quickStats.milestonesNearCompletion}
            subtitle="milestones"
          />
        </div>

        {/* Task Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Task Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* View Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                View
              </label>
              <select
                value={filters.view}
                onChange={(e) => handleFilterChange("view", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="today">Today's Tasks</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
                <option value="all">All Tasks</option>
              </select>
            </div>

            {/* Date Range - Start */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
            </div>

            {/* Date Range - End */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setFilters({
                  view: "today",
                  startDate: "",
                  endDate: "",
                  search: "",
                });
                setPagination({ page: 1, limit: 10 });
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Level Progress & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Level Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaCrown className="text-yellow-500" />
                Level Progress
              </h2>
              <LevelProgress overview={overview} />
            </div>

            {/* Today's Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaTasks className="text-blue-500" />
                  {filters.view === "today" && "Today's Tasks"}
                  {filters.view === "upcoming" && "Upcoming Tasks"}
                  {filters.view === "overdue" && "Overdue Tasks"}
                  {filters.view === "completed" && "Completed Tasks"}
                  {filters.view === "all" && "All Tasks"}
                </h2>
                {paginationInfo && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {paginationInfo.totalCount} tasks total
                  </span>
                )}
              </div>
              <TaskList tasks={tasks.today} />

              {/* Pagination */}
              {paginationInfo && paginationInfo.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() =>
                      handlePageChange(paginationInfo.currentPage - 1)
                    }
                    disabled={!paginationInfo.hasPrev}
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {paginationInfo.currentPage} of{" "}
                    {paginationInfo.totalPages}
                  </span>

                  <button
                    onClick={() =>
                      handlePageChange(paginationInfo.currentPage + 1)
                    }
                    disabled={!paginationInfo.hasNext}
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Available Milestones */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaTrophy className="text-green-500" />
                Milestones
              </h2>
              <MilestoneList milestones={milestones.available} />
            </div>

            {/* Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaGem className="text-purple-500" />
                Badges
              </h2>
              <BadgeShowcase badges={badges.unlocked} total={badges.total} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaStar className="text-orange-500" />
                Recent Activity
              </h2>
              <ActivityFeed transactions={recentActivity.transactions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supporting Components (keep the same as before)
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-pulse">
        <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded-xl mb-6"></div>
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl"
            ></div>
          ))}
        </div>
        <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl mb-6"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, subtitle }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

const LevelProgress = ({ overview }) => (
  <div className="space-y-4">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">
        Level {overview.levelInfo.level}
      </span>
      <span className="text-gray-600 dark:text-gray-400">
        {overview.levelInfo.xpInCurrentLevel} /{" "}
        {overview.levelInfo.xpForNextLevel} XP
      </span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
      <div
        className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
        style={{ width: `${overview.levelInfo.progress}%` }}
      ></div>
    </div>
    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
      {overview.levelInfo.xpNeededForNext} XP needed for next level
    </div>
  </div>
);

const TaskList = ({ tasks }) => (
  <div className="space-y-3">
    {tasks && tasks.length > 0 ? (
      tasks.map((task) => (
        <div
          key={task._id}
          className={`flex items-center justify-between p-3 rounded-lg border ${
            task.completedToday
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                task.completedToday ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
            <span
              className={`${
                task.completedToday
                  ? "text-green-700 dark:text-green-300 line-through"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {task.title}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            +{task.xpReward} XP
          </div>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No tasks found
      </div>
    )}
  </div>
);

const MilestoneList = ({ milestones }) => (
  <div className="space-y-4">
    {milestones && milestones.length > 0 ? (
      milestones.slice(0, 3).map((milestone) => (
        <div
          key={milestone._id}
          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {milestone.title}
            </h3>
            <span className="text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              +{milestone.xpReward} XP
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: `${milestone.progress?.progressPercentage || 0}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {milestone.progress?.currentProgress || 0} /{" "}
            {milestone.progress?.target || 0} {milestone.requirement?.type}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No available milestones
      </div>
    )}
  </div>
);

const BadgeShowcase = ({ badges, total }) => (
  <div>
    <div className="grid grid-cols-4 gap-3 mb-3">
      {badges && badges.length > 0 ? (
        badges.slice(0, 4).map((badge) => (
          <div
            key={badge._id}
            className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {badge.name}
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-4 text-center text-gray-500 dark:text-gray-400 py-4">
          No badges yet
        </div>
      )}
    </div>
    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
      {total || 0} badges unlocked
    </div>
  </div>
);

const ActivityFeed = ({ transactions }) => (
  <div className="space-y-3">
    {transactions && transactions.length > 0 ? (
      transactions.slice(0, 5).map((transaction) => (
        <div
          key={transaction._id}
          className="flex items-center justify-between text-sm"
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                transaction.amount > 0 ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
              {transaction.description}
            </span>
          </div>
          <span
            className={`font-medium ${
              transaction.amount > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {transaction.amount > 0 ? "+" : ""}
            {transaction.amount} XP
          </span>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No recent activity
      </div>
    )}
  </div>
);

export default UserDashboardHome;
