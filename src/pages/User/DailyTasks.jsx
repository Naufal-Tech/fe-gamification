// pages/EnhancedDailyTasks.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  CreateTaskModal,
  DeleteTaskModal,
  UpdateTaskModal,
} from "../../components";
import {
  useEnhancedDailyTaskReset,
  useManualTaskRefresh,
  useTimeUntilReset,
} from "../../hooks/useDailyTaskReset";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// DND Kit imports
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DailyTasks = () => {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  // ✅ Enhanced automatic daily reset with recurrence support
  const { isNewDay, isLoading: resetLoading } = useEnhancedDailyTaskReset({
    onReset: () => {
      console.log("✨ Tasks automatically refreshed for new day!");
      toast.success("Your daily tasks have been refreshed! 🎯");
    },
    onNewDayDetected: () => {
      console.log("🌅 New day detected - recurring tasks will be generated");
    },
    queriesToInvalidate: ["taskStats", "userBadges", "dailyTasks"],
  });

  // ✅ Manual refresh capability
  const { refreshTasks, isRefreshing } = useManualTaskRefresh();

  // ✅ Countdown timer
  const { timeUntilReset, percentage } = useTimeUntilReset();

  // State for filters and pagination
  const [filters, setFilters] = useState({
    view: "all",
    category: "all",
    completed: "",
    sortBy: "deadline",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  const [modals, setModals] = useState({
    create: false,
    update: false,
    delete: false,
  });
  const [selectedTask, setSelectedTask] = useState(null);

  // DND Kit state
  const [activeTask, setActiveTask] = useState(null);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.append(key, value);
      }
    });
    Object.entries(pagination).forEach(([key, value]) => {
      params.append(key, value);
    });
    return params.toString();
  }, [filters, pagination]);

  // ✅ FIXED: Fetch tasks with correct endpoint
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dailyTasks", queryParams],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get(`/v1/daily-tasks?${queryParams}`, config);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // ✅ FIXED: Complete task mutation
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
    onSuccess: (data) => {
      queryClient.invalidateQueries(["dailyTasks"]);
      queryClient.invalidateQueries(["userData"]);
      toast.success(`Task completed! +${data.xpEarned} XP`);
    },
    onError: (error) => {
      console.error("Task completion mutation error:", error);
      toast.error("Failed to complete task");
    },
  });

  // ✅ CORRECT: Using dedicated uncomplete endpoint
  const uncompleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.post(
        // ✅ Using POST to uncomplete
        `/v1/daily-tasks/uncomplete/${taskId}`,
        {}, // ✅ Empty body for uncomplete
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dailyTasks"]);
      queryClient.invalidateQueries(["userData"]);
      toast.success("Task marked as pending");
    },
    onError: (error) => {
      console.error("Task uncompletion mutation error:", error);
      toast.error("Failed to mark task as pending");
    },
  });

  const handleManualRefresh = async () => {
    try {
      const result = await refreshTasks();
      console.log("✅ Tasks refreshed successfully!");
      toast.success("Tasks refreshed for new day!");
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
      toast.error("Failed to refresh tasks");
    }
  };

  // ✅ FIXED: Enhanced DND Kit sensors for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Better mobile activation
      activationConstraint: {
        distance: 3, // Reduced for better mobile sensitivity
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    // ✅ ADD: Touch sensor for mobile support
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  // DND Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(active.data.current?.task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = active.data.current?.task;
    const overColumn = over.data.current?.columnType;

    console.log("Drag End - Active Task:", activeTask?.title);
    console.log("Drag End - Over Column:", overColumn);

    if (!activeTask || !overColumn) return;

    // If dragging to completed column and task is not completed
    if (overColumn === "completed" && !activeTask.completedToday) {
      console.log("Marking task as completed:", activeTask._id);
      completeTaskMutation.mutate(activeTask._id);
    }
    // If dragging to pending column and task is completed
    else if (overColumn === "pending" && activeTask.completedToday) {
      console.log("Marking task as pending:", activeTask._id);
      uncompleteTaskMutation.mutate(activeTask._id);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  // Handler functions
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const openCreateModal = () =>
    setModals((prev) => ({ ...prev, create: true }));
  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setModals((prev) => ({ ...prev, update: true }));
  };
  const openDeleteModal = (task) => {
    setSelectedTask(task);
    setModals((prev) => ({ ...prev, delete: true }));
  };
  const closeModals = () => {
    setModals({ create: false, update: false, delete: false });
    setSelectedTask(null);
  };

  // Helper functions
  const getCategoryColor = (category) => {
    const colors = {
      health:
        "bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200",
      productivity:
        "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      learning:
        "bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      fitness:
        "bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-200",
      personal:
        "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      custom:
        "bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[category] || colors.personal;
  };

  const formatDateHeader = (dateKey) => {
    if (dateKey === "no-deadline") return "No Deadline";

    const date = new Date(dateKey);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateKey) => {
    if (dateKey === "no-deadline") return false;
    return new Date(dateKey) < new Date();
  };

  const formatTimeLeft = (task) => {
    if (!task.deadlineTimestamp) return null;

    const now = new Date().getTime();
    const deadline = task.deadlineTimestamp;
    const timeLeft = deadline - now;

    if (timeLeft < 0) {
      return <span className="text-red-500 text-sm font-medium">Overdue</span>;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return (
        <span className="text-orange-500 text-sm">
          {days}d {hours}h left
        </span>
      );
    } else if (hours > 0) {
      return <span className="text-orange-500 text-sm">{hours}h left</span>;
    } else {
      return (
        <span className="text-red-500 text-sm font-medium">
          {minutes}m left
        </span>
      );
    }
  };

  // Data from API
  const tasksByDate = tasksData?.tasksByDate || {};
  const stats = tasksData?.stats || {};
  const paginationInfo = tasksData?.pagination || {};

  // Calculate recurrence stats
  const recurrenceStats = useMemo(() => {
    const allTasks = Object.values(tasksByDate).flat();
    const recurringTasks = allTasks.filter((task) => task.recurrence?.enabled);
    const activeRecurring = recurringTasks.filter((task) => task.isActive);

    const byType = {
      daily: recurringTasks.filter(
        (t) => t.recurrence?.pattern?.type === "daily"
      ).length,
      weekly: recurringTasks.filter(
        (t) => t.recurrence?.pattern?.type === "weekly"
      ).length,
      monthly: recurringTasks.filter(
        (t) => t.recurrence?.pattern?.type === "monthly"
      ).length,
      yearly: recurringTasks.filter(
        (t) => t.recurrence?.pattern?.type === "yearly"
      ).length,
    };

    return {
      total: recurringTasks.length,
      active: activeRecurring.length,
      byType,
    };
  }, [tasksByDate]);

  // Separate tasks into pending and completed for Kanban view
  const kanbanTasks = useMemo(() => {
    const pending = [];
    const completed = [];

    Object.values(tasksByDate).forEach((tasks) => {
      tasks.forEach((task) => {
        if (task.completedToday) {
          completed.push(task);
        } else {
          pending.push(task);
        }
      });
    });

    return { pending, completed };
  }, [tasksByDate]);

  if (isLoading) {
    return <TasksLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-center">
          Error loading tasks. Please try again.
          <button
            onClick={() => refetch()}
            className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Enhanced Header with Reset Info */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Daily Tasks
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Drag tasks between columns to mark as complete or pending
              </p>

              {/* Countdown Timer */}
              <div className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">
                <svg
                  className="w-4 h-4 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  Resets in {timeUntilReset}
                </span>
              </div>

              {/* New Day Indicator */}
              {isNewDay && (
                <div className="flex items-center space-x-2 text-sm bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    ✨ New Day!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons with Refresh */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
              title="Refresh tasks for new day"
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden xs:inline">
                {isRefreshing ? "Refreshing..." : "Refresh Day"}
              </span>
            </button>

            <button
              onClick={openCreateModal}
              className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2 text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            color="text-indigo-600 dark:text-indigo-400"
            icon="📋"
          />
          <StatCard
            title="Completed Today"
            value={stats.completed}
            color="text-green-600 dark:text-green-400"
            icon="✅"
          />
          <StatCard
            title="Due Today"
            value={stats.dueToday}
            color="text-orange-600 dark:text-orange-400"
            icon="⏰"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            color="text-red-600 dark:text-red-400"
            icon="⚠️"
          />
        </div>

        {/* Recurrence Stats */}
        {recurrenceStats.total > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Recurring Tasks
                </span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {recurrenceStats.active} active
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 text-xs">
              <div className="text-blue-700 dark:text-blue-300">
                <div>Daily: {recurrenceStats.byType.daily}</div>
                <div>Weekly: {recurrenceStats.byType.weekly}</div>
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                <div>Monthly: {recurrenceStats.byType.monthly}</div>
                <div>Yearly: {recurrenceStats.byType.yearly}</div>
              </div>
            </div>
          </div>
        )}

        {/* Day Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Day Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {percentage}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Midnight</span>
            <span>Next Reset</span>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                View
              </label>
              <select
                value={filters.view}
                onChange={(e) => handleFilterChange("view", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {stats.categories?.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="deadline">Deadline (Asc)</option>
                <option value="deadline_desc">Deadline (Desc)</option>
                <option value="created">Created Date</option>
                <option value="xp">XP Reward</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div className="sm:col-span-1 lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats.total} total tasks
            </span>
            <button
              onClick={() =>
                setFilters({
                  view: "all",
                  category: "all",
                  completed: "",
                  sortBy: "deadline",
                  startDate: "",
                  endDate: "",
                  search: "",
                })
              }
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board with DND Kit */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <TaskColumn
            title="To Do"
            count={kanbanTasks.pending.length}
            tasks={kanbanTasks.pending}
            columnType="pending"
            onEdit={openUpdateModal}
            onDelete={openDeleteModal}
            getCategoryColor={getCategoryColor}
            formatTimeLeft={formatTimeLeft}
          />

          <TaskColumn
            title="Completed"
            count={kanbanTasks.completed.length}
            tasks={kanbanTasks.completed}
            columnType="completed"
            onEdit={openUpdateModal}
            onDelete={openDeleteModal}
            getCategoryColor={getCategoryColor}
            formatTimeLeft={formatTimeLeft}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskItem
              task={activeTask}
              isDragging
              getCategoryColor={getCategoryColor}
              formatTimeLeft={formatTimeLeft}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Traditional List View (for smaller screens) */}
      <div className="lg:hidden space-y-4">
        {Object.keys(tasksByDate).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              No tasks found
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {filters.view !== "all"
                ? `No ${filters.view} tasks match your filters.`
                : "Create your first task to get started!"}
            </p>
          </div>
        ) : (
          Object.entries(tasksByDate).map(([dateKey, tasks]) => (
            <div
              key={dateKey}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <div
                className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
                  isOverdue(dateKey) && dateKey !== "no-deadline"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {formatDateHeader(dateKey)}
                  {isOverdue(dateKey) && dateKey !== "no-deadline" && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Overdue
                    </span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    ({tasks.length} tasks)
                  </span>
                </h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onComplete={() => completeTaskMutation.mutate(task._id)}
                    onEdit={() => openUpdateModal(task)}
                    onDelete={() => openDeleteModal(task)}
                    getCategoryColor={getCategoryColor}
                    formatTimeLeft={formatTimeLeft}
                    isCompleting={completeTaskMutation.isLoading}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3 sm:space-x-4 mt-6 sm:mt-8">
          <button
            onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            disabled={!paginationInfo.hasPrev}
            className="px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
            disabled={!paginationInfo.hasNext}
            className="px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal isOpen={modals.create} onClose={closeModals} />
      <UpdateTaskModal
        isOpen={modals.update}
        onClose={closeModals}
        task={selectedTask}
      />
      <DeleteTaskModal
        isOpen={modals.delete}
        onClose={closeModals}
        task={selectedTask}
      />
    </div>
  );
};

// ✅ FIXED: Enhanced Sortable Task Item without problematic touch handler
const SortableTaskItem = ({
  task,
  columnType,
  onEdit,
  onDelete,
  getCategoryColor,
  formatTimeLeft,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      task,
      columnType,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600
        cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200
        touch-none select-none min-h-[70px] sm:min-h-[80px] sortable-item
        ${task.completedToday ? "opacity-75" : ""}
        ${isDragging ? "opacity-50 shadow-lg rotate-2 z-50" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className={`font-medium text-gray-900 dark:text-white text-sm sm:text-base ${
                task.completedToday ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(
                task.category
              )}`}
            >
              {task.category}
            </span>
          </div>

          {task.description && (
            <p
              className={`text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-2 ${
                task.completedToday ? "line-through" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              +{task.xpReward} XP
            </span>
            {formatTimeLeft(task)}
          </div>

          {/* Recurrence Indicator */}
          {task.recurrence?.enabled && (
            <div className="flex items-center mt-2">
              <svg
                className="w-3 h-3 text-green-500 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs text-green-600 dark:text-green-400">
                Repeats {task.recurrence.pattern?.type}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center space-x-1 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 sm:p-1"
            title="Edit task"
          >
            <svg
              className="w-4 h-4 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task)}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 sm:p-1"
            title="Delete task"
          >
            <svg
              className="w-4 h-4 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ FIXED: TaskColumn with proper droppable
const TaskColumn = ({
  title,
  count,
  tasks,
  columnType,
  onEdit,
  onDelete,
  getCategoryColor,
  formatTimeLeft,
}) => {
  const taskIds = tasks.map((task) => task._id);

  // ✅ ADD: useDroppable for the column
  const { setNodeRef } = useDroppable({
    id: `${columnType}-column`,
    data: {
      columnType: columnType,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-fit"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
            {title}
          </h3>
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs sm:text-sm px-2 py-1 rounded-full">
            {count}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 min-h-[150px] sm:min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8">
              <div className="text-base sm:text-lg mb-2">No tasks</div>
              <p className="text-xs sm:text-sm">
                {columnType === "pending"
                  ? "Drag tasks here to mark as pending"
                  : "Drag completed tasks here"}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskItem
                key={task._id}
                task={task}
                columnType={columnType}
                onEdit={onEdit}
                onDelete={onDelete}
                getCategoryColor={getCategoryColor}
                formatTimeLeft={formatTimeLeft}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

// Drag Overlay Component
const KanbanTaskItem = ({
  task,
  isDragging,
  getCategoryColor,
  formatTimeLeft,
}) => (
  <div
    className={`
      bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600
      cursor-grabbing shadow-lg sortable-item
      ${task.completedToday ? "opacity-75" : ""}
      ${isDragging ? "rotate-3" : ""}
    `}
    style={{
      transform: isDragging ? "rotate(5deg)" : "none",
    }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3
            className={`font-medium text-gray-900 dark:text-white text-sm sm:text-base ${
              task.completedToday ? "line-through" : ""
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(
              task.category
            )}`}
          >
            {task.category}
          </span>
        </div>

        {task.description && (
          <p
            className={`text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-2 ${
              task.completedToday ? "line-through" : ""
            }`}
          >
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            +{task.xpReward} XP
          </span>
          {formatTimeLeft(task)}
        </div>
      </div>
    </div>
  </div>
);

// Supporting Components
const TasksLoadingSkeleton = () => (
  <div className="flex-1 p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
    <div className="animate-pulse space-y-4 sm:space-y-6">
      <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 sm:w-1/3 mb-4"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 sm:h-20 bg-gray-300 dark:bg-gray-700 rounded"
          ></div>
        ))}
      </div>
      <div className="h-24 sm:h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-20 sm:h-24 bg-gray-300 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, color, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 text-center shadow-sm">
    <div className="flex items-center justify-center space-x-2">
      <span className="text-lg">{icon}</span>
      <div className={`text-xl sm:text-2xl font-bold ${color}`}>
        {value || 0}
      </div>
    </div>
    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
      {title}
    </div>
  </div>
);

// Original TaskItem component (for list view)
const TaskItem = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  getCategoryColor,
  formatTimeLeft,
  isCompleting,
}) => (
  <div
    className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
      task.completedToday ? "bg-green-50 dark:bg-green-900/20" : ""
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        <button
          onClick={onComplete}
          disabled={task.completedToday || isCompleting}
          className={`mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.completedToday
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
          } ${isCompleting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {task.completedToday && (
            <svg
              className="w-2 h-2 sm:w-3 sm:h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold text-gray-900 dark:text-white text-sm sm:text-base ${
                task.completedToday ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(
                task.category
              )}`}
            >
              {task.category}
            </span>
          </div>

          {task.description && (
            <p
              className={`text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-2 ${
                task.completedToday ? "line-through" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              +{task.xpReward} XP
            </span>
            {formatTimeLeft(task)}

            {/* Recurrence indicator for list view */}
            {task.recurrence?.enabled && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Recurring</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-3 sm:ml-4">
        <button
          onClick={() => onEdit(task)}
          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 sm:p-1"
          title="Edit task"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task)}
          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 sm:p-1"
          title="Delete task"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

export default DailyTasks;
