/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import debounce from "lodash/debounce";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaDownload,
  FaEdit,
  FaEye,
  FaFile,
  FaFileAlt,
  FaImage,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
  FaVideo,
  FaVolumeUp,
} from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function StudyResourcesGuru() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField") || "title";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const subject = searchParams.get("subject") || "";
  const kelas = searchParams.get("kelas") || "";
  const fileCategory = searchParams.get("fileCategory") || "";

  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [classes, setClasses] = useState([]);

  const apiEndpoint = "/study-resource";
  const userResourcesEndpoint = `/v1/study-resource/user/${user?._id}`;

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Debounced search handler
  const debouncedSearch = debounce((value, field) => {
    const params = {
      page: "1",
      searchField: field,
      ...(value && { search: value }),
      sortBy,
      sortOrder,
      ...(subject && { subject }),
      ...(kelas && { kelas }),
      ...(fileCategory && { fileCategory }),
    };
    setSearchParams(params);
  }, 500);

  useEffect(() => {
    setSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/v1/kelas", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setClasses(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      }
    };
    fetchClasses();
  }, [accessToken]);

  // React Query hook for fetching resources
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "studyResources",
      page,
      searchQuery,
      searchField,
      sortBy,
      sortOrder,
      subject,
      kelas,
      fileCategory,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sort: sortOrder === "desc" ? `-${sortBy}` : sortBy,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (subject) params.append("subject", subject);
      if (kelas) params.append("kelas", kelas);
      if (fileCategory) params.append("file_category", fileCategory);

      const endpoint =
        user?.role === "Guru" ? userResourcesEndpoint : apiEndpoint;
      const response = await api.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    },
  });

  // Mutation for deleting resource
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(`/v1/study-resource/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries([
        "studyResources",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        subject,
        kelas,
        fileCategory,
      ]);
      const previousData = queryClient.getQueryData([
        "studyResources",
        page,
        searchQuery,
        searchField,
        sortBy,
        sortOrder,
        subject,
        kelas,
        fileCategory,
      ]);
      queryClient.setQueryData(
        [
          "studyResources",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          subject,
          kelas,
          fileCategory,
        ],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((resource) => resource._id !== id),
          };
        }
      );
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Delete Error:", err.response?.data || err.message);
      queryClient.setQueryData(
        [
          "studyResources",
          page,
          searchQuery,
          searchField,
          sortBy,
          sortOrder,
          subject,
          kelas,
          fileCategory,
        ],
        context?.previousData
      );
      toast.error(err.response?.data?.error || "Failed to delete resource");
    },
    onSuccess: () => {
      toast.success("Resource deleted successfully");
    },
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value, searchField);
  };

  const handleSearchFieldChange = (e) => {
    const newField = e.target.value;
    setSearchParams({
      page: "1",
      searchField: newField,
      ...(search && { search }),
      sortBy,
      sortOrder,
      ...(subject && { subject }),
      ...(kelas && { kelas }),
      ...(fileCategory && { fileCategory }),
    });
  };

  const handleFilterChange = (filterType, value) => {
    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy,
      sortOrder,
      ...(filterType === "subject" ? { subject: value } : { subject }),
      ...(filterType === "kelas" ? { kelas: value } : { kelas }),
      ...(filterType === "fileCategory"
        ? { fileCategory: value }
        : { fileCategory }),
    });
  };

  const handleSortChange = (field) => {
    const newSortOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSearchParams({
      page: "1",
      ...(searchQuery && { search: searchQuery }),
      searchField,
      sortBy: field,
      sortOrder: newSortOrder,
      ...(subject && { subject }),
      ...(kelas && { kelas }),
      ...(fileCategory && { fileCategory }),
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage) {
      setSearchParams({
        page: newPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        searchField,
        sortBy,
        sortOrder,
        ...(subject && { subject }),
        ...(kelas && { kelas }),
        ...(fileCategory && { fileCategory }),
      });
    }
  };

  const handleDeleteClick = (resource) => {
    setResourceToDelete(resource);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (resourceToDelete) {
      deleteMutation.mutate(resourceToDelete._id);
    }
    setIsModalOpen(false);
    setResourceToDelete(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setResourceToDelete(null);
  };

  const handleManualRefetch = () => {
    refetch();
    toast.success("Data refreshed successfully");
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileIcon = (fileCategory) => {
    switch (fileCategory) {
      case "images":
        return <FaImage className="text-green-500" />;
      case "videos":
        return <FaVideo className="text-red-500" />;
      case "audio":
        return <FaVolumeUp className="text-purple-500" />;
      case "documents":
        return <FaFileAlt className="text-blue-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  const handleDownload = async (resource) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(`Downloading ${resource.title}...`);

      // Make request to download endpoint
      const response = await api.get(
        `/v1/study-resource/download/${resource._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob", // Important for file downloads
          timeout: 30000, // 30 second timeout for large files
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      // Create temporary link element
      const link = document.createElement("a");
      link.href = url;

      // Set filename from Content-Disposition header or use original filename
      const contentDisposition = response.headers["content-disposition"];
      let filename = resource.original_filename || resource.title;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      window.URL.revokeObjectURL(url);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`${resource.title} downloaded successfully`);

      // Optionally refresh data to update download count
      refetch();
    } catch (error) {
      console.error("Download error:", error);

      // Handle different error types
      let errorMessage = "Failed to download file";

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = "Download timeout - file may be too large";
      } else if (error.response?.status === 404) {
        errorMessage = "File not found";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required";
        // Redirect to login if unauthorized
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
        return;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    }
  };

  const filteredResources = data?.data || [];

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Study Resources
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "Guru" && (
            <Link
              to="/teachers/study-resources/new"
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Upload Resource
            </Link>
          )}
          <button
            onClick={handleManualRefetch}
            disabled={isLoading}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex gap-2">
          <select
            value={searchField}
            onChange={handleSearchFieldChange}
            className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-32"
          >
            <option value="title">Title</option>
            <option value="subject">Subject</option>
            <option value="description">Description</option>
          </select>
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search by ${searchField}...`}
              value={search}
              onChange={handleSearchChange}
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            />
          </div>
        </div>

        <select
          value={subject}
          onChange={(e) => handleFilterChange("subject", e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
        >
          <option value="">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Science">Science</option>
          <option value="English">English</option>
          <option value="Indonesian">Indonesian</option>
          <option value="History">History</option>
          <option value="Geography">Geography</option>
        </select>

        <select
          value={kelas}
          onChange={(e) => handleFilterChange("kelas", e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
            </option>
          ))}
        </select>

        <select
          value={fileCategory}
          onChange={(e) => handleFilterChange("fileCategory", e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
        >
          <option value="">All File Types</option>
          <option value="images">Images</option>
          <option value="documents">Documents</option>
          <option value="videos">Videos</option>
          <option value="audio">Audio</option>
        </select>
      </div>

      {/* Sort Controls */}
      <div className="mb-6 flex gap-2">
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
        >
          <option value="title">Sort by Title</option>
          <option value="subject">Sort by Subject</option>
          <option value="created_at">Sort by Upload Date</option>
          <option value="file_size">Sort by File Size</option>
          <option value="downloads_count">Sort by Downloads</option>
        </select>
        <select
          value={sortOrder}
          onChange={() => handleSortChange(sortBy)}
          className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base w-32"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array(5)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-sm sm:text-base">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load resources"}
          </span>
          <button
            onClick={handleManualRefetch}
            className="text-red-600 dark:text-red-300 hover:underline text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && filteredResources.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            No resources found
          </p>
          {user?.role === "Guru" && (
            <Link
              to="/teachers/study-resources/new"
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Upload your first resource
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => handleSortChange("title")}
                  >
                    <div className="flex items-center">
                      Title
                      {sortBy === "title" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">File Size</th>
                  <th className="px-4 py-3">Downloads</th>
                  <th className="px-4 py-3">Upload Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((resource) => (
                  <tr
                    key={resource._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getFileIcon(resource.file_category)}
                        <span className="ml-2 text-xs text-gray-500">
                          {resource.file_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {resource.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{resource.subject || "N/A"}</td>
                    <td className="px-4 py-3">
                      {resource.kelas?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {formatFileSize(resource.file_size)}
                    </td>
                    <td className="px-4 py-3">
                      {resource.downloads_count || 0}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(resource.created_at)}
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
                      <button
                        onClick={() => handleDownload(resource)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Download"
                        aria-label="Download resource"
                      >
                        <FaDownload className="h-5 w-5" />
                      </button>
                      <Link
                        to={`/teachers/study-resources/detail/${resource._id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                        aria-label="View resource details"
                      >
                        <FaEye className="h-5 w-5" />
                      </Link>
                      {user?.role === "Guru" &&
                        resource.uploaded_by?._id === user?._id && (
                          <>
                            <Link
                              to={`/teachers/study-resources/edit/${resource._id}`}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit"
                              aria-label="Edit resource"
                            >
                              <FaEdit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(resource)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                              aria-label="Delete resource"
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

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-4">
            {filteredResources.map((resource) => (
              <div
                key={resource._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getFileIcon(resource.file_category)}
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {resource.file_type}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="truncate">
                    <span className="font-semibold">Description:</span>{" "}
                    {resource.description || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Subject:</span>{" "}
                    {resource.subject || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Class:</span>{" "}
                    {resource.kelas?.name || "N/A"}
                  </p>
                  <div className="flex justify-between">
                    <p>
                      <span className="font-semibold">Size:</span>{" "}
                      {formatFileSize(resource.file_size)}
                    </p>
                    <p>
                      <span className="font-semibold">Downloads:</span>{" "}
                      {resource.downloads_count || 0}
                    </p>
                  </div>
                  <p>
                    <span className="font-semibold">Uploaded:</span>{" "}
                    {formatDate(resource.created_at)}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-3">
                  <button
                    onClick={() => handleDownload(resource)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    title="Download"
                    aria-label="Download resource"
                  >
                    <FaDownload className="h-5 w-5" />
                  </button>
                  <Link
                    to={`/teachers/study-resources/detail/${resource._id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View Details"
                    aria-label="View resource details"
                  >
                    <FaEye className="h-5 w-5" />
                  </Link>
                  {user?.role === "Guru" &&
                    resource.uploaded_by?._id === user?._id && (
                      <>
                        <Link
                          to={`/teachers/study-resources/edit/${resource._id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                          aria-label="Edit resource"
                        >
                          <FaEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(resource)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                          aria-label="Delete resource"
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
              Showing {filteredResources.length} of{" "}
              {data?.pagination?.total_items || 0} resources
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                onClick={() =>
                  handlePageChange(data?.pagination?.current_page - 1)
                }
                disabled={data?.pagination?.current_page <= 1 || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-gray-600 rounded-full"></div>
                )}
                Previous
              </button>

              <div className="flex items-center space-x-1 w-full sm:w-auto justify-center">
                {/* Page Numbers */}
                {Array.from(
                  { length: Math.min(5, data?.pagination?.total_pages || 1) },
                  (_, index) => {
                    const startPage = Math.max(
                      1,
                      (data?.pagination?.current_page || 1) - 2
                    );
                    const pageNumber = startPage + index;

                    if (pageNumber > (data?.pagination?.total_pages || 1))
                      return null;

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={isLoading}
                        className={`px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                          pageNumber === (data?.pagination?.current_page || 1)
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() =>
                  handlePageChange(data?.pagination?.current_page + 1)
                }
                disabled={
                  data?.pagination?.current_page >=
                    data?.pagination?.total_pages || isLoading
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto flex items-center justify-center"
              >
                {isLoading && (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-gray-600 rounded-full"></div>
                )}
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
          >
            {/* Close button */}
            <button
              onClick={cancelDelete}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <FaTimes className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Modal content */}
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                <FaTrash className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Resource
              </h3>

              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    "{resourceToDelete?.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="mt-6 w-full flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deleteMutation.isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyResourcesGuru;
