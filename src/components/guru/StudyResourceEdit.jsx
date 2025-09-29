import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaDownload,
  FaEye,
  FaFile,
  FaFileAlt,
  FaImage,
  FaPlus,
  FaSave,
  FaSpinner,
  FaTag,
  FaTimes,
  FaUpload,
  FaVideo,
  FaVolumeUp,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function StudyResourceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    kelas: "",
    tags: [],
    storage_type: "server", // Default storage type
  });
  const [tagInput, setTagInput] = useState("");
  const [isFormChanged, setIsFormChanged] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const response = await api.get("/v1/kelas", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
  });

  // Fetch resource details
  const {
    data: resourceData,
    isLoading: isLoadingResource,
    error: resourceError,
  } = useQuery({
    queryKey: ["studyResourceDetail", id],
    queryFn: async () => {
      const response = await api.get(`/v1/study-resource/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    },
  });

  // Effect to populate form data when resource data is loaded
  useEffect(() => {
    if (resourceData?.data?.resource) {
      const resource = resourceData.data.resource;

      // Ensure tags is always an array
      let resourceTags = resource.tags || [];
      if (typeof resourceTags === "string") {
        try {
          resourceTags = JSON.parse(resourceTags);
        } catch (error) {
          console.error("Error parsing resource tags:", error);
          resourceTags = [];
        }
      }
      if (!Array.isArray(resourceTags)) {
        resourceTags = [];
      }

      setFormData({
        title: resource.title || "",
        description: resource.description || "",
        subject: resource.subject || "",
        kelas: resource.kelas?._id || resource.kelas?.id || "",
        tags: resource.tags || [],
        storage_type: resource.storage_type || "server",
      });
    }
  }, [resourceData]);

  // Handle error cases
  useEffect(() => {
    if (resourceError) {
      console.error(
        "Fetch Error:",
        resourceError.response?.data || resourceError.message
      );
      if (resourceError.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      } else if (resourceError.response?.status === 404) {
        toast.error("Resource not found");
        navigate("/teachers/study-resources");
      }
    }
  }, [resourceError, navigate]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData) => {
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("title", updateData.title);
      formDataToSend.append("description", updateData.description);
      formDataToSend.append("subject", updateData.subject);
      formDataToSend.append("kelas", updateData.kelas);
      formDataToSend.append("storage_type", updateData.storage_type);
      formDataToSend.append("tags", JSON.stringify(updateData.tags));

      // Append file if selected
      if (updateData.file) {
        formDataToSend.append("file", updateData.file);
      }

      const response = await api.put(
        `/v1/study-resource/${id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Resource updated successfully");
      queryClient.invalidateQueries(["studyResourceDetail", id]);
      queryClient.invalidateQueries(["studyResources"]);
      setIsFormChanged(false);
      setSelectedFile(null);
      setFilePreview(null);
      navigate(`/teachers/study-resources/detail/${id}`);
    },
    onError: (err) => {
      console.error("Update Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to update resource");
    },
  });

  const resource = resourceData?.data?.resource;
  const classes = classesData?.kelas || [];

  // Check if user can edit this resource
  const canEdit = React.useMemo(() => {
    if (!resource || !user) return false;
    return (
      resource.uploaded_by?._id === user._id ||
      resource.created_by?._id === user._id
    );
  }, [resource, user]);

  useEffect(() => {
    if (resource && user && !canEdit) {
      toast.error("You don't have permission to edit this resource");
      navigate("/teachers/study-resources");
    }
  }, [resource, user, canEdit, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsFormChanged(true);
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      setTagInput("");
      setIsFormChanged(true);
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
    setIsFormChanged(true);
  };

  // File handling functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsFormChanged(true);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setIsFormChanged(true);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setIsFormChanged(true);
    // Reset file input
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!formData.kelas) {
      toast.error("Class is required");
      return;
    }

    updateMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      subject: formData.subject.trim(),
      kelas: formData.kelas,
      tags: formData.tags,
      storage_type: formData.storage_type,
      file: selectedFile,
    });
  };

  const handleCancel = () => {
    if (isFormChanged) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        navigate(`/teachers/study-resources/detail/${id}`);
      }
    } else {
      navigate(`/teachers/study-resources/detail/${id}`);
    }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoadingResource) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading resource...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (resourceError) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {resourceError.response?.data?.error || "Failed to load resource"}
            </p>
            <Link
              to="/teachers/study-resources"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Back to Resources
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Resource not found
            </p>
            <Link
              to="/teachers/study-resources"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Back to Resources
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/teachers/study-resources/detail/${id}`}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Resource
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/teachers/study-resources/detail/${id}`}
            className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaEye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current File Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Current File
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  {getFileIcon(resource.file_category)}
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {resource.file_type}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Original Filename
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.original_filename}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    File Size
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.file_size_formatted}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {resource.file_category_display || resource.file_category}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Storage Type
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {resource.storage_type}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Downloads
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.downloads_count || resource.download_count || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploaded
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(resource.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploaded by
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.uploaded_by?.fullName ||
                      resource.uploaded_by?.username}
                  </p>
                </div>
              </div>

              {/* Download current file */}
              <a
                href={resource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaDownload className="mr-2 h-4 w-4" />
                Download Current File
              </a>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Edit Resource Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter resource title"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Indonesian">Indonesian</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                  <option value="Physical Education">Physical Education</option>
                </select>
                {/* Add custom subject option if not in predefined list */}
                {formData.subject &&
                  ![
                    "Mathematics",
                    "Science",
                    "English",
                    "Indonesian",
                    "History",
                    "Geography",
                    "Physics",
                    "Chemistry",
                    "Biology",
                    "Art",
                    "Music",
                    "Physical Education",
                  ].includes(formData.subject) && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Current subject: {formData.subject}
                    </p>
                  )}
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class *
                </label>
                <select
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Type *
                </label>
                <select
                  name="storage_type"
                  value={formData.storage_type}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="server">Server Storage</option>
                  <option value="cloudinary">Cloudinary Storage</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose where to store the file
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter resource description"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Replace File (Optional)
                </label>

                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop a file here, or click to select
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.mp3,.wav,.flac,.aac,.ogg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("file-input").click()
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Supported: Images, Documents, Videos, Audio files
                  </p>
                </div>

                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaFile className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTimes className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Image Preview */}
                    {filePreview && (
                      <div className="mt-3">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-w-full h-32 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags - Improved Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>

                {/* Tags Display */}
                <div className="min-h-[2.5rem] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-3">
                  {formData.tags.length === 0 ? (
                    <div className="flex items-center text-gray-400 dark:text-gray-500">
                      <FaTag className="mr-2 h-4 w-4" />
                      <span className="text-sm">No tags added yet</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <FaTag className="mr-1.5 h-3 w-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 p-0.5 rounded-full hover:bg-blue-300 dark:hover:bg-blue-700 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tag Input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyPress={handleTagKeyPress}
                      className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Add a tag (press Enter or comma)"
                    />
                    <FaTag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <FaPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tags help categorize and search for resources
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={updateMutation.isLoading || !isFormChanged}
                  className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateMutation.isLoading}
                  className="flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyResourceEdit;
