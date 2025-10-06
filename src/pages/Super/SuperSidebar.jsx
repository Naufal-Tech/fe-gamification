import React from "react";
import {
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaDatabase,
  FaGem,
  FaHome,
  FaMedal,
  FaShieldAlt,
  FaTasks,
  FaTrophy,
  FaUser,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

const SuperSidebar = ({ isCollapsed, toggleCollapse }) => {
  const navGroups = [
    {
      label: "Dashboard",
      links: [
        {
          to: "/super/dashboard",
          label: "Super Dashboard",
          icon: <FaHome className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "System Management",
      links: [
        {
          to: "/super/admin-management",
          label: "Admin Management",
          icon: <FaUserShield className="h-5 w-5" />,
        },
        {
          to: "/super/players-management",
          label: "Players Management",
          icon: <FaUsers className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Gamification System",
      links: [
        {
          to: "/super/daily-tasks",
          label: "Daily Tasks",
          icon: <FaTasks className="h-5 w-5" />,
        },
        {
          to: "/super/milestones",
          label: "Milestones",
          icon: <FaTrophy className="h-5 w-5" />,
        },
        {
          to: "/super/badges",
          label: "Badges",
          icon: <FaGem className="h-5 w-5" />,
        },
        {
          to: "/super/xp-transactions",
          label: "XP Transactions",
          icon: <FaMedal className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "System Monitoring",
      links: [
        {
          to: "/super/activity-logs",
          label: "Activity Logs",
          icon: <FaChartLine className="h-5 w-5" />,
        },
        {
          to: "/super/system-health",
          label: "System Health",
          icon: <FaDatabase className="h-5 w-5" />,
        },
        {
          to: "/super/settings",
          label: "System Settings",
          icon: <FaCog className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Account",
      links: [
        {
          to: "/super/profile",
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
      } bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 h-full p-4 shadow-2xl transition-all duration-200 flex flex-col fixed top-0 left-0 md:sticky md:top-0 md:h-full border-r border-purple-700 dark:border-gray-700`}
    >
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <FaShieldAlt className="text-yellow-400 h-6 w-6" />
            <div className="text-xl font-bold text-white">Super Admin</div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="text-purple-200 dark:text-gray-300 hover:text-white dark:hover:text-white focus:outline-none transition-colors"
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
              <h3 className="px-2 text-xs font-semibold text-purple-300 dark:text-gray-400 uppercase tracking-wider">
                {group.label}
              </h3>
            )}
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/super/dashboard"}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-purple-700 dark:bg-purple-900 text-white shadow-lg border-l-4 border-yellow-400"
                      : "text-purple-100 dark:text-gray-300 hover:bg-purple-800 dark:hover:bg-gray-700 hover:text-white"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
                title={isCollapsed ? link.label : ""}
              >
                {link.icon}
                {!isCollapsed && (
                  <span className="text-sm font-medium">{link.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {!isCollapsed && (
        <div className="mt-4 p-3 bg-purple-800 dark:bg-gray-800 rounded-lg border border-purple-600 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-yellow-400">
            <FaShieldAlt className="h-4 w-4" />
            <span className="text-xs font-semibold">Elevated Access</span>
          </div>
          <p className="text-xs text-purple-200 dark:text-gray-400 mt-1">
            Full system control
          </p>
        </div>
      )}
    </div>
  );
};

export default SuperSidebar;
