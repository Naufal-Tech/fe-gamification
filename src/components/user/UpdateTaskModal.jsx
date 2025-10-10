// components/UpdateTaskModal.jsx - FIXED VERSION
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const UpdateTaskModal = ({ isOpen, onClose, task }) => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    xpReward: 10,
    category: "personal",
    deadlineDate: "",
    deadlineTime: "",
    autoGenerate: true,
    isActive: true,
  });

  // ✅ ADD: Date formatting functions
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";

    // Convert from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // ✅ ADD: Function to convert backend date to input format
  const formatDateForInput = (backendDate) => {
    if (!backendDate) return "";

    // Backend might store in DD/MM/YYYY format, convert to YYYY-MM-DD for input
    if (backendDate.includes("/")) {
      const [day, month, year] = backendDate.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // If it's already in YYYY-MM-DD format, return as is
    return backendDate;
  };

  useEffect(() => {
    if (task) {
      let deadlineDate = "";
      let deadlineTime = "";

      if (task.deadlineTimestamp) {
        // ✅ FIXED: Use timestamp to create date
        const deadline = new Date(task.deadlineTimestamp);
        deadlineDate = deadline.toISOString().split("T")[0];
        deadlineTime = deadline.toTimeString().slice(0, 5);
      } else if (task.deadlineDate) {
        // ✅ FIXED: Handle existing deadlineDate from backend
        deadlineDate = formatDateForInput(task.deadlineDate);
      }

      setFormData({
        title: task.title || "",
        description: task.description || "",
        xpReward: task.xpReward || 10,
        category: task.category || "personal",
        deadlineDate,
        deadlineTime,
        autoGenerate:
          task.autoGenerate !== undefined ? task.autoGenerate : true,
        isActive: task.isActive !== undefined ? task.isActive : true,
      });
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.put(
        `/v1/daily-tasks/${task._id}`,
        taskData,
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dailyTasks"]);
      onClose();
    },
    onError: (error) => {
      console.error("Update task error:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // ✅ FIXED: Format dates for backend
    const submitData = {
      title: formData.title,
      description: formData.description,
      xpReward: parseInt(formData.xpReward),
      category: formData.category,
      autoGenerate: formData.autoGenerate,
      isActive: formData.isActive,
      // ✅ FIXED: Format deadline date for backend
      ...(formData.deadlineDate && {
        deadlineDate: formatDateForBackend(formData.deadlineDate),
      }),
      ...(formData.deadlineTime && { deadlineTime: formData.deadlineTime }),
    };

    console.log("Updating task with data:", submitData); // For debugging
    updateTaskMutation.mutate(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Task
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter task title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter task description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  XP Reward: {formData.xpReward}
                </label>
                <input
                  type="range"
                  name="xpReward"
                  min="1"
                  max="1000"
                  value={formData.xpReward}
                  onChange={handleChange}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {formData.xpReward} XP
                </div>
              </div>
            </div>

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
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="autoGenerate"
                  checked={formData.autoGenerate}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Auto-generate daily
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>

            {/* ✅ ADD: Task Status Information */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-600 dark:text-gray-400">
                  <div>
                    Completed Today: {task.completedToday ? "✅ Yes" : "❌ No"}
                  </div>
                  <div>Current Streak: {task.currentStreak || 0} days</div>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <div>Total Completions: {task.totalCompletions || 0}</div>
                  <div>Longest Streak: {task.longestStreak || 0} days</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateTaskMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updateTaskMutation.isLoading ? "Updating..." : "Update Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateTaskModal;
