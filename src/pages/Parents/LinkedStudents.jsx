/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEnvelope,
  FaExclamationTriangle,
  FaIdCard,
  FaPhone,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import { Link, useLoaderData } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function LinkedStudents() {
  const [studentsData, setStudentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useLoaderData();

  // Check if user is authorized
  const isAuthorized = useAuthStore((state) => state.user?.role === "Parents");

  // Fetch linked students data
  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        const response = await api.get("/v1/parents/child-list");
        if (response.data.success) {
          setStudentsData(response.data);
        } else {
          setError(response.data.message || "Failed to fetch students");
        }
      } catch (err) {
        setError("Failed to fetch students data");
        console.error("Error fetching students data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  // Format last login date
  const formatLastLogin = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Only parents can view linked students.
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
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
      <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Error loading students
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
            My Children
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your linked students information.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FaUsers className="mr-2 h-4 w-4" />
            {studentsData?.totalStudents || 0} Student
            {studentsData?.totalStudents !== 1 ? "s" : ""}
          </div>
          <Link
            to="/parent-dashboard"
            className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Students List */}
      {studentsData?.students?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentsData.students.map((student) => (
            <StudentCard key={student._id} student={student} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FaUserGraduate className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Linked Students
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have any linked students yet. Contact your school
            administration to link your children to your account.
          </p>
          <Link
            to="/parent-dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

// Student Card Component
const StudentCard = ({ student }) => {
  const formatLastLogin = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Profile Section */}
      <div className="flex items-center mb-4">
        <div className="relative">
          {student.img_profile ? (
            <img
              src={student.img_profile}
              alt={student.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <FaUserGraduate className="h-8 w-8 text-indigo-600 dark:text-indigo-300" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        <div className="ml-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
            {student.fullName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{student.username}
          </p>
        </div>
      </div>

      {/* Student Information */}
      <div className="space-y-3">
        <div className="flex items-center text-sm">
          <FaIdCard className="h-4 w-4 text-gray-400 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">ID:</span>
          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
            {student.noIdentity}
          </span>
        </div>

        <div className="flex items-center text-sm">
          <FaUserGraduate className="h-4 w-4 text-gray-400 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Class:</span>
          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
            {student.kelas?.name || "Not assigned"}
          </span>
        </div>

        <div className="flex items-center text-sm">
          <FaEnvelope className="h-4 w-4 text-gray-400 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Email:</span>
          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium truncate">
            {student.email}
          </span>
        </div>

        <div className="flex items-center text-sm">
          <FaPhone className="h-4 w-4 text-gray-400 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
            {student.phoneNumber || "Not provided"}
          </span>
        </div>

        <div className="flex items-start text-sm">
          <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Last Login:
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium block">
              {formatLastLogin(student.lastLogin)}
            </span>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {student.role}
          </span>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedStudents;
