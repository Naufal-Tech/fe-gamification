import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaFileAlt, FaTimes, FaUpload } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function StudyResourceUpload() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    kelas: "",
    storage_type: "cloudinary",
    tags: "",
    file: null,
  });

  const [errors, setErrors] = useState({});

  // Predefined subjects
  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "Indonesian",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Economics",
    "Sociology",
  ];

  // File type validation
  const supportedTypes = {
    images: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
    documents: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".rtf"],
    videos: [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"],
    audio: [".mp3", ".wav", ".flac", ".aac", ".ogg"],
  };

  const allSupportedExtensions = Object.values(supportedTypes).flat();

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/v1/kelas", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        // Fix: Use response.data.kelas instead of response.data.data
        setClasses(response.data.kelas || []);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        toast.error("Failed to load classes");
      }
    };
    fetchClasses();
  }, [accessToken]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.file) {
      newErrors.file = "Please select a file to upload";
    } else {
      const fileExtension =
        "." + formData.file.name.split(".").pop().toLowerCase();
      if (!allSupportedExtensions.includes(fileExtension)) {
        newErrors.file = `Unsupported file type. Supported types: ${allSupportedExtensions.join(
          ", "
        )}`;
      }
    }

    if (!formData.storage_type) {
      newErrors.storage_type = "Storage type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle file selection
  const handleFileChange = (file) => {
    if (file) {
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      if (!allSupportedExtensions.includes(fileExtension)) {
        toast.error(`Unsupported file type: ${fileExtension}`);
        return;
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        file: file,
      }));

      // Clear file error
      if (errors.file) {
        setErrors((prev) => ({
          ...prev,
          file: "",
        }));
      }
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setFormData((prev) => ({
      ...prev,
      file: null,
    }));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file category based on extension
  const getFileCategory = (filename) => {
    const extension = "." + filename.split(".").pop().toLowerCase();
    for (const [category, extensions] of Object.entries(supportedTypes)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }
    return "others";
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (uploadData) => {
      const formDataToSend = new FormData();

      // Append form fields
      formDataToSend.append("title", uploadData.title);
      formDataToSend.append("description", uploadData.description);
      formDataToSend.append("subject", uploadData.subject);
      formDataToSend.append("kelas", uploadData.kelas);
      formDataToSend.append("storage_type", uploadData.storage_type);
      // Send tags as JSON string - this is the key fix!
      formDataToSend.append("tags", JSON.stringify(uploadData.tags));
      formDataToSend.append("file", uploadData.file);

      const response = await api.post(
        "/v1/study-resource/upload",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // You can use this to show upload progress
            console.log("Upload progress:", percentCompleted + "%");
          },
        }
      );

      return response.data;
    },
    // Fix: Remove unused 'data' parameter or use it if needed
    onSuccess: () => {
      toast.success("Study resource uploaded successfully!");
      navigate("/teachers/resources");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to upload resource";
      toast.error(errorMessage);
    },
  });

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    // Process tags into array
    const processedTags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Prepare upload data
    const uploadData = {
      ...formData,
      tags: processedTags, // Keep as array for the mutation function
    };

    uploadMutation.mutate(uploadData);
  };

  // Check if user is authorized
  if (!user || user.role !== "Guru") {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400">
          Access denied. Only teachers can upload study resources.
        </p>
        <Link
          to="/teachers/resources"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to Study Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/teachers/resources"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Upload Study Resource
          </h1>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-gray-200 ${
                errors.title
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter resource title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200"
              placeholder="Enter resource description"
            />
          </div>

          {/* Subject and Class Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label
                htmlFor="kelas"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Class
              </label>
              <select
                id="kelas"
                name="kelas"
                value={formData.kelas}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Storage Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Storage Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="storage_type"
                  value="cloudinary"
                  checked={formData.storage_type === "cloudinary"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Cloudinary (Recommended)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="storage_type"
                  value="server"
                  checked={formData.storage_type === "server"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Server Storage
              </label>
            </div>
            {errors.storage_type && (
              <p className="mt-1 text-sm text-red-500">{errors.storage_type}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200"
              placeholder="Enter tags separated by commas (e.g., algebra, math, worksheet)"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Separate multiple tags with commas
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File <span className="text-red-500">*</span>
            </label>

            {!formData.file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : errors.file
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag and drop your file here, or{" "}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      accept={allSupportedExtensions.join(",")}
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: Images, Documents, Videos, Audio
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum file size: 50MB
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaFileAlt className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formData.file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(formData.file.size)} •{" "}
                        {getFileCategory(formData.file.name)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {errors.file && (
              <p className="mt-1 text-sm text-red-500">{errors.file}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={uploadMutation.isLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploadMutation.isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Upload Resource
                </>
              )}
            </button>
            <Link
              to="/teachers/resources"
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-6 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudyResourceUpload;
