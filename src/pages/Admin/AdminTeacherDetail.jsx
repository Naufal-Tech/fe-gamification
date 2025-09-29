import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import React from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaClipboardList,
  FaEdit,
  FaEnvelope,
  FaFileAlt,
  FaIdCard,
  FaPhone,
  FaSignInAlt,
  FaTrash,
  FaUser,
  FaVenusMars,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminTeacherDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const response = await api.get(`/v1/admin/view-teachers/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  const teacher = data?.data;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="space-y-4">
          {Array(5)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              ></div>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg">
          <span className="text-sm sm:text-base">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load teacher details"}
          </span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            Teacher not found
          </p>
          <Link
            to="/admin/teachers"
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            <FaArrowLeft className="mr-2" />
            Back to Teachers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/admin/teachers"
          className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Teachers
        </Link>
        {["Admin", "Super"].includes(user?.role) && (
          <div className="flex space-x-2">
            <Link
              to={`/admin/teachers/edit/${teacher._id}`}
              className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm shadow-sm"
            >
              <FaEdit className="mr-1.5" />
              Edit
            </Link>
            <Link
              to={`/admin/teachers/delete/${teacher._id}`}
              className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all duration-200 text-sm shadow-sm"
            >
              <FaTrash className="mr-1.5" />
              Delete
            </Link>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              {teacher.img_profile ? (
                <img
                  src={teacher.img_profile}
                  alt={teacher.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-100 dark:bg-gray-600 border-4 border-white dark:border-gray-600 shadow-md flex items-center justify-center">
                  <FaUser className="h-12 w-12 text-indigo-400 dark:text-gray-400" />
                </div>
              )}
              <span
                className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-md ${
                  teacher.isVerified
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                {teacher.isVerified ? "Verified" : "Pending"}
              </span>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {teacher.fullName}
              </h1>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                @{teacher.username}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-xs font-medium">
                  Teacher
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                  ID: {teacher.noIdentity}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information Card */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaUser className="mr-2 text-indigo-500 dark:text-indigo-400" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <FaEnvelope className="mt-1 mr-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-gray-900 dark:text-white break-all">
                    {teacher.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <FaPhone className="mt-1 mr-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {teacher.phoneNumber || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <FaIdCard className="mt-1 mr-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID Number
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {teacher.noIdentity}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <FaVenusMars className="mt-1 mr-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gender
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {teacher.gender}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-indigo-500 dark:text-indigo-400" />
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <FaCalendarAlt className="mt-1 mr-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created At
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {moment(teacher.createdAt).format("LLL")}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <FaSignInAlt className="mt-1 mr-3 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last Login
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {teacher.lastLogin
                      ? moment(teacher.lastLogin).format("LLL")
                      : "Never logged in"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 mr-4">
                  <FaChalkboardTeacher className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                    Classes
                  </p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {teacher.totalClasses || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-5 rounded-xl border border-green-100 dark:border-green-800/50 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-300 mr-4">
                  <FaFileAlt className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-300">
                    Assignments
                  </p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {teacher.totalAssignments || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/50 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-300 mr-4">
                  <FaClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-300">
                    Exams
                  </p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {teacher.totalExams || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes Section */}
          {teacher.classes && teacher.classes.length > 0 && (
            <div className="md:col-span-2 space-y-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaChalkboardTeacher className="mr-2 text-indigo-500 dark:text-indigo-400" />
                Teaching Classes ({teacher.classes.length})
              </h2>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Class Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Assignments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Exams
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {teacher.classes.map((cls) => (
                      <tr
                        key={cls.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {cls.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {cls.description || "No description"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {cls.totalStudents}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {cls.totalAssignments}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {cls.totalExams}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Activity Sections */}
          {teacher.recentAssignments &&
            teacher.recentAssignments.length > 0 && (
              <div className="md:col-span-2 space-y-5">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaFileAlt className="mr-2 text-indigo-500 dark:text-indigo-400" />
                  Recent Assignments ({teacher.recentAssignments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teacher.recentAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <FaCalendarAlt className="mr-1.5" />
                        Due: {moment(assignment.dueDate).format("MMM D, YYYY")}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full">
                          {assignment.className}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            moment(assignment.dueDate).isBefore(moment())
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {moment(assignment.dueDate).isBefore(moment())
                            ? "Overdue"
                            : "Active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {teacher.recentExams && teacher.recentExams.length > 0 && (
            <div className="md:col-span-2 space-y-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaClipboardList className="mr-2 text-indigo-500 dark:text-indigo-400" />
                Recent Exams ({teacher.recentExams.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacher.recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {exam.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <FaCalendarAlt className="mr-1.5" />
                      Due: {moment(exam.dueDate).format("MMM D, YYYY")}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full">
                        {exam.className}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          exam.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTeacherDetail;
