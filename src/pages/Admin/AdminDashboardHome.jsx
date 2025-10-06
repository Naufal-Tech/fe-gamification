// components/AdminDashboard.jsx
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  FaBolt,
  FaChartLine,
  FaCheckCircle,
  FaCrown,
  FaDatabase,
  FaExclamationTriangle,
  FaGem,
  FaMedal,
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

const AdminDashboardHome = () => {
  const {
    data: dashboardResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const response = await fetch("/api/v1/dashboard/admin-dashboard", {
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto text-center py-10">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Error loading dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    userStats,
    gamificationStats,
    recentActivity,
    systemStats,
    leaderboard,
    quickStats,
    generatedAt,
  } = dashboardResponse;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              System overview and management statistics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {generatedAt || "N/A"}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            icon={<FaUsers className="text-blue-500" />}
            title="Daily Active Users"
            value={quickStats?.dailyActiveUsers || 0}
            subtitle="Logged in today"
          />
          <StatCard
            icon={<FaCheckCircle className="text-green-500" />}
            title="Tasks Completed"
            value={quickStats?.tasksCompletedToday || 0}
            subtitle="Completed today"
          />
          <StatCard
            icon={<FaBolt className="text-yellow-500" />}
            title="Weekly XP"
            value={(gamificationStats?.weeklyXPEarned || 0).toLocaleString()}
            subtitle="XP earned this week"
          />
          <StatCard
            icon={<FaUserGraduate className="text-purple-500" />}
            title="New Users"
            value={userStats?.newUsersThisWeek || 0}
            subtitle="This week"
          />
        </div>

        {/* User Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FaUsers className="text-blue-500" />
            User Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              icon={<FaUsers className="text-blue-500" />}
              title="Total Users"
              value={userStats?.totalUsers || 0}
              subtitle="All users"
              compact
            />
            <StatCard
              icon={<FaUserGraduate className="text-green-500" />}
              title="Students"
              value={userStats?.totalStudents || 0}
              subtitle="Student users"
              compact
            />
            <StatCard
              icon={<FaUserShield className="text-purple-500" />}
              title="Teachers"
              value={userStats?.totalTeachers || 0}
              subtitle="Teacher users"
              compact
            />
            <StatCard
              icon={<FaUserShield className="text-red-500" />}
              title="Admins"
              value={userStats?.totalAdmins || 0}
              subtitle="Admin users"
              compact
            />
            <StatCard
              icon={<FaCheckCircle className="text-indigo-500" />}
              title="Active Users"
              value={userStats?.activeUsers || 0}
              subtitle="Last 30 days"
              compact
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gamification Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              Gamification Stats
            </h2>
            <div className="space-y-4">
              <StatRow
                icon={<FaBolt className="text-yellow-500" />}
                label="Total XP in System"
                value={(
                  gamificationStats?.totalXPInSystem || 0
                ).toLocaleString()}
              />
              <StatRow
                icon={<FaChartLine className="text-green-500" />}
                label="Average User XP"
                value={(gamificationStats?.averageUserXP || 0).toLocaleString()}
              />
              <StatRow
                icon={<FaMedal className="text-orange-500" />}
                label="Average User Level"
                value={gamificationStats?.averageUserLevel || 1}
              />
              <StatRow
                icon={<FaCrown className="text-purple-500" />}
                label="Max User Level"
                value={gamificationStats?.maxUserLevel || 1}
              />
              <StatRow
                icon={<FaTasks className="text-blue-500" />}
                label="Daily Tasks"
                value={gamificationStats?.totalDailyTasks || 0}
              />
              <StatRow
                icon={<FaTrophy className="text-green-500" />}
                label="Milestones"
                value={gamificationStats?.totalMilestones || 0}
              />
              <StatRow
                icon={<FaGem className="text-pink-500" />}
                label="Badges"
                value={gamificationStats?.totalBadges || 0}
              />
              <StatRow
                icon={<FaBolt className="text-indigo-500" />}
                label="XP Transactions"
                value={gamificationStats?.totalXPTransactions || 0}
              />
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <FaDatabase className="text-green-500" />
              System Health
            </h2>
            <div className="space-y-4">
              <StatRow
                icon={<FaDatabase className="text-blue-500" />}
                label="Total Documents"
                value={systemStats?.totalDocuments || 0}
              />
              <StatRow
                icon={<FaTrash className="text-red-500" />}
                label="Deleted Documents"
                value={systemStats?.deletedDocuments || 0}
              />
              <StatRow
                icon={<FaExclamationTriangle className="text-yellow-500" />}
                label="Data Integrity Issues"
                value={systemStats?.dataIntegrityIssues || 0}
              />
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Data Update
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(systemStats?.lastDataUpdate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <FaCrown className="text-yellow-500" />
              Top Performers
            </h2>
            <div className="space-y-3">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((user, index) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white text-xs font-bold rounded-full">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.img_profile && (
                          <img
                            src={user.img_profile}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full"
                          />
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <FaChartLine className="text-green-500" />
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
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            transaction.amount > 0
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                          {transaction.userId?.fullName ||
                            transaction.userId?.username}
                          : {transaction.description}
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
                <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supporting Components
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-300 dark:bg-gray-700 rounded-xl"
            ></div>
          ))}
        </div>
        <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, subtitle, compact = false }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm ${
      compact ? "p-4" : "p-6"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`${
            compact ? "text-xs" : "text-sm"
          } font-medium text-gray-600 dark:text-gray-400`}
        >
          {title}
        </p>
        <p
          className={`${
            compact ? "text-lg" : "text-2xl"
          } font-bold text-gray-900 dark:text-white mt-1`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p
            className={`${
              compact ? "text-xs" : "text-sm"
            } text-gray-500 dark:text-gray-400 mt-1`}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className={`${compact ? "text-2xl" : "text-3xl"}`}>{icon}</div>
    </div>
  </div>
);

const StatRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      {icon}
      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
        {label}
      </span>
    </div>
    <span className="font-semibold text-gray-900 dark:text-white">
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  </div>
);

export default AdminDashboardHome;
