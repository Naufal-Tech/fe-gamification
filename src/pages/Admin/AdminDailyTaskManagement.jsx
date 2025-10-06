// components/AdminDailyTasksManagement.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaFire,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUser,
  FaUserCheck,
} from "react-icons/fa";
import api from "../../utils/api";

const AdminDailyTasksManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    userId: "",
    category: "",
    status: "",
    deadline: "",
    sort: "recently",
    page: 1,
    limit: 10,
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [viewMode, setViewMode] = useState("all"); // 'all', 'today', 'overdue', 'completed'

  // Fetch all tasks with admin privileges
  const {
    data: tasksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminTasks", filters, viewMode],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      // Add view mode to params
      if (viewMode !== "all") {
        params.append("view", viewMode);
      }

      const response = await api.get(`/v1/daily-tasks?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch users for filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const response = await api.get("/v1/users?limit=1000", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await api.delete(`/v1/daily-tasks/${taskId}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminTasks"]);
      setShowDeleteModal(false);
      setSelectedTask(null);
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const response = await api.put(`/v1/daily-tasks/${taskId}`, updates, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminTasks"]);
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const response = await api.post("/v1/daily-tasks", taskData, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminTasks"]);
      setShowCreateModal(false);
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleStatusToggle = (task) => {
    updateTaskMutation.mutate({
      taskId: task._id,
      updates: { completedToday: !task.completedToday },
    });
  };

  const handleActiveToggle = (task) => {
    updateTaskMutation.mutate({
      taskId: task._id,
      updates: { isActive: !task.isActive },
    });
  };

  const confirmDelete = () => {
    if (selectedTask) {
      deleteMutation.mutate(selectedTask._id);
    }
  };

  const handleBulkSelection = (taskId, checked) => {
    setBulkSelection((prev) =>
      checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleBulkAction = (action) => {
    if (bulkSelection.length === 0) return;

    switch (action) {
      case "delete":
        bulkSelection.forEach((taskId) => {
          deleteMutation.mutate(taskId);
        });
        break;
      case "complete":
        bulkSelection.forEach((taskId) => {
          updateTaskMutation.mutate({
            taskId,
            updates: { completedToday: true },
          });
        });
        break;
      case "incomplete":
        bulkSelection.forEach((taskId) => {
          updateTaskMutation.mutate({
            taskId,
            updates: { completedToday: false },
          });
        });
        break;
      case "activate":
        bulkSelection.forEach((taskId) => {
          updateTaskMutation.mutate({
            taskId,
            updates: { isActive: true },
          });
        });
        break;
      case "deactivate":
        bulkSelection.forEach((taskId) => {
          updateTaskMutation.mutate({
            taskId,
            updates: { isActive: false },
          });
        });
        break;
    }
    setBulkSelection([]);
  };

  const selectAllTasks = () => {
    const allTaskIds = tasks?.map((task) => task._id) || [];
    setBulkSelection(allTaskIds);
  };

  const clearSelection = () => {
    setBulkSelection([]);
  };

  // Enhanced statistics calculation
  const stats = useMemo(() => {
    const tasks = tasksData?.tasks || [];
    const now = new Date().getTime();

    return {
      total: tasks.length,
      active: tasks.filter((t) => t.isActive).length,
      completed: tasks.filter((t) => t.completedToday).length,
      overdue: tasks.filter(
        (t) => t.isOverdue && t.isActive && !t.completedToday
      ).length,
      dueToday: tasks.filter((t) => {
        if (!t.deadlineTimestamp) return false;
        const taskDate = new Date(t.deadlineTimestamp);
        const today = new Date();
        return taskDate.toDateString() === today.toDateString();
      }).length,
      totalXP: tasks.reduce((sum, task) => sum + task.xpReward, 0),
      earnedToday: tasks
        .filter((t) => t.completedToday)
        .reduce((sum, task) => sum + task.xpReward, 0),
      categories: {
        health: tasks.filter((t) => t.category === "health").length,
        productivity: tasks.filter((t) => t.category === "productivity").length,
        learning: tasks.filter((t) => t.category === "learning").length,
        fitness: tasks.filter((t) => t.category === "fitness").length,
        personal: tasks.filter((t) => t.category === "personal").length,
        custom: tasks.filter((t) => t.category === "custom").length,
      },
    };
  }, [tasksData]);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <FaTimes className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading tasks
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tasks = tasksData?.tasks || [];
  const totalPages = tasksData?.pagination?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Daily Tasks Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage all daily tasks across the system
            </p>
          </div>
          <div className="flex items-center gap-3">
            {bulkSelection.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {bulkSelection.length} selected
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleBulkAction("complete")}
                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    title="Complete Selected"
                  >
                    <FaCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleBulkAction("incomplete")}
                    className="p-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                    title="Mark Incomplete"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleBulkAction("activate")}
                    className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Activate Selected"
                  >
                    <FaUserCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleBulkAction("deactivate")}
                    className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    title="Deactivate Selected"
                  >
                    <FaUser className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Selected"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Clear Selection"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FaPlus className="h-4 w-4" />
              Create Task
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard
            icon={<FaTrophy className="h-5 w-5" />}
            title="Total Tasks"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<FaUserCheck className="h-5 w-5" />}
            title="Active"
            value={stats.active}
            color="green"
          />
          <StatCard
            icon={<FaCheckCircle className="h-5 w-5" />}
            title="Completed"
            value={stats.completed}
            color="emerald"
          />
          <StatCard
            icon={<FaExclamationTriangle className="h-5 w-5" />}
            title="Overdue"
            value={stats.overdue}
            color="red"
          />
          <StatCard
            icon={<FaClock className="h-5 w-5" />}
            title="Due Today"
            value={stats.dueToday}
            color="orange"
          />
          <StatCard
            icon={<FaFire className="h-5 w-5" />}
            title="Total XP"
            value={stats.totalXP}
            color="purple"
          />
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Tasks", icon: FaTrophy },
              { id: "today", label: "Due Today", icon: FaClock },
              { id: "overdue", label: "Overdue", icon: FaExclamationTriangle },
              { id: "completed", label: "Completed", icon: FaCheckCircle },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FaFilter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters & Search
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {tasksData?.pagination?.totalCount || 0} tasks found
              </span>
              {(filters.search ||
                filters.userId ||
                filters.category ||
                filters.status ||
                filters.deadline) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      userId: "",
                      category: "",
                      status: "",
                      deadline: "",
                      sort: "recently",
                      page: 1,
                      limit: 10,
                    })
                  }
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* User Filter */}
            <select
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {usersData?.users?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName || user.username}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="health">Health</option>
              <option value="productivity">Productivity</option>
              <option value="learning">Learning</option>
              <option value="fitness">Fitness</option>
              <option value="personal">Personal</option>
              <option value="custom">Custom</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="recently">Recently Created</option>
              <option value="deadline">Deadline (Soonest)</option>
              <option value="deadline_desc">Deadline (Latest)</option>
              <option value="xp">XP (High to Low)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        bulkSelection.length === tasks.length &&
                        tasks.length > 0
                      }
                      onChange={(e) =>
                        e.target.checked ? selectAllTasks() : clearSelection()
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task & User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      isSelected={bulkSelection.includes(task._id)}
                      onSelect={handleBulkSelection}
                      onView={handleViewDetails}
                      onStatusToggle={handleStatusToggle}
                      onActiveToggle={handleActiveToggle}
                      onEdit={() => {
                        /* Implement edit functionality */
                      }}
                      onDelete={handleDeleteClick}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <FaTrophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No tasks found</p>
                        <p className="text-sm mt-1">
                          {filters.search || filters.userId || filters.category
                            ? "Try adjusting your filters"
                            : "Get started by creating your first task"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                  {Math.min(
                    filters.page * filters.limit,
                    tasksData?.pagination?.totalCount || 0
                  )}{" "}
                  of {tasksData?.pagination?.totalCount || 0} tasks
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded-lg ${
                            filters.page === pageNum
                              ? "bg-indigo-600 text-white"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= totalPages}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          onStatusToggle={handleStatusToggle}
          onActiveToggle={handleActiveToggle}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTask && (
        <DeleteConfirmModal
          task={selectedTask}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedTask(null);
          }}
          isDeleting={deleteMutation.isLoading}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createTaskMutation.mutate}
          isSubmitting={createTaskMutation.isLoading}
          users={usersData?.users || []}
        />
      )}
    </div>
  );
};

