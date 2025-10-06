import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBolt,
  FaCalendar,
  FaChartLine,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaFire,
  FaGem,
  FaMedal,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const XPStats = () => {
  const { accessToken, user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);

  // Fetch XP statistics
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["xpStats", user?._id],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(`/v1/xp-transactions/my-stats`, config);
      return response.data;
    },
    enabled: !!accessToken && !!user?._id,
  });

  // Fetch transaction history
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["xpTransactions", user?._id, currentPage],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        `/v1/xp-transactions/my-transactions?page=${currentPage}&limit=${transactionsPerPage}`,
        config
      );
      return response.data;
    },
    enabled: !!accessToken && !!user?._id,
  });

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["xpLeaderboard"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        `/v1/xp-transactions/leaderboard?limit=10`,
        config
      );
      return response.data;
    },
    enabled: !!accessToken,
  });

  const stats = statsData?.data || {};
  const transactions = transactionsData?.data?.transactions || [];
  const pagination = transactionsData?.data?.pagination || {};
  const leaderboard = leaderboardData?.data?.leaderboard || [];

  const getSourceIcon = (source) => {
    const icons = {
      task: <FaCheckCircle className="text-blue-500" />,
      daily_task: <FaBolt className="text-green-500" />,
      milestone: <FaTrophy className="text-yellow-500" />,
      badge: <FaMedal className="text-purple-500" />,
      login: <FaFire className="text-orange-500" />,
      manual: <FaGem className="text-pink-500" />,
      penalty: <FaArrowDown className="text-red-500" />,
    };
    return icons[source] || <FaStar className="text-gray-500" />;
  };

  const getSourceLabel = (source) => {
    const labels = {
      task: "Task Completion",
      daily_task: "Daily Task",
      milestone: "Milestone",
      badge: "Badge Unlock",
      login: "Daily Login",
      manual: "Manual Adjustment",
      penalty: "Penalty",
    };
    return labels[source] || source;
  };

  const formatDate = (timestamp) => {
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

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getRankBadge = (rank) => {
    if (rank === 1)
      return {
        icon: <FaCrown className="text-yellow-400" />,
        color: "from-yellow-400 to-orange-500",
      };
    if (rank === 2)
      return {
        icon: <FaMedal className="text-gray-300" />,
        color: "from-gray-300 to-gray-400",
      };
    if (rank === 3)
      return {
        icon: <FaMedal className="text-amber-600" />,
        color: "from-amber-600 to-amber-700",
      };
    return {
      icon: <FaTrophy className="text-blue-400" />,
      color: "from-blue-400 to-blue-500",
    };
  };

  if (loadingStats || loadingTransactions || loadingLeaderboard) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <FaChartLine className="text-yellow-300" />
                XP Statistics
              </h1>
              <p className="text-blue-100">
                Track your experience points and progress
              </p>
            </div>
            <FaStar className="text-6xl text-yellow-300 opacity-20" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaArrowUp className="text-green-300" />
                <span className="text-sm text-blue-200">Total Gained</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalXPGained || 0}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaArrowDown className="text-red-300" />
                <span className="text-sm text-blue-200">Total Lost</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalXPLost || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaStar className="text-yellow-300" />
                <span className="text-sm text-blue-200">Net XP</span>
              </div>
              <div className="text-2xl font-bold">{stats.netXP || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaCalendar className="text-purple-300" />
                <span className="text-sm text-blue-200">Transactions</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalTransactions || 0}
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          {stats.sourceStats && Object.keys(stats.sourceStats).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">XP Sources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.sourceStats).map(([source, amount]) => (
                  <div
                    key={source}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getSourceIcon(source)}
                      <span className="text-xs text-blue-200">
                        {getSourceLabel(source)}
                      </span>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        amount >= 0 ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {amount >= 0 ? "+" : ""}
                      {amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaCalendar className="text-blue-500" />
                Transaction History
              </h2>
            </div>

            <div className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <FaStar className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No transactions yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Complete tasks to start earning XP!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">
                          {getSourceIcon(transaction.source)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span>{getSourceLabel(transaction.source)}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            transaction.amount >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {transaction.amount >= 0 ? "+" : ""}
                          {transaction.amount}
                        </div>
                        {transaction.previousLevel !== transaction.newLevel && (
                          <div className="text-xs text-purple-500 dark:text-purple-400 font-semibold">
                            Level {transaction.previousLevel} →{" "}
                            {transaction.newLevel}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft />
                    Previous
                  </button>

                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                Top Players
              </h2>
            </div>

            <div className="p-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <FaTrophy className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No rankings yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((player) => {
                    const rankBadge = getRankBadge(player.rank);
                    const isCurrentUser = player._id === user?._id;

                    return (
                      <div
                        key={player._id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                          isCurrentUser
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-500"
                            : "bg-gray-50 dark:bg-gray-700 hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-r ${rankBadge.color} flex items-center justify-center text-white font-bold`}
                        >
                          {player.rank <= 3 ? rankBadge.icon : player.rank}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {player.fullName || player.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Level {player.currentLevel}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-yellow-600 dark:text-yellow-400">
                            {player.totalXP.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPStats;
