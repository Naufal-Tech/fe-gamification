/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaClipboardList,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaUserGraduate,
} from "react-icons/fa";
import { Link, useLoaderData } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function ParentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useLoaderData();

  // Check if user is authorized
  const isAuthorized = useAuthStore((state) => state.user?.role === "Parents");

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/v1/parents/dashboard");
        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Only parents can view this dashboard.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaUserGraduate className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 h-24"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 h-32"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Error loading dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Parent Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor your child's academic progress and assignments.
          </p>
        </div>
        <Link
          to="/"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
        >
          <FaUserGraduate className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<FaUserGraduate className="h-5 w-5" />}
          title="Linked Students"
          value={dashboardData?.linkedStudents?.length || 0}
          color="text-indigo-600"
        />
        <StatCard
          icon={<FaClipboardList className="h-5 w-5" />}
          title="Pending Assignments"
          value={dashboardData?.summary?.totalPendingTugas || 0}
          color="text-yellow-600"
        />
        <StatCard
          icon={<FaFileAlt className="h-5 w-5" />}
          title="Pending Exams"
          value={dashboardData?.summary?.totalPendingExams || 0}
          color="text-blue-600"
        />
        <StatCard
          icon={<FaExclamationTriangle className="h-5 w-5" />}
          title="Overdue Tasks"
          value={
            (dashboardData?.summary?.totalOverdueTugas || 0) +
            (dashboardData?.summary?.totalOverdueExams || 0)
          }
          color="text-red-600"
        />
      </div>

      {/* Linked Students */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Children
        </h2>
        {dashboardData?.linkedStudents?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.linkedStudents.map((student) => (
              <div
                key={student._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mr-3">
                    <FaUserGraduate className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {student.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {student.noIdentity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No linked students found.
            </p>
          </div>
        )}
      </div>

      {/* Pending Assignments */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Pending Assignments
        </h2>
        {dashboardData?.pendingTugas?.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.pendingTugas.map((assignment) => (
              <AssignmentCard key={assignment._id} assignment={assignment} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No pending assignments.
            </p>
          </div>
        )}
      </div>

      {/* Pending Exams */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Pending Exams
        </h2>
        {dashboardData?.pendingExams?.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.pendingExams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No pending exams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Stat Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
    <div className="flex items-center">
      <div className={`p-2 rounded-full ${color} bg-opacity-10 mr-3`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  </div>
);

// Assignment Card Component
const AssignmentCard = ({ assignment }) => {
  const dueDate = new Date(assignment.due_date);
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {assignment.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {assignment.description || "No description provided"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
              {assignment.kelas.name}
            </span>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {assignment.type}
            </span>
            {assignment.requiresFileUpload && (
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                File Upload Required
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FaClock className="mr-1" />
          {assignment.daysRemaining}d left
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Assigned by: {assignment.created_by.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Due: {formattedDate}
          </p>
        </div>
        <Link
          to={`/assignments/${assignment._id}`}
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center"
        >
          View Details <FaArrowRight className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

// Exam Card Component
const ExamCard = ({ exam }) => {
  const dueDate = new Date(exam.due_date);
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {exam.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {exam.description || "No description provided"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
              {exam.kelas.name}
            </span>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              Exam
            </span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FaClock className="mr-1" />
          {exam.daysRemaining}d left
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Assigned by: {exam.created_by.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Due: {formattedDate}
          </p>
        </div>
        <Link
          to={`/exams/${exam._id}`}
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center"
        >
          View Details <FaArrowRight className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default ParentDashboard;
