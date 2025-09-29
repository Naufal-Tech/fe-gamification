/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationCircle,
  FaEye,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaGraduationCap,
  FaPaperclip,
  FaSave,
  FaTimes,
  FaTimesCircle,
  FaUpload,
  FaUser,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function TugasSubmit() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();
  const [tugasData, setTugasData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userSubmission, setUserSubmission] = useState(null);
  const [editingScore, setEditingScore] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [tempScore, setTempScore] = useState("");
  const [tempFeedback, setTempFeedback] = useState("");
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);

  // Fetch tugas details and submissions
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tugas details
      const tugasResponse = await api.get(`/v1/tugas/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setTugasData(tugasResponse.data.data);

      // Fetch submissions
      const submissionsResponse = await api.get(
        `/v1/tugas/preview?tugasId=${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const submissionsData = submissionsResponse.data.data;
      setSubmissions(submissionsData);

      // Find user's submission if exists
      const userSub = submissionsData.find(
        (sub) =>
          sub.submitter.id === user.id || sub.submitter.email === user.email
      );

      setUserSubmission(userSub || null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load assignment data"
      );
      toast.error("Failed to load assignment data");

      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, accessToken]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "File type not supported. Please upload JPG, PNG, PDF, DOC, TXT, or PPT files."
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("tugasId", id);

      await api.post("/v1/tugas/submit", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("File submitted successfully!");
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById("file-upload");
      if (fileInput) fileInput.value = "";
      // Refresh data to show the new submission
      fetchData();
    } catch (err) {
      console.error("Error submitting file:", err);
      toast.error(err.response?.data?.message || "Failed to submit file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    if (!tempScore || tempScore < 0 || tempScore > 100) {
      toast.error("Please enter a valid score (0-100)");
      return;
    }

    setIsUpdatingGrade(true);
    try {
      await api.put(
        `/v1/tugas/grade/${submissionId}`,
        {
          score: parseInt(tempScore),
          feedback: tempFeedback.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success("Grade updated successfully!");
      setEditingScore(null);
      setEditingFeedback(null);
      setTempScore("");
      setTempFeedback("");
      fetchData();
    } catch (err) {
      console.error("Error updating grade:", err);
      toast.error(err.response?.data?.message || "Failed to update grade");
    } finally {
      setIsUpdatingGrade(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(Number(dateString));
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Get file type icon
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return <FaPaperclip className="text-gray-400" />;

    const extension = fileUrl.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return <FaFilePdf className="text-red-500" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FaFileImage className="text-green-500" />;
      case "ppt":
      case "pptx":
        return <FaFileAlt className="text-orange-500" />;
      case "txt":
        return <FaFileAlt className="text-gray-500" />;
      default:
        return <FaPaperclip className="text-gray-400" />;
    }
  };

  // Get file size from name or return default
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Check if assignment is expired
  const isExpired =
    tugasData?.due_date && new Date(Number(tugasData.due_date)) < new Date();

  // Open file in new tab
  const openFile = (url) => {
    window.open(url, "_blank");
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "graded":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "late":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-t-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading assignment data...
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <FaExclamationCircle className="text-red-500 text-4xl mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Siswa Belum Menyelesaikan Tugas
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <div className="flex space-x-4">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            Try Again
          </button>
          <Link
            to="/teachers/assignments"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
          >
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link
          to="/teachers/assignments"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Assignments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tugasData?.title || "Assignment Details"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tugasData?.description || "No description provided"}
            </p>
          </div>
          {isExpired && (
            <div className="mt-2 sm:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                <FaClock className="mr-1" />
                Expired
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Details Card - Enhanced */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <FaFileAlt className="mr-2 text-indigo-600" />
              Assignment Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <FaGraduationCap className="text-gray-400 mr-3 w-4 h-4" />
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Class:</span>{" "}
                  {tugasData?.kelas?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center">
                <FaUser className="text-gray-400 mr-3 w-4 h-4" />
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Creator:</span>{" "}
                  {tugasData?.created_by?.fullName || "N/A"}
                </span>
              </div>
              <div className="flex items-center">
                <FaCalendarAlt className="text-gray-400 mr-3 w-4 h-4" />
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Due Date:</span>{" "}
                  <span
                    className={
                      isExpired ? "text-red-600 dark:text-red-400" : ""
                    }
                  >
                    {formatDate(tugasData?.due_date)}
                  </span>
                </span>
              </div>
              <div className="flex items-center">
                <FaUpload className="text-gray-400 mr-3 w-4 h-4" />
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Submission Type:</span>{" "}
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full">
                    File Upload
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* File Upload Instructions */}
          {tugasData?.fileUploadInstructions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Upload Instructions
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  {tugasData.fileUploadInstructions}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student File Upload Section */}
      {user?.role === "Siswa" && tugasData?.requiresFileUpload && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <FaUpload className="mr-2 text-indigo-600" />
            Submit Your Work
          </h2>

          {userSubmission ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaCheckCircle className="text-green-600 mr-2" />
                  <span className="font-medium text-green-800 dark:text-green-300">
                    Submission Completed
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-400 text-sm">
                  Submitted on: {userSubmission.submittedAt}
                </p>
                {userSubmission.score !== null && (
                  <p className="text-green-700 dark:text-green-400 text-sm">
                    Score: {userSubmission.score}/100
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => openFile(userSubmission.fileTugas)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FaEye className="mr-2" />
                  View Submission
                </button>
                <a
                  href={userSubmission.fileTugas}
                  download
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaDownload className="mr-2" />
                  Download
                </a>
              </div>
            </div>
          ) : isExpired ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <FaTimesCircle className="text-red-600 mr-2" />
                <span className="font-medium text-red-800 dark:text-red-300">
                  Assignment Expired
                </span>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                The deadline for this assignment has passed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select File to Upload
                </label>
                <div className="relative">
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.ppt,.pptx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                  >
                    <div className="text-center">
                      <FaUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PDF, DOC, JPG, PNG up to 10MB
                      </p>
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      {getFileIcon(selectedFile.name)}
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Submit Assignment
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Class Submissions Section - Enhanced */}
      {(user?.role === "Guru" || user?.role === "Admin") && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <FaUser className="mr-2 text-indigo-600" />
              All Submissions ({submissions.length})
            </h2>
            <div className="mt-2 sm:mt-0 text-sm text-gray-500 dark:text-gray-400">
              {submissions.filter((s) => s.status === "graded").length} graded
              of {submissions.length} total
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No submissions yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Students haven't submitted their work for this assignment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      Student
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      Submitted At
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      Score
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      Feedback
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {submissions.map((submission) => (
                    <tr
                      key={submission._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-3">
                            <FaUser className="text-indigo-600 dark:text-indigo-400 text-sm" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {submission.submitter.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {submission.submitter.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status.charAt(0).toUpperCase() +
                            submission.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                        {submission.submittedAt || "N/A"}
                      </td>
                      <td className="px-4 py-4">
                        {editingScore === submission._id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={tempScore}
                            onChange={(e) => setTempScore(e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-300"
                            placeholder="0-100"
                          />
                        ) : (
                          <span
                            className={`font-medium ${
                              submission.score !== null
                                ? submission.score >= 75
                                  ? "text-green-600 dark:text-green-400"
                                  : submission.score >= 60
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {submission.score !== null
                              ? `${submission.score}/100`
                              : "Not graded"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingFeedback === submission._id ? (
                          <textarea
                            value={tempFeedback}
                            onChange={(e) => setTempFeedback(e.target.value)}
                            className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-300"
                            placeholder="Optional feedback"
                            rows="2"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400 text-sm">
                            {submission.feedback || "No feedback"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {editingScore === submission._id ? (
                            <>
                              <button
                                onClick={() =>
                                  handleGradeSubmission(submission._id)
                                }
                                disabled={isUpdatingGrade}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                title="Save Grade"
                              >
                                <FaSave className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openFile(submission.fileTugas)}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                title="View File"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                              <a
                                href={submission.fileTugas}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                title="Download File"
                              >
                                <FaDownload className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => {
                                  setEditingScore(submission._id);
                                  setEditingFeedback(submission._id);
                                  setTempScore(
                                    submission.score?.toString() || ""
                                  );
                                  setTempFeedback(submission.feedback || "");
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Grade Submission"
                              >
                                <FaGraduationCap className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {editingScore === submission._id && (
                            <button
                              onClick={() => {
                                setEditingScore(null);
                                setEditingFeedback(null);
                                setTempScore("");
                                setTempFeedback("");
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Cancel"
                            >
                              <FaTimes className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Submission Summary Card */}
      {(user?.role === "Guru" || user?.role === "Admin") &&
        submissions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Submission Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <FaFileAlt className="text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {submissions.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Graded
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {submissions.filter((s) => s.status === "graded").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <FaClock className="text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {
                        submissions.filter((s) => s.status === "submitted")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <FaTimesCircle className="text-red-600 mr-2" />
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Late
                    </p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {submissions.filter((s) => s.status === "late").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default TugasSubmit;
