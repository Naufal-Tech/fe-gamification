import React, { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBook,
  FiCalendar,
  FiDownload,
  FiExternalLink,
  FiFile,
  FiHeart,
  FiImage,
  FiShare2,
  FiTag,
  FiUser,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const StudyResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore(); // Removed unused 'user'

  // State
  const [resource, setResource] = useState(null);
  const [relatedResources, setRelatedResources] = useState([]);
  const [uploaderOtherResources, setUploaderOtherResources] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [isFavorited, setIsFavorited] = useState(false);

  // Utility functions
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType, fileCategory) => {
    if (fileCategory === "images")
      return <FiImage className="h-8 w-8 text-blue-500" />;
    if (fileType === ".pdf") return <FiFile className="h-8 w-8 text-red-500" />;
    return <FiFile className="h-8 w-8 text-gray-500" />;
  };

  const getFileCategoryColor = (category) => {
    switch (category) {
      case "pdf":
        return "bg-red-100 text-red-800 border-red-200";
      case "images":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "videos":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "documents":
        return "bg-green-100 text-green-800 border-green-200";
      case "presentations":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Fetch resource detail
  const fetchResourceDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/study-resource/detail/${id}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.data?.data) {
        const { resource, related_resources, uploader_other_resources, meta } =
          response.data.data;
        setResource(resource);
        setRelatedResources(related_resources || []);
        setUploaderOtherResources(uploader_other_resources || []);
        setMeta(meta || {});
        setIsFavorited(resource.is_favorited_by_user || false);
      } else {
        toast.error("Failed to fetch resource details");
      }
    } catch (error) {
      console.error("Fetch resource detail error:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch resource details"
      );
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  // Handle resource download
  const handleDownload = async (resourceId, filename) => {
    try {
      setDownloadingIds((prev) => new Set([...prev, resourceId]));

      const response = await api.get(`/api/resources/${resourceId}/download`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

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

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!meta.can_favorite) {
      toast.error("You cannot favorite this resource");
      return;
    }

    try {
      const response = await api.post(
        `/v1/study-resource/${resource.id}/favorite`,
        {},
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );

      if (response.data.success) {
        setIsFavorited(!isFavorited);
        setResource((prev) => ({
          ...prev,
          favorites_count: isFavorited
            ? prev.favorites_count - 1
            : prev.favorites_count + 1,
        }));
        toast.success(
          isFavorited ? "Removed from favorites" : "Added to favorites"
        );
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
      toast.error(error.response?.data?.message || "Failed to toggle favorite");
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      await navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href,
      });
    } catch {
      // Fallback to clipboard - removed unused 'error' parameter
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      } catch {
        // Removed unused 'clipboardError' parameter
        toast.error("Failed to share resource");
      }
    }
  };

  // Navigate to resource detail
  const navigateToResource = (resourceId) => {
    navigate(`/study-resources/${resourceId}`);
  };

  // Effects
  useEffect(() => {
    if (id) {
      fetchResourceDetail();
    }
  }, [fetchResourceDetail, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Resource not found
          </h3>
          <p className="text-gray-500 mb-4">
            The resource you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/study-resources")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Resources
          </button>
        </div>
      </div>
    );
  }

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

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/study-resources")}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Resource Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Resource Header */}
              <div className="flex items-start gap-6 mb-8">
                <div className="flex-shrink-0">
                  {getFileIcon(resource.file_type, resource.file_category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getFileCategoryColor(
                        resource.file_category
                      )}`}
                    >
                      {resource.file_category_display ||
                        resource.file_category.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {resource.file_size_formatted}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {resource.title}
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    {resource.description}
                  </p>
                </div>
              </div>

              {/* Resource Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <FiBook className="h-5 w-5 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Subject</span>
                      <p className="font-medium">{resource.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiUser className="h-5 w-5 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Uploaded by</span>
                      <p className="font-medium">
                        {resource.uploaded_by?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{resource.uploaded_by?.username}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <FiCalendar className="h-5 w-5 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Upload Date</span>
                      <p className="font-medium">
                        {resource.upload_date_formatted ||
                          formatDate(resource.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiBook className="h-5 w-5 mr-3" />
                    <div>
                      <span className="text-sm text-gray-500">Class</span>
                      <p className="font-medium">{resource.kelas?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="flex items-center justify-center text-indigo-600 mb-2">
                    <FiDownload className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {resource.download_count}
                  </div>
                  <div className="text-sm text-gray-600">Downloads</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="flex items-center justify-center text-red-500 mb-2">
                    <FiHeart className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {resource.favorites_count}
                  </div>
                  <div className="text-sm text-gray-600">Favorites</div>
                </div>
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiTag className="mr-2 h-5 w-5" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full border border-indigo-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* File Details */}
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  File Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Original Filename:</span>
                    <p className="mt-1">{resource.original_filename}</p>
                  </div>
                  <div>
                    <span className="font-medium">File Type:</span>
                    <p className="mt-1">{resource.file_type}</p>
                  </div>
                  <div>
                    <span className="font-medium">File Size:</span>
                    <p className="mt-1">{resource.file_size_formatted}</p>
                  </div>
                  <div>
                    <span className="font-medium">Storage Type:</span>
                    <p className="mt-1 capitalize">{resource.storage_type}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                {meta.can_download && (
                  <button
                    onClick={() =>
                      handleDownload(resource.id, resource.original_filename)
                    }
                    disabled={downloadingIds.has(resource.id)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingIds.has(resource.id) ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FiDownload className="mr-2 h-5 w-5" />
                    )}
                    {downloadingIds.has(resource.id)
                      ? "Downloading..."
                      : "Download File"}
                  </button>
                )}

                {meta.can_favorite && (
                  <button
                    onClick={handleFavoriteToggle}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                      isFavorited
                        ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FiHeart
                      className={`mr-2 h-5 w-5 ${
                        isFavorited ? "fill-current" : ""
                      }`}
                    />
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiShare2 className="mr-2 h-5 w-5" />
                  Share Resource
                </button>
              </div>
            </div>

            {/* Related Resources */}
            {relatedResources.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Related Resources
                </h3>
                <div className="space-y-3">
                  {relatedResources.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToResource(item.id)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getFileIcon(item.file_type, item.file_category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {item.file_size_formatted}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {item.subject}
                          </span>
                        </div>
                      </div>
                      <FiExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Resources by Uploader */}
            {uploaderOtherResources.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  More from {resource.uploaded_by?.fullName}
                </h3>
                <div className="space-y-3">
                  {uploaderOtherResources.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToResource(item.id)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getFileIcon(item.file_type, item.file_category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {item.file_size_formatted}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {item.subject}
                          </span>
                        </div>
                      </div>
                      <FiExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyResourceDetail;
