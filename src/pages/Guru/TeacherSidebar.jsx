import React from "react";
import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaChartBar,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaEdit,
  FaFolderOpen,
  FaGraduationCap,
  FaHome,
  FaListAlt,
  FaPen,
  FaQuestionCircle,
  FaUser,
} from "react-icons/fa";

import { MdGrading } from "react-icons/md";
import { NavLink } from "react-router-dom";

const TeacherSidebar = ({ isCollapsed, toggleCollapse }) => {
  const navGroups = [
    {
      label: "Content Creation",
      links: [
        {
          to: "/teachers/category-quiz",
          label: "Kategori Kuis",
          icon: <FaQuestionCircle className="h-5 w-5" />,
        },
        {
          to: "/teachers/essay-quizzes",
          label: "Kuis Essay",
          icon: <FaEdit className="h-5 w-5" />,
        },
        {
          to: "/teachers/multiple-choice",
          label: "Kuis Pilihan Ganda",
          icon: <FaListAlt className="h-5 w-5" />,
        },
        {
          to: "/teachers/short-quiz",
          label: "Kuis Jawaban Singkat",
          icon: <FaPen className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Class Management",
      links: [
        {
          to: "/teachers/classes",
          label: "Kelas",
          icon: <FaChalkboardTeacher className="h-5 w-5" />,
        },
        {
          to: "/teachers/assignments",
          label: "Kumpulan Tugas",
          icon: <FaFolderOpen className="h-5 w-5" />,
        },
        {
          to: "/teachers/exams",
          label: "Kumpulan Ujian",
          icon: <FaGraduationCap className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Reports & Profile",
      links: [
        {
          to: "/teachers/penilaian-tugas",
          label: "Penilaian Tugas",
          icon: <MdGrading className="h-5 w-5" />,
        },
        {
          to: "/teachers/penilaian-exam",
          label: "Penilaian Exam",
          icon: <FaClipboardCheck className="h-5 w-5" />,
        },
        {
          to: "/teachers/resources",
          label: "Study Resources",
          icon: <FaBookOpen className="h-5 w-5" />,
        },
        {
          to: "/teachers/reports-exam",
          label: "Reports Exam",
          icon: <FaChartLine className="h-5 w-5" />,
        },
        {
          to: "/teachers/reports-tugas",
          label: "Reports Tugas",
          icon: <FaChartBar className="h-5 w-5" />,
        },
        {
          to: "/teachers/profile",
          label: "Profile",
          icon: <FaUser className="h-5 w-5" />,
        },
      ],
    },
    {
      label: "Dashboard",
      links: [
        {
          to: "/teachers/dashboard",
          label: "Dashboard",
          icon: <FaHome className="h-5 w-5" />,
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
            Menu Guru
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
                end={link.to === "/teachers/dashboard"}
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

export default TeacherSidebar;
