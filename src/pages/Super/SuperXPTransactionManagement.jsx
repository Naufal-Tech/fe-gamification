import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaFilter,
  FaHistory,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import api from "../../utils/api";

const SuperXPTransactionManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    userId: "",
    source: "",
    startDate: "",
    endDate: "",
    sort: "recently",
    page: 1,
    limit: 20,
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all transactions (Admin only)
  const {
    data: transactionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superXPTransactions", filters, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(
        `/v1/xp-transactions/admin/transactions?${params}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch admin statistics
  const { data: statsData } = useQuery({
    queryKey: ["xpTransactionStats"],
    queryFn: async () => {
      const response = await api.get("/v1/xp-transactions/admin/stats", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  // Fetch users for filtering and manual transactions
  const { data: usersData } = useQuery({
    queryKey: ["superUsersForXP"],
    queryFn: async () => {
      const response = await api.get(
        "/v1/users?limit=1000&fields=username,fullName,currentLevel,totalXP",
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId) => {
      const response = await api.delete(
        `/v1/xp-transactions/${transactionId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superXPTransactions"]);
      queryClient.invalidateQueries(["xpTransactionStats"]);
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    },
  });

  const createManualMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/v1/xp-transactions/manual", data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superXPTransactions"]);
      queryClient.invalidateQueries(["xpTransactionStats"]);
      setShowCreateModal(false);
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      deleteMutation.mutate(selectedTransaction._id);
    }
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const getSourceColor = (source) => {
    const colors = {
      task: "blue",
      milestone: "purple",
      badge: "yellow",
      login: "green",
      manual: "orange",
      penalty: "red",
    };
    return colors[source] || "gray";
  };

  const getSourceIcon = (source) => {
    const icons = {
      task: "📝",
      milestone: "🎯",
      badge: "🏆",
      login: "🔓",
      manual: "✏️",
      penalty: "⚠️",
    };
    return icons[source] || "📊";
  };

  const stats = useMemo(() => {
    const transactions = transactionsData?.data?.transactions || [];
    const positiveXP = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const negativeXP = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netXP = positiveXP - negativeXP;

    // Count by source
    const sourceCounts = {
      task: transactions.filter((t) => t.source === "task").length,
      milestone: transactions.filter((t) => t.source === "milestone").length,
      badge: transactions.filter((t) => t.source === "badge").length,
      login: transactions.filter((t) => t.source === "login").length,
      manual: transactions.filter((t) => t.source === "manual").length,
      penalty: transactions.filter((t) => t.source === "penalty").length,
    };

    return {
      total: transactionsData?.data?.pagination?.totalCount || 0,
      positiveXP,
      negativeXP,
      netXP,
      sourceCounts,
      ...statsData?.data,
    };
  }, [transactionsData, statsData]);

  const transactions = transactionsData?.data?.transactions || [];
  const totalPages = transactionsData?.data?.pagination?.totalPages || 1;
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
              <FaChartLine className="h-8 w-8 text-green-600" />
              XP Transaction Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor and manage all XP transactions across the platform
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

            {/* Action Buttons */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
            >
              <FaPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Manual XP</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={<FaHistory />}
            title="Total Transactions"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<FaArrowUp />}
            title="XP Gained"
            value={formatNumber(stats.positiveXP)}
            color="green"
            subtitle="Total positive XP"
          />
          <StatCard
            icon={<FaArrowDown />}
            title="XP Lost"
            value={formatNumber(stats.negativeXP)}
            color="red"
            subtitle="Total negative XP"
          />
          <StatCard
            icon={<FaChartLine />}
            title="Net XP"
            value={formatNumber(stats.netXP)}
            color={stats.netXP >= 0 ? "purple" : "orange"}
            subtitle={stats.netXP >= 0 ? "Overall gain" : "Overall loss"}
          />
          <StatCard
            icon={<FaTrophy />}
            title="Manual"
            value={stats.sourceCounts?.manual || 0}
            color="orange"
          />
          <StatCard
            icon={<FaUser />}
            title="Tasks"
            value={stats.sourceCounts?.task || 0}
            color="blue"
          />
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "all", name: "All Transactions", icon: FaHistory },
                { id: "positive", name: "XP Gains", icon: FaArrowUp },
                { id: "negative", name: "XP Losses", icon: FaArrowDown },
                { id: "manual", name: "Manual", icon: FaEdit },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600 dark:text-green-400"
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
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <FaFilter className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transactionsData?.data?.pagination?.totalCount || 0}{" "}
                    transactions found
                  </p>
                </div>
              </div>
              {(filters.search ||
                filters.userId ||
                filters.source ||
                filters.startDate ||
                filters.endDate) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      userId: "",
                      source: "",
                      startDate: "",
                      endDate: "",
                      sort: "recently",
                      page: 1,
                      limit: 20,
                    })
                  }
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
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
                  placeholder="Search descriptions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.fullName})
                  </option>
                ))}
              </select>

              <select
                value={filters.source}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">All Sources</option>
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
                <option value="badge">Badge</option>
                <option value="login">Login</option>
                <option value="manual">Manual</option>
                <option value="penalty">Penalty</option>
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Level Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction._id}
                    transaction={transaction}
                    onView={handleViewDetails}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <FaHistory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No transactions found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {Object.values(filters).some((val) => val !== "")
                    ? "Try adjusting your filters to see more results"
                    : "There are no XP transactions recorded yet"}
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
                    transactionsData?.data?.pagination?.totalCount || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {transactionsData?.data?.pagination?.totalCount || 0}
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
                            ? "bg-green-600 text-white"
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

      {/* Modals */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {showDeleteModal && selectedTransaction && (
        <DeleteConfirmModal
          transaction={selectedTransaction}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedTransaction(null);
          }}
          isDeleting={deleteMutation.isLoading}
        />
      )}

      {showCreateModal && (
        <CreateManualTransactionModal
          users={users}
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createManualMutation.mutate(data)}
          isCreating={createManualMutation.isLoading}
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
        Failed to Load Transactions
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
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

// Transaction Row Component
const TransactionRow = ({ transaction, onView, onDelete }) => {
  const getSourceColor = (source) => {
    const colors = {
      task: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      milestone:
        "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      badge:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      login:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      manual:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      penalty: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return (
      colors[transaction.source] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  const getSourceIcon = (source) => {
    const icons = {
      task: "📝",
      milestone: "🎯",
      badge: "🏆",
      login: "🔓",
      manual: "✏️",
      penalty: "⚠️",
    };
    return icons[source] || "📊";
  };

  const leveledUp = transaction.newLevel > transaction.previousLevel;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="text-xl">{getSourceIcon(transaction.source)}</div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {transaction.description}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getSourceColor(
                transaction.source
              )}`}
            >
              {transaction.source}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FaUser className="h-4 w-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {transaction.userId?.username || "Unknown User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Level {transaction.userId?.currentLevel || transaction.newLevel}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            transaction.amount >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {transaction.amount >= 0 ? (
            <FaArrowUp className="h-3 w-3" />
          ) : (
            <FaArrowDown className="h-3 w-3" />
          )}
          {transaction.amount >= 0 ? "+" : ""}
          {transaction.amount.toLocaleString()} XP
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {transaction.previousLevel}
          </span>
          <FaArrowRight className="h-3 w-3 text-gray-400" />
          <span
            className={`font-medium ${
              leveledUp
                ? "text-green-600 dark:text-green-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {transaction.newLevel}
          </span>
          {leveledUp && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
              +{transaction.newLevel - transaction.previousLevel}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(transaction.created_at).toLocaleDateString()}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(transaction.created_at).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(transaction)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="View Details"
          >
            <FaEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            title="Delete Transaction"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Transaction Detail Modal
const TransactionDetailModal = ({ transaction, onClose }) => {
  const leveledUp = transaction.newLevel > transaction.previousLevel;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Transaction Details
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
                Description
              </h3>
              <p className="text-gray-900 dark:text-white">
                {transaction.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Source
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 capitalize">
                {transaction.source}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Amount
              </h3>
              <p
                className={`text-lg font-semibold ${
                  transaction.amount >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {transaction.amount >= 0 ? "+" : ""}
                {transaction.amount.toLocaleString()} XP
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Date & Time
              </h3>
              <p className="text-gray-900 dark:text-white">
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
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
                  {transaction.userId?.username || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Full Name
                </p>
                <p className="text-gray-900 dark:text-white">
                  {transaction.userId?.fullName || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Level Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Before Transaction
                </p>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-white">
                    Level:{" "}
                    <span className="font-semibold">
                      {transaction.previousLevel}
                    </span>
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    XP:{" "}
                    <span className="font-semibold">
                      {transaction.previousXP.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  After Transaction
                </p>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-white">
                    Level:{" "}
                    <span className="font-semibold">
                      {transaction.newLevel}
                    </span>
                    {leveledUp && (
                      <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                        +{transaction.newLevel - transaction.previousLevel}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    XP:{" "}
                    <span className="font-semibold">
                      {transaction.newXP.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* XP Change Visualization */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              XP Change
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Previous XP
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {transaction.previousXP.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Change
                </p>
                <p
                  className={`text-lg font-semibold ${
                    transaction.amount >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.amount >= 0 ? "+" : ""}
                  {transaction.amount.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  New XP
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {transaction.newXP.toLocaleString()}
                </p>
              </div>
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

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  transaction,
  onConfirm,
  onCancel,
  isDeleting,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaTrash className="h-6 w-6 text-red-500" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Delete Transaction
        </h3>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Are you sure you want to delete this XP transaction? This action
          cannot be undone.
        </p>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {transaction.description}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {transaction.userId?.username} •{" "}
            {new Date(transaction.created_at).toLocaleDateString()}
          </p>
          <p
            className={`text-sm font-semibold mt-1 ${
              transaction.amount >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.amount >= 0 ? "+" : ""}
            {transaction.amount} XP
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Create Manual Transaction Modal
const CreateManualTransactionModal = ({
  users,
  onClose,
  onCreate,
  isCreating,
}) => {
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      amount: parseInt(formData.amount),
      source: "manual",
    });
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Manual XP
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select User
            </label>
            <select
              value={formData.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.fullName}) - Level {user.currentLevel}{" "}
                  - {user.totalXP?.toLocaleString()} XP
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              XP Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter XP amount (positive or negative)"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use positive numbers to add XP, negative numbers to remove XP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe why this XP is being added/removed..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isCreating ||
                !formData.userId ||
                !formData.amount ||
                !formData.description
              }
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? "Adding XP..." : "Add XP Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperXPTransactionManagement;
