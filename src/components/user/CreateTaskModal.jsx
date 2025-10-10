// components/CreateTaskModal.jsx - FIXED VERSION
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
    xpReward: 10,
    category: "personal",
    priority: "medium",
    difficulty: "medium",
    estimatedDuration: 30,
    deadlineDate: "",
    deadlineTime: "",
    // Recurrence fields
    recurrence: {
      enabled: false,
      pattern: {
        type: "daily",
        interval: 1,
        daysOfWeek: [],
        endDate: "",
        maxOccurrences: "",
      },
    },
  });

  // ✅ ADD: Function to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";

    // Convert from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // ✅ ADD: Function to format recurrence end date to timestamp
  const formatRecurrenceEndDate = (dateString) => {
    if (!dateString) return undefined;

    // Convert to timestamp (backend expects milliseconds)
    return new Date(dateString).getTime();
  };

  const createMutation = useMutation({
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
      // Reset form
      setFormData({
        title: "",
        description: "",
        xpReward: 10,
        category: "personal",
        priority: "medium",
        difficulty: "medium",
        estimatedDuration: 30,
        deadlineDate: "",
        deadlineTime: "",
        recurrence: {
          enabled: false,
          pattern: {
            type: "daily",
            interval: 1,
            daysOfWeek: [],
            endDate: "",
            maxOccurrences: "",
          },
        },
      });
    },
    onError: (error) => {
      console.error("Create task error:", error);
      // You might want to show a more specific error message here
    },
  });

  const handleRecurrenceChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        pattern: {
          ...prev.recurrence.pattern,
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ FIXED: Format dates for backend
    const taskData = {
      title: formData.title,
      description: formData.description,
      xpReward: parseInt(formData.xpReward),
      category: formData.category,
      priority: formData.priority,
      difficulty: formData.difficulty,
      estimatedDuration: parseInt(formData.estimatedDuration),
      // ✅ FIXED: Format deadline date for backend
      ...(formData.deadlineDate && {
        deadlineDate: formatDateForBackend(formData.deadlineDate),
      }),
      ...(formData.deadlineTime && { deadlineTime: formData.deadlineTime }),
      // ✅ FIXED: Include recurrence if enabled with proper date formatting
      ...(formData.recurrence.enabled && {
        recurrence: {
          enabled: true,
          pattern: {
            type: formData.recurrence.pattern.type,
            interval: parseInt(formData.recurrence.pattern.interval),
            ...(formData.recurrence.pattern.daysOfWeek.length > 0 && {
              daysOfWeek: formData.recurrence.pattern.daysOfWeek,
            }),
            // ✅ FIXED: Format recurrence end date as timestamp
            ...(formData.recurrence.pattern.endDate && {
              endDate: formatRecurrenceEndDate(
                formData.recurrence.pattern.endDate
              ),
            }),
            ...(formData.recurrence.pattern.maxOccurrences && {
              maxOccurrences: parseInt(
                formData.recurrence.pattern.maxOccurrences
              ),
            }),
          },
        },
      }),
    };

    console.log("Submitting task data:", taskData); // For debugging
    createMutation.mutate(taskData);
  };

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
            {/* Basic Task Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  XP Reward *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={formData.xpReward}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      xpReward: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                >
                  <option value="health">Health</option>
                  <option value="productivity">Productivity</option>
                  <option value="learning">Learning</option>
                  <option value="fitness">Fitness</option>
                  <option value="personal">Personal</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {/* Additional Task Fields */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimatedDuration: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Recurrence Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recurring Task
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence,
                        enabled: !prev.recurrence.enabled,
                      },
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    formData.recurrence.enabled
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      formData.recurrence.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {formData.recurrence.enabled && (
                <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Recurrence Pattern
                    </label>
                    <select
                      value={formData.recurrence.pattern.type}
                      onChange={(e) =>
                        handleRecurrenceChange("type", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Repeat Every
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.recurrence.pattern.interval}
                        onChange={(e) =>
                          handleRecurrenceChange("interval", e.target.value)
                        }
                        className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formData.recurrence.pattern.type === "daily"
                          ? "day(s)"
                          : formData.recurrence.pattern.type === "weekly"
                          ? "week(s)"
                          : formData.recurrence.pattern.type === "monthly"
                          ? "month(s)"
                          : "year(s)"}
                      </span>
                    </div>
                  </div>

                  {formData.recurrence.pattern.type === "weekly" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                          "sunday",
                        ].map((day) => (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              const currentDays = [
                                ...formData.recurrence.pattern.daysOfWeek,
                              ];
                              const index = currentDays.indexOf(day);
                              if (index > -1) {
                                currentDays.splice(index, 1);
                              } else {
                                currentDays.push(day);
                              }
                              handleRecurrenceChange("daysOfWeek", currentDays);
                            }}
                            className={`px-2 py-1 text-xs rounded-md ${
                              formData.recurrence.pattern.daysOfWeek.includes(
                                day
                              )
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={formData.recurrence.pattern.endDate}
                        onChange={(e) =>
                          handleRecurrenceChange("endDate", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Max Occurrences
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurrence.pattern.maxOccurrences}
                        onChange={(e) =>
                          handleRecurrenceChange(
                            "maxOccurrences",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deadline Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Deadline (Optional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={formData.deadlineDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadlineDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.deadlineTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadlineTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {createMutation.isLoading ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
