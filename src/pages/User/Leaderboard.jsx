import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FaAward,
  FaBolt,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaFilter,
  FaGem,
  FaMedal,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const Leaderboard = () => {
  const { accessToken, user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("xp");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardLimit] = useState(50);

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["leaderboard", currentPage, selectedCategory],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(
        `/v1/xp-transactions/leaderboard?page=${currentPage}&limit=${leaderboardLimit}`,
        config
      );
      return response.data;
    },
    enabled: !!accessToken,
  });

  // Fetch user's own rank
  const { data: userData } = useQuery({
    queryKey: ["userData"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/users/info-user", config);
      return response.data;
    },
    enabled: !!accessToken,
  });

  const leaderboard = leaderboardData?.data?.leaderboard || [];
  const pagination = leaderboardData?.data?.pagination || {};
  const currentUser = userData?.user;

  // Filter leaderboard based on search
  const filteredLeaderboard = leaderboard.filter((player) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      player.username?.toLowerCase().includes(query) ||
      player.fullName?.toLowerCase().includes(query)
    );
  });

  const getRankBadge = (rank) => {
    if (rank === 1)
      return {
        icon: <FaCrown className="text-3xl" />,
        gradient: "from-yellow-400 via-yellow-500 to-orange-500",
        glow: "shadow-yellow-500/50",
        border: "border-yellow-400",
        text: "Champion",
      };
    if (rank === 2)
      return {
        icon: <FaMedal className="text-3xl" />,
        gradient: "from-gray-300 via-gray-400 to-gray-500",
        glow: "shadow-gray-400/50",
        border: "border-gray-400",
        text: "Runner-up",
      };
    if (rank === 3)
      return {
        icon: <FaMedal className="text-3xl" />,
        gradient: "from-amber-600 via-amber-700 to-amber-800",
        glow: "shadow-amber-600/50",
        border: "border-amber-600",
        text: "Third Place",
      };
    if (rank <= 10)
      return {
        icon: <FaShieldAlt className="text-2xl" />,
        gradient: "from-purple-400 to-purple-600",
        glow: "shadow-purple-500/30",
        border: "border-purple-400",
        text: "Top 10",
      };
    return {
      icon: null,
      gradient: "from-blue-400 to-blue-600",
      glow: "shadow-blue-500/20",
      border: "border-blue-400",
      text: "Competitor",
    };
  };

  const getLevelBadge = (level) => {
    if (level >= 50)
      return {
        icon: <FaCrown />,
        color: "text-yellow-400",
        label: "Grandmaster",
      };
    if (level >= 30)
      return {
        icon: <FaShieldAlt />,
        color: "text-purple-400",
        label: "Champion",
      };
    if (level >= 20)
      return { icon: <FaTrophy />, color: "text-yellow-500", label: "Expert" };
    if (level >= 10)
      return { icon: <FaBolt />, color: "text-blue-400", label: "Warrior" };
    if (level >= 5)
      return { icon: <FaStar />, color: "text-green-400", label: "Adventurer" };
    return { icon: <FaAward />, color: "text-gray-400", label: "Novice" };
  };

  const getProfileImage = (img) => {
    return img || "https://placehold.jp/150x150.png";
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-yellow-900/10 dark:to-orange-900/10 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-lg p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-xl animate-pulse"></div>
            <div
              className="absolute bottom-0 right-1/3 w-24 h-24 bg-white rounded-full blur-lg animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
                  <FaTrophy className="text-yellow-300 animate-bounce" />
                  Global Leaderboard
                </h1>
                <p className="text-yellow-100">
                  Compete with the best quest masters worldwide
                </p>
              </div>
              <FaGem className="text-6xl text-yellow-300 opacity-30" />
            </div>

            {/* User's Position Banner */}
            {currentUser && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={getProfileImage(currentUser.img_profile)}
                    alt="Your avatar"
                    className="w-12 h-12 rounded-full border-2 border-yellow-300"
                  />
                  <div>
                    <div className="font-bold text-lg">Your Position</div>
                    <div className="text-sm text-yellow-100">
                      {currentUser.fullName || currentUser.username}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {currentUser.totalXP?.toLocaleString() || 0} XP
                  </div>
                  <div className="text-sm text-yellow-100">
                    Level {currentUser.currentLevel || 1}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="xp">Total XP</option>
                <option value="level">Level</option>
                <option value="streak">Streak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {filteredLeaderboard.length >= 3 &&
          currentPage === 1 &&
          !searchQuery && (
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-4 items-end">
                {/* 2nd Place */}
                <div className="transform translate-y-8">
                  <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg p-6 text-center">
                    <div className="relative inline-block mb-3">
                      <img
                        src={getProfileImage(
                          filteredLeaderboard[1]?.img_profile
                        )}
                        alt="2nd place"
                        className="w-20 h-20 rounded-full border-4 border-gray-200 mx-auto"
                      />
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        2
                      </div>
                    </div>
                    <div className="font-bold text-white truncate">
                      {filteredLeaderboard[1]?.fullName ||
                        filteredLeaderboard[1]?.username}
                    </div>
                    <div className="text-2xl font-bold text-white mt-2">
                      {filteredLeaderboard[1]?.totalXP?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-100">XP</div>
                  </div>
                  <div className="bg-gray-400 h-32 rounded-b-lg flex items-center justify-center">
                    <FaMedal className="text-6xl text-gray-200" />
                  </div>
                </div>

                {/* 1st Place */}
                <div className="transform -translate-y-4">
                  <div className="bg-gradient-to-b from-yellow-400 to-orange-500 rounded-t-lg p-6 text-center relative">
                    <FaCrown className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-5xl text-yellow-400 animate-bounce" />
                    <div className="relative inline-block mb-3 mt-4">
                      <img
                        src={getProfileImage(
                          filteredLeaderboard[0]?.img_profile
                        )}
                        alt="1st place"
                        className="w-24 h-24 rounded-full border-4 border-yellow-200 mx-auto shadow-xl"
                      />
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                        1
                      </div>
                    </div>
                    <div className="font-bold text-white text-lg truncate">
                      {filteredLeaderboard[0]?.fullName ||
                        filteredLeaderboard[0]?.username}
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">
                      {filteredLeaderboard[0]?.totalXP?.toLocaleString()}
                    </div>
                    <div className="text-sm text-yellow-100">XP</div>
                  </div>
                  <div className="bg-yellow-500 h-40 rounded-b-lg flex items-center justify-center">
                    <FaTrophy className="text-7xl text-yellow-200" />
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="transform translate-y-12">
                  <div className="bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg p-6 text-center">
                    <div className="relative inline-block mb-3">
                      <img
                        src={getProfileImage(
                          filteredLeaderboard[2]?.img_profile
                        )}
                        alt="3rd place"
                        className="w-20 h-20 rounded-full border-4 border-amber-400 mx-auto"
                      />
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-800 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        3
                      </div>
                    </div>
                    <div className="font-bold text-white truncate">
                      {filteredLeaderboard[2]?.fullName ||
                        filteredLeaderboard[2]?.username}
                    </div>
                    <div className="text-2xl font-bold text-white mt-2">
                      {filteredLeaderboard[2]?.totalXP?.toLocaleString()}
                    </div>
                    <div className="text-sm text-amber-100">XP</div>
                  </div>
                  <div className="bg-amber-700 h-28 rounded-b-lg flex items-center justify-center">
                    <FaMedal className="text-6xl text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Full Leaderboard List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Rankings
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLeaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <FaTrophy className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No players found
                </p>
              </div>
            ) : (
              filteredLeaderboard.map((player) => {
                const rankBadge = getRankBadge(player.rank);
                const levelBadge = getLevelBadge(player.currentLevel);
                const isCurrentUser = player._id === user?._id;

                return (
                  <div
                    key={player._id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isCurrentUser ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${rankBadge.gradient} ${rankBadge.glow} flex items-center justify-center shadow-lg border-2 ${rankBadge.border}`}
                      >
                        {rankBadge.icon || (
                          <span className="text-2xl font-bold text-white">
                            {player.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <img
                        src={getProfileImage(player.img_profile)}
                        alt={player.username}
                        className="w-14 h-14 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                            {player.fullName || player.username}
                          </h3>
                          {isCurrentUser && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              You
                            </span>
                          )}
                          {player.rank <= 3 && (
                            <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full font-semibold">
                              {rankBadge.text}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            {levelBadge.icon}
                            <span className={levelBadge.color}>
                              Level {player.currentLevel}
                            </span>
                          </span>
                          <span>•</span>
                          <span>{levelBadge.label}</span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {player.totalXP?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          XP
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow"
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
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow"
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
