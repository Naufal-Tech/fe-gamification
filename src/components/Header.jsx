/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import {
  FaArrowRight,
  FaBars,
  FaBell,
  FaBolt,
  FaCog,
  FaCrown,
  FaFire,
  FaGamepad,
  FaListUl,
  FaMoon,
  FaSignOutAlt,
  FaStar,
  FaSun,
  FaTimes,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { FiUser } from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

const activeClassName =
  "text-yellow-400 dark:text-yellow-300 font-bold shadow-lg";
const defaultClassName =
  "text-gray-200 dark:text-gray-300 hover:text-yellow-300 dark:hover:text-yellow-400 transition-all duration-300 hover:scale-105";
const commonClasses = "px-4 py-2 text-sm font-medium relative";

// Gamification utility functions
const getLevelFromXP = (xp) => Math.floor(xp / 100) + 1;
const getXPProgress = (xp) => xp % 100;
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

function Header({ toggleSidebar, isSidebarOpen, toggleCollapse, isCollapsed }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme
        ? savedTheme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const { accessToken, user, clearAuth, isValidAuth } = useAuthStore();
  const isLoggedIn = isValidAuth();
  const navigate = useNavigate();

  // Mock gamification data - replace with actual user data
  const userStats = useMemo(() => {
    if (!user) return null;

    // In real app, this would come from user data
    const mockXP = 1250;
    const mockStreak = 7;
    const mockLevel = getLevelFromXP(mockXP);

    return {
      xp: mockXP,
      level: mockLevel,
      streak: mockStreak,
      xpProgress: getXPProgress(mockXP),
      rank: getRankTitle(mockLevel),
      rankIcon: getRankIcon(mockLevel),
    };
  }, [user]);

  // Get role-based announcements route
  const getAnnouncementsRoute = useMemo(() => {
    if (!user) return "/";
    switch (user.role) {
      case "Guru":
        return "/teachers/quests"; // Changed to match gaming theme
      case "User":
        return "/students/quests";
      case "Parents":
        return "/parents/quests";
      case "Admin":
        return "/admin/quests";
      case "Super":
        return "/super/quests";
      default:
        return "/";
    }
  }, [user]);

  // Get profile route based on user role
  const getProfileRoute = useMemo(() => {
    if (!user) return "/";
    switch (user.role) {
      case "Guru":
        return "/teachers/profile";
      case "User":
        return "/students/profile";
      case "Parents":
        return "/parents/profile";
      case "Admin":
        return "/admin/profile";
      case "Super":
        return "/super/profile";
      default:
        return "/profile";
    }
  }, [user]);

  // Updated navigation links with gaming terminology
  const navLinks = useMemo(() => {
    if (!isLoggedIn) {
      return [
        { to: "/parents/login", label: "Parents Portal" },
        { to: "/teacher-login", label: "Teacher Hub" },
        { to: "/about-us", label: "Our Quest" },
        { to: "/contact-us", label: "Join Us" },
      ];
    }

    return [
      { to: getAnnouncementsRoute, label: "Daily Quests" },
      { to: "/leaderboard", label: "Leaderboard" },
    ];
  }, [isLoggedIn, getAnnouncementsRoute]);

  // Get dashboard route based on user role
  const getDashboardRoute = useMemo(() => {
    if (!user) return "/";
    switch (user.role) {
      case "Guru":
        return "/teachers/command-center"; // Gaming themed
      case "Parents":
        return "/parents/overview";
      case "User":
        return "/students/adventure-hub";
      case "Admin":
        return "/admin/control-room";
      case "Super":
        return "/super/headquarters";
      default:
        return "/";
    }
  }, [user]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Apply dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const config = accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : { withCredentials: true };
      await api.post("/v1/users/logout", {}, config);
      clearAuth();
      navigate("/");
      closeMobileMenu();
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuth();
      navigate("/");
    }
  };

  const getProfileImage = (profileImg) => {
    return profileImg || "https://placehold.jp/150x150.png";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-indigo-900/95 dark:from-gray-900/95 dark:via-purple-900/95 dark:to-indigo-900/95 backdrop-blur-sm border-b border-purple-500/30 dark:border-purple-400/20 sticky top-0 z-50 transition-all duration-300 w-full max-w-none shadow-lg">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-0 right-1/3 w-24 h-24 bg-purple-400/20 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 flex items-center justify-between h-16 sm:h-18 w-full max-w-none relative z-10">
        {/* Left Side: Logo and Sidebar Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            to={isLoggedIn ? getDashboardRoute : "/"}
            className="flex items-center space-x-2 group"
            onClick={closeMobileMenu}
            aria-label="Go to dashboard"
          >
            <div className="relative">
              <FaGamepad className="text-2xl sm:text-3xl text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                QUEST MASTER
              </span>
              <span className="text-[8px] sm:text-[10px] font-medium tracking-wider text-purple-200/80 -mt-1">
                LEVEL UP YOUR LIFE
              </span>
            </div>
          </Link>

          {isLoggedIn && (
            <>
              {/* Mobile Sidebar Toggle */}
              <button
                className="md:hidden p-2 rounded-lg text-purple-200 hover:bg-purple-700/50 hover:text-yellow-300 transition-all duration-200 border border-purple-500/30"
                onClick={toggleSidebar}
                aria-controls="sidebar"
                aria-expanded={isSidebarOpen}
              >
                {isSidebarOpen ? (
                  <FaArrowRight className="h-4 w-4 text-yellow-400" />
                ) : (
                  <FaListUl className="h-4 w-4" />
                )}
              </button>

              {/* Desktop Sidebar Collapse Toggle */}
              <button
                className="hidden md:block p-2 rounded-lg text-purple-200 hover:bg-purple-700/50 hover:text-yellow-300 transition-all duration-200 border border-purple-500/30"
                onClick={toggleCollapse}
              >
                {isCollapsed ? (
                  <FaArrowRight className="h-5 w-5" />
                ) : (
                  <FaListUl className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-2 ml-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${commonClasses} rounded-lg border border-transparent hover:border-yellow-400/50 ${
                  isActive ? activeClassName : defaultClassName
                } ${
                  isActive
                    ? "bg-yellow-400/20 border-yellow-400/50"
                    : "hover:bg-purple-700/30"
                }`
              }
              end={link.to === "/"}
            >
              {link.label}
              {link.label === "Daily Quests" && (
                <FaBolt className="inline ml-1 text-xs animate-pulse text-yellow-400" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Side: Stats and Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Stats - Only for logged-in users */}
          {isLoggedIn && user && userStats && (
            <div className="hidden lg:flex items-center space-x-4 bg-purple-800/40 rounded-lg px-3 py-2 border border-purple-500/30">
              {/* Level */}
              <div className="flex items-center space-x-1">
                {userStats.rankIcon}
                <span className="text-yellow-300 font-bold text-sm">
                  Lv.{userStats.level}
                </span>
              </div>

              {/* XP Progress */}
              <div className="flex items-center space-x-2">
                <FaStar className="text-yellow-400 text-xs" />
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${userStats.xpProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-purple-200">
                  {userStats.xpProgress}/100
                </span>
              </div>

              {/* Streak */}
              <div className="flex items-center space-x-1">
                <FaFire className="text-orange-400 text-sm animate-pulse" />
                <span className="text-orange-300 font-bold text-sm">
                  {userStats.streak}
                </span>
              </div>
            </div>
          )}

          {/* Search - Only show for unauthenticated users */}
          {!isLoggedIn && (
            <button
              className="hidden xs:block p-2 rounded-lg text-purple-200 hover:bg-purple-700/50 hover:text-yellow-300 transition-all duration-200 border border-purple-500/30"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <AiOutlineSearch className="h-4 w-4" />
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            className="p-2 rounded-lg text-purple-200 hover:bg-purple-700/50 transition-all duration-200 border border-purple-500/30"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <FaSun className="h-4 w-4 text-yellow-300 hover:rotate-180 transition-transform duration-500" />
            ) : (
              <FaMoon className="h-4 w-4 text-purple-300 hover:rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications - Only for logged-in users */}
          {isLoggedIn && user && (
            <button
              className="p-2 rounded-lg text-purple-200 hover:bg-purple-700/50 relative transition-all duration-200 border border-purple-500/30 hover:border-yellow-400/50"
              aria-label="Quest notifications"
            >
              <FaBell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse border border-purple-900"></span>
            </button>
          )}

          {/* User Menu */}
          {isLoggedIn && user && userStats ? (
            <>
              {/* Desktop User Menu */}
              <div className="hidden sm:flex items-center relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-purple-800/40 rounded-lg px-3 py-2 border border-purple-500/30 hover:border-yellow-400/50 transition-all duration-200"
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="relative">
                    <img
                      src={getProfileImage(user.img_profile)}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border-2 border-yellow-400"
                      onError={(e) => {
                        e.target.src = getProfileImage(undefined);
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-purple-900">
                        {userStats.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-yellow-300">
                      {userStats.rank}
                    </div>
                    <div className="text-xs text-purple-200">
                      {user.fullName || user.username}
                    </div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-purple-900/95 backdrop-blur-sm rounded-lg shadow-xl py-2 z-50 border border-purple-500/30">
                    <div className="px-4 py-3 border-b border-purple-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          {userStats.rankIcon}
                          <div className="text-xs text-purple-200 mt-1">
                            {userStats.rank}
                          </div>
                        </div>
                        <div>
                          <div className="text-yellow-300 font-bold">
                            Level {userStats.level}
                          </div>
                          <div className="text-xs text-purple-200">
                            {userStats.xp} XP
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={getProfileRoute}
                      className="flex items-center px-4 py-2 text-sm text-purple-100 hover:bg-purple-700/50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaUser className="mr-3 h-4 w-4" /> Character Profile
                    </Link>
                    <Link
                      to="/achievements"
                      className="flex items-center px-4 py-2 text-sm text-purple-100 hover:bg-purple-700/50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaTrophy className="mr-3 h-4 w-4 text-yellow-400" />{" "}
                      Achievements
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-purple-100 hover:bg-purple-700/50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaCog className="mr-3 h-4 w-4" /> Game Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-purple-700/50"
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" /> End Session
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile User Menu Toggle */}
              <div className="sm:hidden flex items-center">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative"
                >
                  <img
                    src={getProfileImage(user.img_profile)}
                    alt="Profile"
                    className="h-7 w-7 rounded-full object-cover border-2 border-yellow-400"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-purple-900">
                      {userStats.level}
                    </span>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Sign In */}
              <Link to="/sign-in" className="hidden sm:block">
                <button className="relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white px-6 py-2 text-sm font-bold rounded-lg shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 border border-yellow-400/50 hover:scale-105">
                  <FaGamepad className="inline mr-2" />
                  Start Quest
                </button>
              </Link>

              {/* Mobile Sign In */}
              <Link to="/sign-in" className="sm:hidden">
                <button className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white border border-yellow-400/50">
                  <FiUser className="h-4 w-4" />
                </button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-purple-200 hover:bg-purple-700/50 transition-all duration-200 border border-purple-500/30"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <FaTimes className="h-4 w-4 text-yellow-400" />
            ) : (
              <FaBars className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Search Bar for non-logged-in users */}
      {!isLoggedIn && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isSearchOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-3 bg-gradient-to-r from-purple-800/50 to-indigo-800/50 border-t border-purple-500/30">
            <form className="flex items-center w-full" onSubmit={handleSearch}>
              <div className="relative w-full">
                <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search for your next adventure..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white bg-purple-800/60 backdrop-blur-sm shadow-sm placeholder-purple-300 transition-all duration-300"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 bg-purple-900/95 backdrop-blur-sm border-t border-purple-500/30">
          <nav className="flex flex-col space-y-2">
            {isLoggedIn && user && userStats && (
              <div className="px-3 py-4 border-b border-purple-500/30">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 w-full text-left"
                >
                  <div className="relative">
                    <img
                      src={getProfileImage(user.img_profile)}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover border-2 border-yellow-400"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-purple-900">
                        {userStats.level}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-yellow-300 font-bold">
                      {userStats.rank}
                    </div>
                    <div className="text-sm text-purple-200">
                      {user.fullName || user.username}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <FaFire className="text-orange-400 text-xs" />
                      <span className="text-xs text-orange-300">
                        {userStats.streak} day streak
                      </span>
                    </div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="mt-3 space-y-2">
                    <NavLink
                      to={getProfileRoute}
                      className="block px-3 py-2 text-sm text-purple-100 hover:bg-purple-700/50 rounded"
                      onClick={closeMobileMenu}
                    >
                      Character Profile
                    </NavLink>
                    <NavLink
                      to="/achievements"
                      className="block px-3 py-2 text-sm text-purple-100 hover:bg-purple-700/50 rounded"
                      onClick={closeMobileMenu}
                    >
                      Achievements
                    </NavLink>
                    <NavLink
                      to="/settings"
                      className="block px-3 py-2 text-sm text-purple-100 hover:bg-purple-700/50 rounded"
                      onClick={closeMobileMenu}
                    >
                      Game Settings
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-purple-700/50 rounded"
                    >
                      End Session
                    </button>
                  </div>
                )}
              </div>
            )}

            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                    isActive
                      ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/50"
                      : "text-purple-100 hover:bg-purple-700/50"
                  }`
                }
                onClick={closeMobileMenu}
              >
                <span>{link.label}</span>
                {link.label === "Daily Quests" && (
                  <FaBolt className="text-yellow-400 animate-pulse" />
                )}
              </NavLink>
            ))}

            {!isLoggedIn && (
              <div className="pt-2">
                <Link
                  to="/sign-in"
                  className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-bold rounded-lg transition-all duration-200 border border-yellow-400/50"
                  onClick={closeMobileMenu}
                >
                  <FaGamepad className="mr-2" />
                  Start Your Quest
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
