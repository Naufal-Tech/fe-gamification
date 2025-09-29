import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

function TeacherDashboardHome() {
  const { user } = useAuthStore();

  // Mock data for demonstration (replace with real API data)
  const stats = {
    classes: 5,
    pendingAssignments: 12,
    upcomingExams: 3,
  };
  const recentActivities = [
    {
      id: 1,
      text: "Graded assignment for Class 10A",
      link: "/teachers/assignments",
    },
    {
      id: 2,
      text: "New quiz submission from John Doe",
      link: "/teachers/category-quiz",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {user?.fullName || "Teacher"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your classes, assignments, and quizzes with ease.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
            Classes
          </h2>
          <p className="text-2xl font-bold">{stats.classes}</p>
          <Link
            to="/teachers/classes"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Classes
          </Link>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-300">
            Pending Assignments
          </h2>
          <p className="text-2xl font-bold">{stats.pendingAssignments}</p>
          <Link
            to="/teachers/assignments"
            className="text-green-600 dark:text-green-300 hover:underline"
          >
            Grade Now
          </Link>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-300">
            Upcoming Exams
          </h2>
          <p className="text-2xl font-bold">{stats.upcomingExams}</p>
          <Link
            to="/teachers/exams"
            className="text-red-600 dark:text-red-300 hover:underline"
          >
            View Exams
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h2>
        <ul className="mt-4 space-y-2">
          {recentActivities.map((activity) => (
            <li key={activity.id} className="text-gray-600 dark:text-gray-400">
              {activity.text} -{" "}
              <Link
                to={activity.link}
                className="text-indigo-600 dark:text-indigo-400"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <Link
          to="/teachers/quizzes/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Create Quiz
        </Link>
        <Link
          to="/teachers/assignments/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Create Assignment
        </Link>
      </div>
    </div>
  );
}

export default TeacherDashboardHome;
