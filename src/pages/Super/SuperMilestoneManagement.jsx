import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaAward,
  FaBolt,
  FaCalendar,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaGem,
  FaList,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSync,
  FaThLarge,
  FaTimes,
  FaTrash,
  FaTrophy,
} from "react-icons/fa";
import api from "../../utils/api";

const SuperMilestoneManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    tier: "",
    rarity: "",
    status: "",
    series: "",
    sort: "recently",
    page: 1,
    limit: 20,
  });
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: milestonesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superMilestones", filters, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      // Add view-specific filters
      if (activeTab === "expiring") {
        params.append("days", "7");
      } else if (activeTab === "active") {
        params.append("isActive", "true");
      } else if (activeTab === "hidden") {
        params.append("isHidden", "true");
      }

      const response = await api.get(`/v1/milestones?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch milestone series for filter
  const { data: seriesData } = useQuery({
    queryKey: ["milestoneSeries"],
    queryFn: async () => {
      const response = await api.get("/v1/milestones/meta/series", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (milestoneId) => {
      const response = await api.delete(`/v1/milestones/${milestoneId}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superMilestones"]);
      setShowDeleteModal(false);
      setSelectedMilestone(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ milestoneId, data }) => {
      const response = await api.patch(`/v1/milestones/${milestoneId}`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superMilestones"]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/v1/milestones", data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superMilestones"]);
      setShowCreateModal(false);
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (milestone) => {
    setSelectedMilestone(milestone);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (milestone) => {
    setSelectedMilestone(milestone);
    setShowDeleteModal(true);
  };

  const handleEditClick = (milestone) => {
    setSelectedMilestone(milestone);
    // For simplicity, we'll use the detail modal for editing
    setShowDetailModal(true);
  };

  const confirmDelete = () => {
    if (selectedMilestone) {
      deleteMutation.mutate(selectedMilestone._id);
    }
  };

  const handleBulkSelection = (milestoneId, checked) => {
    setBulkSelection((prev) =>
      checked ? [...prev, milestoneId] : prev.filter((id) => id !== milestoneId)
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

    // Bulk update milestones
    Promise.all(
      bulkSelection.map((milestoneId) =>
        updateMutation.mutateAsync({
          milestoneId,
          data: updateData,
        })
      )
    ).then(() => {
      setBulkSelection([]);
      setShowBulkActions(false);
    });
  };

  const selectAllMilestones = () => {
    const allMilestoneIds = milestones?.map((milestone) => milestone._id) || [];
    setBulkSelection(allMilestoneIds);
  };

  const clearSelection = () => {
    setBulkSelection([]);
  };

  const stats = useMemo(() => {
    const milestones = milestonesData?.milestones || [];
    const totalXP = milestones.reduce(
      (sum, milestone) => sum + (milestone.rewards?.xp || 0),
      0
    );
    const activeMilestones = milestones.filter(
      (milestone) => milestone.isActive
    ).length;
    const hiddenMilestones = milestones.filter(
      (milestone) => milestone.isHidden
    ).length;
    const expiredMilestones = milestones.filter(
      (milestone) => milestone.isExpired
    ).length;

    // Count by tier
    const tierCounts = {
      bronze: milestones.filter((m) => m.tier === "bronze").length,
      silver: milestones.filter((m) => m.tier === "silver").length,
      gold: milestones.filter((m) => m.tier === "gold").length,
      platinum: milestones.filter((m) => m.tier === "platinum").length,
      diamond: milestones.filter((m) => m.tier === "diamond").length,
    };

    // Count by rarity
    const rarityCounts = {
      common: milestones.filter((m) => m.rarity === "common").length,
      rare: milestones.filter((m) => m.rarity === "rare").length,
      epic: milestones.filter((m) => m.rarity === "epic").length,
      legendary: milestones.filter((m) => m.rarity === "legendary").length,
    };

    return {
      total: milestones.length,
      active: activeMilestones,
      hidden: hiddenMilestones,
      expired: expiredMilestones,
      totalXP,
      tierCounts,
      rarityCounts,
    };
  }, [milestonesData]);

  const milestones = milestonesData?.milestones || [];
  const totalPages = milestonesData?.pagination?.totalPages || 1;
  const series = seriesData?.series || [];

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
              <FaTrophy className="h-8 w-8 text-yellow-600" />
              Super Milestone Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all milestones across the platform with full administrative
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
              <span className="hidden sm:inline">Create Milestone</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={<FaTrophy />}
            title="Total Milestones"
            value={stats.total}
            color="yellow"
          />
          <StatCard
            icon={<FaAward />}
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
            icon={<FaExclamationTriangle />}
            title="Expired"
            value={stats.expired}
            color="red"
          />
          <StatCard
            icon={<FaBolt />}
            title="Total XP"
            value={stats.totalXP.toLocaleString()}
            color="orange"
          />
          <StatCard
            icon={<FaGem />}
            title="Diamond Tier"
            value={stats.tierCounts.diamond}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "all", name: "All Milestones", icon: FaList },
                { id: "active", name: "Active", icon: FaAward },
                { id: "hidden", name: "Hidden", icon: FaShieldAlt },
                { id: "expiring", name: "Expiring Soon", icon: FaCalendar },
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
                    {milestonesData?.pagination?.totalCount || 0} milestones
                    found
                  </p>
                </div>
              </div>
              {(filters.search ||
                filters.category ||
                filters.tier ||
                filters.rarity ||
                filters.series) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      category: "",
                      tier: "",
                      rarity: "",
                      status: "",
                      series: "",
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
                  placeholder="Search milestones..."
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
                <option value="level">Level</option>
                <option value="streak">Streak</option>
                <option value="tasks">Tasks</option>
                <option value="xp">XP</option>
                <option value="time">Time</option>
                <option value="personal">Personal</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={filters.tier}
                onChange={(e) => handleFilterChange("tier", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>

              <select
                value={filters.rarity}
                onChange={(e) => handleFilterChange("rarity", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>

            {/* Second row of filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <select
                value={filters.series}
                onChange={(e) => handleFilterChange("series", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="">All Series</option>
                {series.map((seriesItem) => (
                  <option
                    key={seriesItem.seriesName}
                    value={seriesItem.seriesName}
                  >
                    {seriesItem.seriesName} ({seriesItem.count})
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="hidden">Hidden Only</option>
                <option value="visible">Visible Only</option>
              </select>

              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              >
                <option value="recently">Recently Created</option>
                <option value="title">Title A-Z</option>
                <option value="tier">Tier (Low to High)</option>
                <option value="tier_desc">Tier (High to Low)</option>
                <option value="xp">XP (Low to High)</option>
                <option value="xp_desc">XP (High to Low)</option>
                <option value="targetDate">Target Date (Soonest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Milestones Display */}
        {viewMode === "grid" ? (
          <MilestoneGridView
            milestones={milestones}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onSelectAll={selectAllMilestones}
            onClearSelection={clearSelection}
          />
        ) : (
          <MilestoneListView
            milestones={milestones}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onSelectAll={selectAllMilestones}
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
                    milestonesData?.pagination?.totalCount || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {milestonesData?.pagination?.totalCount || 0}
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
      {showDetailModal && selectedMilestone && (
        <MilestoneDetailModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMilestone(null);
          }}
          onUpdate={(data) => {
            updateMutation.mutate({
              milestoneId: selectedMilestone._id,
              data,
            });
          }}
        />
      )}

      {showDeleteModal && selectedMilestone && (
        <DeleteConfirmModal
          milestone={selectedMilestone}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedMilestone(null);
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
        <CreateMilestoneModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(["superMilestones"]);
          }}
          series={series}
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
        Failed to Load Milestones
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
const MilestoneGridView = ({
  milestones,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onEdit,
  onDelete,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {milestones.map((milestone) => (
      <MilestoneCard
        key={milestone._id}
        milestone={milestone}
        isSelected={bulkSelection.includes(milestone._id)}
        onSelect={onBulkSelect}
        onView={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </div>
);

// List View Component
const MilestoneListView = ({
  milestones,
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
                  bulkSelection.length === milestones.length &&
                  milestones.length > 0
                }
                onChange={(e) =>
                  e.target.checked ? onSelectAll() : onClearSelection()
                }
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Milestone
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Requirements
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Rewards
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
          {milestones.map((milestone) => (
            <MilestoneRow
              key={milestone._id}
              milestone={milestone}
              isSelected={bulkSelection.includes(milestone._id)}
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

// Milestone Card Component
const MilestoneCard = ({
  milestone,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}) => {
  const getTierColor = (tier) => {
    switch (tier) {
      case "bronze":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "silver":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      case "gold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "platinum":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "diamond":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
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

  const getRequirementText = (requirement) => {
    const { type, target, taskCategory, timeframe } = requirement;

    switch (type) {
      case "reach_level":
        return `Reach Level ${target}`;
      case "reach_streak":
        return `${target} Day Streak`;
      case "complete_tasks":
        return `${target} Tasks Completed`;
      case "earn_total_xp":
        return `${target.toLocaleString()} Total XP`;
      case "days_active":
        return `${target} Days Active`;
      case "task_streak":
        return `${target} Task Streak${
          taskCategory ? ` (${taskCategory})` : ""
        }`;
      default:
        return `${type.replace(/_/g, " ")}: ${target}`;
    }
  };

  const xpReward = milestone.rewards?.xp || 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isSelected
          ? "border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800"
          : milestone.isExpired
          ? "border-red-300 dark:border-red-700"
          : !milestone.isActive
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
              onChange={(e) => onSelect(milestone._id, e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
            />
            <div className="text-2xl">{milestone.icon || "🏆"}</div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                milestone.tier
              )}`}
            >
              {milestone.tier}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(
                milestone.rarity
              )}`}
            >
              {milestone.rarity}
            </span>
          </div>
        </div>

        {/* Milestone Info */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2 line-clamp-2">
            {milestone.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
            {milestone.description}
          </p>

          <div className="space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Requirement:</span>{" "}
              {getRequirementText(milestone.requirement)}
            </div>
            {milestone.series && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Series:</span> {milestone.series}
                {milestone.seriesOrder && ` #${milestone.seriesOrder}`}
              </div>
            )}
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {xpReward.toLocaleString()} XP
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              {milestone.rewards?.title && (
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                  Title
                </span>
              )}
              {milestone.rewards?.badge && (
                <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                  Badge
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Deadline */}
        {milestone.targetDate && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <FaCalendar className="h-3 w-3" />
              <span>{new Date(milestone.targetDate).toLocaleDateString()}</span>
              {milestone.isExpired && (
                <span className="ml-auto text-red-600 dark:text-red-400 font-medium">
                  Expired
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onView(milestone)}
            className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 text-xs font-medium"
          >
            View Details
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(milestone)}
              className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <FaEdit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(milestone)}
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

// Milestone Row Component
const MilestoneRow = ({
  milestone,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}) => {
  const getTierColor = (tier) => {
    switch (tier) {
      case "bronze":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "silver":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      case "gold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "platinum":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "diamond":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRequirementText = (requirement) => {
    const { type, target } = requirement;

    switch (type) {
      case "reach_level":
        return `Level ${target}`;
      case "reach_streak":
        return `${target} Day Streak`;
      case "complete_tasks":
        return `${target} Tasks`;
      case "earn_total_xp":
        return `${target.toLocaleString()} XP`;
      default:
        return `${type.replace(/_/g, " ")}: ${target}`;
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="w-12 px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(milestone._id, e.target.checked)}
          className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{milestone.icon || "🏆"}</div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {milestone.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {milestone.description}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                  milestone.tier
                )}`}
              >
                {milestone.tier}
              </span>
              {milestone.series && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {milestone.series}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900 dark:text-white">
          {getRequirementText(milestone.requirement)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {milestone.requirement.type.replace(/_/g, " ")}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
          {milestone.rewards?.xp?.toLocaleString()} XP
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {milestone.rewards?.title && "Title • "}
          {milestone.rewards?.badge && "Badge"}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
              milestone.isActive
                ? milestone.isExpired
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {milestone.isActive
              ? milestone.isExpired
                ? "Expired"
                : "Active"
              : "Inactive"}
          </span>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
              milestone.isHidden
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {milestone.isHidden ? "Hidden" : "Visible"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(milestone)}
            className="p-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
            title="View"
          >
            <FaEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(milestone)}
            className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(milestone)}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Milestone Detail Modal
const MilestoneDetailModal = ({ milestone, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: milestone.title,
    description: milestone.description,
    category: milestone.category,
    tier: milestone.tier,
    rarity: milestone.rarity,
    isActive: milestone.isActive,
    isHidden: milestone.isHidden,
    targetDate: milestone.targetDate
      ? new Date(milestone.targetDate).toISOString().split("T")[0]
      : "",
    series: milestone.series || "",
    seriesOrder: milestone.seriesOrder || "",
    icon: milestone.icon || "🏆",
    color: milestone.color || "#DC2626",
    celebrationMessage: milestone.celebrationMessage || "",
  });

  const handleSave = () => {
    const updateData = {
      ...formData,
      targetDate: formData.targetDate
        ? new Date(formData.targetDate).getTime()
        : undefined,
      seriesOrder: formData.seriesOrder
        ? parseInt(formData.seriesOrder)
        : undefined,
    };
    onUpdate(updateData);
    setIsEditing(false);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "bronze":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "silver":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      case "gold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "platinum":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "diamond":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
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

  const getRequirementText = (requirement) => {
    const { type, target, taskCategory, timeframe } = requirement;

    switch (type) {
      case "reach_level":
        return `Reach Level ${target}`;
      case "reach_streak":
        return `Maintain a ${target} day streak`;
      case "complete_tasks":
        return `Complete ${target} tasks${
          taskCategory ? ` in ${taskCategory} category` : ""
        }`;
      case "earn_total_xp":
        return `Earn ${target.toLocaleString()} total XP`;
      case "days_active":
        return `Be active for ${target} days`;
      case "task_streak":
        return `Maintain ${target} day task streak${
          taskCategory ? ` for ${taskCategory}` : ""
        }`;
      default:
        return `${type.replace(/_/g, " ")}: ${target}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Milestone Details
            </h3>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Milestone Header */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-4xl">{milestone.icon || "🏆"}</div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full text-xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-yellow-500 focus:outline-none py-1"
                    />
                  ) : (
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {milestone.title}
                    </h4>
                  )}
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full mt-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Basic Information
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Category
                      </dt>
                      {isEditing ? (
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                        >
                          <option value="level">Level</option>
                          <option value="streak">Streak</option>
                          <option value="tasks">Tasks</option>
                          <option value="xp">XP</option>
                          <option value="time">Time</option>
                          <option value="personal">Personal</option>
                          <option value="custom">Custom</option>
                        </select>
                      ) : (
                        <dd className="text-sm text-gray-900 dark:text-white capitalize">
                          {milestone.category}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Tier
                      </dt>
                      {isEditing ? (
                        <select
                          value={formData.tier}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tier: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                        >
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      ) : (
                        <dd className="text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTierColor(
                              milestone.tier
                            )}`}
                          >
                            {milestone.tier}
                          </span>
                        </dd>
                      )}
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Settings
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Rarity
                      </dt>
                      {isEditing ? (
                        <select
                          value={formData.rarity}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rarity: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                        >
                          <option value="common">Common</option>
                          <option value="rare">Rare</option>
                          <option value="epic">Epic</option>
                          <option value="legendary">Legendary</option>
                        </select>
                      ) : (
                        <dd className="text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(
                              milestone.rarity
                            )}`}
                          >
                            {milestone.rarity}
                          </span>
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </dt>
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isActive: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              Active
                            </span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.isHidden}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isHidden: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              Hidden
                            </span>
                          </label>
                        </div>
                      ) : (
                        <dd className="text-sm">
                          <div className="space-y-1">
                            <div
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                milestone.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {milestone.isActive ? "Active" : "Inactive"}
                            </div>
                            <div
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                milestone.isHidden
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                              }`}
                            >
                              {milestone.isHidden ? "Hidden" : "Visible"}
                            </div>
                          </div>
                        </dd>
                      )}
                    </div>
                  </dl>
                </div>
              </div>

              {/* Requirement Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Requirement
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {getRequirementText(milestone.requirement)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                    Type: {milestone.requirement.type.replace(/_/g, " ")}
                  </div>
                  {milestone.requirement.taskCategory && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Category: {milestone.requirement.taskCategory}
                    </div>
                  )}
                  {milestone.requirement.timeframe && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Timeframe: {milestone.requirement.timeframe} days
                    </div>
                  )}
                </div>
              </div>

              {/* Rewards */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Rewards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {milestone.rewards?.xp?.toLocaleString()}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      XP Reward
                    </div>
                  </div>
                  {milestone.rewards?.title && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {milestone.rewards.title}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Title
                      </div>
                    </div>
                  )}
                  {milestone.rewards?.badge && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        Badge
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Special Badge
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Series Information
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Series
                      </dt>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.series}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              series: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="Series name"
                        />
                      ) : (
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {milestone.series || "No series"}
                        </dd>
                      )}
                    </div>
                    {milestone.series && (
                      <div>
                        <dt className="text-xs text-gray-500 dark:text-gray-400">
                          Series Order
                        </dt>
                        {isEditing ? (
                          <input
                            type="number"
                            value={formData.seriesOrder}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                seriesOrder: e.target.value,
                              }))
                            }
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          />
                        ) : (
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {milestone.seriesOrder}
                          </dd>
                        )}
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Time Settings
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Target Date
                      </dt>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.targetDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              targetDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                        />
                      ) : (
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {milestone.targetDate
                            ? new Date(
                                milestone.targetDate
                              ).toLocaleDateString()
                            : "No target date"}
                        </dd>
                      )}
                    </div>
                    {milestone.targetDate && (
                      <div>
                        <dt className="text-xs text-gray-500 dark:text-gray-400">
                          Status
                        </dt>
                        <dd className="text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              milestone.isExpired
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            }`}
                          >
                            {milestone.isExpired ? "Expired" : "Active"}
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Celebration Message */}
              {milestone.celebrationMessage && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Celebration Message
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={formData.celebrationMessage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          celebrationMessage: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {milestone.celebrationMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirm Modal
const DeleteConfirmModal = ({ milestone, onConfirm, onCancel, isDeleting }) => (
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
              Delete Milestone
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete the milestone{" "}
              <strong>"{milestone.title}"</strong>? This action cannot be undone
              and will remove this milestone from the system.
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
            onClick={() => onAction("activate")}
            disabled={isProcessing}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaCheck className="h-4 w-4" />
            Activate
          </button>
          <button
            onClick={() => onAction("deactivate")}
            disabled={isProcessing}
            className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaTimes className="h-4 w-4" />
            Deactivate
          </button>
          <button
            onClick={() => onAction("show")}
            disabled={isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaEye className="h-4 w-4" />
            Show
          </button>
          <button
            onClick={() => onAction("hide")}
            disabled={isProcessing}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaShieldAlt className="h-4 w-4" />
            Hide
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

// Create Milestone Modal
const CreateMilestoneModal = ({ onClose, onSuccess, series }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "level",
    requirement: {
      type: "reach_level",
      target: 1,
      taskCategory: "",
      timeframe: "",
    },
    rewards: {
      xp: 100,
      title: "",
      badge: "",
      specialRewards: [],
    },
    tier: "bronze",
    rarity: "common",
    isHidden: false,
    isActive: true,
    targetDate: "",
    series: "",
    seriesOrder: "",
    icon: "🏆",
    color: "#DC2626",
    bannerImage: "",
    celebrationMessage: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/v1/milestones", data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare the data for submission
    const submitData = {
      ...formData,
      requirement: {
        ...formData.requirement,
        target: parseInt(formData.requirement.target),
        timeframe: formData.requirement.timeframe
          ? parseInt(formData.requirement.timeframe)
          : undefined,
      },
      rewards: {
        ...formData.rewards,
        xp: parseInt(formData.rewards.xp),
      },
      targetDate: formData.targetDate
        ? new Date(formData.targetDate).getTime()
        : undefined,
      seriesOrder: formData.seriesOrder
        ? parseInt(formData.seriesOrder)
        : undefined,
    };

    createMutation.mutate(submitData);
  };

  const handleRequirementChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      requirement: {
        ...prev.requirement,
        [key]: value,
      },
    }));
  };

  const handleRewardsChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        [key]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Create New Milestone
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Basic Information
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    placeholder="Enter milestone title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    placeholder="Enter milestone description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    >
                      <option value="level">Level</option>
                      <option value="streak">Streak</option>
                      <option value="tasks">Tasks</option>
                      <option value="xp">XP</option>
                      <option value="time">Time</option>
                      <option value="personal">Personal</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Icon
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          icon: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      placeholder="🏆"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Requirement */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Requirement
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Requirement Type *
                    </label>
                    <select
                      required
                      value={formData.requirement.type}
                      onChange={(e) =>
                        handleRequirementChange("type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    >
                      <option value="reach_level">Reach Level</option>
                      <option value="reach_streak">Reach Streak</option>
                      <option value="complete_tasks">Complete Tasks</option>
                      <option value="earn_total_xp">Earn Total XP</option>
                      <option value="days_active">Days Active</option>
                      <option value="task_streak">Task Streak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.requirement.target}
                      onChange={(e) =>
                        handleRequirementChange("target", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {formData.requirement.type === "complete_tasks" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Task Category
                    </label>
                    <select
                      value={formData.requirement.taskCategory}
                      onChange={(e) =>
                        handleRequirementChange("taskCategory", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    >
                      <option value="">Any Category</option>
                      <option value="health">Health</option>
                      <option value="productivity">Productivity</option>
                      <option value="learning">Learning</option>
                      <option value="fitness">Fitness</option>
                      <option value="personal">Personal</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Rewards */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Rewards
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    XP Reward *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.rewards.xp}
                    onChange={(e) => handleRewardsChange("xp", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title Reward
                    </label>
                    <input
                      type="text"
                      value={formData.rewards.title}
                      onChange={(e) =>
                        handleRewardsChange("title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      placeholder="Optional title reward"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Badge ID
                    </label>
                    <input
                      type="text"
                      value={formData.rewards.badge}
                      onChange={(e) =>
                        handleRewardsChange("badge", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      placeholder="Optional badge ID"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tier and Rarity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tier *
                </label>
                <select
                  required
                  value={formData.tier}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tier: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rarity *
                </label>
                <select
                  required
                  value={formData.rarity}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rarity: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            </div>

            {/* Series Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Series Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Series
                  </label>
                  <select
                    value={formData.series}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        series: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  >
                    <option value="">No Series</option>
                    {series.map((seriesItem) => (
                      <option
                        key={seriesItem.seriesName}
                        value={seriesItem.seriesName}
                      >
                        {seriesItem.seriesName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Series Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.seriesOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seriesOrder: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    placeholder="Order in series"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Active
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isHidden}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isHidden: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Hidden
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {createMutation.isLoading ? "Creating..." : "Create Milestone"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperMilestoneManagement;
