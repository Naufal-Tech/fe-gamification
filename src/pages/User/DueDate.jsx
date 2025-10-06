// pages/DueDatePage.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  isAfter,
  isBefore,
  isToday,
  isTomorrow,
  startOfDay,
} from "date-fns";
import React, { useState } from "react";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const DueDate = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState("all"); // all, today, overdue, upcoming
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch tasks
  const {
    data: tasksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dailyTasks"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/daily-tasks", config);
      return response.data;
    },
  });

  // Mark task as completed mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post(
        `/v1/daily-tasks/${taskId}/complete`,
        {},
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dailyTasks"]);
    },
  });

  const tasks = tasksData?.tasks || [];

  // Organize tasks by due date
  const organizeTasksByDueDate = () => {
    const now = new Date();
    const todayStart = startOfDay(now);

    const overdue = [];
    const today = [];
    const tomorrow = [];
    const upcoming = [];
    const noDueDate = [];

    tasks.forEach((task) => {
      if (task.completedToday) return; // Skip completed tasks

      if (!task.deadlineTimestamp) {
        noDueDate.push(task);
        return;
      }

      const dueDate = new Date(task.deadlineTimestamp);

      if (isBefore(dueDate, todayStart)) {
        overdue.push(task);
      } else if (isToday(dueDate)) {
        today.push(task);
      } else if (isTomorrow(dueDate)) {
        tomorrow.push(task);
      } else if (isAfter(dueDate, todayStart)) {
        upcoming.push(task);
      }
    });

    // Sort upcoming tasks by due date
    upcoming.sort(
      (a, b) => new Date(a.deadlineTimestamp) - new Date(b.deadlineTimestamp)
    );

    return { overdue, today, tomorrow, upcoming, noDueDate };
  };

  const { overdue, today, tomorrow, upcoming, noDueDate } =
    organizeTasksByDueDate();

  const getTasksForView = () => {
    switch (selectedView) {
      case "today":
        return today;
      case "overdue":
        return overdue;
      case "upcoming":
        return [...tomorrow, ...upcoming];
      default:
        return [...overdue, ...today, ...tomorrow, ...upcoming, ...noDueDate];
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      health: "bg-green-100 border-green-500 text-green-800",
      productivity: "bg-blue-100 border-blue-500 text-blue-800",
      learning: "bg-purple-100 border-purple-500 text-purple-800",
      fitness: "bg-red-100 border-red-500 text-red-800",
      personal: "bg-yellow-100 border-yellow-500 text-yellow-800",
      custom: "bg-gray-100 border-gray-500 text-gray-800",
    };
    return colors[category] || colors.personal;
  };

  const getDueDateBadge = (task) => {
    if (!task.deadlineTimestamp) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          No due date
        </span>
      );
    }

    const dueDate = new Date(task.deadlineTimestamp);
    const now = new Date();

    if (isBefore(dueDate, startOfDay(now))) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
          Overdue
        </span>
      );
    } else if (isToday(dueDate)) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
          Today
        </span>
      );
    } else if (isTomorrow(dueDate)) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          Tomorrow
        </span>
      );
    } else {
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          In {daysUntilDue} days
        </span>
      );
    }
  };

  const formatDueDate = (timestamp) => {
    if (!timestamp) return "No due date";
    return format(new Date(timestamp), "MMM dd, yyyy 'at' HH:mm");
  };

  const getTimeUntilDeadline = (timestamp) => {
    if (!timestamp) return null;

    const now = new Date().getTime();
    const timeLeft = timestamp - now;

    if (timeLeft < 0) {
      return null; // Already handled by overdue badge
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else {
      return `${hours}h left`;
    }
  };

  const filteredTasks = getTasksForView().filter(
    (task) => selectedCategory === "all" || task.category === selectedCategory
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-center">
          Error loading tasks. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Due Dates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your tasks by their due dates and deadlines
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {overdue.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Overdue
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-orange-500">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {today.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Due Today
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tomorrow.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Due Tomorrow
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {upcoming.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Upcoming
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedView("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedView === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              All Tasks ({tasks.filter((t) => !t.completedToday).length})
            </button>
            <button
              onClick={() => setSelectedView("overdue")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedView === "overdue"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Overdue ({overdue.length})
            </button>
            <button
              onClick={() => setSelectedView("today")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedView === "today"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Today ({today.length})
            </button>
            <button
              onClick={() => setSelectedView("upcoming")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedView === "upcoming"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Upcoming ({tomorrow.length + upcoming.length})
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="health">Health</option>
            <option value="productivity">Productivity</option>
            <option value="learning">Learning</option>
            <option value="fitness">Fitness</option>
            <option value="personal">Personal</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedView === "all" && "All Tasks"}
            {selectedView === "overdue" && "Overdue Tasks"}
            {selectedView === "today" && "Tasks Due Today"}
            {selectedView === "upcoming" && "Upcoming Tasks"}
            <span className="text-gray-500 dark:text-gray-400 ml-2">
              ({filteredTasks.length})
            </span>
          </h2>
        </div>

        <div className="p-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {selectedView === "overdue" && "No overdue tasks! 🎉"}
              {selectedView === "today" && "No tasks due today! 🎉"}
              {selectedView === "upcoming" && "No upcoming tasks!"}
              {selectedView === "all" &&
                "No tasks found. Create some tasks to get started!"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(
                            task.category
                          )}`}
                        >
                          {task.category}
                        </span>
                        {getDueDateBadge(task)}
                      </div>

                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          +{task.xpReward} XP
                        </span>
                        {task.deadlineTimestamp && (
                          <>
                            <span>
                              Due: {formatDueDate(task.deadlineTimestamp)}
                            </span>
                            {getTimeUntilDeadline(task.deadlineTimestamp) && (
                              <span className="text-orange-500">
                                {getTimeUntilDeadline(task.deadlineTimestamp)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => completeTaskMutation.mutate(task._id)}
                      disabled={completeTaskMutation.isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 whitespace-nowrap"
                    >
                      {completeTaskMutation.isLoading
                        ? "Completing..."
                        : "Complete Task"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar View Preview */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
              Overdue
            </h4>
            {overdue.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">None</p>
            ) : (
              overdue.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="truncate">{task.title}</span>
                </div>
              ))
            )}
          </div>
          <div>
            <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">
              Today
            </h4>
            {today.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">None</p>
            ) : (
              today.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="truncate">{task.title}</span>
                </div>
              ))
            )}
          </div>
          <div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
              Tomorrow
            </h4>
            {tomorrow.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">None</p>
            ) : (
              tomorrow.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="truncate">{task.title}</span>
                </div>
              ))
            )}
          </div>
          <div>
            <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
              This Week
            </h4>
            {upcoming.slice(0, 3).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">None</p>
            ) : (
              upcoming.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="truncate">{task.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DueDate;
