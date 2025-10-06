// pages/admin/badges.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaAward,
  FaChartBar,
  FaCheckCircle,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimesCircle,
  FaTrash,
  FaUnlock,
  FaUpload,
  FaUsers,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const AdminBadges = () => {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState({
    category: "all",
    rarity: "all",
    isActive: "all",
    isHidden: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedUserForUnlock, setSelectedUserForUnlock] = useState("");

  // Fetch badges with filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminBadges", filters, pagination],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };

      const params = new URLSearchParams();
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.rarity !== "all") params.append("rarity", filters.rarity);
      if (filters.isActive !== "all")
        params.append("isActive", filters.isActive);
      if (filters.isHidden !== "all")
        params.append("isHidden", filters.isHidden);
      if (filters.search) params.append("search", filters.search);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await api.get(`/v1/badges?${params}`, config);
      return response.data;
    },
    enabled: !!accessToken && user?.role === "Admin",
  });

  // Fetch badge statistics
  const { data: statsData } = useQuery({
    queryKey: ["badgeStats"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/badges/stats", config);
      return response.data;
    },
    enabled: !!accessToken && user?.role === "Admin",
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (badgeId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      await api.delete(`/v1/badges/${badgeId}`, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
      setShowDeleteModal(false);
      setSelectedBadge(null);
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      alert(error.response?.data?.error || "Failed to delete badge");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.patch(
        `/v1/badges/${id}`,
        { isActive },
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
    },
    onError: (error) => {
      console.error("Toggle active failed:", error);
      alert(error.response?.data?.error || "Failed to update badge");
    },
  });

  const unlockBadgeMutation = useMutation({
    mutationFn: async ({ badgeId, userId }) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post(
        `/v1/badges/${badgeId}/unlock/${userId}`,
        {},
        config
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["adminBadges"]);
      queryClient.invalidateQueries(["badgeStats"]);
      setShowUnlockModal(false);
      setSelectedUserForUnlock("");
      alert(
        `Badge unlocked successfully! ${
          data.xpBonus ? `+${data.xpBonus} XP awarded` : ""
        }`
      );
    },
    onError: (error) => {
      console.error("Unlock badge failed:", error);
      alert(error.response?.data?.error || "Failed to unlock badge");
    },
  });

  // Helper functions
  const getRarityColor = (rarity) => {
    const colors = {
      common: "bg-gray-500 text-white",
      uncommon: "bg-green-500 text-white",
      rare: "bg-blue-500 text-white",
      epic: "bg-purple-500 text-white",
      legendary: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
    };
    return colors[rarity] || colors.common;
  };

  const getRarityXP = (rarity) => {
    const xpValues = {
      common: 50,
      uncommon: 100,
      rare: 250,
      epic: 500,
      legendary: 1000,
    };
    return xpValues[rarity] || 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter badges based on search
  const filteredBadges = useMemo(() => {
    if (!data?.badges) return [];

    return data.badges.filter((badge) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          badge.name.toLowerCase().includes(searchLower) ||
          badge.description.toLowerCase().includes(searchLower) ||
          badge.category.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [data?.badges, filters.search]);

  const categories = [
    ...new Set(data?.badges?.map((badge) => badge.category) || []),
  ];

  if (!user || user.role !== "Admin") {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
            Access denied. Admin privileges required.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Badge Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create, edit, and manage achievement badges
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <FaPlus />
              Create Badge
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Badges
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {statsData?.stats?.totalBadges || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FaAward className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Badges
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {statsData?.stats?.activeBadges || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hidden Badges
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                    {statsData?.stats?.hiddenBadges || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <FaEyeSlash className="text-yellow-600 dark:text-yellow-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Unlocks
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {statsData?.stats?.totalUnlocks || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FaUsers className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Rarity Distribution */}
          {statsData?.stats?.rarityDistribution && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaChartBar />
                Rarity Distribution
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(statsData.stats.rarityDistribution).map(
                  ([rarity, count]) => (
                    <div key={rarity} className="text-center">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getRarityColor(
                          rarity
                        )} mb-2`}
                      >
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {rarity}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getRarityXP(rarity)} XP
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <div>
              <select
                value={filters.rarity}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, rarity: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.isActive}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, isActive: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div>
              <button
                onClick={() => refetch()}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <FaSync className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Badges Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                Loading badges...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
                Failed to load badges. Please try again.
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Badge
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Requirements
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredBadges.map((badge) => (
                      <tr
                        key={badge._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {badge.imageUrl ? (
                                <img
                                  src={badge.imageUrl}
                                  alt={badge.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                  style={{
                                    backgroundColor: badge.color || "#F59E0B",
                                  }}
                                >
                                  {badge.icon || "🏆"}
                                </div>
                              )}
                              <div
                                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${getRarityColor(
                                  badge.rarity
                                )}`}
                              ></div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {badge.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {badge.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Category:
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {badge.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Rarity:
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-semibold ${getRarityColor(
                                  badge.rarity
                                )}`}
                              >
                                {badge.rarity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                XP:
                              </span>
                              <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                {getRarityXP(badge.rarity)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                            {badge.requirements ? (
                              <div className="space-y-1">
                                {badge.requirements.type === "reach" && (
                                  <div>
                                    Reach {badge.requirements.target}{" "}
                                    {badge.requirements.metric}
                                  </div>
                                )}
                                {badge.requirements.type === "maintain" && (
                                  <div>
                                    Maintain {badge.requirements.target}{" "}
                                    {badge.requirements.metric} for{" "}
                                    {badge.requirements.duration} days
                                  </div>
                                )}
                                {badge.requirements.type === "complete" && (
                                  <div>
                                    Complete {badge.requirements.target}{" "}
                                    {badge.requirements.taskType}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                Manual unlock only
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {badge.isActive ? (
                                <FaCheckCircle className="text-green-500" />
                              ) : (
                                <FaTimesCircle className="text-red-500" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  badge.isActive
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {badge.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            {badge.isHidden && (
                              <div className="flex items-center gap-2">
                                <FaEyeSlash className="text-yellow-500" />
                                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                  Hidden
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(badge.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedBadge(badge);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBadge(badge);
                                setShowUnlockModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Unlock for User"
                            >
                              <FaUnlock />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBadge(badge);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  id: badge._id,
                                  isActive: !badge.isActive,
                                })
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                badge.isActive
                                  ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                              }`}
                              title={badge.isActive ? "Deactivate" : "Activate"}
                            >
                              {badge.isActive ? (
                                <FaTimesCircle />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBadge(badge);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredBadges.length === 0 && !isLoading && (
                <div className="p-12 text-center">
                  <FaAward className="text-6xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Badges Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {filters.search ||
                    filters.category !== "all" ||
                    filters.rarity !== "all"
                      ? "Try adjusting your filters to see more results."
                      : "Get started by creating your first badge."}
                  </p>
                  {!filters.search &&
                    filters.category === "all" &&
                    filters.rarity === "all" && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <FaPlus />
                        Create First Badge
                      </button>
                    )}
                </div>
              )}

              {/* Pagination */}
              {data?.pagination && filteredBadges.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      {(data.pagination.current - 1) * data.pagination.count +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        data.pagination.current * data.pagination.count,
                        data.pagination.totalRecords
                      )}{" "}
                      of {data.pagination.totalRecords} entries
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={!data.pagination.hasPrev}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={!data.pagination.hasNext}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Create Badge Modal */}
      {showCreateModal && (
        <CreateBadgeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Edit Badge Modal */}
      {showEditModal && selectedBadge && (
        <EditBadgeModal
          badge={selectedBadge}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBadge(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedBadge(null);
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBadge && (
        <DeleteConfirmationModal
          badge={selectedBadge}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBadge(null);
          }}
          onConfirm={() => deleteMutation.mutate(selectedBadge._id)}
          isLoading={deleteMutation.isLoading}
        />
      )}

      {/* Badge Details Modal */}
      {showDetailsModal && selectedBadge && (
        <BadgeDetailsModal
          badge={selectedBadge}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBadge(null);
          }}
        />
      )}

      {/* Unlock Badge Modal */}
      {showUnlockModal && selectedBadge && (
        <UnlockBadgeModal
          badge={selectedBadge}
          onClose={() => {
            setShowUnlockModal(false);
            setSelectedBadge(null);
            setSelectedUserForUnlock("");
          }}
          onUnlock={(userId) =>
            unlockBadgeMutation.mutate({
              badgeId: selectedBadge._id,
              userId,
            })
          }
          isLoading={unlockBadgeMutation.isLoading}
        />
      )}
    </div>
  );
};

// Modal Components
const CreateBadgeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏆",
    color: "#F59E0B",
    rarity: "common",
    category: "",
    requirements: null,
    isActive: true,
    isHidden: false,
  });
  const [imageFile, setImageFile] = useState(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Badge
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter badge name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Level, Streak, Tasks"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                placeholder="Describe what this badge represents"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                  placeholder="🏆"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rarity
                </label>
                <select
                  value={formData.rarity}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rarity: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Badge Image
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                    <FaUpload className="mx-auto text-gray-400 text-2xl mb-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {imageFile ? imageFile.name : "Click to upload image"}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isHidden}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isHidden: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Hidden
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Badge
          </button>
        </div>
      </div>
    </div>
  );
};

const EditBadgeModal = ({ badge, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Badge: {badge.name}
          </h2>
        </div>
        <div className="p-6">
          <p>Edit form implementation would go here...</p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ badge, onClose, onConfirm, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Delete Badge
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the badge{" "}
            <strong>"{badge.name}"</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This action cannot be undone. The badge will be soft-deleted and
            hidden from users.
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <FaTrash />
                Delete Badge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const BadgeDetailsModal = ({ badge, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Badge Details
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Badge Preview */}
            <div className="text-center">
              <div className="inline-block relative">
                {badge.imageUrl ? (
                  <img
                    src={badge.imageUrl}
                    alt={badge.name}
                    className="w-32 h-32 rounded-lg object-cover mx-auto"
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-lg flex items-center justify-center text-4xl mx-auto"
                    style={{ backgroundColor: badge.color || "#F59E0B" }}
                  >
                    {badge.icon || "🏆"}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                {badge.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {badge.description}
              </p>
            </div>

            {/* Badge Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Category:
                    </span>
                    <span className="font-medium capitalize">
                      {badge.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Rarity:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(
                        badge.rarity
                      )}`}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      XP Value:
                    </span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      {getRarityXP(badge.rarity)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Status
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Active:
                    </span>
                    <span
                      className={`font-medium ${
                        badge.isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {badge.isActive ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Hidden:
                    </span>
                    <span
                      className={`font-medium ${
                        badge.isHidden
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {badge.isHidden ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Created:
                    </span>
                    <span className="font-medium text-sm">
                      {formatDate(badge.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {badge.requirements && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Requirements
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {badge.requirements.type === "reach" && (
                    <p>
                      Reach {badge.requirements.target}{" "}
                      {badge.requirements.metric}
                    </p>
                  )}
                  {badge.requirements.type === "maintain" && (
                    <p>
                      Maintain {badge.requirements.target}{" "}
                      {badge.requirements.metric} for{" "}
                      {badge.requirements.duration} days
                    </p>
                  )}
                  {badge.requirements.type === "complete" && (
                    <p>
                      Complete {badge.requirements.target}{" "}
                      {badge.requirements.taskType}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const UnlockBadgeModal = ({ badge, onClose, onUnlock, isLoading }) => {
  const [userId, setUserId] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unlock Badge for User
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-block relative">
              {badge.imageUrl ? (
                <img
                  src={badge.imageUrl}
                  alt={badge.name}
                  className="w-16 h-16 rounded-lg object-cover mx-auto"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl mx-auto"
                  style={{ backgroundColor: badge.color || "#F59E0B" }}
                >
                  {badge.icon || "🏆"}
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
              {badge.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {getRarityXP(badge.rarity)} XP • {badge.rarity}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter the MongoDB User ID of the user you want to award this badge
              to.
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onUnlock(userId)}
            disabled={!userId || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Unlocking...
              </>
            ) : (
              <>
                <FaUnlock />
                Unlock Badge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBadges;
