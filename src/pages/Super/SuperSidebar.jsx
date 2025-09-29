import React, { useState } from "react";
import {
  FaChalkboardTeacher,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaFileAlt,
  FaHistory,
  FaHome,
  FaQuestionCircle,
  FaUser,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

const SuperSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navLinks = [
    {
      to: "/super/dashboard",
      label: "Dashboard",
      icon: <FaHome className="h-5 w-5" />,
    },
    {
      to: "/super/admins",
      label: "Admin",
      icon: <FaUserShield className="h-5 w-5" />,
    },
    {
      to: "/super/teachers",
      label: "Guru",
      icon: <FaChalkboardTeacher className="h-5 w-5" />,
    },
    {
      to: "/super/students",
      label: "Siswa",
      icon: <FaUserGraduate className="h-5 w-5" />,
    },
    {
      to: "/super/classes",
      label: "Kelas",
      icon: <FaUsers className="h-5 w-5" />,
    },
    {
      to: "/super/multiple-choice",
      label: "Kuis Pilihan Ganda",
      icon: <FaQuestionCircle className="h-5 w-5" />,
    },
    {
      to: "/super/essays",
      label: "Kuis Essay",
      icon: <FaFileAlt className="h-5 w-5" />,
    },
    {
      to: "/super/settings",
      label: "System Settings",
      icon: <FaCog className="h-5 w-5" />,
    },
    {
      to: "/super/logs",
      label: "Audit Logs",
      icon: <FaHistory className="h-5 w-5" />,
    },
    {
      to: "/super/reports",
      label: "Reports",
      icon: <FaChartBar className="h-5 w-5" />,
    },
    {
      to: "/super/profile",
      label: "Profile",
      icon: <FaUser className="h-5 w-5" />,
    },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white dark:bg-gray-800 h-screen p-4 shadow-lg transition-all duration-200 flex flex-col`}
    >
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed && (
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Super Admin Portal
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
      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              } ${isCollapsed ? "justify-center" : ""}`
            }
            title={isCollapsed ? link.label : ""}
          >
            {link.icon}
            {!isCollapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default SuperSidebar;
