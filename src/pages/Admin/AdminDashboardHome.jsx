/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaClipboardList,
  FaDatabase,
  FaExclamationTriangle,
  FaSchool,
  FaTrash,
  FaTrophy,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminDashboard() {
  const [dashboardResponse, setDashboardResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authorized
  const isAuthorized = useAuthStore((state) =>
    ["Admin", "Super"].includes(state.user?.role)
  );

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/v1/admin/dashboard");
        if (response.data.success) {
          setDashboardResponse(response.data); // Store the entire response
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

    if (isAuthorized) {
      fetchDashboardData();
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Only administrators can view this dashboard.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaUserShield className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 h-24"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 h-64"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
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

  // Destructure the response data for cleaner access
  const { data: dashboardData, generatedAt } = dashboardResponse;

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            System overview and management statistics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {generatedAt || "N/A"}
          </span>
          <Link
            to="/"
            className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
          >
            <FaUserShield className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* User Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          User Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<FaUsers className="h-5 w-5" />}
            title="Total Users"
            value={dashboardData?.userStats?.totalUsers || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={<FaUserGraduate className="h-5 w-5" />}
            title="Students"
            value={dashboardData?.userStats?.totalStudents || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={<FaChalkboardTeacher className="h-5 w-5" />}
            title="Teachers"
            value={dashboardData?.userStats?.totalTeachers || 0}
            color="bg-purple-500"
          />
          <StatCard
            icon={<FaUsers className="h-5 w-5" />}
            title="Parents"
            value={dashboardData?.userStats?.totalParents || 0}
            color="bg-yellow-500"
          />
          <StatCard
            icon={<FaUserShield className="h-5 w-5" />}
            title="Admins"
            value={dashboardData?.userStats?.totalAdmins || 0}
            color="bg-red-500"
          />
          <StatCard
            icon={<FaCheckCircle className="h-5 w-5" />}
            title="Active Users"
            value={dashboardData?.userStats?.activeUsers || 0}
            color="bg-indigo-500"
            subtitle="Last 30 days"
          />
        </div>
      </div>

      {/* Content & Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Content Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Content Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaClipboardList className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Quiz Categories
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {dashboardData?.contentStats?.totalQuizCategories || 0}
              </span>
            </div>
            {/* ... rest of the content stats ... */}
          </div>
        </div>

        {/* Submission Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Submission Statistics
          </h3>
          <div className="space-y-4">{/* ... submission stats ... */}</div>
        </div>
      </div>

      {/* Class Distribution */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Class Distribution
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {dashboardData?.classStats?.classDistribution?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.classStats.classDistribution.map(
                (classItem, index) => (
                  <ClassDistributionItem key={index} classItem={classItem} />
                )
              )}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No classes found
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentAssignments
          assignments={dashboardData?.activityStats?.recentTugas}
        />
        <TopPerformingClasses
          classes={dashboardData?.activityStats?.topPerformingClasses}
        />
      </div>

      {/* System Health */}
      <SystemHealthStats
        healthStats={dashboardData?.systemHealth}
        formatDate={formatDate}
      />
    </div>
  );
}

// Extracted components for better organization

const ClassDistributionItem = ({ classItem }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className="flex items-center">
      <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mr-4">
        <FaSchool className="h-4 w-4" />
      </div>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {classItem.className}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {classItem.studentCount} students, {classItem.teacherCount} teachers
        </p>
      </div>
    </div>
    <div className="flex items-center gap-6 text-sm">
      <div className="text-center">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {classItem.totalAssignments}
        </p>
        <p className="text-gray-600 dark:text-gray-400">Assignments</p>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {classItem.totalExams}
        </p>
        <p className="text-gray-600 dark:text-gray-400">Exams</p>
      </div>
    </div>
  </div>
);

const RecentAssignments = ({ assignments }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Recent Assignments
    </h3>
    {assignments?.length > 0 ? (
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div
            key={assignment._id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {assignment.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {assignment.className} • by {assignment.createdBy}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Due: {formatDate(assignment.dueDate)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {assignment.submissionCount} submissions
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-600 dark:text-gray-400 py-8">
        No recent assignments
      </p>
    )}
  </div>
);

const TopPerformingClasses = ({ classes }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Top Performing Classes
    </h3>
    {classes?.length > 0 ? (
      <div className="space-y-3">
        {classes.map((classItem, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mr-3">
                <FaTrophy className="h-3 w-3" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {classItem.className}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {classItem.totalSubmissions} submissions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600 dark:text-green-400">
                {classItem.averageScore}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Average Score
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-600 dark:text-gray-400 py-8">
        No performance data available
      </p>
    )}
  </div>
);

const SystemHealthStats = ({ healthStats, formatDate }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      System Health
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <HealthStatItem
        icon={<FaDatabase className="h-5 w-5" />}
        color="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
        value={healthStats?.totalDocuments || 0}
        label="Total Documents"
      />
      <HealthStatItem
        icon={<FaTrash className="h-5 w-5" />}
        color="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
        value={healthStats?.deletedDocuments || 0}
        label="Deleted Documents"
      />
      <HealthStatItem
        icon={<FaExclamationTriangle className="h-5 w-5" />}
        color="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300"
        value={healthStats?.dataIntegrityIssues || 0}
        label="Integrity Issues"
      />
      <div className="text-center">
        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mx-auto w-12 h-12 flex items-center justify-center mb-2">
          <FaCalendarAlt className="h-5 w-5" />
        </div>
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
          {formatDate(healthStats?.lastDataUpdate)}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">Last Update</p>
      </div>
    </div>
  </div>
);

const HealthStatItem = ({ icon, color, value, label }) => (
  <div className="text-center">
    <div
      className={`p-3 rounded-full ${color} mx-auto w-12 h-12 flex items-center justify-center mb-2`}
    >
      {icon}
    </div>
    <p className="font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
  </div>
);

const StatCard = ({ icon, title, value, color, subtitle }) => {
  const colorClasses = {
    "bg-blue-500":
      "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300",
    "bg-green-500":
      "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
    "bg-purple-500":
      "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300",
    "bg-yellow-500":
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300",
    "bg-red-500": "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
    "bg-indigo-500":
      "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${colorClasses[color]} mr-3`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
