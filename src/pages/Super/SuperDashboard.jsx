/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaChalkboardTeacher,
  FaFileAlt,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function SuperDashboard() {
  const { user, isAuthenticated, accessToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data (replace with API calls)
  const [stats] = useState({
    admins: 5,
    teachers: 50,
    students: 1000,
    classes: 40,
    multipleChoice: 1000,
    essays: 500,
  });

  const [activity] = useState([
    { id: 1, action: "New admin added: John Doe", date: "2025-04-14" },
    { id: 2, action: "Question bank updated: Math MCQs", date: "2025-04-13" },
    { id: 3, action: "Class 10A created", date: "2025-04-12" },
  ]);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to sign-in");
      navigate("/sign-in");
    } else if (user?.role !== "Super") {
      console.log("User is not a super admin, redirecting to sign-in");
      navigate("/sign-in");
    }
  }, [isAuthenticated, user, navigate]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      await api.post("/v1/users/logout", {}, config);
      clearAuth();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      clearAuth();
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300 text-lg">
          Loading...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg">
          Error loading data. Please try again.
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden text-white focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <FaBars className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <img
                src={user.img_profile || "https://placehold.jp/150x150.png"}
                alt="Super Admin Profile"
                className="h-12 w-12 rounded-full object-cover border-2 border-white"
                onError={(e) => {
                  console.log(
                    "Profile image failed to load:",
                    user.img_profile
                  );
                  e.target.src = "https://placehold.jp/150x150.png";
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-white">
                  {user.fullName || user.username}
                </h1>
                <p className="text-indigo-100 text-sm">Super Admin Dashboard</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
            disabled={isLoading}
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="p-6 flex-1">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
              System Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* User Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  User Statistics
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaUserShield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Admins:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {stats.admins}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaChalkboardTeacher className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Teachers:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {stats.teachers}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaUserGraduate className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Students:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {stats.students}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Class Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Class Statistics
                </h3>
                <div className="flex items-center space-x-2">
                  <FaUsers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Total Classes:{" "}
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {stats.classes}
                    </span>
                  </p>
                </div>
              </div>

              {/* Question Bank Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Question Bank Overview
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaFileAlt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Multiple Choice:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {stats.multipleChoice}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaFileAlt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-gray-600 dark:text-gray-300">
                      Essays:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {stats.essays}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent System Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Recent System Activity
                </h3>
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.action}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                        {item.date}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-800 p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t">
          © {new Date().getFullYear()} School System. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default SuperDashboard;
