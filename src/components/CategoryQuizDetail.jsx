import { useQuery } from "@tanstack/react-query";
import moment from "moment-timezone";
import React from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBook,
  FaEdit,
  FaQuestionCircle,
  FaTasks,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function CategoryQuizDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();

  const isAuthorized = ["Guru", "Admin", "Super"].includes(user?.role);

  // Format timestamp to Asia/Jakarta
  const formatDate = (date) =>
    date
      ? moment.tz(date, "Asia/Jakarta").format("DD/MM/YYYY, HH:mm:ss")
      : "N/A";

  // Fetch category data
  const {
    data: category,
    isLoading: isCategoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["categoryQuizDetail", id],
    queryFn: async () => {
      const response = await api.get(`/v1/category-quiz/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    onError: (err) => {
      console.error("Fetch Category Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.error || "Failed to load category details";
      toast.error(errorMessage, {
        duration: 6000,
        style: {
          background: "#ef4444",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/";
      }
    },
  });

  // Fetch essay quizzes
  const { data: essayQuizzes, isLoading: isEssayLoading } = useQuery({
    queryKey: ["essayQuizzes", id, category?.essayQuizList],
    queryFn: async () => {
      if (!category?.essayQuizList?.length) return [];
      const response = await api.get("/v1/essay-quiz", {
        params: {
          ids: category.essayQuizList.join(","),
          deleted_at: "false",
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Essay Quizzes Response:", response.data);
      return response.data.data || [];
    },
    enabled: !!category?.essayQuizList,
    onError: (err) => {
      console.error(
        "Fetch Essay Quizzes Error:",
        err.response?.data || err.message
      );
      toast.error("Failed to load essay quizzes", {
        duration: 6000,
        style: {
          background: "#ef4444",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
    },
  });

  // Fetch multiple-choice quizzes
  const { data: multipleQuizzes, isLoading: isMultipleLoading } = useQuery({
    queryKey: ["multipleQuizzes", id, category?.multipleQuizList],
    queryFn: async () => {
      if (!category?.multipleQuizList?.length) return [];
      const response = await api.get("/v1/multiple-choice", {
        params: {
          ids: category.multipleQuizList.join(","),
          deleted_at: "false",
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    },
    enabled: !!category?.multipleQuizList,
    onError: (err) => {
      console.error(
        "Fetch Multiple-Choice Quizzes Error:",
        err.response?.data || err.message
      );
      toast.error("Failed to load multiple-choice quizzes", {
        duration: 6000,
        style: {
          background: "#ef4444",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
    },
  });

  // Fetch short quizzes
  const { data: shortQuizzes, isLoading: isShortLoading } = useQuery({
    queryKey: ["shortQuizzes", id, category?.shortQuizList],
    queryFn: async () => {
      if (!category?.shortQuizList?.length) return [];
      const response = await api.get("/v1/short-quiz", {
        params: {
          ids: category.shortQuizList.join(","),
          deleted_at: "false",
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Short Quizzes Response:", response.data);
      return response.data.data || [];
    },
    enabled: !!category?.shortQuizList,
    onError: (err) => {
      console.error(
        "Fetch Short Quizzes Error:",
        err.response?.data || err.message
      );
      toast.error("Failed to load short quizzes", {
        duration: 6000,
        style: {
          background: "#ef4444",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
    },
  });

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Category Details
        </h1>
        <div className="flex gap-4">
          <Link
            to="/teachers/category-quiz"
            className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base"
            aria-label="Back to categories"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
          {isAuthorized && (
            <Link
              to={`/teachers/category-quiz/edit/${id}`}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
              aria-label="Edit category"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit Category
            </Link>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isCategoryLoading && (
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
      )}

      {/* Error State */}
      {categoryError && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm sm:text-base">
          {categoryError.response?.data?.error ||
            "Failed to load category details"}
        </div>
      )}

      {/* Category Details and Quiz Lists */}
      {category && (
        <div className="space-y-6">
          {/* Category Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {category.name}
            </h2>
            <dl className="space-y-4 text-sm sm:text-base">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Description
                </dt>
                <dd className="text-gray-600 dark:text-gray-400 mt-1">
                  {category.description || "No description provided"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Created By
                </dt>
                <dd className="text-gray-600 dark:text-gray-400 mt-1">
                  {category.created_by?.fullName || "Unknown"} (
                  {category.created_by?.email || "N/A"})
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Created At
                </dt>
                <dd className="text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(category.created_at)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Updated By
                </dt>
                <dd className="text-gray-600 dark:text-gray-400 mt-1">
                  {category.updated_by?.fullName || "Not updated"} (
                  {category.updated_by?.email || "N/A"})
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">
                  Updated At
                </dt>
                <dd className="text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(category.updated_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Essay Quizzes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <FaBook className="h-5 w-5 mr-2" />
              Essay Quizzes
            </h3>
            {isEssayLoading ? (
              <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
            ) : essayQuizzes?.length > 0 ? (
              <ul className="space-y-2">
                {essayQuizzes.map((quiz) => (
                  <li
                    key={quiz._id}
                    className="p-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Link
                      to={`/teachers/essay-quiz/detail/${quiz._id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      aria-label={`View details for essay quiz ${
                        quiz.title || "Untitled"
                      }`}
                    >
                      {quiz.title || "Untitled Quiz"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                No essay quizzes in this category
              </p>
            )}
          </div>

          {/* Multiple-Choice Quizzes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <FaQuestionCircle className="h-5 w-5 mr-2" />
              Multiple-Choice Quizzes
            </h3>
            {isMultipleLoading ? (
              <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
            ) : multipleQuizzes?.length > 0 ? (
              <ul className="space-y-2">
                {multipleQuizzes.map((quiz) => (
                  <li
                    key={quiz._id}
                    className="p-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Link
                      to={`/teachers/multiple-choice-quiz/detail/${quiz._id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      aria-label={`View details for multiple-choice quiz ${
                        quiz.title || "Untitled"
                      }`}
                    >
                      {quiz.title || "Untitled Quiz"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                No multiple-choice quizzes in this category
              </p>
            )}
          </div>

          {/* Short Quizzes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <FaTasks className="h-5 w-5 mr-2" />
              Short Quizzes
            </h3>
            {isShortLoading ? (
              <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
            ) : shortQuizzes?.length > 0 ? (
              <ul className="space-y-2">
                {shortQuizzes.map((quiz) => (
                  <li
                    key={quiz._id}
                    className="p-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Link
                      to={`/teachers/short-quiz/detail/${quiz._id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      aria-label={`View details for short quiz ${
                        quiz.title || "Untitled"
                      }`}
                    >
                      {quiz.title || "Untitled Quiz"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                No short quizzes in this category
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryQuizDetail;