// Enhanced Loading Skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
    </div>
  </div>
);

// StatCard Component
const StatCard = ({ icon, title, value, color, subtitle }) => {
  const bgColorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    emerald:
      "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    red: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value?.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

// TaskRow Component
const TaskRow = ({
  task,
  isSelected,
  onSelect,
  onView,
  onStatusToggle,
  onActiveToggle,
  onEdit,
  onDelete,
}) => {
  const getUserDisplay = (userId, users) => {
    const user = users?.find((u) => u._id === userId);
    return user ? user.fullName || user.username : "Unknown User";
  };

  const getCategoryBadge = (category) => {
    const categories = {
      health: { color: "green", label: "Health" },
      productivity: { color: "blue", label: "Productivity" },
      learning: { color: "purple", label: "Learning" },
      fitness: { color: "orange", label: "Fitness" },
      personal: { color: "indigo", label: "Personal" },
      custom: { color: "gray", label: "Custom" },
    };

    const categoryInfo = categories[category] || {
      color: "gray",
      label: category,
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800 dark:bg-${categoryInfo.color}-900 dark:text-${categoryInfo.color}-200`}
      >
        {categoryInfo.label}
      </span>
    );
  };

  const getStatusBadge = (task) => {
    if (!task.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          Inactive
        </span>
      );
    }
    if (task.completedToday) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Completed
        </span>
      );
    }
    if (task.isOverdue) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Pending
      </span>
    );
  };

  const formatDeadline = (deadlineTimestamp) => {
    if (!deadlineTimestamp) return "No deadline";

    const deadline = new Date(deadlineTimestamp);
    const now = new Date();
    const diffMs = deadline - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays > 1 && diffDays < 7) {
      return `${diffDays} days`;
    } else {
      return deadline.toLocaleDateString();
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="w-12 px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(task._id, e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-start space-x-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {task.title}
              </div>
              {getCategoryBadge(task.category)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {task.description}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              User: {getUserDisplay(task.userId)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {task.xpReward} XP
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Streak: {task.currentStreak || 0}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Total: {task.totalCompletions || 0}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div>{getStatusBadge(task)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {task.autoGenerate ? "Auto-generate" : "Manual"}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDeadline(task.deadlineTimestamp)}
        </div>
        {task.timeUntilDeadline && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {task.timeUntilDeadline}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(task)}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="View Details"
          >
            <FaEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onStatusToggle(task)}
            className={`p-2 rounded-lg transition-colors ${
              task.completedToday
                ? "text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                : "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
            }`}
            title={task.completedToday ? "Mark Incomplete" : "Mark Complete"}
          >
            <FaCheck className="h-4 w-4" />
          </button>
          <button
            onClick={() => onActiveToggle(task)}
            className={`p-2 rounded-lg transition-colors ${
              task.isActive
                ? "text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
            title={task.isActive ? "Deactivate" : "Activate"}
          >
            <FaUser className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Task"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// TaskDetailModal Component
const TaskDetailModal = ({ task, onClose, onStatusToggle, onActiveToggle }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "history", name: "History" },
    { id: "user", name: "User Info" },
  ];

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Task Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Task Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {task.title}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  {task.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full text-sm font-medium">
                    {task.xpReward} XP
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium">
                    {task.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      task.isActive
                        ? task.completedToday
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : task.isOverdue
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {task.isActive
                      ? task.completedToday
                        ? "Completed"
                        : task.isOverdue
                        ? "Overdue"
                        : "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onStatusToggle(task)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    task.completedToday
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {task.completedToday ? "Mark Incomplete" : "Mark Complete"}
                </button>
                <button
                  onClick={() => onActiveToggle(task)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    task.isActive
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {task.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 gap-6">
                <DetailSection title="Task Information">
                  <DetailItem label="Title" value={task.title} />
                  <DetailItem label="Description" value={task.description} />
                  <DetailItem label="Category" value={task.category} />
                  <DetailItem label="XP Reward" value={`${task.xpReward} XP`} />
                  <DetailItem
                    label="Auto Generate"
                    value={task.autoGenerate ? "Yes" : "No"}
                  />
                </DetailSection>

                <DetailSection title="Progress & Stats">
                  <DetailItem
                    label="Current Streak"
                    value={`${task.currentStreak || 0} days`}
                  />
                  <DetailItem
                    label="Longest Streak"
                    value={`${task.longestStreak || 0} days`}
                  />
                  <DetailItem
                    label="Total Completions"
                    value={task.totalCompletions || 0}
                  />
                  <DetailItem
                    label="Created"
                    value={formatDate(task.created_at)}
                  />
                  <DetailItem
                    label="Last Updated"
                    value={formatDate(task.updated_at)}
                  />
                </DetailSection>

                <DetailSection title="Deadline Information">
                  <DetailItem
                    label="Deadline"
                    value={formatDate(task.deadlineTimestamp)}
                  />
                  <DetailItem
                    label="Time Until Deadline"
                    value={task.timeUntilDeadline || "No deadline"}
                  />
                  <DetailItem
                    label="Overdue"
                    value={task.isOverdue ? "Yes" : "No"}
                  />
                </DetailSection>

                <DetailSection title="System Information">
                  <DetailItem
                    label="Active"
                    value={task.isActive ? "Yes" : "No"}
                  />
                  <DetailItem
                    label="Completed Today"
                    value={task.completedToday ? "Yes" : "No"}
                  />
                  <DetailItem label="User ID" value={task.userId} copyable />
                </DetailSection>
              </div>
            )}

            {activeTab === "history" && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Task history tracking coming soon</p>
              </div>
            )}

            {activeTab === "user" && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaUser className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>User information integration coming soon</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DetailSection Component
const DetailSection = ({ title, children }) => (
  <div>
    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

// DetailItem Component
const DetailItem = ({ label, value, copyable = false }) => (
  <div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <div className="flex items-center gap-2">
      <p className="mt-1 text-sm text-gray-900 dark:text-white flex-1">
        {value || "Not provided"}
      </p>
      {copyable && value && (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-gray-400 hover:text-gray-500"
          title="Copy to clipboard"
        >
          <FaTimes className="h-4 w-4 transform rotate-45" />
        </button>
      )}
    </div>
  </div>
);

// DeleteConfirmation Modal
const DeleteConfirmModal = ({ task, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div
        className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        onClick={onCancel}
      ></div>

      <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
              <FaTrash className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Delete Task
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete the task{" "}
                  <strong>"{task.title}"</strong>? This action cannot be undone.
                </p>
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    ⚠️ This will permanently delete:
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
                    <li>Task data and progress</li>
                    <li>Completion history</li>
                    <li>Streak information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Task"}
          </button>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

// CreateTaskModal Component
const CreateTaskModal = ({ onClose, onSubmit, isSubmitting, users }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    xpReward: 10,
    category: "personal",
    userId: "",
    autoGenerate: true,
    deadlineDate: "",
    deadlineTime: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create New Task
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User
                  </label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => handleChange("userId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName || user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      handleChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter task description (optional)"
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
                        handleChange("xpReward", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline Date
                    </label>
                    <input
                      type="date"
                      value={formData.deadlineDate}
                      onChange={(e) =>
                        handleChange("deadlineDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline Time
                    </label>
                    <input
                      type="time"
                      value={formData.deadlineTime}
                      onChange={(e) =>
                        handleChange("deadlineTime", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoGenerate}
                    onChange={(e) =>
                      handleChange("autoGenerate", e.target.checked)
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Auto-generate daily
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDailyTasksManagement;
