import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function CategoryQuizEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [initialData, setInitialData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    description: "",
  });

  const isAuthorized = ["Guru", "Admin", "Super"].includes(user?.role);

  // Redirect if not authorized
  useEffect(() => {
    if (!isAuthorized) {
      navigate("/teachers/category-quiz");
      toast.error("You don't have permission to edit categories", {
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
    }
  }, [isAuthorized, navigate]);

  // Fetch category data
  const {
    data: category,
    isLoading: isCategoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["categoryQuizEdit", id],
    queryFn: async () => {
      const response = await api.get(`/v1/category-quiz/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const categoryData = {
        name: data.name || "",
        description: data.description || "",
      };
      setFormData(categoryData);
      setInitialData(categoryData);
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

  // Set form data from category when it's available
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
      });
      setInitialData({
        name: category.name || "",
        description: category.description || "",
      });
    }
  }, [category]);

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(`/v1/category-quiz/${id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Category updated successfully", {
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
      navigate(`/teachers/category-quiz/detail/${id}`);
    },
    onError: (err) => {
      console.error(
        "Update Category Error:",
        err.response?.data || err.message
      );
      const errorData = err.response?.data;

      if (errorData?.field === "name") {
        setErrors((prev) => ({ ...prev, name: errorData.error }));
      } else {
        toast.error(errorData?.error || "Failed to update category", {
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
      }

      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/";
      }
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { name: "", description: "" };

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
      valid = false;
    }

    if (formData.description.trim().length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      updateCategoryMutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
    }
  };

  // Check if there are no changes to disable the submit button
  const hasChanges = () => {
    return (
      formData.name !== initialData.name ||
      formData.description !== initialData.description
    );
  };

  if (!isAuthorized) {
    return null; // Prevent rendering if not authorized
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Category
        </h1>
        <Link
          to={`/teachers/category-quiz/detail/${id}`}
          className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base"
          aria-label="Back to category details"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Details
        </Link>
      </div>

      {/* Loading State */}
      {isCategoryLoading && (
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
      )}

      {/* Error State */}
      {categoryError && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm sm:text-base mb-4">
          {categoryError.response?.data?.error ||
            "Failed to load category details"}
        </div>
      )}

      {/* Edit Form */}
      {!isCategoryLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700">
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="Enter category name"
                  maxLength={100}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum 100 characters
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="Enter category description"
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum 1000 characters ({formData.description.length}/1000)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                updateCategoryMutation.isPending ||
                !hasChanges() ||
                !isAuthorized
              }
              className={`flex items-center px-4 py-2 rounded-lg text-white ${
                updateCategoryMutation.isPending ||
                !hasChanges() ||
                !isAuthorized
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } transition-all duration-200`}
            >
              {updateCategoryMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CategoryQuizEdit;
