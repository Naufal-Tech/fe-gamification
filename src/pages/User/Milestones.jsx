import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaAward,
  FaBolt,
  FaCheck,
  FaChevronRight,
  FaCrown,
  FaFilter,
  FaFire,
  FaGem,
  FaLock,
  FaMedal,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const Milestones = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Fetch user milestones
  const { data, isLoading, error } = useQuery({
    queryKey: ["userMilestones", showCompleted],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        `/v1/milestones/user/available?includeCompleted=${showCompleted}`,
        config
      );
      return response.data;
    },
    enabled: !!accessToken,
  });

  // Complete milestone mutation
  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post(
        `/v1/milestones/complete/${milestoneId}`,
        {},
        config
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["userMilestones"]);
      queryClient.invalidateQueries(["userData"]);
      setSelectedMilestone(null);

      // Show celebration
      if (data.celebrationMessage) {
        alert(
          `🎉 ${data.celebrationMessage}\n\nYou earned ${data.milestone.xpReward} XP!`
        );
      }
    },
    onError: (error) => {
      console.error("Failed to complete milestone:", error);
      alert(error.response?.data?.error || "Failed to complete milestone");
    },
  });

  const milestones = data?.milestones || [];
  const userStats = data?.userStats || {};

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((milestone) => {
      if (
        selectedCategory !== "all" &&
        milestone.category !== selectedCategory
      ) {
        return false;
      }
      if (selectedTier !== "all" && milestone.tier !== selectedTier) {
        return false;
      }
      return true;
    });
  }, [milestones, selectedCategory, selectedTier]);

  // Group milestones by category
  const groupedMilestones = useMemo(() => {
    const groups = {};
    filteredMilestones.forEach((milestone) => {
      if (!groups[milestone.category]) {
        groups[milestone.category] = [];
      }
      groups[milestone.category].push(milestone);
    });
    return groups;
  }, [filteredMilestones]);

  const getCategoryIcon = (category) => {
    const icons = {
      level: <FaCrown className="text-yellow-400" />,
      streak: <FaFire className="text-orange-500" />,
      tasks: <FaBolt className="text-blue-400" />,
      xp: <FaStar className="text-purple-400" />,
      special: <FaGem className="text-pink-400" />,
    };
    return icons[category] || <FaTrophy className="text-yellow-500" />;
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: "from-amber-600 to-amber-800",
      silver: "from-gray-300 to-gray-500",
      gold: "from-yellow-400 to-yellow-600",
      platinum: "from-cyan-300 to-cyan-500",
      diamond: "from-blue-300 to-purple-400",
    };
    return colors[tier] || "from-gray-400 to-gray-600";
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

  const handleCompleteMilestone = (milestone) => {
    if (milestone.canBeCompleted && !milestone.isCompleted) {
      if (window.confirm(`Complete milestone: ${milestone.title}?`)) {
        completeMilestoneMutation.mutate(milestone._id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
            Failed to load milestones. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with User Stats */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <FaTrophy className="text-yellow-300" />
                Quest Milestones
              </h1>
              <p className="text-purple-100">
                Complete challenges to earn legendary rewards
              </p>
            </div>
            <FaMedal className="text-6xl text-yellow-300 opacity-20" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaStar className="text-yellow-300" />
                <span className="text-sm text-purple-200">Total XP</span>
              </div>
              <div className="text-2xl font-bold">{userStats.totalXP || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaCrown className="text-yellow-300" />
                <span className="text-sm text-purple-200">Level</span>
              </div>
              <div className="text-2xl font-bold">
                {userStats.currentLevel || 1}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaFire className="text-orange-400" />
                <span className="text-sm text-purple-200">Streak</span>
              </div>
              <div className="text-2xl font-bold">
                {userStats.currentStreak || 0}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaTrophy className="text-yellow-300" />
                <span className="text-sm text-purple-200">Completed</span>
              </div>
              <div className="text-2xl font-bold">
                {userStats.totalMilestonesCompleted || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="level">Level</option>
              <option value="streak">Streak</option>
              <option value="tasks">Tasks</option>
              <option value="xp">XP</option>
              <option value="special">Special</option>
            </select>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Show Completed
              </span>
            </label>
          </div>
        </div>

        {/* Milestones Grid */}
        {Object.keys(groupedMilestones).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FaTrophy className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Milestones Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Keep completing tasks to unlock new milestones!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMilestones).map(
              ([category, categoryMilestones]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    {getCategoryIcon(category)}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {category} Milestones
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({categoryMilestones.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryMilestones.map((milestone) => (
                      <div
                        key={milestone._id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                          milestone.isCompleted ? "opacity-75" : ""
                        }`}
                      >
                        {/* Tier Banner */}
                        <div
                          className={`h-2 bg-gradient-to-r ${getTierColor(
                            milestone.tier
                          )}`}
                        ></div>

                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl">
                                {milestone.icon || "🏆"}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {milestone.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-semibold ${getRarityBadge(
                                      milestone.rarity
                                    )}`}
                                  >
                                    {milestone.rarity.toUpperCase()}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                                    {milestone.tier.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {milestone.isCompleted && (
                              <FaCheck className="text-2xl text-green-500" />
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {milestone.description}
                          </p>

                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                Progress
                              </span>
                              <span className="text-purple-600 dark:text-purple-400 font-bold">
                                {milestone.progress?.current || 0} /{" "}
                                {milestone.requirement?.target || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full bg-gradient-to-r ${getTierColor(
                                  milestone.tier
                                )} transition-all duration-500`}
                                style={{
                                  width: `${Math.min(
                                    milestone.progress?.percentage || 0,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Rewards */}
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Rewards
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaStar className="text-yellow-500" />
                                  <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {milestone.xpReward} XP
                                  </span>
                                </div>
                              </div>
                              {milestone.rewards?.title && (
                                <div className="text-right">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Title
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FaAward className="text-yellow-500" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      {milestone.rewards.title}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          {!milestone.isCompleted &&
                          milestone.canBeCompleted ? (
                            <button
                              onClick={() => handleCompleteMilestone(milestone)}
                              disabled={completeMilestoneMutation.isLoading}
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <FaTrophy />
                                Claim Reward
                              </span>
                            </button>
                          ) : milestone.isCompleted ? (
                            <div className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold py-3 rounded-lg text-center">
                              <span className="flex items-center justify-center gap-2">
                                <FaCheck />
                                Completed
                              </span>
                            </div>
                          ) : (
                            <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-3 rounded-lg text-center">
                              <span className="flex items-center justify-center gap-2">
                                <FaLock />
                                Keep Questing
                              </span>
                            </div>
                          )}

                          {/* Next Milestone */}
                          {milestone.nextMilestone &&
                            !milestone.isCompleted && (
                              <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                                <span>Next:</span>
                                <FaChevronRight className="text-xs" />
                                <span className="font-semibold">
                                  {milestone.nextMilestone.title}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Milestones;
