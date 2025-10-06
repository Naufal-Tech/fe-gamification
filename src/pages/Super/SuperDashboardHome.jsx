// components/SuperDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaCrown,
  FaDatabase,
  FaExclamationTriangle,
  FaGem,
  FaMedal,
  FaServer,
  FaShieldAlt,
  FaSync,
  FaTasks,
  FaTrash,
  FaTrophy,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SuperDashboardHome = () => {
  const {
    data: dashboardResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["superDashboard"],
    queryFn: async () => {
      const response = await fetch("/api/v1/dashboard/super-dashboard", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto text-center py-10">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error loading dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-4">
            {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    userStats,
    adminStats,
    gamificationStats,
    recentActivity,
    systemStats,
    leaderboard,
    quickStats,
    generatedAt,
  } = dashboardResponse;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-2xl shadow-lg">
              <FaShieldAlt className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                System-wide overview and advanced management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <FaSync
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FaCalendarAlt className="h-3 w-3" />
                <span>Last updated: {generatedAt || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={<FaUsers className="h-6 w-6" />}
            title="Daily Active Users"
            value={quickStats?.dailyActiveUsers || 0}
            subtitle="Logged in today"
            color="blue"
            trend={quickStats?.dailyActiveUsersTrend || 0}
          />
          <StatCard
            icon={<FaCheckCircle className="h-6 w-6" />}
            title="Tasks Completed"
            value={quickStats?.tasksCompletedToday || 0}
            subtitle="Completed today"
            color="green"
            trend={quickStats?.tasksCompletedTrend || 0}
          />
          <StatCard
            icon={<FaBolt className="h-6 w-6" />}
            title="Weekly XP"
            value={(gamificationStats?.weeklyXPEarned || 0).toLocaleString()}
            subtitle="XP earned this week"
            color="amber"
            trend={gamificationStats?.weeklyXPTrend || 0}
          />
          <StatCard
            icon={<FaUserShield className="h-6 w-6" />}
            title="Total Admins"
            value={adminStats?.totalAdmins || 0}
            subtitle="System administrators"
            color="purple"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - System & User Overview */}
          <div className="xl:col-span-2 space-y-6">
            {/* System Health & User Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaServer className="text-emerald-500" />
                    System Status
                  </h3>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                    Operational
                  </span>
                </div>
                <div className="space-y-4">
                  <StatRow
                    icon={<FaDatabase className="text-blue-500" />}
                    label="Total Documents"
                    value={systemStats?.totalDocuments || 0}
                    change={systemStats?.documentsChange || 0}
                  />
                  <StatRow
                    icon={<FaTrash className="text-rose-500" />}
                    label="Deleted Documents"
                    value={systemStats?.deletedDocuments || 0}
                    change={systemStats?.deletedChange || 0}
                  />
                  <StatRow
                    icon={<FaExclamationTriangle className="text-amber-500" />}
                    label="Data Issues"
                    value={systemStats?.dataIntegrityIssues || 0}
                    change={systemStats?.issuesChange || 0}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUsers className="text-blue-500" />
                  User Overview
                </h3>
                <div className="space-y-4">
                  <StatRow
                    icon={<FaUsers className="text-blue-500" />}
                    label="Total Users"
                    value={userStats?.totalUsers || 0}
                    change={userStats?.totalUsersChange || 0}
                  />
                  <StatRow
                    icon={<FaUserGraduate className="text-emerald-500" />}
                    label="Students"
                    value={userStats?.totalStudents || 0}
                    change={userStats?.studentsChange || 0}
                  />
                  <StatRow
                    icon={<FaUserShield className="text-purple-500" />}
                    label="Admins"
                    value={adminStats?.totalAdmins || 0}
                  />
                  <StatRow
                    icon={<FaCheckCircle className="text-indigo-500" />}
                    label="Active (30d)"
                    value={userStats?.activeUsers || 0}
                    change={userStats?.activeUsersChange || 0}
                  />
                </div>
              </div>
            </div>

            {/* Admin Management & Gamification Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUserShield className="text-purple-500" />
                  Admin Overview
                </h2>
                <div className="space-y-4">
                  <StatRow
                    icon={<FaUserShield className="text-purple-500" />}
                    label="Total Admins"
                    value={adminStats?.totalAdmins || 0}
                  />
                  <StatRow
                    icon={<FaCheckCircle className="text-emerald-500" />}
                    label="Active Admins"
                    value={adminStats?.activeAdmins || 0}
                  />
                  <StatRow
                    icon={<FaChartLine className="text-blue-500" />}
                    label="Admin Actions (24h)"
                    value={adminStats?.recentActions || 0}
                  />
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last Admin Login
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(adminStats?.lastAdminLogin)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <FaTrophy className="text-amber-500" />
                  Gamification Stats
                </h2>
                <div className="space-y-4">
                  <StatRow
                    icon={<FaChartLine className="text-emerald-500" />}
                    label="Average User XP"
                    value={(
                      gamificationStats?.averageUserXP || 0
                    ).toLocaleString()}
                  />
                  <StatRow
                    icon={<FaMedal className="text-orange-500" />}
                    label="Average Level"
                    value={gamificationStats?.averageUserLevel || 1}
                  />
                  <StatRow
                    icon={<FaCrown className="text-purple-500" />}
                    label="Max Level"
                    value={gamificationStats?.maxUserLevel || 1}
                  />
                  <StatRow
                    icon={<FaBolt className="text-indigo-500" />}
                    label="XP Transactions"
                    value={gamificationStats?.totalXPTransactions || 0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Gamification & Recent Activity */}
          <div className="space-y-6">
            {/* Gamification Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border-l-4 border-amber-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaTrophy className="text-amber-500" />
                Gamification
              </h3>
              <div className="space-y-4">
                <StatRow
                  icon={<FaBolt className="text-amber-500" />}
                  label="Total XP"
                  value={(
                    gamificationStats?.totalXPInSystem || 0
                  ).toLocaleString()}
                />
                <StatRow
                  icon={<FaTasks className="text-blue-500" />}
                  label="Daily Tasks"
                  value={gamificationStats?.totalDailyTasks || 0}
                />
                <StatRow
                  icon={<FaTrophy className="text-emerald-500" />}
                  label="Milestones"
                  value={gamificationStats?.totalMilestones || 0}
                />
                <StatRow
                  icon={<FaGem className="text-rose-500" />}
                  label="Badges"
                  value={gamificationStats?.totalBadges || 0}
                />
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaCrown className="text-amber-500" />
                Top Performers
              </h2>
              <div className="space-y-3">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.slice(0, 5).map((user, index) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex items-center justify-center w-6 h-6 text-white text-xs font-bold rounded-full ${
                            index === 0
                              ? "bg-gradient-to-br from-amber-500 to-orange-500"
                              : index === 1
                              ? "bg-gradient-to-br from-slate-500 to-slate-600"
                              : index === 2
                              ? "bg-gradient-to-br from-amber-700 to-amber-800"
                              : "bg-gradient-to-br from-slate-400 to-slate-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.img_profile ? (
                            <img
                              src={user.img_profile}
                              alt={user.fullName}
                              className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-600"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                              {(user.fullName || user.username)
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {user.fullName || user.username}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Level {user.currentLevel}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.totalXP?.toLocaleString()} XP
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Streak: {user.currentStreak} days
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                    No user data available
                  </p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <FaChartLine className="text-emerald-500" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentActivity?.recentTransactions &&
                recentActivity.recentTransactions.length > 0 ? (
                  recentActivity.recentTransactions
                    .slice(0, 5)
                    .map((transaction) => (
                      <div
                        key={transaction._id}
                        className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              transaction.amount > 0
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {transaction.userId?.fullName ||
                              transaction.userId?.username}
                            : {transaction.description}
                          </span>
                        </div>
                        <span
                          className={`font-semibold flex-shrink-0 ml-2 ${
                            transaction.amount > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount} XP
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supporting Components
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-900 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-pulse">
        <div className="h-10 bg-slate-300 dark:bg-slate-700 rounded-xl w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-300 dark:bg-slate-700 rounded-2xl"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-64 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  color = "blue",
  trend = 0,
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    rose: "from-rose-500 to-rose-600",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <div className="flex items-center gap-2">
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            {trend !== 0 && (
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  trend > 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                }`}
              >
                {trend > 0 ? "↗" : "↘"} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div
          className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-xl shadow-lg`}
        >
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ icon, label, value, change = 0 }) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="text-slate-500 dark:text-slate-400">{icon}</div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {change !== 0 && (
        <span
          className={`text-xs font-medium ${
            change > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {change > 0 ? "+" : ""}
          {change}%
        </span>
      )}
      <span className="font-semibold text-gray-900 dark:text-white min-w-12 text-right">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  </div>
);

export default SuperDashboardHome;
