/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useQuery } from "@tanstack/react-query";
import moment from "moment-timezone";
import React from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function ShortQuizDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();

  const isAuthorized = ["Guru", "Admin", "Super"].includes(user?.role || "");

  // Format timestamp to Asia/Jakarta
  const formatDate = (millis) =>
    millis
      ? moment.tz(millis, "Asia/Jakarta").format("DD/MM/YYYY, HH:mm:ss")
      : "N/A";

  // Helper to display class names
  const displayKelas = (kelas) => {
    if (!kelas || kelas.length === 0) return "N/A";
    return kelas.map((k) => k.name).join(", ");
  };

  // Fetch quiz data
  const { data, isLoading, error } = useQuery({
    queryKey: ["shortQuizDetail", id],
    queryFn: async () => {
      const response = await api.get(`/v1/short-quiz/detail/${id}`, {
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
        err.response?.data?.error || "Failed to load short quiz details",
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm sm:text-base">
          {error.response?.data?.error || "Failed to load short quiz details"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Short Quiz Details
        </h1>
        <div className="flex gap-4">
          <Link
            to="/teachers/short-quiz"
            className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base"
            aria-label="Back to short quizzes"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Short Quizzes
          </Link>
          {isAuthorized && (
            <Link
              to={`/teachers/short-quiz/edit/${id}`}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
              aria-label="Edit short quiz"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit Short Quiz
            </Link>
          )}
        </div>
      </div>

      {/* Quiz Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {data?.title}
        </h2>
        <dl className="space-y-4 text-sm sm:text-base" role="definition">
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Description
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {data?.description || "No description provided"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Category
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {data?.category?.name || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Classes
            </dt>
            <dd
              className="text-gray-600 dark:text-gray-400 mt-1 truncate"
              title={displayKelas(data?.kelas)}
            >
              {displayKelas(data?.kelas)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Semester
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {data?.semester || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Status
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  data?.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}
              >
                {data?.status || "N/A"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Created By
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {data?.created_by?.fullName || "Unknown"} (
              {data?.created_by?.email || "N/A"})
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Created At
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {formatDate(data?.created_at)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Updated At
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {formatDate(data?.updated_at)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Updated By
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {data?.updated_by?.fullName || "Not updated"} (
              {data?.updated_by?.email || "N/A"})
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700 dark:text-gray-300">
              Questions
            </dt>
            <dd className="text-gray-600 dark:text-gray-400 mt-1">
              {data?.questions?.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2" role="list">
                  {data.questions.map((q) => (
                    <li key={q._id} role="listitem">
                      {q.question} <br />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Answer: {q.correctAnswer}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                "No questions available"
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default ShortQuizDetail;
