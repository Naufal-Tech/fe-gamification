import React, { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBook,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiFile,
  FiFilter,
  FiImage,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const StudyResources = () => {
  const { accessToken, user } = useAuthStore();

  // State for resources list
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false,
  });

  // State for filters and search
  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    file_category: "",
    tags: [],
    page: 1,
    limit: 12,
    sort: "-created_at",
  });

  // State for detailed view
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceDetail, setShowResourceDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // State for UI
  const [showFilters, setShowFilters] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  // Filter options
  const subjectOptions = [
    { value: "", label: "All Subjects" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Science", label: "Science" },
    { value: "English", label: "English" },
    { value: "Indonesian", label: "Indonesian" },
    { value: "History", label: "History" },
    { value: "Geography", label: "Geography" },
    { value: "Physics", label: "Physics" },
    { value: "Chemistry", label: "Chemistry" },
    { value: "Biology", label: "Biology" },
  ];

  const fileCategoryOptions = [
    { value: "", label: "All File Types" },
    { value: "pdf", label: "PDF Documents" },
    { value: "images", label: "Images" },
    { value: "videos", label: "Videos" },
    { value: "documents", label: "Documents" },
    { value: "presentations", label: "Presentations" },
  ];

  const sortOptions = [
    { value: "-created_at", label: "Newest First" },
    { value: "created_at", label: "Oldest First" },
    { value: "title", label: "Title A-Z" },
    { value: "-title", label: "Title Z-A" },
    { value: "-download_count", label: "Most Downloaded" },
  ];

  // Utility functions
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i]);
  };

  const getFileIcon = (fileType, fileCategory) => {
    if (fileCategory === "images") return <FiImage className="h-6 w-6" />;
    if (fileType === ".pdf") return <FiFile className="h-6 w-6 text-red-500" />;
    return <FiFile className="h-6 w-6" />;
  };

  const getFileCategoryColor = (category) => {
    switch (category) {
      case "pdf":
        return "bg-red-100 text-red-800";
      case "images":
        return "bg-blue-100 text-blue-800";
      case "videos":
        return "bg-purple-100 text-purple-800";
      case "documents":
        return "bg-green-100 text-green-800";
      case "presentations":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch resources by user's class
  const fetchResourcesByClass = useCallback(async () => {
    if (!user?.kelas) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Add filters to params
      if (filters.search) params.append("search", filters.search);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.file_category)
        params.append("file_category", filters.file_category);
      if (filters.tags.length > 0) {
        filters.tags.forEach((tag) => params.append("tags", tag));
      }
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());
      params.append("sort", filters.sort);

      const response = await api.get(
        `/v1/study-resource/class/${user.kelas}?${params}`,
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );

      if (response.data?.data) {
        setResources(response.data.data || []);
        setPagination(
          response.data.pagination || {
            current_page: 1,
            total_pages: 1,
            total_items: 0,
            has_next: false,
            has_prev: false,
          }
        );
      } else {
        toast.error("Failed to fetch study resources");
      }
    } catch (error) {
      console.error("Fetch resources error:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch study resources"
      );
    } finally {
      setLoading(false);
    }
  }, [filters, accessToken, user?.kelas]);

  // Fetch detailed resource information
  const fetchResourceDetail = async (resourceId) => {
    try {
      setDetailLoading(true);
      const response = await api.get(
        `/v1/study-resource/detail/${resourceId}`,
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );

      if (response.data?.data?.resource) {
        const resource = response.data.data.resource;
        setSelectedResource({
          ...resource,
          // Map the API response to match your component's expected structure
          _id: resource.id,
          download_count: resource.downloads_count || resource.download_count,
          related_resources: response.data.data.related_resources || [],
          uploader_other_resources:
            response.data.data.uploader_other_resources || [],
        });
      } else {
        toast.error("Failed to fetch resource details");
      }
    } catch (error) {
      console.error("Fetch resource detail error:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch resource details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleTagsChange = (tag) => {
    setFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return {
        ...prev,
        tags: newTags,
        page: 1,
      };
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResourcesByClass();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      subject: "",
      file_category: "",
      tags: [],
      page: 1,
      limit: 12,
      sort: "-created_at",
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Handle resource download
  const handleDownload = async (resourceId, filename) => {
    try {
      setDownloadingIds((prev) => new Set([...prev, resourceId]));

      const response = await api.get(
        `/v1/study-resource/download/${resourceId}`,
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
          responseType: "blob",
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Update download count in UI
      setResources((prev) =>
        prev.map((resource) =>
          resource._id === resourceId
            ? {
                ...resource,
                download_count: (resource.download_count || 0) + 1,
              }
            : resource
        )
      );

      if (
        selectedResource?._id === resourceId ||
        selectedResource?.id === resourceId
      ) {
        setSelectedResource((prev) => ({
          ...prev,
          download_count: (prev.download_count || 0) + 1,
        }));
      }

      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.response?.data?.message || "Failed to download file");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(resourceId);
        return newSet;
      });
    }
  };

  const handleViewDetail = async (resource) => {
    setShowResourceDetail(true);
    await fetchResourceDetail(resource._id);
  };

  const closeDetailView = () => {
    setSelectedResource(null);
    setShowResourceDetail(false);
  };

  // Effects
  useEffect(() => {
    if (user?.kelas) {
      fetchResourcesByClass();
    }
  }, [fetchResourcesByClass, user?.kelas]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Study Resources</h1>
          <p className="mt-2 text-sm text-gray-600">
            Download and access study materials for your class
          </p>
          {user?.kelas && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                <FiBook className="mr-1 h-4 w-4" />
                Class: {user.kelas}
              </span>
            </div>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4 mb-4"
          >
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Filters
            </button>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) =>
                      handleFilterChange("subject", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {subjectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    value={filters.file_category}
                    onChange={(e) =>
                      handleFilterChange("file_category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {fileCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Common Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "pdf",
                    "worksheet",
                    "notes",
                    "assignment",
                    "exam",
                    "quiz",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagsChange(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.tags.includes(tag)
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resources Grid */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No resources found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(
                          resource.file_type,
                          resource.file_category
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {resource.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getFileCategoryColor(
                          resource.file_category
                        )}`}
                      >
                        {resource.file_category.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {resource.file_size_formatted ||
                          formatFileSize(resource.file_size)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiBook className="h-4 w-4 mr-2" />
                        <span>{resource.subject}</span>
                      </div>
                      <div className="flex items-center">
                        <FiUser className="h-4 w-4 mr-2" />
                        <span>
                          {resource.uploaded_by?.fullName || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(resource.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <FiDownload className="h-4 w-4 mr-1" />
                        <span>{resource.download_count || 0} downloads</span>
                      </div>
                    </div>

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{resource.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleViewDetail(resource)}
                        className="flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <FiEye className="mr-1 h-4 w-4" />
                        View Details
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(
                            resource._id,
                            resource.original_filename
                          )
                        }
                        disabled={downloadingIds.has(resource._id)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingIds.has(resource._id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <FiDownload className="mr-2 h-4 w-4" />
                        )}
                        {downloadingIds.has(resource._id)
                          ? "Downloading..."
                          : "Download"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={!pagination.has_prev}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page {pagination.current_page} of {pagination.total_pages} (
              {pagination.total_items} total items)
            </span>

            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={!pagination.has_next}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <FiChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showResourceDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {detailLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : selectedResource ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          {getFileIcon(
                            selectedResource.file_type,
                            selectedResource.file_category
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getFileCategoryColor(
                              selectedResource.file_category
                            )}`}
                          >
                            {selectedResource.file_category.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {selectedResource.file_size_formatted ||
                              formatFileSize(selectedResource.file_size)}
                          </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedResource.title}
                        </h1>
                        <p className="text-gray-600 mb-4">
                          {selectedResource.description}
                        </p>
                      </div>
                      <button
                        onClick={closeDetailView}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <FiX className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiBook className="h-4 w-4 mr-2" />
                        <span>{selectedResource.subject}</span>
                      </div>
                      <div className="flex items-center">
                        <FiUser className="h-4 w-4 mr-2" />
                        <span>
                          {selectedResource.uploaded_by?.fullName || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(selectedResource.created_at)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-6 text-sm">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-700 mb-2">
                          <FiDownload className="h-4 w-4 mr-2" />
                          <span className="font-medium">Downloads</span>
                        </div>
                        <span className="text-2xl font-bold text-indigo-600">
                          {selectedResource.download_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedResource.tags &&
                      selectedResource.tags.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedResource.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      <button
                        onClick={() =>
                          handleDownload(
                            selectedResource._id || selectedResource.id,
                            selectedResource.original_filename
                          )
                        }
                        disabled={downloadingIds.has(
                          selectedResource._id || selectedResource.id
                        )}
                        className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingIds.has(
                          selectedResource._id || selectedResource.id
                        ) ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <FiDownload className="mr-2 h-5 w-5" />
                        )}
                        {downloadingIds.has(
                          selectedResource._id || selectedResource.id
                        )
                          ? "Downloading..."
                          : "Download File"}
                      </button>
                    </div>

                    {/* Related Resources */}
                    {selectedResource.related_resources &&
                      selectedResource.related_resources.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Related Resources
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedResource.related_resources.map(
                              (related) => (
                                <div
                                  key={related._id}
                                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      {getFileIcon(
                                        related.file_type,
                                        related.file_category
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 truncate">
                                        {related.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {related.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${getFileCategoryColor(
                                            related.file_category
                                          )}`}
                                        >
                                          {related.file_category.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {related.file_size_formatted ||
                                            formatFileSize(related.file_size)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center mt-3">
                                    <button
                                      onClick={() => handleViewDetail(related)}
                                      className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDownload(
                                          related._id,
                                          related.original_filename
                                        )
                                      }
                                      disabled={downloadingIds.has(related._id)}
                                      className="flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {downloadingIds.has(related._id) ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                      ) : (
                                        <FiDownload className="mr-1 h-3 w-3" />
                                      )}
                                      {downloadingIds.has(related._id)
                                        ? "Downloading..."
                                        : "Download"}
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Uploader's Other Resources */}
                    {selectedResource.uploader_other_resources &&
                      selectedResource.uploader_other_resources.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            More from{" "}
                            {selectedResource.uploaded_by?.fullName ||
                              "this uploader"}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedResource.uploader_other_resources.map(
                              (other) => (
                                <div
                                  key={other._id}
                                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      {getFileIcon(
                                        other.file_type,
                                        other.file_category
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 truncate">
                                        {other.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {other.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${getFileCategoryColor(
                                            other.file_category
                                          )}`}
                                        >
                                          {other.file_category.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {other.file_size_formatted ||
                                            formatFileSize(other.file_size)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center mt-3">
                                    <button
                                      onClick={() => handleViewDetail(other)}
                                      className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDownload(
                                          other._id,
                                          other.original_filename
                                        )
                                      }
                                      disabled={downloadingIds.has(other._id)}
                                      className="flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {downloadingIds.has(other._id) ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                      ) : (
                                        <FiDownload className="mr-1 h-3 w-3" />
                                      )}
                                      {downloadingIds.has(other._id)
                                        ? "Downloading..."
                                        : "Download"}
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Resource not found
                    </h3>
                    <p className="text-gray-500">
                      The requested resource could not be loaded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyResources;
