/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { FaCalendar, FaLink, FaSave, FaTag, FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const AdminAnnouncementEdit = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const { id } = useParams();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    category: "general",
    targetAudience: "all",
    startDate: null,
    endDate: null,
    tags: [],
    external_links: [],
    storage_type: "server",
    file_attachments: [],
  });
  const [newTag, setNewTag] = useState("");
  const [newLink, setNewLink] = useState({ name: "", url: "" });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch announcement data
  const {
    data: announcement,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () => {
      const response = await api.get(`/v1/announcements/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    },
  });

  // Populate form with fetched data
  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        priority: announcement.priority || "medium",
        category: announcement.category || "general",
        targetAudience: announcement.targetAudience || "all",
        startDate: announcement.startDate
          ? new Date(announcement.startDate)
          : null,
        endDate: announcement.endDate ? new Date(announcement.endDate) : null,
        tags: announcement.tags || [],
        external_links: announcement.external_links || [],
        storage_type: announcement.storage_type || "server",
        file_attachments: announcement.file_attachments || [],
      });
    }
  }, [announcement]);

  // Mutation for updating announcement
  const updateMutation = useMutation({
    mutationFn: (announcementData) =>
      api.put(`/v1/announcements/${id}`, announcementData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: () => {
      toast.success("Announcement updated successfully");
      queryClient.invalidateQueries(["announcements"]);
      queryClient.invalidateQueries(["announcement", id]);
      navigate("/admin/announcements");
    },
    onError: (error) => {
      console.error("Update Error:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update announcement";
      toast.error(errorMessage);
    },
  });

  // Mutation for deleting file attachment
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId) =>
      api.delete(`/v1/announcements/${id}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onSuccess: () => {
      toast.success("Attachment deleted successfully");
      queryClient.invalidateQueries(["announcement", id]);
    },
    onError: (error) => {
      console.error(
        "Delete Attachment Error:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to delete attachment";
      toast.error(errorMessage);
    },
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Add a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (formData.storage_type === "cloudinary") {
      const invalidFiles = selectedFiles.filter(
        (file) => !file.type.includes("pdf")
      );
      if (invalidFiles.length > 0) {
        setErrors((prev) => ({
          ...prev,
          files: "Only PDF files are allowed for Cloudinary upload",
        }));
        return;
      }
    }
    setFiles(selectedFiles);
    setErrors((prev) => ({ ...prev, files: "" }));
  };

  // Remove a new file
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Delete an existing attachment
  const handleDeleteAttachment = (attachmentId) => {
    deleteAttachmentMutation.mutate(attachmentId);
  };

  // Add an external link
  const handleAddLink = () => {
    if (newLink.name.trim() && newLink.url.trim()) {
      try {
        new URL(newLink.url); // Validate URL format
        setFormData((prev) => ({
          ...prev,
          external_links: [...prev.external_links, { ...newLink }],
        }));
        setNewLink({ name: "", url: "" });
        setErrors((prev) => ({ ...prev, external_links: "" }));
      } catch {
        setErrors((prev) => ({
          ...prev,
          external_links: "Invalid URL format",
        }));
      }
    }
  };

  // Remove an external link
  const handleRemoveLink = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      external_links: prev.external_links.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  // Format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.content.trim()) newErrors.content = "Content is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date cannot be earlier than start date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the form errors");
      return;
    }

    // Prepare FormData for multipart request
    const announcementData = new FormData();
    if (formData.title) announcementData.append("title", formData.title.trim());
    if (formData.content)
      announcementData.append("content", formData.content.trim());
    if (formData.priority)
      announcementData.append("priority", formData.priority);
    if (formData.category)
      announcementData.append("category", formData.category);
    if (formData.targetAudience)
      announcementData.append("targetAudience", formData.targetAudience);
    announcementData.append("storage_type", formData.storage_type);
    if (formData.startDate) {
      announcementData.append(
        "startDate",
        formatDateToDDMMYYYY(formData.startDate)
      );
    }
    if (formData.endDate) {
      announcementData.append(
        "endDate",
        formatDateToDDMMYYYY(formData.endDate)
      );
    }
    formData.tags.forEach((tag) => announcementData.append("tags[]", tag));
    formData.external_links.forEach((link, index) => {
      announcementData.append(`external_links[${index}][name]`, link.name);
      announcementData.append(`external_links[${index}][url]`, link.url);
    });
    files.forEach((file) => announcementData.append("files", file));

    updateMutation.mutate(announcementData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-t-2 border-indigo-600 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-red-600 dark:text-red-400">
          Failed to load announcement: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Update Announcement
            </h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/admin/announcements")}
              className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 text-sm sm:text-base"
            >
              <FaTimes className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isLoading}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
            >
              {updateMutation.isLoading ? (
                <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
              ) : (
                <FaSave className="mr-2 h-4 w-4" />
              )}
              Update Announcement
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6"
        >
          {/* Title */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className={`w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.title ? "border-red-500" : ""
              }`}
              placeholder="Enter announcement title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Content */}
          <div className="mb-6">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Content*
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={8}
              className={`w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.content ? "border-red-500" : ""
              }`}
              placeholder="Write your announcement content here..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* Priority, Category, and Storage Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Priority*
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
                <option value="maintenance">Maintenance</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="storage_type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Storage Type*
              </label>
              <select
                id="storage_type"
                name="storage_type"
                value={formData.storage_type}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="server">Server</option>
                <option value="cloudinary">Cloudinary</option>
              </select>
            </div>
          </div>

          {/* Target Audience */}
          <div className="mb-6">
            <label
              htmlFor="targetAudience"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Target Audience*
            </label>
            <select
              id="targetAudience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              required
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Everyone</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
              <option value="parents">Parents Only</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date*
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => handleDateChange("startDate", date)}
                  required
                  className={`w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.startDate ? "border-red-500" : ""
                  }`}
                  dateFormat="dd/MM/yyyy"
                />
                <FaCalendar className="absolute right-3 top-3.5 text-gray-400" />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date (Optional)
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => handleDateChange("endDate", date)}
                  minDate={formData.startDate}
                  className={`w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.endDate ? "border-red-500" : ""
                  }`}
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  placeholderText="No end date"
                />
                <FaCalendar className="absolute right-3 top-3.5 text-gray-400" />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 p-2 border rounded-l-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-indigo-600 text-white px-4 rounded-r-lg hover:bg-indigo-700 transition-colors"
              >
                <FaTag className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Existing File Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Existing File Attachments
            </label>
            {formData.file_attachments.length > 0 ? (
              <div className="space-y-2 mb-3">
                {formData.file_attachments.map((attachment, index) => (
                  <div
                    key={attachment._id || index}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="truncate text-sm text-gray-700 dark:text-gray-300">
                      {attachment.file_name} ({attachment.storage_type})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment._id)}
                      disabled={deleteAttachmentMutation.isLoading}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No existing attachments
              </p>
            )}
          </div>

          {/* New File Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add New File Attachments
            </label>
            {files.length > 0 && (
              <div className="space-y-2 mb-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="truncate text-sm text-gray-700 dark:text-gray-300">
                      {file.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              accept={formData.storage_type === "cloudinary" ? ".pdf" : "*"}
              onChange={handleFileChange}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.files && (
              <p className="mt-1 text-sm text-red-600">{errors.files}</p>
            )}
            {formData.storage_type === "cloudinary" && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Only PDF files are allowed for Cloudinary upload
              </p>
            )}
          </div>

          {/* External Links */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              External Links
            </label>
            {formData.external_links.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.external_links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="truncate text-sm text-gray-700 dark:text-gray-300">
                      {link.name}: {link.url}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                value={newLink.name}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, name: e.target.value }))
                }
                className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Link name (e.g., Status Page)"
              />
              <input
                type="url"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, url: e.target.value }))
                }
                className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter link URL"
              />
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FaLink className="mr-2 h-4 w-4" />
              Add Link
            </button>
            {errors.external_links && (
              <p className="mt-1 text-sm text-red-600">
                {errors.external_links}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/admin/announcements")}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {updateMutation.isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-2">↻</span>
                  Updating...
                </>
              ) : (
                "Update Announcement"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAnnouncementEdit;
