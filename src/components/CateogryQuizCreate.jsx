/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function CategoryQuizCreate() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    submit: "",
  });
  const { accessToken, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const apiEndpoint = "/v1/category-quiz";

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.post(apiEndpoint, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onError: (err) => {
      console.error("Create Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.error || "Failed to create category";
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
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
        navigate("/sign-in");
      }
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Category created successfully", {
        duration: 4000,
        style: {
          background: "#10b981",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
      queryClient.invalidateQueries(["categoryQuiz"]);
      navigate("/teachers/category-quiz");
    },
  });

  const validateForm = () => {
    const newErrors = { name: "", description: "", submit: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
      isValid = false;
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
    }
  };

  // Check if user is authorized
  const isAuthorized = ["Guru", "Admin", "Super"].includes(user?.role);

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Only teachers, admins, or super users can create categories.
        </p>
        <Link
          to="/teachers/category-quiz"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Create New Category
        </h1>
        <Link
          to="/teachers/category-quiz"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Link>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6"
      >
        {/* Server-side error */}
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg text-sm sm:text-base">
            {errors.submit}
          </div>
        )}

        {/* Name Field */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base ${
              errors.name || errors.submit.includes("name")
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Enter category name (e.g., Geography)"
            aria-label="Category name"
            maxLength={100}
            disabled={createMutation.isLoading}
          />
          {errors.name && (
            <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
              <svg
                className="mr-1 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.name}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base resize-y ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter a brief description (optional)"
            aria-label="Category description"
            rows={4}
            maxLength={1000}
            disabled={createMutation.isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/teachers/category-quiz")}
            className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm sm:text-base w-full sm:w-auto"
            disabled={createMutation.isLoading}
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            aria-label="Save category"
          >
            {createMutation.isLoading ? (
              <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
            ) : (
              <FaSave className="mr-2 h-4 w-4" />
            )}
            Save Category
          </button>
        </div>
      </form>
    </div>
  );
}

export default CategoryQuizCreate;
