import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth"; // Assuming auth store is in ../store/auth

function StudentDashboardHome() {
  const { user } = useAuthStore();

  // Mock data for demonstration (replace with real API data)
  const stats = {
    totalAssignments: 15,
    completedAssignments: 10,
    upcomingExams: 2,
    averageGrade: 88, // Example average grade
  };

  const upcomingAssignments = [
    {
      id: 1,
      title: "Math Homework 5",
      dueDate: "Apr 20",
      link: "/students/assignments",
    },
    {
      id: 2,
      title: "Science Lab Report",
      dueDate: "Apr 25",
      link: "/students/assignments",
    },
  ];

  const upcomingExams = [
    { id: 1, title: "English Midterm", date: "May 1", link: "/student/exams" },
    { id: 2, title: "Biology Final", date: "May 15", link: "/student/exams" },
  ];

  const recentGrades = [
    {
      id: 1,
      item: "History Quiz",
      grade: "92%",
      link: "/students/assignment-grades",
      color: "text-green-600",
    },
    {
      id: 2,
      item: "Math Test Chapter 3",
      grade: "85%",
      link: "/students/exam-grades",
      color: "text-orange-600",
    },
    {
      id: 3,
      item: "Physics Essay",
      grade: "78%",
      link: "/students/assignment-grades",
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {user?.fullName || "Student"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stay on top of your studies and track your progress.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
            Total Assignments
          </h2>
          <p className="text-2xl font-bold">{stats.totalAssignments}</p>
          <Link
            to="/students/assignments"
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-300">
            Completed Assignments
          </h2>
          <p className="text-2xl font-bold">{stats.completedAssignments}</p>
          <Link
            to="/students/assignments"
            className="text-green-600 dark:text-green-300 hover:underline text-sm"
          >
            Check Status
          </Link>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-300">
            Upcoming Exams
          </h2>
          <p className="text-2xl font-bold">{stats.upcomingExams}</p>
          <Link
            to="/students/exams"
            className="text-red-600 dark:text-red-300 hover:underline text-sm"
          >
            Prepare Now
          </Link>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-300">
            Average Grade
          </h2>
          <p className="text-2xl font-bold">{stats.averageGrade}%</p>
          <Link
            to="/students/progress"
            className="text-blue-600 dark:text-blue-300 hover:underline text-sm"
          >
            Full Report
          </Link>
        </div>
      </div>

      {/* Upcoming Assignments & Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Upcoming Assignments
          </h3>
          <ul className="space-y-3">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex justify-between items-center"
                >
                  <span className="text-gray-600 dark:text-gray-300">
                    {assignment.title}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                    Due: {assignment.dueDate}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No upcoming assignments.
              </p>
            )}
          </ul>
          <Link
            to="/students/assignments"
            className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
          >
            View All Assignments &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Upcoming Exams
          </h3>
          <ul className="space-y-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => (
                <li key={exam.id} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">
                    {exam.title}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                    Date: {exam.date}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No upcoming exams.
              </p>
            )}
          </ul>
          <Link
            to="/students/exams"
            className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
          >
            Lihat Semua Ujian &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Recent Grades
        </h2>
        <ul className="mt-4 space-y-2">
          {recentGrades.length > 0 ? (
            recentGrades.map((grade) => (
              <li
                key={grade.id}
                className="flex justify-between items-center text-gray-600 dark:text-gray-400"
              >
                <span>{grade.item}</span>
                <span className={`${grade.color} font-semibold`}>
                  {grade.grade}
                </span>
              </li>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No recent grades available.
            </p>
          )}
        </ul>
        <Link
          to="/students/assignment-grades"
          className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
        >
          View All Grades
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/students/assignments"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 shadow-md transition-colors duration-200"
        >
          Submit Assignment
        </Link>
        <Link
          to="/students/exams"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md transition-colors duration-200"
        >
          Take an Exam
        </Link>
        <Link
          to="/students/resources"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 shadow-md transition-colors duration-200"
        >
          Explore Study Resources
        </Link>
      </div>
    </div>
  );
}

export default StudentDashboardHome;
