import { useQuery } from "@tanstack/react-query";
import React from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function EssayQuizDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["essayQuiz", id],
    queryFn: async () => {
      const response = await api.get(`/v1/essay-quiz/detail/${id}`, {
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
      toast.error(
        err.response?.data?.error || "Failed to load essay quiz details",
        {
          duration: 6000,
          style: {
            background: "#ef4444",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "12px",
            maxWidth: "90vw",
            fontSize: "14px",
          },
        }
      );
    },
  });

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Essay Quiz Details
        </h1>
        <div className="flex space-x-3">
          <Link
            to="/teachers/essay-quizzes"
            className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
          {user?.role === "Guru" && (
            <Link
              to={`/teachers/essay-quiz/edit/${id}`}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit Quiz
            </Link>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg text-sm sm:text-base">
          {error.response?.data?.error ||
            error.message ||
            "Failed to load essay quiz details"}
        </div>
      )}

      {/* Quiz Details */}
      {data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {data.title}
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-semibold">Description:</span>{" "}
              {data.description || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Category:</span>{" "}
              {data.category?.name || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Classes:</span>{" "}
              {data.kelas?.length > 0
                ? data.kelas.map((k) => k.name).join(", ")
                : "N/A"}
            </p>
            <p>
              <span className="font-semibold">Semester:</span>{" "}
              {data.semester || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  data.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}
              >
                {data.status || "N/A"}
              </span>
            </p>
            <p>
              <span className="font-semibold">Created At:</span>{" "}
              {new Date(data.created_at).toLocaleDateString() || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Created By:</span>{" "}
              {data.created_by || "N/A"}
            </p>
          </div>

          {/* Questions */}
          <div className="mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Questions
            </h3>
            {data.questions?.length > 0 ? (
              <ul className="space-y-3">
                {data.questions.map((question, index) => (
                  <li
                    key={question._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm sm:text-base text-gray-600 dark:text-gray-400"
                  >
                    <span className="font-semibold">Question {index + 1}:</span>{" "}
                    {question.question}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                No questions available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EssayQuizDetail;
