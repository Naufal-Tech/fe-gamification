import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaAward,
  FaBolt,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaFilter,
  FaGem,
  FaList,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaSync,
  FaThLarge,
  FaTimes,
  FaTrash,
  FaUnlock,
  FaUsers,
} from "react-icons/fa";
import api from "../../utils/api";

const SuperBadgeManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    rarity: "",
    status: "",
    sort: "recently",
    page: 1,
    limit: 20,
  });
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: badgesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superBadges", filters, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      // Add view-specific filters
      if (activeTab === "active") {
        params.append("isActive", "true");
      } else if (activeTab === "hidden") {
        params.append("isHidden", "true");
      } else if (activeTab === "inactive") {
        params.append("isActive", "false");
      }

      const response = await api.get(`/v1/badges?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch badge statistics
  const { data: statsData } = useQuery({
    queryKey: ["badgeStats"],
    queryFn: async () => {
      const response = await api.get("/v1/badges/stats", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  // Fetch users for unlock modal
  const { data: usersData } = useQuery({
    queryKey: ["superUsers"],
    queryFn: async () => {
      const response = await api.get("/v1/users?limit=1000", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (badgeId) => {
      const response = await api.delete(`/v1/badges/${badgeId}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
      setShowDeleteModal(false);
      setSelectedBadge(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ badgeId, data }) => {
      const response = await api.patch(`/v1/badges/${badgeId}`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();

      // Append all fields to formData
      Object.keys(data).forEach((key) => {
        if (key === "requirements" && data[key]) {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === "badgeImage" && data[key]) {
          formData.append("badgeImage", data[key]);
        } else {
          formData.append(key, data[key]);
        }
      });

      const response = await api.post("/v1/badges/create", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
      setShowCreateModal(false);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async ({ badgeId, userId }) => {
      const response = await api.post(
        `/v1/badges/${badgeId}/unlock/${userId}`,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
      setShowUnlockModal(false);
      setSelectedBadge(null);
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (badge) => {
    setSelectedBadge(badge);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const handleEditClick = (badge) => {
    setSelectedBadge(badge);
    setShowDetailModal(true);
  };

  const handleUnlockClick = (badge) => {
    setSelectedBadge(badge);
    setShowUnlockModal(true);
  };

  const confirmDelete = () => {
    if (selectedBadge) {
      deleteMutation.mutate(selectedBadge._id);
    }
  };

  const handleBulkSelection = (badgeId, checked) => {
    setBulkSelection((prev) =>
      checked ? [...prev, badgeId] : prev.filter((id) => id !== badgeId)
    );
  };

  const handleBulkAction = (action) => {
    if (bulkSelection.length === 0) return;

    const updateData = {};
    if (action === "activate") {
      updateData.isActive = true;
    } else if (action === "deactivate") {
      updateData.isActive = false;
    } else if (action === "show") {
      updateData.isHidden = false;
    } else if (action === "hide") {
      updateData.isHidden = true;
    }

    // Bulk update badges
    Promise.all(
      bulkSelection.map((badgeId) =>
        updateMutation.mutateAsync({
          badgeId,
          data: updateData,
        })
      )
    ).then(() => {
      setBulkSelection([]);
      setShowBulkActions(false);
    });
  };

  const selectAllBadges = () => {
    const allBadgeIds = badges?.map((badge) => badge._id) || [];
    setBulkSelection(allBadgeIds);
  };

  const clearSelection = () => {
    setBulkSelection([]);
  };

  const stats = useMemo(() => {
    const badges = badgesData?.badges || [];
    const activeBadges = badges.filter((badge) => badge.isActive).length;
    const hiddenBadges = badges.filter((badge) => badge.isHidden).length;
    const totalUnlocks = badges.reduce(
      (sum, badge) => sum + (badge.totalUnlocked || 0),
      0
    );

    // Count by rarity
    const rarityCounts = {
      common: badges.filter((b) => b.rarity === "common").length,
      uncommon: badges.filter((b) => b.rarity === "uncommon").length,
      rare: badges.filter((b) => b.rarity === "rare").length,
      epic: badges.filter((b) => b.rarity === "epic").length,
      legendary: badges.filter((b) => b.rarity === "legendary").length,
    };

    return {
      total: badges.length,
      active: activeBadges,
      hidden: hiddenBadges,
      totalUnlocks,
      rarityCounts,
      ...statsData?.stats,
    };
  }, [badgesData, statsData]);

  const badges = badgesData?.badges || [];
  const totalPages = badgesData?.pagination?.total || 1;
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
              <FaAward className="h-8 w-8 text-yellow-600" />
              Super Badge Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all badges across the platform with full administrative
              control
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-yellow-600 text-white"
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
                    ? "bg-yellow-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
                title="List View"
              >
                <FaList className="h-4 w-4" />
              </button>
            </div>

            {/* Bulk Actions Indicator */}
            {bulkSelection.length > 0 && (
              <div className="flex items-center gap-2 bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">
                  {bulkSelection.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="hover:bg-yellow-700 p-1 rounded transition-colors"
                  title="Bulk Actions"
                >
                  <FaSync className="h-3 w-3" />
                </button>
                <button
                  onClick={clearSelection}
                  className="hover:bg-yellow-700 p-1 rounded transition-colors"
                  title="Clear Selection"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium shadow-sm"
            >
              <FaPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Badge</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={<FaAward />}
            title="Total Badges"
            value={stats.total}
            color="yellow"
          />
          <StatCard
            icon={<FaCheck />}
            title="Active"
            value={stats.active}
            color="green"
            subtitle={`${Math.round((stats.active / stats.total) * 100) || 0}%`}
          />
          <StatCard
            icon={<FaShieldAlt />}
            title="Hidden"
            value={stats.hidden}
            color="blue"
          />
          <StatCard
            icon={<FaUsers />}
            title="Total Unlocks"
            value={stats.totalUnlocks?.toLocaleString() || "0"}
            color="purple"
          />
          <StatCard
            icon={<FaGem />}
            title="Legendary"
            value={stats.rarityCounts?.legendary || 0}
            color="orange"
          />
          <StatCard
            icon={<FaBolt />}
            title="Epic"
            value={stats.rarityCounts?.epic || 0}
            color="pink"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "all", name: "All Badges", icon: FaList },
                { id: "active", name: "Active", icon: FaCheck },
                { id: "hidden", name: "Hidden", icon: FaShieldAlt },
                { id: "inactive", name: "Inactive", icon: FaTimes },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
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
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <FaFilter className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {badgesData?.pagination?.totalRecords || 0} badges found
                  </p>
                </div>
              </div>
              {(filters.search ||
                filters.category ||
                filters.rarity ||
                filters.status) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      category: "",
                      rarity: "",
                      status: "",
                      sort: "recently",
                      page: 1,
                      limit: 20,
                    })
                  }
                  className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="">All Categories</option>
                <option value="achievement">Achievement</option>
                <option value="level">Level</option>
                <option value="streak">Streak</option>
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
                <option value="special">Special</option>
                <option value="event">Event</option>
              </select>

              <select
                value={filters.rarity}
                onChange={(e) => handleFilterChange("rarity", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>

              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="recently">Recently Created</option>
                <option value="name">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="rarity">Rarity (Low to High)</option>
                <option value="rarity_desc">Rarity (High to Low)</option>
                <option value="unlocks">Most Unlocked</option>
                <option value="unlocks_asc">Least Unlocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badges Display */}
        {viewMode === "grid" ? (
          <BadgeGridView
            badges={badges}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onUnlock={handleUnlockClick}
            onDelete={handleDeleteClick}
            onSelectAll={selectAllBadges}
            onClearSelection={clearSelection}
          />
        ) : (
          <BadgeListView
            badges={badges}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onUnlock={handleUnlockClick}
            onDelete={handleDeleteClick}
            onSelectAll={selectAllBadges}
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
                    badgesData?.pagination?.totalRecords || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {badgesData?.pagination?.totalRecords || 0}
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
                            ? "bg-yellow-600 text-white"
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
      {showDetailModal && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBadge(null);
          }}
          onUpdate={(data) => {
            updateMutation.mutate({
              badgeId: selectedBadge._id,
              data,
            });
          }}
        />
      )}

      {showDeleteModal && selectedBadge && (
        <DeleteConfirmModal
          badge={selectedBadge}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedBadge(null);
          }}
          isDeleting={deleteMutation.isLoading}
        />
      )}

      {showBulkActions && (
        <BulkActionsModal
          selectedCount={bulkSelection.length}
          onAction={handleBulkAction}
          onClose={() => setShowBulkActions(false)}
          isProcessing={updateMutation.isLoading}
        />
      )}

      {showCreateModal && (
        <CreateBadgeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(["superBadges"]);
          }}
        />
      )}

      {showUnlockModal && selectedBadge && (
        <UnlockBadgeModal
          badge={selectedBadge}
          users={users}
          onClose={() => {
            setShowUnlockModal(false);
            setSelectedBadge(null);
          }}
          onUnlock={(userId) => {
            unlockMutation.mutate({
              badgeId: selectedBadge._id,
              userId,
            });
          }}
          isUnlocking={unlockMutation.isLoading}
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
        Failed to Load Badges
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
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
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
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
const BadgeGridView = ({
  badges,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onEdit,
  onUnlock,
  onDelete,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {badges.map((badge) => (
      <BadgeCard
        key={badge._id}
        badge={badge}
        isSelected={bulkSelection.includes(badge._id)}
        onSelect={onBulkSelect}
        onView={onViewDetails}
        onEdit={onEdit}
        onUnlock={onUnlock}
        onDelete={onDelete}
      />
    ))}
  </div>
);

// List View Component
const BadgeListView = ({
  badges,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onEdit,
  onUnlock,
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
                  bulkSelection.length === badges.length && badges.length > 0
                }
                onChange={(e) =>
                  e.target.checked ? onSelectAll() : onClearSelection()
                }
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Badge
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Category & Rarity
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Unlocks
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
          {badges.map((badge) => (
            <BadgeRow
              key={badge._id}
              badge={badge}
              isSelected={bulkSelection.includes(badge._id)}
              onSelect={onBulkSelect}
              onView={onViewDetails}
              onEdit={onEdit}
              onUnlock={onUnlock}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Badge Card Component
const BadgeCard = ({
  badge,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onUnlock,
  onDelete,
}) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      case "uncommon":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "rare":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "legendary":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRarityMultiplier = (rarity) => {
    const multipliers = {
      common: 1,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2,
      legendary: 3,
    };
    return multipliers[rarity] || 1;
  };

  const xpBonus = Math.floor(getRarityMultiplier(badge.rarity) * 100);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isSelected
          ? "border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800"
          : !badge.isActive
          ? "border-gray-300 dark:border-gray-600"
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
              onChange={(e) => onSelect(badge._id, e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
            />
            <div className="text-3xl" style={{ color: badge.color }}>
              {badge.icon}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!badge.isActive && (
              <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full">
                Inactive
              </span>
            )}
            {badge.isHidden && (
              <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                Hidden
              </span>
            )}
          </div>
        </div>

        {/* Badge Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {badge.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {badge.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span
              className={`px-2 py-1 rounded-full font-medium ${getRarityColor(
                badge.rarity
              )}`}
            >
              {badge.rarity}
            </span>
            <span className="text-gray-500 dark:text-gray-400 capitalize">
              {badge.category}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <FaUsers className="h-3 w-3" />
              <span>{badge.totalUnlocked || 0} unlocks</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <FaStar className="h-3 w-3" />
              <span>+{xpBonus} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onView(badge)}
            className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1.5"
            title="View Details"
          >
            <FaEye className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onEdit(badge)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors p-1.5"
            title="Edit Badge"
          >
            <FaEdit className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onUnlock(badge)}
            className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors p-1.5"
            title="Unlock for User"
          >
            <FaUnlock className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onDelete(badge)}
            className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors p-1.5"
            title="Delete Badge"
          >
            <FaTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Badge Row Component for List View
const BadgeRow = ({
  badge,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onUnlock,
  onDelete,
}) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      case "uncommon":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "rare":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "legendary":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusBadge = (badge) => {
    if (!badge.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Inactive
        </span>
      );
    }
    if (badge.isHidden) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Hidden
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        Active
      </span>
    );
  };

  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        isSelected ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
      }`}
    >
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(badge._id, e.target.checked)}
          className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="text-2xl flex-shrink-0"
            style={{ color: badge.color }}
            title={badge.name}
          >
            {badge.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {badge.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {badge.description}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRarityColor(
              badge.rarity
            )}`}
          >
            {badge.rarity}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {badge.category}
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <FaUsers className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {badge.totalUnlocked || 0}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">{getStatusBadge(badge)}</td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(badge)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="View Details"
          >
            <FaEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(badge)}
            className="p-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            title="Edit Badge"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUnlock(badge)}
            className="p-1.5 text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
            title="Unlock for User"
          >
            <FaUnlock className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(badge)}
            className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            title="Delete Badge"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Badge Detail Modal
const BadgeDetailModal = ({ badge, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: badge.name,
    description: badge.description,
    category: badge.category,
    rarity: badge.rarity,
    color: badge.color,
    icon: badge.icon,
    isActive: badge.isActive,
    isHidden: badge.isHidden,
    requirements: badge.requirements || {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Badge
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Badge Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="achievement">Achievement</option>
                <option value="level">Level</option>
                <option value="streak">Streak</option>
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
                <option value="special">Special</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => handleChange("rarity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active Badge
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isHidden"
                checked={formData.isHidden}
                onChange={(e) => handleChange("isHidden", e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
              />
              <label
                htmlFor="isHidden"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Hidden Badge
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ badge, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaTrash className="h-6 w-6 text-red-500" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Delete Badge
        </h3>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>"{badge.name}"</strong>? This
          action cannot be undone and will remove the badge from all users.
        </p>

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
            {isDeleting ? "Deleting..." : "Delete Badge"}
          </button>
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bulk Actions
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FaTimes className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Apply action to {selectedCount} selected badges
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            action: "activate",
            label: "Activate",
            color: "green",
            icon: FaCheck,
          },
          {
            action: "deactivate",
            label: "Deactivate",
            color: "gray",
            icon: FaTimes,
          },
          { action: "show", label: "Show", color: "blue", icon: FaEye },
          { action: "hide", label: "Hide", color: "yellow", icon: FaShieldAlt },
        ].map(({ action, label, color, icon: Icon }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            disabled={isProcessing}
            className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// Create Badge Modal
const CreateBadgeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "achievement",
    rarity: "common",
    color: "#3B82F6",
    icon: "🏆",
    isActive: true,
    isHidden: false,
    badgeImage: null,
    requirements: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === "requirements" && data[key]) {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === "badgeImage" && data[key]) {
          formData.append("badgeImage", data[key]);
        } else {
          formData.append(key, data[key]);
        }
      });

      const response = await api.post("/v1/badges/create", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange("badgeImage", file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create New Badge
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Badge Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="achievement">Achievement</option>
                <option value="level">Level</option>
                <option value="streak">Streak</option>
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
                <option value="special">Special</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => handleChange("rarity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Badge Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="create-isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
              />
              <label
                htmlFor="create-isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active Badge
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="create-isHidden"
                checked={formData.isHidden}
                onChange={(e) => handleChange("isHidden", e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
              />
              <label
                htmlFor="create-isHidden"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Hidden Badge
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isLoading ? "Creating..." : "Create Badge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Unlock Badge Modal
const UnlockBadgeModal = ({ badge, users, onClose, onUnlock, isUnlocking }) => {
  const [selectedUserId, setSelectedUserId] = useState("");

  const handleUnlock = () => {
    if (selectedUserId) {
      onUnlock(selectedUserId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unlock Badge
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl" style={{ color: badge.color }}>
              {badge.icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {badge.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {badge.rarity} • {badge.category}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isUnlocking}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUnlock}
              disabled={!selectedUserId || isUnlocking}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isUnlocking ? "Unlocking..." : "Unlock Badge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperBadgeManagement;
