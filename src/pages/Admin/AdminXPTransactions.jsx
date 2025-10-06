import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBolt,
  FaChartLine,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaFire,
  FaGem,
  FaMedal,
  FaPlus,
  FaSearch,
  FaStar,
  FaSync,
  FaTrash,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const AdminXPTransactions = () => {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const transactionsPerPage = 20;

  // Form state for new transaction
  const [newTransaction, setNewTransaction] = useState({
    userId: "",
    amount: "",
    description: "",
    source: "manual",
  });

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // Fetch all transactions with filters
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: [
      "adminXpTransactions",
      currentPage,
      searchTerm,
      selectedUser,
      selectedSource,
      dateRange,
    ],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };

      let url = `/v1/xp-transactions/admin/transactions?page=${currentPage}&limit=${transactionsPerPage}`;

      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedUser) url += `&userId=${selectedUser}`;
      if (selectedSource) url += `&source=${selectedSource}`;
      if (dateRange.start) url += `&startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;

      const response = await api.get(url, config);
      return response.data;
    },
    enabled: !!accessToken && isAdmin,
  });

  // Fetch users for dropdown
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

  // Fetch admin stats
  const { data: adminStatsData } = useQuery({
    queryKey: ["adminXpStats"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/xp-transactions/admin/stats", config);
      return response.data;
    },
    enabled: !!accessToken && isAdmin,
  });

  // Mutations
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post(
        "/v1/xp-transactions/manual",
        transactionData,
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminXpTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["adminXpStats"] });
      setShowAddModal(false);
      setNewTransaction({
        userId: "",
        amount: "",
        description: "",
        source: "manual",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.delete(
        `/v1/xp-transactions/${transactionId}`,
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminXpTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["adminXpStats"] });
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    },
  });

  // Effects
  useEffect(() => {
    if (usersData?.data?.users) {
      setUsersList(usersData.data.users);
    }
  }, [usersData]);

  // Handler functions
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedUser("");
    setSelectedSource("");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (
      !newTransaction.userId ||
      !newTransaction.amount ||
      !newTransaction.description
    ) {
      alert("Please fill all required fields");
      return;
    }
    createTransactionMutation.mutate({
      ...newTransaction,
      amount: parseInt(newTransaction.amount),
    });
  };

  const handleDeleteTransaction = () => {
    if (selectedTransaction) {
      deleteTransactionMutation.mutate(selectedTransaction._id);
    }
  };

  const openDeleteModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
  };

  // Data extraction
  const transactions = transactionsData?.data?.transactions || [];
  const pagination = transactionsData?.data?.pagination || {};
  const stats = adminStatsData?.data || {};

  // Helper functions
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
            XP Transactions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Manage and monitor all XP transactions across the platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Transactions
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalTransactions?.toLocaleString() || 0}
                </p>
              </div>
              <FaChartLine className="text-2xl md:text-3xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total XP Granted
                </p>
                <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                  +{stats.totalXPGained?.toLocaleString() || 0}
                </p>
              </div>
              <FaArrowUp className="text-2xl md:text-3xl text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total XP Deducted
                </p>
                <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                  -{stats.totalXPLost?.toLocaleString() || 0}
                </p>
              </div>
              <FaArrowDown className="text-2xl md:text-3xl text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Net XP Change
                </p>
                <p
                  className={`text-xl md:text-2xl font-bold ${
                    (stats.netXP || 0) >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {stats.netXP >= 0 ? "+" : ""}
                  {stats.netXP?.toLocaleString() || 0}
                </p>
              </div>
              <FaSync className="text-2xl md:text-3xl text-purple-500" />
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
                      placeholder="Search transactions..."
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
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm md:text-base flex items-center flex-1 lg:flex-none"
                >
                  <FaPlus className="inline mr-2" />
                  Add XP
                </button>
              </div>
            </div>

            {/* Date Range Filters - Collapsible on mobile */}
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
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">All Sources</option>
                    <option value="task">Task</option>
                    <option value="daily_task">Daily Task</option>
                    <option value="milestone">Milestone</option>
                    <option value="badge">Badge</option>
                    <option value="login">Login</option>
                    <option value="manual">Manual</option>
                    <option value="penalty">Penalty</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loadingTransactions ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading transactions...
                </p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <FaChartLine className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No transactions found
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Try adjusting your filters or create a new transaction
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaUser className="flex-shrink-0 h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                            <div className="ml-2 md:ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white max-w-20 md:max-w-none truncate">
                                {transaction.userId?.fullName ||
                                  transaction.userId?.username ||
                                  "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Level {transaction.newLevel}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex items-center">
                            {getSourceIcon(transaction.source)}
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {getSourceLabel(transaction.source)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className="text-sm text-gray-900 dark:text-white max-w-32 md:max-w-xs truncate"
                            title={transaction.description}
                          >
                            {transaction.description}
                          </div>
                          <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getSourceLabel(transaction.source)} •{" "}
                            {formatRelativeDate(transaction.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.amount >= 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {transaction.amount}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                          <div title={formatDate(transaction.created_at)}>
                            {formatRelativeDate(transaction.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openViewModal(transaction)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                              title="View Details"
                            >
                              <FaEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(transaction)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
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
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                  Showing page {pagination.currentPage} of{" "}
                  {pagination.totalPages} •{" "}
                  {pagination.totalCount?.toLocaleString()} total transactions
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={!pagination.hasPrev}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <FaChevronLeft className="inline mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <FaChevronRight className="inline ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Manual XP Transaction
              </h3>
            </div>
            <form
              onSubmit={handleAddTransaction}
              className="p-4 md:p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User *
                </label>
                <select
                  required
                  value={newTransaction.userId}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      userId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                >
                  <option value="">Select User</option>
                  {usersList.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.fullName || user.username} (Level{" "}
                      {user.currentLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="Positive or negative amount"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Reason for this XP adjustment..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source
                </label>
                <select
                  value={newTransaction.source}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      source: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                >
                  <option value="manual">Manual Adjustment</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTransactionMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {createTransactionMutation.isPending
                    ? "Creating..."
                    : "Create Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Transaction
              </h3>
            </div>
            <div className="p-4 md:p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete this XP transaction? This action
                cannot be undone.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTransaction.description}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User:{" "}
                  {selectedTransaction.userId?.fullName ||
                    selectedTransaction.userId?.username}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Amount: {selectedTransaction.amount >= 0 ? "+" : ""}
                  {selectedTransaction.amount} XP
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  disabled={deleteTransactionMutation.isPending}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {deleteTransactionMutation.isPending
                    ? "Deleting..."
                    : "Delete Transaction"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {selectedTransaction && !showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
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
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedTransaction.userId?.fullName ||
                      selectedTransaction.userId?.username}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    {getSourceIcon(selectedTransaction.source)}
                    <span className="ml-2">
                      {getSourceLabel(selectedTransaction.source)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </label>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      selectedTransaction.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.amount >= 0 ? "+" : ""}
                    {selectedTransaction.amount} XP
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level Change
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedTransaction.previousLevel} →{" "}
                    {selectedTransaction.newLevel}
                    {selectedTransaction.previousLevel !==
                      selectedTransaction.newLevel && (
                      <span className="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                        (Level Up!)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    XP Before
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedTransaction.previousXP} XP
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    XP After
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedTransaction.newXP} XP
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedTransaction.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date & Time
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedTransaction.created_at)}
                </p>
              </div>

              {selectedTransaction.sourceId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source Reference
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    ID: {selectedTransaction.sourceId}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
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

export default AdminXPTransactions;
