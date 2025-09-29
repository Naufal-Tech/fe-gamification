/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendar,
  FaDownload,
  FaEdit,
  FaEye,
  FaFile,
  FaFileAlt,
  FaFolderOpen,
  FaHeart,
  FaImage,
  FaShare,
  FaSync,
  FaTag,
  FaTrash,
  FaUser,
  FaVideo,
  FaVolumeUp,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function StudyResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch resource details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["studyResourceDetail", id],
    queryFn: async () => {
      const response = await api.get(`/v1/study-resource/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      } else if (err.response?.status === 404) {
        toast.error("Resource not found");
        navigate("/teachers/resources");
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/v1/study-resource/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      toast.success("Resource deleted successfully");
      navigate("/teachers/study-resources");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to delete resource");
    },
  });

  const handleDownload = async () => {
    try {
      const loadingToast = toast.loading(
        `Downloading ${data?.data?.resource?.title}...`
      );

      const response = await api.get(`/v1/study-resource/download/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: "blob",
        timeout: 30000,
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename =
        data?.data?.resource?.original_filename || data?.data?.resource?.title;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(`${data?.data?.resource?.title} downloaded successfully`);
      refetch();
    } catch (error) {
      console.error("Download error:", error);
      let errorMessage = "Failed to download file";

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = "Download timeout - file may be too large";
      } else if (error.response?.status === 404) {
        errorMessage = "File not found";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required";
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
        return;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this resource: ${data?.data?.resource?.title}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.data?.resource?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          fallbackShare(shareUrl);
        }
      }
    } else {
      fallbackShare(shareUrl);
    }
  };

  const fallbackShare = (url) => {
    navigator.clipboard.writeText(url).then(
      () => {
        toast.success("Link copied to clipboard!");
      },
      () => {
        toast.error("Failed to copy link");
      }
    );
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

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setIsDeleteModalOpen(false);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg">
          <p className="mb-2">
            {error.response?.data?.error ||
              error.message ||
              "Failed to load resource"}
          </p>
          <button
            onClick={refetch}
            className="text-red-600 dark:text-red-300 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const resource = data?.data?.resource;
  const relatedResources = data?.data?.related_resources || [];
  const uploaderResources = data?.data?.uploader_other_resources || [];
  const meta = data?.data?.meta || {};

  if (!resource) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Resource not found</p>
          <Link
            to="/teachers/resources"
            className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-800"
          >
            <FaArrowLeft className="mr-2" />
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  const canEdit =
    user?.role === "Guru" && resource.uploaded_by?._id === user?._id;
  const canDelete =
    user?.role === "Guru" && resource.uploaded_by?._id === user?._id;

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/teachers/resources"
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Resource Details
          </h1>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
        >
          <FaSync
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getFileIcon(resource.file_category)}
                <div className="ml-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {resource.title}
                  </h2>
                  <p className="text-sm text-gray-500">{resource.file_type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="text-blue-500 hover:text-blue-700"
                  title="Share"
                >
                  <FaShare className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {resource.description || "No description available"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaTag className="mr-2 h-4 w-4" />
                  <span className="font-medium mr-2">Subject:</span>
                  <span>{resource.subject || "N/A"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaFolderOpen className="mr-2 h-4 w-4" />
                  <span className="font-medium mr-2">Class:</span>
                  <span>{resource.kelas?.name || "N/A"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaFile className="mr-2 h-4 w-4" />
                  <span className="font-medium mr-2">File Size:</span>
                  <span>{resource.file_size_formatted}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaDownload className="mr-2 h-4 w-4" />
                  <span className="font-medium mr-2">Downloads:</span>
                  <span>{resource.downloads_count || 0}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaHeart className="mr-2 h-4 w-4" />
                  <span className="font-medium mr-2">Favorites:</span>
                  <span>{resource.favorites_count || 0}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaCalendar className="mr-2 h-4 w-4" />
                  <span className="font-medium mr-2">Uploaded:</span>
                  <span>
                    {resource.upload_date_formatted ||
                      formatDate(resource.created_at)}
                  </span>
                </div>
              </div>

              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {meta.can_download && (
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200"
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Download
                </button>
              )}
              {canEdit && (
                <Link
                  to={`/teachers/study-resources/edit/${resource.id}`}
                  className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  <FaEdit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200"
                >
                  <FaTrash className="mr-2 h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Uploader Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Uploaded By
            </h3>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <FaUser className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {resource.uploaded_by?.fullName ||
                    resource.uploaded_by?.username ||
                    "Unknown"}
                </p>
                <p className="text-sm text-gray-500">
                  @{resource.uploaded_by?.username || "unknown"}
                </p>
                {resource.uploaded_by?.email && (
                  <p className="text-sm text-gray-500">
                    {resource.uploaded_by.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Resources */}
          {relatedResources.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Related Resources
              </h3>
              <div className="space-y-3">
                {relatedResources.slice(0, 5).map((relatedResource) => (
                  <Link
                    key={relatedResource.id}
                    to={`/teachers/study-resources/detail/${relatedResource.id}`}
                    className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      {getFileIcon(relatedResource.file_category)}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {relatedResource.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {relatedResource.subject} •{" "}
                          {relatedResource.file_size_formatted}
                        </p>
                      </div>
                      <FaEye className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* More from Uploader */}
          {uploaderResources.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                More from{" "}
                {resource.uploaded_by?.fullName ||
                  resource.uploaded_by?.username}
              </h3>
              <div className="space-y-3">
                {uploaderResources.slice(0, 5).map((uploaderResource) => (
                  <Link
                    key={uploaderResource.id}
                    to={`/teachers/study-resources/detail/${uploaderResource.id}`}
                    className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      {getFileIcon(uploaderResource.file_category)}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {uploaderResource.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {uploaderResource.subject} •{" "}
                          {uploaderResource.file_size_formatted}
                        </p>
                      </div>
                      <FaEye className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Deletion
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the resource{" "}
              <span className="font-medium">"{resource.title}"</span>? This
              action cannot be undone.
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
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center"
              >
                {deleteMutation.isLoading && (
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyResourceDetail;
