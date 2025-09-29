/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import api from "../utils/api";
import { useAuthStore } from "../store/auth";

function ClassDetail() {
  const { id } = useParams();
  const { accessToken } = useAuthStore();

  // Fetch class details
  const {
    data: kelas,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const response = await api.get(`/v1/kelas/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data || response.data; // Handle { data: {...} } or plain object
    },
  });

  // Check if user is authorized
  const isAuthorized = useAuthStore((state) => state.user?.role === "Guru");

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Only teachers can view class details.
        </p>
        <Link
          to="/teachers/classes"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Class Details
        </h1>
        <Link
          to="/teachers/classes"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-indigo-600 rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg text-sm sm:text-base">
          Failed to load class details: {error.message}
        </div>
      )}

      {/* Class Details */}
      {!isLoading && !error && kelas && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {kelas.name}
          </h2>
          {kelas.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {kelas.description}
            </p>
          )}

          {/* Short Quizzes */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short Quizzes:
            </p>
            {kelas.shortQuizzes?.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {kelas.shortQuizzes.map((quiz) => (
                  <li key={quiz._id}>
                    <Link
                      to={`/teachers/short-quizzes/detail/${quiz._id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {quiz.title || quiz._id}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No short quizzes assigned.
              </p>
            )}
          </div>

          {/* Essay Quizzes */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Essay Quizzes:
            </p>
            {kelas.essayQuizzes?.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {kelas.essayQuizzes.map((quiz) => (
                  <li key={quiz._id}>
                    <Link
                      to={`/teachers/essay-quizzes/detail/${quiz._id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {quiz.title || quiz._id}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No essay quizzes assigned.
              </p>
            )}
          </div>

          {/* Multiple Choice Quizzes */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Multiple Choice Quizzes:
            </p>
            {kelas.multipleChoiceQuizzes?.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {kelas.multipleChoiceQuizzes.map((quiz) => (
                  <li key={quiz._id}>
                    <Link
                      to={`/teachers/multiple-choice/detail/${quiz._id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {quiz.title || quiz._id}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No multiple choice quizzes assigned.
              </p>
            )}
          </div>

          {/* Exams */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exams:
            </p>
            {kelas.exams?.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {kelas.exams.map((exam) => (
                  <li key={exam._id}>
                    <Link
                      to={`/teachers/exams/detail/${exam._id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {exam.name || exam._id}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No exams assigned.
              </p>
            )}
          </div>

          {/* Tugas */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tugas:
            </p>
            {kelas.tugas?.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {kelas.tugas.map((task) => (
                  <li key={task._id}>
                    <Link
                      to={`/teachers/tugas/detail/${task._id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {task.title || task._id}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No tugas assigned.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassDetail;
