/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBell,
  FaCalendar,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaPlus,
  FaSearch,
  FaTag,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function Announcements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const priority = searchParams.get("priority") || "";
  const targetAudience = searchParams.get("targetAudience") || "";
  const tags = searchParams.get("tags") || "";
  const hasAttachments = searchParams.get("hasAttachments") || "";
  const createdAfter = searchParams.get("created_after") || "";
  const createdBefore = searchParams.get("created_before") || "";
  const [searchInput, setSearchInput] = useState(search);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  const apiEndpoint = "/v1/announcements";

  // Check if user is Admin
  const isAdmin = user?.role === "Admin";

  // Debounced search handler
  const debouncedSearch = debounce((value) => {
    const params = { page: "1" };
    if (value) params.search = value;
    if (category) params.category = category;
    if (priority) params.priority = priority;
    if (targetAudience) params.targetAudience = targetAudience;
    if (tags) params.tags = tags;
    if (hasAttachments) params.hasAttachments = hasAttachments;
    if (createdAfter) params.created_after = createdAfter;
    if (createdBefore) params.created_before = createdBefore;
    setSearchParams(params);
  }, 500);

  useEffect(() => {
    setSearchInput(search);
    return () => {
      debouncedSearch.cancel();
    };
  }, [search]);

  // Fetch announcements using the search endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "announcements",
      page,
      search,
      category,
      priority,
      targetAudience,
      tags,
      hasAttachments,
      createdAfter,
      createdBefore,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (priority) params.append("priority", priority);
      if (targetAudience) params.append("targetAudience", targetAudience);
      if (tags) params.append("tags", tags);
      if (hasAttachments) params.append("hasAttachments", hasAttachments);
      if (createdAfter) params.append("created_after", createdAfter);
      if (createdBefore) params.append("created_before", createdBefore);

      const response = await api.get(`${apiEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(`${apiEndpoint}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries([
        "announcements",
        page,
        search,
        category,
        priority,
        targetAudience,
        tags,
        hasAttachments,
        createdAfter,
        createdBefore,
      ]);
      const previousData = queryClient.getQueryData([
        "announcements",
        page,
        search,
        category,
        priority,
        targetAudience,
        tags,
        hasAttachments,
        createdAfter,
        createdBefore,
      ]);
      queryClient.setQueryData(
        [
          "announcements",
          page,
          search,
          category,
          priority,
          targetAudience,
          tags,
          hasAttachments,
          createdAfter,
          createdBefore,
        ],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((announcement) => announcement._id !== id),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Delete Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        [
          "announcements",
          page,
          search,
          category,
          priority,
          targetAudience,
          tags,
          hasAttachments,
          createdAfter,
          createdBefore,
        ],
        context?.previousData
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete announcement";
      toast.error(errorMessage);
    },
    onSuccess: (response) => {
      toast.success(
        response.data?.message || "Announcement deleted successfully"
      );
    },
  });

  // Fetch single announcement for detail view
  const fetchAnnouncementDetail = async (id) => {
    try {
      const response = await api.get(`${apiEndpoint}/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      console.error("Fetch detail error:", error);
      toast.error("Failed to fetch announcement details");
      return null;
    }
  };

  // Utility functions
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "emergency":
        return "bg-red-100 text-red-800";
      case "academic":
        return "bg-blue-100 text-blue-800";
      case "event":
        return "bg-purple-100 text-purple-800";
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Event handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (filterType, value) => {
    const params = { page: "1" };
    if (search) params.search = search;
    if (filterType === "category") params.category = value;
    else if (category) params.category = category;
    if (filterType === "priority") params.priority = value;
    else if (priority) params.priority = priority;
    if (filterType === "targetAudience") params.targetAudience = value;
    else if (targetAudience) params.targetAudience = targetAudience;
    if (filterType === "tags") params.tags = value;
    else if (tags) params.tags = tags;
    if (filterType === "hasAttachments") params.hasAttachments = value;
    else if (hasAttachments) params.hasAttachments = hasAttachments;
    if (filterType === "created_after") params.created_after = value;
    else if (createdAfter) params.created_after = createdAfter;
    if (filterType === "created_before") params.created_before = value;
    else if (createdBefore) params.created_before = createdBefore;
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    if (newPage) {
      const params = { page: newPage.toString() };
      if (search) params.search = search;
      if (category) params.category = category;
      if (priority) params.priority = priority;
      if (targetAudience) params.targetAudience = targetAudience;
      if (tags) params.tags = tags;
      if (hasAttachments) params.hasAttachments = hasAttachments;
      if (createdAfter) params.created_after = createdAfter;
      if (createdBefore) params.created_before = createdBefore;
      setSearchParams(params);
    }
  };

  const handleDeleteClick = (announcement) => {
    setAnnouncementToDelete(announcement);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (announcementToDelete) {
      deleteMutation.mutate(announcementToDelete._id);
    }
    setIsModalOpen(false);
    setAnnouncementToDelete(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setAnnouncementToDelete(null);
  };

  const handleViewDetail = async (announcement) => {
    const detailData = await fetchAnnouncementDetail(announcement._id);
    if (detailData) {
      setSelectedAnnouncement(detailData);
      setIsDetailModalOpen(true);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({ page: "1" });
  };

  const filteredAnnouncements = data?.data || [];

  // Filter options
  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "academic", label: "Academic" },
    { value: "event", label: "Event" },
    { value: "maintenance", label: "Maintenance" },
    { value: "emergency", label: "Emergency" },
  ];

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  const targetAudienceOptions = [
    { value: "", label: "All Audiences" },
    { value: "all", label: "Everyone" },
    { value: "students", label: "Students" },
    { value: "teachers", label: "Teachers" },
    { value: "parents", label: "Parents" },
  ];

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <FaBell className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Announcements
          </h1>
        </div>
        {isAdmin && (
          <Link
            to="/admin/announcements/new"
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Create Announcement
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) =>
                handleFilterChange("targetAudience", e.target.value)
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            >
              {targetAudienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              placeholder="Enter tags (comma-separated)"
              value={tags}
              onChange={(e) => handleFilterChange("tags", e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Has Attachments
            </label>
            <select
              value={hasAttachments}
              onChange={(e) =>
                handleFilterChange("hasAttachments", e.target.value)
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created After
            </label>
            <input
              type="date"
              value={createdAfter}
              onChange={(e) =>
                handleFilterChange("created_after", e.target.value)
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Created Before
            </label>
            <input
              type="date"
              value={createdBefore}
              onChange={(e) =>
                handleFilterChange("created_before", e.target.value)
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array(5)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              ></div>
            ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm sm:text-base">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load announcements"}
          </span>
          <button
            onClick={() =>
              queryClient.invalidateQueries([
                "announcements",
                page,
                search,
                category,
                priority,
                targetAudience,
                tags,
                hasAttachments,
                createdAfter,
                createdBefore,
              ])
            }
            className="text-red-600 dark:text-red-300 hover:underline text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAnnouncements.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <FaBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No announcements found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria.
          </p>
          {isAdmin && (
            <Link
              to="/admin/announcements/new"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Create your first announcement
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Target Audience</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => (
                  <tr
                    key={announcement._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs">
                      <div className="truncate">{announcement.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          announcement.category
                        )}`}
                      >
                        {announcement.category.charAt(0).toUpperCase() +
                          announcement.category.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {announcement.targetAudience}
                    </td>
                    <td className="px-4 py-3">
                      {announcement.author?.fullName || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(announcement.created_at)}
                    </td>
                    <td className="px-4 py-3">{announcement.viewCount || 0}</td>
                    <td className="px-4 py-3 flex space-x-2">
                      <button
                        onClick={() => handleViewDetail(announcement)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="View Details"
                        aria-label="View announcement details"
                      >
                        <FaEye className="h-5 w-5" />
                      </button>
                      {isAdmin && (
                        <>
                          <Link
                            to={`/admin/announcements/edit/${announcement._id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                            aria-label="Edit announcement"
                          >
                            <FaEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(announcement)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                            aria-label="Delete announcement"
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          announcement.category
                        )}`}
                      >
                        {announcement.category.charAt(0).toUpperCase() +
                          announcement.category.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  <div className="flex items-center">
                    <FaUser className="h-4 w-4 mr-2" />
                    {announcement.author?.fullName || "Unknown"}
                  </div>
                  <div className="flex items-center">
                    <FaCalendar className="h-4 w-4 mr-2" />
                    {formatDate(announcement.created_at)}
                  </div>
                  <div className="flex items-center">
                    <FaTag className="h-4 w-4 mr-2" />
                    {announcement.targetAudience.charAt(0).toUpperCase() +
                      announcement.targetAudience.slice(1)}
                  </div>
                  <div className="flex items-center">
                    <FaEye className="h-4 w-4 mr-2" />
                    {announcement.viewCount || 0} views
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleViewDetail(announcement)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    title="View Details"
                    aria-label="View announcement details"
                  >
                    <FaEye className="h-5 w-5" />
                  </button>
                  {isAdmin && (
                    <>
                      <Link
                        to={`/admin/announcements/edit/${announcement._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                        aria-label="Edit announcement"
                      >
                        <FaEdit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(announcement)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                        aria-label="Delete announcement"
                      >
                        <FaTrash className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAnnouncements.length} of{" "}
              {data?.pagination?.total_items || 0} announcements
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={() =>
                  handlePageChange(data?.pagination?.current_page - 1)
                }
                disabled={data?.pagination?.current_page === 1 || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-center">
                Page {data?.pagination?.current_page || 1} of{" "}
                {data?.pagination?.total_pages || 1}
              </span>
              <button
                onClick={() =>
                  handlePageChange(data?.pagination?.current_page + 1)
                }
                disabled={
                  data?.pagination?.current_page ===
                    data?.pagination?.total_pages || isLoading
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirm Deletion
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the announcement{" "}
              <span className="font-medium">
                "{announcementToDelete?.title}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
              >
                {deleteMutation.isLoading ? (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                Announcement Details
              </h2>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedAnnouncement.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                      selectedAnnouncement.priority
                    )}`}
                  >
                    {selectedAnnouncement.priority.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      selectedAnnouncement.category
                    )}`}
                  >
                    {selectedAnnouncement.category.charAt(0).toUpperCase() +
                      selectedAnnouncement.category.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <FaUser className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Author
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedAnnouncement.author?.fullName || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaCalendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created At
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedAnnouncement.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaTag className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Target Audience
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {selectedAnnouncement.targetAudience}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaEye className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Views
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedAnnouncement.viewCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center">
                  <FaCalendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedAnnouncement.startDate)}
                    </p>
                  </div>
                </div>
                {selectedAnnouncement.endDate && (
                  <div className="flex items-center">
                    <FaCalendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        End Date
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedAnnouncement.endDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Content
                </h4>
                <div
                  className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: selectedAnnouncement.content,
                  }}
                />
              </div>

              {/* Tags */}
              {selectedAnnouncement.tags &&
                selectedAnnouncement.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnnouncement.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* File Attachments */}
              {selectedAnnouncement.file_attachments &&
                selectedAnnouncement.file_attachments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {selectedAnnouncement.file_attachments.map(
                        (attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center truncate">
                              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                {attachment.file_name ||
                                  `Attachment ${index + 1}`}
                              </span>
                            </div>
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* External Links */}
              {selectedAnnouncement.external_links &&
                selectedAnnouncement.external_links.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      External Links
                    </h4>
                    <div className="space-y-2">
                      {selectedAnnouncement.external_links.map(
                        (link, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center truncate">
                              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                {link.name || link.url}
                              </span>
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Visit
                            </a>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                  <Link
                    to={`/admin/announcements/edit/${selectedAnnouncement._id}`}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm"
                  >
                    <FaEdit className="mr-2 h-4 w-4" />
                    Edit Announcement
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;
