import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaAward,
  FaBolt,
  FaCheck,
  FaCheckCircle,
  FaCrown,
  FaFire,
  FaGem,
  FaLock,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const Badges = () => {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [showLocked, setShowLocked] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Fetch user's badges
  const { data: userBadgesData, isLoading: loadingUserBadges } = useQuery({
    queryKey: ["userBadges", user?._id],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(`/v1/badges/user/${user._id}`, config);
      return response.data;
    },
    enabled: !!accessToken && !!user?._id,
  });

  // Fetch available badges
  const { data: availableBadgesData, isLoading: loadingAvailable } = useQuery({
    queryKey: ["availableBadges", user?._id],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        `/v1/badges/user/available/${user._id}`,
        config
      );
      return response.data;
    },
    enabled: !!accessToken && !!user?._id,
  });

  // Check and unlock eligible badges
  const checkEligibleMutation = useMutation({
    mutationFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post(
        `/v1/badges/user/check-eligible/${user._id}`,
        {},
        config
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["userBadges"]);
      queryClient.invalidateQueries(["availableBadges"]);
      queryClient.invalidateQueries(["userData"]);

      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        const badgeNames = data.newlyUnlocked.map((b) => b.name).join(", ");
        alert(
          `🎉 Congratulations! You've unlocked ${data.count} new badge(s): ${badgeNames}`
        );
      } else {
        alert("No new badges unlocked at this time. Keep questing!");
      }
    },
    onError: (error) => {
      console.error("Failed to check eligible badges:", error);
    },
  });

  const userBadges = userBadgesData?.badges || [];
  const availableBadges = availableBadgesData?.badges || [];

  // Combine badges and mark which ones are unlocked
  const allBadges = useMemo(() => {
    const userBadgeIds = new Set(userBadges.map((b) => b._id));
    const combined = [
      ...userBadges.map((b) => ({ ...b, isUnlocked: true })),
      ...availableBadges
        .filter((b) => !userBadgeIds.has(b._id))
        .map((b) => ({ ...b, isUnlocked: false })),
    ];
    return combined;
  }, [userBadges, availableBadges]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      if (!showLocked && !badge.isUnlocked) return false;

      if (selectedCategory !== "all" && badge.category !== selectedCategory) {
        return false;
      }

      if (selectedRarity !== "all" && badge.rarity !== selectedRarity) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          badge.name.toLowerCase().includes(query) ||
          badge.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allBadges, selectedCategory, selectedRarity, showLocked, searchQuery]);

  // Group badges by category
  const groupedBadges = useMemo(() => {
    const groups = {};
    filteredBadges.forEach((badge) => {
      if (!groups[badge.category]) {
        groups[badge.category] = [];
      }
      groups[badge.category].push(badge);
    });
    return groups;
  }, [filteredBadges]);

  const getRarityColor = (rarity) => {
    const colors = {
      common: "from-gray-400 to-gray-600",
      uncommon: "from-green-400 to-green-600",
      rare: "from-blue-400 to-blue-600",
      epic: "from-purple-400 to-purple-600",
      legendary: "from-yellow-400 to-orange-500",
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadge = (rarity) => {
    const styles = {
      common: "bg-gray-500 text-white",
      uncommon: "bg-green-500 text-white",
      rare: "bg-blue-500 text-white",
      epic: "bg-purple-500 text-white",
      legendary:
        "bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse",
    };
    return styles[rarity] || styles.common;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      achievement: <FaTrophy className="text-yellow-500" />,
      milestone: <FaCrown className="text-purple-500" />,
      streak: <FaFire className="text-orange-500" />,
      special: <FaGem className="text-pink-500" />,
      level: <FaStar className="text-blue-500" />,
      task: <FaBolt className="text-green-500" />,
    };
    return icons[category] || <FaAward className="text-gray-500" />;
  };

  const stats = useMemo(() => {
    const unlocked = allBadges.filter((b) => b.isUnlocked).length;
    const total = allBadges.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    const byRarity = {
      common: allBadges.filter((b) => b.isUnlocked && b.rarity === "common")
        .length,
      uncommon: allBadges.filter((b) => b.isUnlocked && b.rarity === "uncommon")
        .length,
      rare: allBadges.filter((b) => b.isUnlocked && b.rarity === "rare").length,
      epic: allBadges.filter((b) => b.isUnlocked && b.rarity === "epic").length,
      legendary: allBadges.filter(
        (b) => b.isUnlocked && b.rarity === "legendary"
      ).length,
    };

    return { unlocked, total, percentage, byRarity };
  }, [allBadges]);

  if (loadingUserBadges || loadingAvailable) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <FaShieldAlt className="text-yellow-300" />
                Badge Collection
              </h1>
              <p className="text-purple-100">
                Showcase your gaming achievements
              </p>
            </div>
            <button
              onClick={() => checkEligibleMutation.mutate()}
              disabled={checkEligibleMutation.isLoading}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <FaCheckCircle />
                Check New Badges
              </span>
            </button>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{stats.unlocked}</div>
              <div className="text-sm text-purple-200">Unlocked</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{stats.total}</div>
              <div className="text-sm text-purple-200">Total Badges</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{stats.percentage}%</div>
              <div className="text-sm text-purple-200">Completion</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">
                <span className="text-yellow-300">
                  {stats.byRarity.legendary}
                </span>
              </div>
              <div className="text-sm text-purple-200">Legendary</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">
                <span className="text-purple-300">{stats.byRarity.epic}</span>
              </div>
              <div className="text-sm text-purple-200">Epic</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Collection Progress</span>
              <span className="font-bold">
                {stats.unlocked} / {stats.total}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="achievement">Achievement</option>
              <option value="milestone">Milestone</option>
              <option value="streak">Streak</option>
              <option value="special">Special</option>
              <option value="level">Level</option>
              <option value="task">Task</option>
            </select>

            {/* Rarity Filter */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>

            {/* Show Locked Toggle */}
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showLocked}
                onChange={(e) => setShowLocked(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Show Locked
              </span>
            </label>
          </div>
        </div>

        {/* Badges Grid */}
        {Object.keys(groupedBadges).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FaShieldAlt className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Badges Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or complete more quests to unlock
              badges!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  {getCategoryIcon(category)}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {category} Badges
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({categoryBadges.filter((b) => b.isUnlocked).length}/
                    {categoryBadges.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryBadges.map((badge) => (
                    <div
                      key={badge._id}
                      onClick={() => setSelectedBadge(badge)}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer ${
                        !badge.isUnlocked ? "opacity-60" : ""
                      }`}
                    >
                      {/* Rarity Banner */}
                      <div
                        className={`h-2 bg-gradient-to-r ${getRarityColor(
                          badge.rarity
                        )}`}
                      ></div>

                      <div className="p-6 relative">
                        {/* Unlock Status */}
                        {badge.isUnlocked ? (
                          <div className="absolute top-2 right-2">
                            <FaCheck className="text-2xl text-green-500" />
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2">
                            <FaLock className="text-xl text-gray-400" />
                          </div>
                        )}

                        {/* Badge Display */}
                        <div className="flex flex-col items-center mb-4">
                          {badge.imageUrl ? (
                            <img
                              src={badge.imageUrl}
                              alt={badge.name}
                              className={`w-24 h-24 object-contain mb-3 ${
                                !badge.isUnlocked ? "filter grayscale" : ""
                              }`}
                            />
                          ) : (
                            <div
                              className={`text-6xl mb-3 ${
                                !badge.isUnlocked ? "filter grayscale" : ""
                              }`}
                              style={{
                                color: badge.isUnlocked
                                  ? badge.color
                                  : "#9CA3AF",
                              }}
                            >
                              {badge.icon || "🏆"}
                            </div>
                          )}

                          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
                            {badge.name}
                          </h3>

                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${getRarityBadge(
                              badge.rarity
                            )}`}
                          >
                            {badge.rarity.toUpperCase()}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm text-center line-clamp-2">
                          {badge.description}
                        </p>

                        {/* Requirements Preview */}
                        {!badge.isUnlocked && badge.requirements && (
                          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                              {badge.requirements.type === "level" &&
                                `Reach Level ${badge.requirements.target}`}
                              {badge.requirements.type === "streak" &&
                                `${badge.requirements.target} Day Streak`}
                              {badge.requirements.type === "tasks" &&
                                `Complete ${badge.requirements.target} Tasks`}
                              {badge.requirements.type === "xp" &&
                                `Earn ${badge.requirements.target} XP`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`h-3 bg-gradient-to-r ${getRarityColor(
                  selectedBadge.rarity
                )}`}
              ></div>

              <div className="p-8">
                <div className="flex flex-col items-center mb-6">
                  {selectedBadge.imageUrl ? (
                    <img
                      src={selectedBadge.imageUrl}
                      alt={selectedBadge.name}
                      className={`w-32 h-32 object-contain mb-4 ${
                        !selectedBadge.isUnlocked ? "filter grayscale" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`text-8xl mb-4 ${
                        !selectedBadge.isUnlocked ? "filter grayscale" : ""
                      }`}
                      style={{
                        color: selectedBadge.isUnlocked
                          ? selectedBadge.color
                          : "#9CA3AF",
                      }}
                    >
                      {selectedBadge.icon || "🏆"}
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedBadge.name}
                  </h2>

                  <span
                    className={`text-sm px-4 py-2 rounded-full font-semibold ${getRarityBadge(
                      selectedBadge.rarity
                    )}`}
                  >
                    {selectedBadge.rarity.toUpperCase()}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {selectedBadge.description}
                </p>

                {selectedBadge.isUnlocked ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                    <FaCheck className="text-3xl text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 dark:text-green-300 font-semibold">
                      Badge Unlocked!
                    </p>
                  </div>
                ) : selectedBadge.requirements ? (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                      Requirements
                    </h3>
                    <div className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <FaLock className="text-gray-400" />
                        <span>
                          {selectedBadge.requirements.type === "level" &&
                            `Reach Level ${selectedBadge.requirements.target}`}
                          {selectedBadge.requirements.type === "streak" &&
                            `Maintain a ${selectedBadge.requirements.target} day streak`}
                          {selectedBadge.requirements.type === "tasks" &&
                            `Complete ${selectedBadge.requirements.target} tasks`}
                          {selectedBadge.requirements.type === "xp" &&
                            `Earn ${selectedBadge.requirements.target} total XP`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <FaLock className="text-2xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Keep completing quests to unlock this badge!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Badges;
