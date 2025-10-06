// components/CreateTaskModal.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const CreateTaskModal = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    xpReward: 50,
    category: "personal",
    deadlineDate: "",
    deadlineTime: "",
    autoGenerate: true,
  });
  const [errors, setErrors] = useState({});

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post("/v1/daily-tasks", taskData, config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dailyTasks"]);
      onClose();
      setFormData({
        title: "",
        description: "",
        xpReward: 50,
        category: "personal",
        deadlineDate: "",
        deadlineTime: "",
        autoGenerate: true,
      });
      setErrors({});
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach((err) => {
          validationErrors[err.path] = err.msg;
        });
        setErrors(validationErrors);
      }
    },
  });

  // Function to convert YYYY-MM-DD to DD/MM/YYYY
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    // Description validation
    if (formData.description && formData.description.length > 300) {
      newErrors.description = "Description must be less than 300 characters";
    }

    // XP validation
    if (!formData.xpReward || formData.xpReward < 1) {
      newErrors.xpReward = "XP reward must be at least 1";
    } else if (formData.xpReward > 1000) {
      newErrors.xpReward = "XP reward cannot exceed 1000";
    } else if (!Number.isInteger(Number(formData.xpReward))) {
      newErrors.xpReward = "XP reward must be a whole number";
    }

    // Deadline validation
    if (formData.deadlineDate) {
      const selectedDate = new Date(formData.deadlineDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.deadlineDate = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = {
      ...formData,
      xpReward: parseInt(formData.xpReward),
      // Format the date for backend validation
      deadlineDate: formData.deadlineDate
        ? formatDateForBackend(formData.deadlineDate)
        : undefined,
    };

    // Remove empty deadline fields
    if (!submitData.deadlineDate) {
      delete submitData.deadlineDate;
      delete submitData.deadlineTime;
    }

    createTaskMutation.mutate(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleXpChange = (e) => {
    const value = e.target.value;

    // Allow empty input for better UX
    if (value === "") {
      setFormData((prev) => ({ ...prev, xpReward: "" }));
      return;
    }

    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, "");

    if (numValue === "") {
      setFormData((prev) => ({ ...prev, xpReward: "" }));
      return;
    }

    const xp = parseInt(numValue);

    // Validate range
    if (xp < 1) {
      setErrors((prev) => ({
        ...prev,
        xpReward: "XP reward must be at least 1",
      }));
    } else if (xp > 1000) {
      setErrors((prev) => ({
        ...prev,
        xpReward: "XP reward cannot exceed 1000",
      }));
    } else {
      setErrors((prev) => ({ ...prev, xpReward: "" }));
    }

    setFormData((prev) => ({ ...prev, xpReward: xp }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New Task
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.title
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter task title..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter task description..."
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.description}
                  </p>
                )}
                <span
                  className={`text-xs ml-auto ${
                    formData.description.length > 300
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formData.description.length}/300
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="health">Health</option>
                  <option value="productivity">Productivity</option>
                  <option value="learning">Learning</option>
                  <option value="fitness">Fitness</option>
                  <option value="personal">Personal</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* XP Reward Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  XP Reward *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="xpReward"
                    value={formData.xpReward}
                    onChange={handleXpChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.xpReward
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Enter XP reward..."
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      XP
                    </span>
                  </div>
                </div>
                {errors.xpReward && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.xpReward}
                  </p>
                )}
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Range: 1-1000
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Whole numbers only
                  </span>
                </div>
              </div>
            </div>

            {/* Deadline Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="deadlineDate"
                  value={formData.deadlineDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.deadlineDate
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.deadlineDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.deadlineDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Time
                </label>
                <input
                  type="time"
                  name="deadlineTime"
                  value={formData.deadlineTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Auto-generate Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="autoGenerate"
                checked={formData.autoGenerate}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Auto-generate this task daily
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTaskMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createTaskMutation.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
