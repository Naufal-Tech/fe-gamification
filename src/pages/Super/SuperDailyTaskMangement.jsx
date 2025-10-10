import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  FaCalendar,
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaFire,
  FaList,
  FaPlus,
  FaSearch,
  FaSync,
  FaTasks,
  FaThLarge,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import api from "../../utils/api";

const SuperDailyTaskManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    userId: "",
    category: "",
    status: "",
    sort: "recently",
    page: 1,
    limit: 20,
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("all");

  // FIXED: Use the new admin endpoint
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superTasks", filters, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      // Add status based on active tab
      if (activeTab === "completed") {
        params.append("status", "completed");
      } else if (activeTab === "pending") {
        params.append("status", "pending");
      } else if (activeTab === "overdue") {
        params.append("status", "overdue");
      }

      // Use the admin endpoint for Super users
      const response = await api.get(`/v1/daily-tasks/admin/all?${params}`, {
        withCredentials: true,
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch users for filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ["superUsers"],
    queryFn: async () => {
      const response = await api.get("/v1/users?limit=1000", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await api.delete(`/v1/daily-tasks/${taskId}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superTasks"]);
      setShowDeleteModal(false);
      setSelectedTask(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, data }) => {
      const response = await api.put(`/v1/daily-tasks/${taskId}`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superTasks"]);
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

  const handleToggleComplete = async (task) => {
    try {
      if (task.completedToday) {
        await api.post(
          `/v1/daily-tasks/uncomplete/${task._id}`,
          {},
          { withCredentials: true }
        );
      } else {
        await api.post(
          `/v1/daily-tasks/${task._id}/complete`,
          {},
          { withCredentials: true }
        );
      }
      queryClient.invalidateQueries(["superTasks"]);
    } catch (error) {
      console.error("Toggle complete error:", error);
    }
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

  const handleBulkAction = async (action) => {
    if (bulkSelection.length === 0) return;

    try {
      if (action === "complete") {
        await Promise.all(
          bulkSelection.map((taskId) =>
            api.post(
              `/v1/daily-tasks/${taskId}/complete`,
              {},
              { withCredentials: true }
            )
          )
        );
      } else if (action === "uncomplete") {
        await Promise.all(
          bulkSelection.map((taskId) =>
            api.post(
              `/v1/daily-tasks/uncomplete/${taskId}`,
              {},
              { withCredentials: true }
            )
          )
        );
      } else if (action === "delete") {
        await Promise.all(
          bulkSelection.map((taskId) =>
            api.delete(`/v1/daily-tasks/${taskId}`, { withCredentials: true })
          )
        );
      }

      queryClient.invalidateQueries(["superTasks"]);
      setBulkSelection([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Bulk action error:", error);
    }
  };

  const selectAllTasks = () => {
    const allTaskIds = tasks?.map((task) => task._id) || [];
    setBulkSelection(allTaskIds);
  };

  const clearSelection = () => {
    setBulkSelection([]);
  };

  const stats = useMemo(() => {
    return (
      tasksData?.stats || {
        totalTasks: 0,
        activeTasks: 0,
        completedToday: 0,
        overdueTasks: 0,
        totalXP: 0,
        earnedXP: 0,
        uniqueUsers: 0,
        completionRate: 0,
      }
    );
  }, [tasksData]);

  const tasks = tasksData?.tasks || [];
  const totalPages = tasksData?.pagination?.totalPages || 1;
  const users = usersData?.users || [];

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaTasks className="h-8 w-8 text-purple-600" />
              Super Task Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage daily tasks across all users • {stats.totalTasks} total
              tasks
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-purple-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
                title="Grid View"
              >
                <FaThLarge className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-purple-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
                title="List View"
              >
                <FaList className="h-4 w-4" />
              </button>
            </div>

            {/* Bulk Actions Indicator */}
            {bulkSelection.length > 0 && (
              <div className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">
                  {bulkSelection.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="hover:bg-purple-700 p-1 rounded transition-colors"
                  title="Bulk Actions"
                >
                  <FaSync className="h-3 w-3" />
                </button>
                <button
                  onClick={clearSelection}
                  className="hover:bg-purple-700 p-1 rounded transition-colors"
                  title="Clear Selection"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              title="Refresh"
            >
              <FaSync className="h-4 w-4" />
            </button>

            {/* Create Task Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
            >
              <FaPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Task</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          <StatCard
            icon={<FaTasks />}
            title="Total Tasks"
            value={stats.totalTasks}
            color="purple"
          />
          <StatCard
            icon={<FaCheckCircle />}
            title="Completed"
            value={stats.completedToday}
            color="green"
            subtitle={`${stats.completionRate}%`}
          />
          <StatCard
            icon={<FaExclamationTriangle />}
            title="Overdue"
            value={stats.overdueTasks}
            color="red"
          />
          <StatCard
            icon={<FaFire />}
            title="Active"
            value={stats.activeTasks}
            color="orange"
          />
          <StatCard
            icon={<FaTrophy />}
            title="Total XP"
            value={stats.totalXP}
            color="yellow"
          />
          <StatCard
            icon={<FaCheckCircle />}
            title="Earned XP"
            value={stats.earnedXP}
            color="blue"
          />
          <StatCard
            icon={<FaUser />}
            title="Users"
            value={stats.uniqueUsers}
            color="indigo"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: "all", name: "All Tasks", icon: FaList },
                { id: "pending", name: "Pending", icon: FaClock },
                { id: "overdue", name: "Overdue", icon: FaExclamationTriangle },
                { id: "completed", name: "Completed", icon: FaCheckCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Filters Section */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <FaFilter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tasksData?.pagination?.totalCount || 0} tasks found
                  </p>
                </div>
              </div>
              {(filters.search ||
                filters.userId ||
                filters.category ||
                filters.status) && (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      userId: "",
                      category: "",
                      status: "",
                      sort: "recently",
                      page: 1,
                      limit: 20,
                    })
                  }
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({user.role})
                  </option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">All Categories</option>
                <option value="health">Health</option>
                <option value="productivity">Productivity</option>
                <option value="learning">Learning</option>
                <option value="fitness">Fitness</option>
                <option value="personal">Personal</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="recently">Recently Created</option>
                <option value="oldest">Oldest First</option>
                <option value="deadline">Deadline (Soonest)</option>
                <option value="xp">XP (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State or Tasks Display */}
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTasks className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {filters.search || filters.userId || filters.category
                  ? "Try adjusting your filters to see more tasks"
                  : "Get started by creating your first task"}
              </p>
              {!filters.search && !filters.userId && !filters.category && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <FaPlus className="h-4 w-4" />
                  Create Task
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <TaskGridView
            tasks={tasks}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onToggleComplete={handleToggleComplete}
            onEdit={(task) => setSelectedTask(task)}
            onDelete={handleDeleteClick}
            onSelectAll={selectAllTasks}
            onClearSelection={clearSelection}
          />
        ) : (
          <TaskListView
            tasks={tasks}
            bulkSelection={bulkSelection}
            onBulkSelect={handleBulkSelection}
            onViewDetails={handleViewDetails}
            onToggleComplete={handleToggleComplete}
            onEdit={(task) => setSelectedTask(task)}
            onDelete={handleDeleteClick}
            onSelectAll={selectAllTasks}
            onClearSelection={clearSelection}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(filters.page - 1) * filters.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.min(
                    filters.page * filters.limit,
                    tasksData?.pagination?.totalCount || 0
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {tasksData?.pagination?.totalCount || 0}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="h-4 w-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1">
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
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          filters.page === pageNum
                            ? "bg-purple-600 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <span className="sm:hidden text-sm text-gray-600 dark:text-gray-400">
                  Page {filters.page} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          onUpdate={(data) => {
            updateMutation.mutate({
              taskId: selectedTask._id,
              data,
            });
          }}
        />
      )}

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

      {showBulkActions && (
        <BulkActionsModal
          selectedCount={bulkSelection.length}
          onAction={handleBulkAction}
          onClose={() => setShowBulkActions(false)}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          users={users}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(["superTasks"]);
          }}
        />
      )}
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Error State
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-96">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaTimes className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to Load Tasks
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  </div>
);

// StatCard Component
const StatCard = ({ icon, title, value, color, subtitle }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {value}
            </p>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-2.5 rounded-lg ${colorClasses[color]} text-white flex-shrink-0`}
        >
          {React.cloneElement(icon, { className: "h-4 w-4" })}
        </div>
      </div>
    </div>
  );
};

// Grid View Component
const TaskGridView = ({
  tasks,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onToggleComplete,
  onEdit,
  onDelete,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {tasks.map((task) => (
      <TaskCard
        key={task._id}
        task={task}
        isSelected={bulkSelection.includes(task._id)}
        onSelect={onBulkSelect}
        onView={onViewDetails}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ))}
  </div>
);

// List View Component
const TaskListView = ({
  tasks,
  bulkSelection,
  onBulkSelect,
  onViewDetails,
  onToggleComplete,
  onEdit,
  onDelete,
  onSelectAll,
  onClearSelection,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  bulkSelection.length === tasks.length && tasks.length > 0
                }
                onChange={(e) =>
                  e.target.checked ? onSelectAll() : onClearSelection()
                }
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Task
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              XP & Deadline
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              isSelected={bulkSelection.includes(task._id)}
              onSelect={onBulkSelect}
              onView={onViewDetails}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Task Card Component
const TaskCard = ({
  task,
  isSelected,
  onSelect,
  onView,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case "health":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "productivity":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "learning":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "fitness":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      case "personal":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isSelected
          ? "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800"
          : task.isOverdue
          ? "border-red-300 dark:border-red-700"
          : task.completedToday
          ? "border-green-300 dark:border-green-700"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(task._id, e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <button
              onClick={() => onToggleComplete(task)}
              className={`p-1.5 rounded-lg transition-colors ${
                task.completedToday
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              }`}
            >
              <FaCheck className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                task.category
              )}`}
            >
              {task.category}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                task.completedToday
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : task.isOverdue
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              }`}
            >
              {task.completedToday
                ? "Completed"
                : task.isOverdue
                ? "Overdue"
                : "Pending"}
            </span>
          </div>
        </div>

        {/* Task Info */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2 line-clamp-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaUser className="h-3 w-3" />
            <span>
              {task.userId?.fullName || "Unknown User"} (
              {task.userId?.role || "User"})
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {task.xpReward}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">XP</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {task.currentStreak || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Streak
            </div>
          </div>
        </div>

        {/* Deadline */}
        {task.deadlineTimestamp && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <FaClock className="h-3 w-3" />
              <span>
                {new Date(task.deadlineTimestamp).toLocaleDateString()}
              </span>
              {task.timeUntilDeadline && (
                <span
                  className={`ml-auto font-medium ${
                    task.isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {task.timeUntilDeadline}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onView(task)}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-xs font-medium"
          >
            View Details
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <FaEdit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <FaTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Row Component
const TaskRow = ({
  task,
  isSelected,
  onSelect,
  onView,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case "health":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "productivity":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "learning":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "fitness":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="w-12 px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(task._id, e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleComplete(task)}
            className={`p-1.5 rounded-lg transition-colors ${
              task.completedToday
                ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            }`}
          >
            <FaCheck className="h-3 w-3" />
          </button>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {task.title}
            </div>
            {task.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {task.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                  task.category
                )}`}
              >
                {task.category}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FaUser className="h-3 w-3 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {task.userId?.fullName || "Unknown User"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {task.userId?.role || "User"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            task.completedToday
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : task.isOverdue
              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          }`}
        >
          {task.completedToday
            ? "Completed"
            : task.isOverdue
            ? "Overdue"
            : "Pending"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
          {task.xpReward} XP
        </div>
        {task.deadlineTimestamp && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(task.deadlineTimestamp).toLocaleDateString()}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(task)}
            className="p-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            title="View"
          >
            <FaEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Task Detail Modal
const TaskDetailModal = ({ task, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    xpReward: task.xpReward,
    category: task.category,
    isActive: task.isActive,
    completedToday: task.completedToday,
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "health":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "productivity":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "learning":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "fitness":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Task Details
            </h3>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <FaUser className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {task.userId?.fullName || "Unknown User"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {task.userId?.email || "No email"} •{" "}
                    {task.userId?.role || "User"}
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Basic Information
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Title
                      </dt>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      ) : (
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {task.title}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Description
                      </dt>
                      {isEditing ? (
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      ) : (
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {task.description || "No description"}
                        </dd>
                      )}
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Task Settings
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        XP Reward
                      </dt>
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.xpReward}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              xpReward: parseInt(e.target.value),
                            }))
                          }
                          min="1"
                          max="1000"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      ) : (
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {task.xpReward}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Category
                      </dt>
                      {isEditing ? (
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        >
                          <option value="health">Health</option>
                          <option value="productivity">Productivity</option>
                          <option value="learning">Learning</option>
                          <option value="fitness">Fitness</option>
                          <option value="personal">Personal</option>
                          <option value="custom">Custom</option>
                        </select>
                      ) : (
                        <dd className="text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                              task.category
                            )}`}
                          >
                            {task.category}
                          </span>
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </dt>
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isActive: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              Active
                            </span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.completedToday}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  completedToday: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              Completed Today
                            </span>
                          </label>
                        </div>
                      ) : (
                        <dd className="text-sm">
                          <div className="space-y-1">
                            <div
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                task.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {task.isActive ? "Active" : "Inactive"}
                            </div>
                            <div
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                task.completedToday
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              }`}
                            >
                              {task.completedToday
                                ? "Completed Today"
                                : "Pending"}
                            </div>
                          </div>
                        </dd>
                      )}
                    </div>
                  </dl>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {task.currentStreak || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Current Streak
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {task.longestStreak || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Longest Streak
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {task.totalCompletions || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total Completions
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {task.xpReward}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      XP Reward
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadline Information */}
              {task.deadlineTimestamp && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Deadline
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(
                            task.deadlineTimestamp
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            task.deadlineTimestamp
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                      {task.timeUntilDeadline && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          }`}
                        >
                          {task.timeUntilDeadline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirm Modal
const DeleteConfirmModal = ({ task, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onCancel}
      ></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <FaTrash className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Task
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete the task{" "}
              <strong>"{task.title}"</strong> for user{" "}
              <strong>{task.userId?.fullName || "Unknown User"}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Bulk Actions Modal
const BulkActionsModal = ({
  selectedCount,
  onAction,
  onClose,
  isProcessing,
}) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bulk Actions ({selectedCount} selected)
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => onAction("complete")}
            disabled={isProcessing}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaCheck className="h-4 w-4" />
            Complete
          </button>
          <button
            onClick={() => onAction("uncomplete")}
            disabled={isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaSync className="h-4 w-4" />
            Uncomplete
          </button>
          <button
            onClick={() => onAction("activate")}
            disabled={isProcessing}
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaCheckCircle className="h-4 w-4" />
            Activate
          </button>
          <button
            onClick={() => onAction("deactivate")}
            disabled={isProcessing}
            className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <FaTimes className="h-4 w-4" />
            Deactivate
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Create Task Modal
const CreateTaskModal = ({ onClose, users, onSuccess }) => {
  const [formData, setFormData] = useState({
    userId: "",
    title: "",
    description: "",
    xpReward: 10,
    category: "personal",
    deadlineDate: "",
    deadlineTime: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/v1/daily-tasks", data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Create New Task
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User
              </label>
              <select
                required
                value={formData.userId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, userId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({user.role}) - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Enter task description (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  XP Reward
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
                      xpReward: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                    setFormData((prev) => ({
                      ...prev,
                      deadlineDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                    setFormData((prev) => ({
                      ...prev,
                      deadlineTime: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
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

export default SuperDailyTaskManagement;
