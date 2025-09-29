import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function MultipleChoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const page = 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ["multipleChoiceDetail", id, page],
    queryFn: async () => {
      const response = await api.get(
        `/v1/multiple-choice/detail/${id}?page=${page}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    },
    onError: (err) => {
      console.error("Fetch Detail Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        navigate("/sign-in");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg">
          {error.response?.data?.error ||
            error.message ||
            "Failed to load bundle details"}
        </div>
      </div>
    );
  }

  console.log("response", data.data);

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Multiple Choice Bundle Details
      </h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Title
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.title || "N/A"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Description
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.description || "N/A"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Category
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.category?.name || "N/A"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Classes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.kelas &&
            Array.isArray(data.data.kelas) &&
            data.data.kelas.length > 0
              ? data.data.kelas.map((k) => k.name).join(", ")
              : "N/A"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Semester
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.semester || "N/A"}
          </p>
        </div>
        {data?.data?.questions && Array.isArray(data.data.questions) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Questions
            </h2>
            <div className="space-y-4 mt-2">
              {data.data.questions.map((question, index) => (
                <div key={question._id}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}. {question.question}
                  </p>
                  <ul className="mt-2 space-y-2 pl-4">
                    {question.options.map((option) => (
                      <li
                        key={option._id}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        {option.text} {option.isCorrect ? "(Correct)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Created By
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.created_by?.fullName
              ? `${data.data.created_by.fullName} (${data.data.created_by.email})`
              : "N/A"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Created At
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data?.data?.created_at
              ? new Date(data.data.created_at).toLocaleString()
              : "N/A"}
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(`/teachers/multiple-choice/edit/${id}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/teachers/multiple-choice")}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultipleChoiceDetail;
