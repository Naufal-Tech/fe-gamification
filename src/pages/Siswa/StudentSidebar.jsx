import React from "react";
import {
  FaBook,
  FaChartLine,
  FaChartPie,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaGraduationCap,
  FaHome,
  FaTasks,
  FaTrophy,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

const StudentSidebar = ({ isCollapsed, toggleCollapse }) => {
  const navGroups = [
    {
      label: "Academics",
      links: [
        {
          to: "/students/dashboard",
          label: "Dashboard",
          icon: <FaHome className="h-5 w-5" />,
        },
        {
          to: "/students/assignments",
          label: "Tugas",
          icon: <FaTasks className="h-5 w-5" />,
        },
        {
          to: "/students/exams",
          label: "Ujian",
          icon: <FaGraduationCap className="h-5 w-5" />,
        },
        {
          to: "/students/classes",
          label: "Kelas",
          icon: <FaUsers className="h-5 w-5" />,
        },
        {
          to: "/students/resources",
          label: "Study Resources",
          icon: <FaBook className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Performance",
      links: [
        {
          to: "/students/assignment-grades",
          label: "Nilai Tugas",
          icon: <FaClipboardCheck className="h-5 w-5" />,
        },
        {
          to: "/students/exam-grades",
          label: "Nilai Ujian",
          icon: <FaTrophy className="h-5 w-5" />,
        },
        {
          to: "/students/reports-exam",
          label: "Reports Exam",
          icon: <FaChartLine className="h-5 w-5" />,
        },
        {
          to: "/students/reports-tugas",
          label: "Reports Tugas",
          icon: <FaChartPie className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Account",
      links: [
        {
          to: "/students/profile",
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
      } bg-white dark:bg-gray-800 h-screen p-4 shadow-lg transition-all duration-200 flex flex-col sticky top-0`}
    >
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed && (
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Menu Siswa
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
      <nav className="flex-1 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {group.label}
              </h3>
            )}
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                // 'end' prop ensures the dashboard link is only active when exactly on /student/dashboard
                end={link.to === "/students/dashboard"}
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
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default StudentSidebar;
