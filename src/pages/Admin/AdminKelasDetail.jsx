import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import React from "react";
import {
  FaArrowLeft,
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaExclamationCircle,
  FaFileAlt,
  FaIdCard,
  FaSignInAlt,
  FaTrash,
  FaUser,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminKelasDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["class-detail", id],
    queryFn: async () => {
      const response = await api.get(`/v1/admin/kelas/${id}`, {
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

  const classDetail = data?.data;

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
            {error.response?.data?.message ||
              error.message ||
              "Failed to load class details"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/kelas"
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {classDetail?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {classDetail?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FaEdit className="w-4 h-4" />
            Edit Class
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <FaTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FaUserGraduate className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classDetail?.totalStudents || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FaChalkboardTeacher className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Teachers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classDetail?.totalTeachers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <FaClipboardList className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assignments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classDetail?.totalAssignments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FaBook className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classDetail?.totalExams || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Students Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaUsers className="w-5 h-5" />
                Students ({classDetail?.students?.length || 0})
              </h2>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {classDetail?.students?.length > 0 ? (
              <div className="space-y-4">
                {classDetail.students.slice(0, 5).map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <FaUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {student.fullName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaIdCard className="w-3 h-3" />
                          {student.noIdentity}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEnvelope className="w-3 h-3" />
                          {student.email}
                        </span>
                      </div>
                      {student.lastLogin && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <FaSignInAlt className="w-3 h-3" />
                          Last login:{" "}
                          {moment(student.lastLogin).format(
                            "MMM DD, YYYY HH:mm"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {classDetail.students.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      +{classDetail.students.length - 5} more students
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students enrolled in this class</p>
              </div>
            )}
          </div>
        </div>

        {/* Teachers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaChalkboardTeacher className="w-5 h-5" />
              Teachers ({classDetail?.teachers?.length || 0})
            </h2>
          </div>
          <div className="p-6">
            {classDetail?.teachers?.length > 0 ? (
              <div className="space-y-4">
                {classDetail.teachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <FaChalkboardTeacher className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {teacher.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <FaEnvelope className="w-3 h-3" />
                        {teacher.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaChalkboardTeacher className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No teachers assigned to this class</p>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaClipboardList className="w-5 h-5" />
                Assignments ({classDetail?.assignments?.length || 0})
              </h2>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {classDetail?.assignments?.length > 0 ? (
              <div className="space-y-4">
                {classDetail.assignments.slice(0, 5).map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      {assignment.requiresFileUpload ? (
                        <FaFileAlt className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <FaClipboardList className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {assignment.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        Due:{" "}
                        {moment(assignment.due_date).format("MMM DD, YYYY")}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {assignment.requiresFileUpload ? (
                          <span className="flex items-center gap-1">
                            <FaFileAlt className="w-3 h-3" />
                            File Upload Required
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaClipboardList className="w-3 h-3" />
                            Text Submission
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {classDetail.assignments.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      +{classDetail.assignments.length - 5} more assignments
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No assignments created for this class</p>
              </div>
            )}
          </div>
        </div>

        {/* Exams Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaBook className="w-5 h-5" />
                Exams ({classDetail?.exams?.length || 0})
              </h2>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {classDetail?.exams?.length > 0 ? (
              <div className="space-y-4">
                {classDetail.exams.map((exam) => (
                  <div
                    key={exam._id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaBook className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {exam.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3 h-3" />
                          Due: {moment(exam.due_date).format("MMM DD, YYYY")}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          {exam.duration}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-2">
                        {exam.status === "active" ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full">
                            <FaCheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full">
                            <FaExclamationCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaBook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exams created for this class</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminKelasDetail;
