import React from "react";
import {
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaFire,
  FaHome,
  FaMedal,
  FaStar,
  FaTasks,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

const UserSidebar = ({ isCollapsed, toggleCollapse }) => {
  const navGroups = [
    {
      label: "Dashboard",
      links: [
        {
          to: "/users/dashboard",
          label: "Home",
          icon: <FaHome className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Daily Activities",
      links: [
        {
          to: "/users/daily-tasks",
          label: "Daily Quests",
          icon: <FaTasks className="h-5 w-5" />,
        },
        {
          to: "/users/due-dates", // Consistent route
          label: "Due Dates", // Consistent label
          icon: <FaFire className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Progress & Achievements",
      links: [
        {
          to: "/users/milestones",
          label: "Milestones",
          icon: <FaTrophy className="h-5 w-5" />,
        },
        {
          to: "/users/badges",
          label: "Badges",
          icon: <FaMedal className="h-5 w-5" />,
        },
        {
          to: "/users/xp-stats",
          label: "XP & Stats",
          icon: <FaStar className="h-5 w-5" />,
        },
        {
          to: "/users/leaderboard",
          label: "Leaderboard",
          icon: <FaChartLine className="h-5 w-5" />,
        },
      ],
    },

    {
      label: "Account",
      links: [
        {
          to: "/users/profile",
          label: "Profile",
          icon: <FaUser className="h-5 w-5" />,
        },
      ],
    },
  ];

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white dark:bg-gray-800 h-full p-4 shadow-lg transition-all duration-200 flex flex-col fixed top-0 left-0 md:sticky md:top-0 md:h-full`} // Changed h-screen to h-full
    >
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        {!isCollapsed && (
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Quest Master
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <FaChevronRight className="h-5 w-5" />
          ) : (
            <FaChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.label}
              </h3>
            )}
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/users/dashboard"}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 border-l-4 border-indigo-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
                title={isCollapsed ? link.label : ""}
              >
                {link.icon}
                {!isCollapsed && <span className="text-sm">{link.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default UserSidebar;
