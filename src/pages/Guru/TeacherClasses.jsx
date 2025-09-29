/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import {
  FaChalkboardTeacher,
  FaClipboardList,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import { Link, useLoaderData } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

function TeacherClasses() {
  const user = useLoaderData();

  // Log teachingClass for debugging
  useEffect(() => {
    console.log("Teaching classes:", user?.teachingClass);
  }, [user]);

  // Check if user is authorized
  const isAuthorized = useAuthStore((state) => state.user?.role === "Guru");

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hanya guru yang dapat melihat daftar kelas.
        </p>
        <Link
          to="/teachers"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaChalkboardTeacher className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const classes = user?.teachingClass || [];

  console.log("Classes:", classes);

  return (
    <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Kelas Guru
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola dan lihat semua kelas yang ditugaskan kepada Anda.
          </p>
        </div>
        <Link
          to="/teachers"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
        >
          <FaChalkboardTeacher className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Summary Stats */}
      {classes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FaChalkboardTeacher className="h-5 w-5" />}
            title="Total Classes"
            value={classes.length}
            color="text-indigo-600"
          />
          <StatCard
            icon={<FaUsers className="h-5 w-5" />}
            title="Total Students"
            value={classes.reduce(
              (sum, kelas) => sum + (kelas.students?.length || 0),
              0
            )}
            color="text-green-600"
          />
          <StatCard
            icon={<FaClipboardList className="h-5 w-5" />}
            title="Total Quizzes"
            value={classes.reduce(
              (sum, kelas) =>
                sum +
                (kelas.shortQuizzes?.length || 0) +
                (kelas.essayQuizzes?.length || 0) +
                (kelas.multipleChoiceQuizzes?.length || 0),
              0
            )}
            color="text-blue-600"
          />
          <StatCard
            icon={<FaFileAlt className="h-5 w-5" />}
            title="Total Ujian"
            value={classes.reduce(
              (sum, kelas) => sum + (kelas.exams?.length || 0),
              0
            )}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Empty State */}
      {classes.length === 0 && (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FaChalkboardTeacher className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Anda belum memiliki kelas yang harus diajarkan.
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            Anda belum ditugaskan ke kelas mana pun. Harap hubungi administrator
            Anda.
          </p>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((kelas) => (
            <ClassCard key={kelas._id} kelas={kelas} />
          ))}
        </div>
      )}
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

// Reusable Class Card Component
const ClassCard = ({ kelas }) => (
  <Link
    to={`/teachers/classes/${kelas._id}`}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 group"
    aria-label={`View details for ${kelas.name}`}
  >
    <div className="flex items-center mb-4">
      <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mr-3">
        <FaChalkboardTeacher className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {kelas.name}
      </h2>
    </div>

    {kelas.description && (
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {kelas.description}
      </p>
    )}

    <div className="grid grid-cols-3 gap-2 text-center">
      <StatItem
        icon={<FaUsers className="h-4 w-4 mx-auto" />}
        value={kelas.students?.length || 0}
        label="Students"
      />
      <StatItem
        icon={<FaClipboardList className="h-4 w-4 mx-auto" />}
        value={
          (kelas.shortQuizzes?.length || 0) +
          (kelas.essayQuizzes?.length || 0) +
          (kelas.multipleChoiceQuizzes?.length || 0)
        }
        label="Quizzes"
      />
      <StatItem
        icon={<FaFileAlt className="h-4 w-4 mx-auto" />}
        value={kelas.exams?.length || 0}
        label="Exams"
      />
    </div>

    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Last updated:{" "}
        {new Date(kelas.updated_at || kelas.created_at).toLocaleDateString()}
      </span>
      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
        View Details →
      </span>
    </div>
  </Link>
);

// Reusable Stat Item Component
const StatItem = ({ icon, value, label }) => (
  <div>
    <div className="text-gray-500 dark:text-gray-400 mb-1">{icon}</div>
    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      {value}
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

export default TeacherClasses;
