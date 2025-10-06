// pages/EnhancedDailyTasks.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  CreateTaskModal,
  DeleteTaskModal,
  UpdateTaskModal,
} from "../../components";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// DND Kit imports
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DailyTasks = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [filters, setFilters] = useState({
    view: "all", // 'all', 'today', 'upcoming', 'overdue', 'completed'
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

  // Fetch tasks with enhanced filtering
  const {
    data: tasksData,
    isLoading,
    error,
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
  });

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
    },
    onError: (error) => {
      console.error("Task completion mutation error:", error);
    },
  });

  const uncompleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.put(
        `/v1/daily-tasks/${taskId}`,
        { completedToday: false },
        config
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["dailyTasks"]);
      queryClient.invalidateQueries(["userData"]);
    },
    onError: (error) => {
      console.error("Task uncompletion mutation error:", error);
    },
  });

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
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

    if (!activeTask || !overColumn) return;

    // If dragging to completed column and task is not completed
    if (overColumn === "completed" && !activeTask.completedToday) {
      completeTaskMutation.mutate(activeTask._id);
    }
    // If dragging to pending column and task is completed
    else if (overColumn === "pending" && activeTask.completedToday) {
      uncompleteTaskMutation.mutate(activeTask._id);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  // Handler functions
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
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

    if (days > 0) {
      return (
        <span className="text-orange-500 text-sm">
          {days}d {hours}h left
        </span>
      );
    } else if (hours > 0) {
      return <span className="text-orange-500 text-sm">{hours}h left</span>;
    } else {
      return <span className="text-red-500 text-sm font-medium">Due soon</span>;
    }
  };

  // Data from API
  const tasksByDate = tasksData?.tasksByDate || {};
  const stats = tasksData?.stats || {};
  const paginationInfo = tasksData?.pagination || {};

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
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Daily Tasks
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Drag tasks between columns to mark as complete or pending
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            title="Completed Today"
            value={stats.completed}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Due Today"
            value={stats.dueToday}
            color="text-orange-600 dark:text-orange-400"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            color="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Advanced Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* View Filter */}
            <div>
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

            {/* Category Filter */}
            <div>
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

            {/* Sort By */}
            <div>
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

            {/* Date Range - Start */}
            <div>
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

            {/* Date Range - End */}
            <div>
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

            {/* Search */}
            <div>
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

          {/* Clear Filters */}
          <div className="flex justify-end mt-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending Tasks Column */}
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

          {/* Completed Tasks Column */}
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

        {/* Drag Overlay */}
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

      {/* Traditional List View (for smaller screens or as backup) */}
      <div className="lg:hidden space-y-6">
        {Object.keys(tasksByDate).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
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
              {/* Date Header */}
              <div
                className={`px-6 py-4 border-b ${
                  isOverdue(dateKey) && dateKey !== "no-deadline"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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

              {/* Tasks List */}
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
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            disabled={!paginationInfo.hasPrev}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
            disabled={!paginationInfo.hasNext}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

// Sortable Task Item Component
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
        ${task.completedToday ? "opacity-75" : ""}
        ${isDragging ? "opacity-50 shadow-lg rotate-2 z-50" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className={`font-medium text-gray-900 dark:text-white ${
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
              className={`text-gray-600 dark:text-gray-300 text-sm mb-2 ${
                task.completedToday ? "line-through" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              +{task.xpReward} XP
            </span>
            {formatTimeLeft(task)}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center space-x-1 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
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
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
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
};

// Kanban Column Component
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-fit">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm px-2 py-1 rounded-full">
            {count}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3 min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-lg mb-2">No tasks</div>
              <p className="text-sm">
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
      cursor-grabbing shadow-lg
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
            className={`font-medium text-gray-900 dark:text-white ${
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
            className={`text-gray-600 dark:text-gray-300 text-sm mb-2 ${
              task.completedToday ? "line-through" : ""
            }`}
          >
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
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
  <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      {/* Stats Skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-300 dark:bg-gray-700 rounded"
          ></div>
        ))}
      </div>
      {/* Filters Skeleton */}
      <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
      {/* Kanban Skeleton */}
      <div className="grid grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-24 bg-gray-300 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
    <div className={`text-2xl font-bold ${color}`}>{value || 0}</div>
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{title}</div>
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
    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
      task.completedToday ? "bg-green-50 dark:bg-green-900/20" : ""
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        {/* Completion Checkbox */}
        <button
          onClick={onComplete}
          disabled={task.completedToday || isCompleting}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.completedToday
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
          } ${isCompleting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {task.completedToday && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold text-gray-900 dark:text-white ${
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
              className={`text-gray-600 dark:text-gray-300 text-sm mb-2 ${
                task.completedToday ? "line-through" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              +{task.xpReward} XP
            </span>
            {formatTimeLeft(task)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => onEdit(task)}
          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
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
          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
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

// Keyboard coordinate getter for DND Kit
function sortableKeyboardCoordinates(
  event,
  {
    context: {
      active,
      over,
      collisionRect,
      droppableRects,
      droppableContainers,
    },
  }
) {
  if (event.code === "ArrowDown") {
    event.preventDefault();
    return { y: 50 };
  }

  if (event.code === "ArrowUp") {
    event.preventDefault();
    return { y: -50 };
  }

  if (event.code === "ArrowLeft") {
    event.preventDefault();
    return { x: -50 };
  }

  if (event.code === "ArrowRight") {
    event.preventDefault();
    return { x: 50 };
  }

  return { x: 0, y: 0 };
}

export default DailyTasks;
