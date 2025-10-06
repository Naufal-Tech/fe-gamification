// pages/admin/milestones.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaCrown,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaFire,
  FaGem,
  FaMedal,
  FaPlus,
  FaSearch,
  FaStar,
  FaSync,
  FaTimesCircle,
  FaTrash,
  FaTrophy,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const AdminMilestones = () => {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState({
    category: "all",
    tier: "all",
    rarity: "all",
    isActive: "all",
    isHidden: "all",
    series: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch milestones with filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminMilestones", filters, pagination],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };

      const params = new URLSearchParams();
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.tier !== "all") params.append("tier", filters.tier);
      if (filters.rarity !== "all") params.append("rarity", filters.rarity);
      if (filters.isActive !== "all")
        params.append("isActive", filters.isActive);
      if (filters.isHidden !== "all")
        params.append("isHidden", filters.isHidden);
      if (filters.series !== "all") params.append("series", filters.series);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      params.append("sortBy", pagination.sortBy);
      params.append("sortOrder", pagination.sortOrder);

      const response = await api.get(`/v1/milestones?${params}`, config);
      return response.data;
    },
    enabled: !!accessToken && user?.role === "Admin",
  });

  // Fetch milestone series for filter
  const { data: seriesData } = useQuery({
    queryKey: ["milestoneSeries"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/milestones/meta/series", config);
      return response.data;
    },
    enabled: !!accessToken,
  });

  // Fetch expiring milestones
  const { data: expiringData } = useQuery({
    queryKey: ["expiringMilestones"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        "/v1/milestones/meta/expiring?days=7",
        config
      );
      return response.data;
    },
    enabled: !!accessToken && user?.role === "Admin",
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (milestoneId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      await api.delete(`/v1/milestones/${milestoneId}`, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminMilestones"]);
      setShowDeleteModal(false);
      setSelectedMilestone(null);
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      alert(error.response?.data?.error || "Failed to delete milestone");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.patch(
        `/v1/milestones/${id}`,
        { isActive },
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminMilestones"]);
    },
    onError: (error) => {
      console.error("Toggle active failed:", error);
      alert(error.response?.data?.error || "Failed to update milestone");
    },
  });

  // Helper functions
  const getTierColor = (tier) => {
    const colors = {
      bronze: "bg-amber-600 text-white",
      silver: "bg-gray-400 text-white",
      gold: "bg-yellow-500 text-white",
      platinum: "bg-cyan-500 text-white",
      diamond: "bg-purple-500 text-white",
    };
    return colors[tier] || "bg-gray-500 text-white";
  };

  const getRarityBadge = (rarity) => {
    const styles = {
      common: "bg-gray-500 text-white",
      uncommon: "bg-green-500 text-white",
      rare: "bg-blue-500 text-white",
      epic: "bg-purple-500 text-white",
      legendary: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
    };
    return styles[rarity] || styles.common;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      level: <FaCrown className="text-yellow-500" />,
      streak: <FaFire className="text-orange-500" />,
      tasks: <FaStar className="text-blue-500" />,
      xp: <FaGem className="text-purple-500" />,
      special: <FaTrophy className="text-pink-500" />,
    };
    return icons[category] || <FaMedal className="text-gray-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter milestones based on search
  const filteredMilestones = useMemo(() => {
    if (!data?.milestones) return [];

    return data.milestones.filter((milestone) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          milestone.title.toLowerCase().includes(searchLower) ||
          milestone.description.toLowerCase().includes(searchLower) ||
          (milestone.series &&
            milestone.series.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [data?.milestones, filters.search]);

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
                Milestone Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create, edit, and manage achievement milestones
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <FaPlus />
              Create Milestone
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Milestones
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {data?.pagination?.totalCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FaTrophy className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Milestones
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {data?.milestones?.filter((m) => m.isActive)?.length || 0}
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
                    Hidden Milestones
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                    {data?.milestones?.filter((m) => m.isHidden)?.length || 0}
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
                    Expiring Soon
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                    {expiringData?.milestones?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FaClock className="text-orange-600 dark:text-orange-400 text-xl" />
                </div>
              </div>
            </div>
          </div>
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
                  placeholder="Search milestones..."
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
                <option value="level">Level</option>
                <option value="streak">Streak</option>
                <option value="tasks">Tasks</option>
                <option value="xp">XP</option>
                <option value="special">Special</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={filters.tier}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, tier: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
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

        {/* Expiring Milestones Alert */}
        {expiringData?.milestones && expiringData.milestones.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-orange-500 text-xl" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-300">
                  {expiringData.milestones.length} milestones expiring in the
                  next 7 days
                </h3>
                <p className="text-orange-600 dark:text-orange-400 text-sm">
                  Review and update target dates if needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Milestones Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                Loading milestones...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
                Failed to load milestones. Please try again.
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Milestone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category & Tier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Requirements
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rewards
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
                    {filteredMilestones.map((milestone) => (
                      <tr
                        key={milestone._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{milestone.icon}</div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {milestone.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {milestone.description}
                              </div>
                              {milestone.series && (
                                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                  Series: {milestone.series} #
                                  {milestone.seriesOrder}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(milestone.category)}
                              <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                                {milestone.category}
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                                milestone.tier
                              )}`}
                            >
                              {milestone.tier}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {milestone.requirement?.type === "reach" && (
                              <>
                                Reach {milestone.requirement.target}{" "}
                                {milestone.requirement.metric}
                              </>
                            )}
                            {milestone.requirement?.type === "maintain" && (
                              <>
                                Maintain {milestone.requirement.target}{" "}
                                {milestone.requirement.metric} for{" "}
                                {milestone.requirement.duration} days
                              </>
                            )}
                          </div>
                          {milestone.targetDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Until: {formatDate(milestone.targetDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-yellow-600 dark:text-yellow-400">
                              {milestone.rewards?.xp || 0} XP
                            </div>
                            {milestone.rewards?.title && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Title: {milestone.rewards.title}
                              </div>
                            )}
                            {milestone.rewards?.badge && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Badge: {milestone.rewards.badge}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {milestone.isActive ? (
                                <FaCheckCircle className="text-green-500" />
                              ) : (
                                <FaTimesCircle className="text-red-500" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  milestone.isActive
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {milestone.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            {milestone.isHidden && (
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
                          {formatDate(milestone.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  id: milestone._id,
                                  isActive: !milestone.isActive,
                                })
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                milestone.isActive
                                  ? "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                              }`}
                              title={
                                milestone.isActive ? "Deactivate" : "Activate"
                              }
                            >
                              {milestone.isActive ? (
                                <FaTimesCircle />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone);
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

              {/* Pagination */}
              {data?.pagination && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      {(data.pagination.currentPage - 1) *
                        data.pagination.limit +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        data.pagination.currentPage * data.pagination.limit,
                        data.pagination.totalCount
                      )}{" "}
                      of {data.pagination.totalCount} entries
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

      {/* Modals would go here */}
      {/* Create Milestone Modal */}
      {showCreateModal && (
        <CreateMilestoneModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Edit Milestone Modal */}
      {showEditModal && selectedMilestone && (
        <EditMilestoneModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMilestone(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedMilestone(null);
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMilestone && (
        <DeleteConfirmationModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMilestone(null);
          }}
          onConfirm={() => deleteMutation.mutate(selectedMilestone._id)}
          isLoading={deleteMutation.isLoading}
        />
      )}

      {/* Milestone Details Modal */}
      {showDetailsModal && selectedMilestone && (
        <MilestoneDetailsModal
          milestone={selectedMilestone}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMilestone(null);
          }}
        />
      )}
    </div>
  );
};

// Modal Components (simplified versions - you'd want to expand these)
const CreateMilestoneModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "level",
    requirement: { type: "reach", metric: "level", target: 1 },
    rewards: { xp: 100 },
    tier: "bronze",
    rarity: "common",
    isActive: true,
    isHidden: false,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Milestone
          </h2>
        </div>
        <div className="p-6">
          {/* Form fields would go here */}
          <p>Form implementation would go here...</p>
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
            Create Milestone
          </button>
        </div>
      </div>
    </div>
  );
};

const EditMilestoneModal = ({ milestone, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Milestone: {milestone.title}
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

const DeleteConfirmationModal = ({
  milestone,
  onClose,
  onConfirm,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Delete Milestone
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the milestone{" "}
            <strong>"{milestone.title}"</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This action cannot be undone. The milestone will be soft-deleted and
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
                Delete Milestone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MilestoneDetailsModal = ({ milestone, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Milestone Details
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {milestone.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {milestone.description}
              </p>
            </div>
            {/* More details would go here */}
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

export default AdminMilestones;
