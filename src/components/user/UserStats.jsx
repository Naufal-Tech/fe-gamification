// components/UserStats.jsx
import React from "react";
import {
  FaBolt,
  FaCrown,
  FaFire,
  FaGamepad,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { useUserData } from "../../hooks/useUserData.js";

// Gamification utility functions
const getLevelFromXP = (xp) => Math.floor(xp / 1000) + 1; // Updated to match your 1000 XP per level
const getXPProgress = (xp) => xp % 1000; // XP in current level
const getRankTitle = (level) => {
  if (level >= 50) return "Grandmaster";
  if (level >= 30) return "Champion";
  if (level >= 20) return "Expert";
  if (level >= 10) return "Warrior";
  if (level >= 5) return "Adventurer";
  return "Novice";
};

const getRankIcon = (level) => {
  if (level >= 50) return <FaCrown className="text-yellow-400" />;
  if (level >= 30) return <FaShield className="text-purple-400" />;
  if (level >= 20) return <FaTrophy className="text-yellow-500" />;
  if (level >= 10) return <FaBolt className="text-blue-400" />;
  return <FaGamepad className="text-green-400" />;
};

const UserStats = () => {
  const { userData, isLoading } = useUserData();

  if (isLoading || !userData) {
    return (
      <div className="hidden lg:flex items-center space-x-4 bg-purple-800/40 rounded-lg px-3 py-2 border border-purple-500/30 animate-pulse">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="w-8 h-4 bg-gray-600 rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="w-16 h-2 bg-gray-600 rounded-full"></div>
          <div className="w-8 h-4 bg-gray-600 rounded"></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  const userXP = userData.totalXP || 0;
  const userLevel = getLevelFromXP(userXP);
  const xpProgress = getXPProgress(userXP);
  const rankTitle = getRankTitle(userLevel);
  const rankIcon = getRankIcon(userLevel);

  // Mock streak data - you can replace this with actual streak data from your backend
  const userStreak = userData.currentStreak || 0;

  return (
    <div className="hidden lg:flex items-center space-x-4 bg-purple-800/40 rounded-lg px-3 py-2 border border-purple-500/30">
      {/* Level */}
      <div className="flex items-center space-x-1">
        {rankIcon}
        <span className="text-yellow-300 font-bold text-sm">
          Lv.{userLevel}
        </span>
      </div>

      {/* XP Progress */}
      <div className="flex items-center space-x-2">
        <FaStar className="text-yellow-400 text-xs" />
        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${(xpProgress / 1000) * 100}%` }}
          ></div>
        </div>
        <span className="text-xs text-purple-200">{xpProgress}/1000</span>
      </div>

      {/* Streak */}
      <div className="flex items-center space-x-1">
        <FaFire
          className={`text-orange-400 text-sm ${
            userStreak > 0 ? "animate-pulse" : ""
          }`}
        />
        <span className="text-orange-300 font-bold text-sm">{userStreak}</span>
      </div>
    </div>
  );
};

export default UserStats;
