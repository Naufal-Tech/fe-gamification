import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaFilter,
  FaMedal,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUserFriends,
  FaUserPlus,
  FaUsers,
  FaUserShield,
  FaChartLine,
  FaCrown,
  FaFire,
  FaTrophy,
  FaSync,
  FaDownload,
  FaEnvelope,
  FaKey,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import api from "../../utils/api";

const AdminPlayersManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    sort: "recently",
    page: 1,
    limit: 20,
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const {
    data: playersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminPlayers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });
      const response = await api.get(`/v1/users?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete("/v1/users/delete", {
        data: { user_id: userId },
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminPlayers"]);
      setShowDeleteModal(false);
      setSelectedPlayer(null);
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, userIds }) => {
      const responses = await Promise.all(
        userIds.map((userId) =>
          api.post(
            `/v1/users/${userId}/${action}`,
            {},
            { withCredentials: true }
          )
        )
      );
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminPlayers"]);
      setBulkSelection([]);
      setShowBulkActions(false);
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (player) => {
    setSelectedPlayer(player);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (player) => {
    setSelectedPlayer(player);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedPlayer) {
      deleteMutation.mutate(selectedPlayer._id);
    }
  };

  const handleBulkSelection = (userId, checked) => {
    setBulkSelection((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  const handleBulkAction = (action) => {
    if (bulkSelection.length === 0) return;
    bulkActionMutation.mutate({ action, userIds: bulkSelection });
  };

  const selectAllPlayers = () => {
    const allPlayerIds = players?.map((player) => player._id) || [];
    setBulkSelection(allPlayerIds);
  };

  const clearSelection = () => {
    setBulkSelection([]);
  };

  const stats = useMemo(() => {
    const players = playersData?.users || [];
    const totalXP = players.reduce(
      (sum, player) => sum + (player.totalXP || 0),
      0
    );
    const avgLevel =
      players.length > 0
        ? players.reduce((sum, player) => sum + (player.currentLevel || 1), 0) /
          players.length
        : 0;
    const activePlayers = players.filter((p) => {
      if (!p.lastLogin) return false;
      const lastLogin = new Date(p.lastLogin);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastLogin > sevenDaysAgo;
    }).length;

    return {
      total: players.length,
      verified: players.filter((p) => p.isVerified).length,
      users: players.filter((p) => p.role === "User").length,
      admins: players.filter((p) => ["Admin", "Super"].includes(p.role)).length,
      totalXP,
      avgLevel: Math.round(avgLevel * 10) / 10,
      activePlayers,
    };
  }, [playersData]);

  const players = playersData?.users || [];
  const totalPages = playersData?.numOfPages || 1;

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Player Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage and monitor all players in the gamification ecosystem
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
                title="Grid View"
              >
                <FaThLarge className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
                title="List View"
              >
                <FaList className="h-4 w-4" />
              </button>
            </div>

            {/* Bulk Actions Indicator */}
            {bulkSelection.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">
                  {bulkSelection.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="hover:bg-blue-700 p-1 rounded transition-colors"
                  title="Bulk Actions"
                >
                  <FaSync className="h-3 w-3" />
                </button>
                <button
                  onClick={clearSelection}
                  className="hover:bg-blue-700 p-1 rounded transition-colors"
                  title="Clear Selection"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <FaDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => (window.location.href = "/admin/users/create")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <FaUserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Player</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Improved Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
          <StatCard
            icon={<FaUsers />}
            title="Total Players"
            value={playersData?.totalUsers || 0}
            color="blue"
            trend="+12%"
          />
          <StatCard
            icon={<FaMedal />}
            title="Verified"
            value={stats.verified}
            color="green"
            subtitle={`${
              Math.round((stats.verified / stats.total) * 100) || 0
            }%`}
          />
          <StatCard
            icon={<FaUserFriends />}
            title="Regular Users"
            value={stats.users}
            color="purple"
          />
          <StatCard
            icon={<FaUserShield />}
            title="Admins"
            value={stats.admins}
            color="red"
          />
          <StatCard
            icon={<FaChartLine />}
            title="Total XP"
            value={(stats.totalXP / 1000).toFixed(1) + "K"}
            color="orange"
          />
          <StatCard
            icon={<FaCrown />}
            title="Avg Level"
            value={stats.avgLevel}
            color="yellow"
          />
          <StatCard
            icon={<FaFire />}
            title="Active (7d)"
            value={stats.activePlayers}
            color="pink"
            subtitle={`${
              Math.round((stats.activePlayers / stats.total) * 100) || 0
            }%`}
          />
          <StatCard
            icon={<FaTrophy />}
            title="Top Level"
            value={Math.max(...players.map((p) => p.currentLevel || 1), 0)}
            color="indigo"
          />
        </div>

        {/* Filters Section - Improved Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FaFilter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Filters
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {playersData?.totalUsers || 0} players found
                </p>
              </div>
            </div>
            {(filters.search || filters.role || filters.status) && (
              <button
                onClick={() =>
                  setFilters({
                    search: "",
                    role: "",
                    status: "",
                    sort: "recently",
                    page: 1,
                    limit: 20,
                  })
                }
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Roles</option>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
              <option value="Super">Super Admin</option>
              <option value="Guru">Guru</option>
              <option value="Parents">Parents</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="recently">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="level_high">Level High to Low</option>
              <option value="level_low">Level Low to High</option>
              <option value="xp_high">XP High to Low</option>
              <option value="xp_low">XP Low to High</option>
              <option value="active">Most Active</option>
            </select>

            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange("limit", e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>

        {/* Players Display */}
        {viewMode === "grid" ? (
          <PlayerGridView
            players={players}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onEdit={(player) =>
              (window.location.href = `/admin/users/edit/${player._id}`)
            }
            onDelete={handleDeleteClick}
            onSelectAll={selectAllPlayers}
            onClearSelection={clearSelection}
          />
        ) : (
          <PlayerListView
            players={players}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onEdit={(player) =>
              (window.location.href = `/admin/users/edit/${player._id}`)
            }
            onDelete={handleDeleteClick}
            onSelectAll={selectAllPlayers}
            onClearSelection={clearSelection}
          />
        )}

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
                    playersData?.totalUsers || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {playersData?.totalUsers || 0}
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
                            ? "bg-blue-600 text-white"
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
      {showDetailModal && selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPlayer(null);
          }}
        />
      )}

      {showDeleteModal && selectedPlayer && (
        <DeleteConfirmModal
          player={selectedPlayer}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedPlayer(null);
          }}
          isDeleting={deleteMutation.isLoading}
        />
      )}

      {showBulkActions && (
        <BulkActionsModal
          selectedCount={bulkSelection.length}
          onAction={handleBulkAction}
          onClose={() => setShowBulkActions(false)}
          isProcessing={bulkActionMutation.isLoading}
        />
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          totalPlayers={playersData?.totalUsers || 0}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
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
        Failed to Load Players
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  </div>
);

// StatCard Component
const StatCard = ({ icon, title, value, color, subtitle, trend }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
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
            {trend && (
              <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded">
                {trend}
              </span>
            )}
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

// Grid View Component
const PlayerGridView = ({
  players,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onEdit,
  onDelete,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {players.map((player) => (
      <PlayerCard
        key={player._id}
        player={player}
        isSelected={bulkSelection.includes(player._id)}
        onSelect={onBulkSelect}
        onView={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </div>
);

// List View Component
const PlayerListView = ({
  players,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onEdit,
  onDelete,
  onSelectAll,
  onClearSelection,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  bulkSelection.length === players.length && players.length > 0
                }
                onChange={(e) =>
                  e.target.checked ? onSelectAll() : onClearSelection()
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Player
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Level & XP
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {players.map((player) => (
            <PlayerRow
              key={player._id}
              player={player}
              isSelected={bulkSelection.includes(player._id)}
              onSelect={onBulkSelect}
              onView={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Player Card Component
const PlayerCard = ({
  player,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}) => {
  const getLevelProgress = (level = 1) => {
    const progress = (level % 1) * 100 || 0;
    return Math.min(progress, 100);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(player._id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <img
              src={
                player.img_profile ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  player.fullName
                )}&background=6366f1&color=fff`
              }
              alt={player.fullName}
              className="h-10 w-10 rounded-lg"
            />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                player.role === "Admin" || player.role === "Super"
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              }`}
            >
              {player.role}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                player.isVerified
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              }`}
            >
              {player.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>

        {/* Player Info */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-0.5 truncate">
            {player.fullName}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 truncate">
            @{player.username}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs truncate">
            {player.email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {player.currentLevel || 1}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Level
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {((player.totalXP || 0) / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">XP</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{getLevelProgress(player.currentLevel)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${getLevelProgress(player.currentLevel)}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onView(player)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-medium"
          >
            View Details
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(player)}
              className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <FaEdit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(player)}
              className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <FaTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Player Row Component
const PlayerRow = ({
  player,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
    <td className="w-12 px-4 py-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(player._id, e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
      />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <img
          src={
            player.img_profile ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              player.fullName
            )}&background=6366f1&color=fff`
          }
          alt={player.fullName}
          className="h-10 w-10 rounded-lg flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {player.fullName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{player.username}
          </div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="text-sm font-bold text-gray-900 dark:text-white">
        Level {player.currentLevel || 1}
      </div>
      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
        {(player.totalXP || 0).toLocaleString()} XP
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
            player.role === "Admin" || player.role === "Super"
              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          }`}
        >
          {player.role}
        </span>
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
            player.isVerified
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
          }`}
        >
          {player.isVerified ? "Verified" : "Unverified"}
        </span>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => onView(player)}
          className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="View"
        >
          <FaEye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(player)}
          className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Edit"
        >
          <FaEdit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(player)}
          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete"
        >
          <FaTrash className="h-4 w-4" />
        </button>
      </div>
    </td>
  </tr>
);

// Player Detail Modal
const PlayerDetailModal = ({ player, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", name: "Overview", icon: FaEye },
    { id: "stats", name: "Statistics", icon: FaChartLine },
    { id: "achievements", name: "Achievements", icon: FaTrophy },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Player Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {/* Player Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <img
                src={
                  player.img_profile ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    player.fullName
                  )}&background=6366f1&color=fff&size=96`
                }
                alt={player.fullName}
                className="h-20 w-20 rounded-xl"
              />
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {player.fullName}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  @{player.username} • {player.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium ${
                      player.role === "Admin" || player.role === "Super"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {player.role}
                  </span>
                  <span
                    className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium ${
                      player.isVerified
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {player.isVerified ? "Verified" : "Unverified"}
                  </span>
                  <span className="inline-flex px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-lg text-xs font-medium">
                    Level {player.currentLevel || 1}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
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

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && <OverviewTab player={player} />}
            {activeTab === "stats" && <StatsTab player={player} />}
            {activeTab === "achievements" && (
              <AchievementsTab player={player} />
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ player }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Basic Information
      </h4>
      <dl className="space-y-2">
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Email</dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Phone</dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.phoneNumber || "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Gender</dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.gender || "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Birthdate
          </dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.birthdate || "N/A"}
          </dd>
        </div>
      </dl>
    </div>

    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Gamification Stats
      </h4>
      <dl className="space-y-2">
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Level</dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.currentLevel || 1}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Total XP</dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {(player.totalXP || 0).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Current Streak
          </dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.currentStreak || 0} days
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Tasks Completed
          </dt>
          <dd className="text-sm text-gray-900 dark:text-white">
            {player.totalTasksCompleted || 0}
          </dd>
        </div>
      </dl>
    </div>
  </div>
);

const StatsTab = ({ player }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">✅</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasks</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {player.totalTasksCompleted || 0}
      </div>
    </div>
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">🎯</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        Milestones
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {player.totalMilestonesCompleted || 0}
      </div>
    </div>
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">🔥</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        Streak
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {player.currentStreak || 0} days
      </div>
    </div>
  </div>
);

const AchievementsTab = ({ player }) => (
  <div className="text-center py-8">
    <FaTrophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
      Achievements
    </h4>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {player.badges?.length || 0} badges earned
    </p>
  </div>
);

// Delete Confirm Modal
const DeleteConfirmModal = ({ player, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onCancel}
      ></div>

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <FaTrash className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Player
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>{player.fullName}</strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Bulk Actions Modal
const BulkActionsModal = ({
  selectedCount,
  onAction,
  onClose,
  isProcessing,
}) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bulk Actions ({selectedCount} selected)
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => onAction("verify")}
            disabled={isProcessing}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Verify
          </button>
          <button
            onClick={() => onAction("send_email")}
            disabled={isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaEnvelope className="h-4 w-4" />
            Email
          </button>
          <button
            onClick={() => onAction("reset_password")}
            disabled={isProcessing}
            className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaKey className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={() => onAction("export")}
            disabled={isProcessing}
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaDownload className="h-4 w-4" />
            Export
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Export Modal
const ExportModal = ({ onClose, totalPlayers }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Players ({totalPlayers} total)
        </h3>
        <div className="space-y-3 mb-4">
          <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-3">
            <FaDownload className="h-4 w-4" />
            Export as CSV
          </button>
          <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-3">
            <FaDownload className="h-4 w-4" />
            Export as Excel
          </button>
          <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-3">
            <FaDownload className="h-4 w-4" />
            Export as JSON
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default AdminPlayersManagement;
