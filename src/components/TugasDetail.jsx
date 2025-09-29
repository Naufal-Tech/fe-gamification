/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaFileUpload,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function TugasDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tugas, setTugas] = useState(null);
  const [shortQuiz, setShortQuiz] = useState(null);
  const [essayQuiz, setEssayQuiz] = useState(null);
  const [multipleChoice, setMultipleChoice] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  // Fetch tugas details
  const fetchTugasDetail = async () => {
    try {
      const response = await api.get(`/v1/tugas/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const tugasData = response.data.data;
      setTugas(tugasData);

      // Determine default tab based on available content
      if (tugasData.isFileOnly) {
        setActiveTab("fileSubmission");
      } else if (tugasData.hasShortQuiz) {
        setActiveTab("shortQuiz");
      } else if (tugasData.hasEssayQuiz) {
        setActiveTab("essayQuiz");
      } else if (tugasData.hasMultipleChoice) {
        setActiveTab("multipleChoice");
      }
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
      setError(
        err.response?.data?.error || "Failed to load assignment details"
      );
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
    }
  };

  // Fetch quiz details
  const fetchQuizDetails = async (quizType) => {
    const backendQuizTypeMap = {
      ShortQuiz: "shortQuiz",
      EssayQuiz: "essayQuiz",
      MultipleChoice: "multipleChoice",
    };

    const backendQuizType = backendQuizTypeMap[quizType];
    const hasQuizType = tugas && tugas[`has${quizType}`];
    if (!hasQuizType) return;

    try {
      const response = await api.get(
        `/v1/tugas/quiz/${id}/${backendQuizType}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      switch (quizType) {
        case "ShortQuiz":
          setShortQuiz(response.data.data);
          break;
        case "EssayQuiz":
          setEssayQuiz(response.data.data);
          break;
        case "MultipleChoice":
          setMultipleChoice(response.data.data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(
        `Fetch ${quizType} Error:`,
        err.response?.data || err.message
      );
      toast.error(`Failed to load ${quizType} details`);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTugasDetail();
      setIsLoading(false);
    };

    loadData();
  }, [id]);

  // Load quiz details when tugas is loaded
  useEffect(() => {
    if (!tugas) return;

    if (tugas.hasShortQuiz) fetchQuizDetails("ShortQuiz");
    if (tugas.hasEssayQuiz) fetchQuizDetails("EssayQuiz");
    if (tugas.hasMultipleChoice) fetchQuizDetails("MultipleChoice");
  }, [tugas]);

  // Format date
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(Number(dueDate));
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen flex justify-center items-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 p-4 rounded-lg mb-4">
          <p>{error}</p>
          <Link
            to="/teachers/assignments"
            className="text-indigo-600 hover:underline mt-2 inline-block"
          >
            Return to Assignments
          </Link>
        </div>
      </div>
    );
  }

  if (!tugas) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 p-4 rounded-lg mb-4">
          <p>Assignment not found</p>
          <Link
            to="/teachers/assignments"
            className="text-indigo-600 hover:underline mt-2 inline-block"
          >
            Return to Assignments
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(tugas.due_date);
  const isExpired = tugas.isExpired || daysRemaining < 0;

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with back button */}
      <div className="mb-6">
        <Link
          to="/teachers/assignments"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Assignments
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {tugas.title}
        </h1>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Assignment details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Assignment Information
            </h2>

            {/* Status badge */}
            <div className="mb-4">
              {isExpired ? (
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <FaExclamationCircle className="mr-2" />
                  <span className="font-medium">Expired</span>
                </div>
              ) : (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <FaCheckCircle className="mr-2" />
                  <span className="font-medium">Active</span>
                </div>
              )}
            </div>

            {/* Due date info */}
            <div className="flex items-center mb-4 text-gray-700 dark:text-gray-300">
              <FaCalendarAlt className="mr-2 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="font-medium">Due Date</p>
                <p>{formatDate(tugas.due_date)}</p>
                {!isExpired && (
                  <p
                    className={`mt-1 text-sm ${
                      daysRemaining <= 3
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {daysRemaining === 0
                      ? "Due today"
                      : `${daysRemaining} day${
                          daysRemaining === 1 ? "" : "s"
                        } remaining`}
                  </p>
                )}
              </div>
            </div>

            {/* Class info */}
            <div className="mb-4">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Class
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {tugas.kelas?.name || "N/A"}
              </p>
              {tugas.kelas?.description && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {tugas.kelas.description}
                </p>
              )}
            </div>

            {/* Creator info */}
            <div className="mb-4">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Created By
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {tugas.created_by?.fullName || "N/A"}
              </p>
              {tugas.created_by?.email && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {tugas.created_by.email}
                </p>
              )}
            </div>

            {/* Created date */}
            <div className="mb-4">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Created On
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDate(tugas.created_at)}
              </p>
            </div>

            {/* Description */}
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Description
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {tugas.description || "No description"}
              </p>
            </div>
          </div>

          {/* Available content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Available Content
            </h2>
            <div className="space-y-2">
              {tugas.hasFileUpload && (
                <button
                  onClick={() => setActiveTab("fileSubmission")}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-between ${
                    activeTab === "fileSubmission"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <span>File Submission</span>
                  {activeTab === "fileSubmission" && <FaCheckCircle />}
                </button>
              )}

              {tugas.hasShortQuiz && (
                <button
                  onClick={() => setActiveTab("shortQuiz")}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-between ${
                    activeTab === "shortQuiz"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <span>Short Answer Quiz</span>
                  {activeTab === "shortQuiz" && <FaCheckCircle />}
                </button>
              )}

              {tugas.hasMultipleChoice && (
                <button
                  onClick={() => setActiveTab("multipleChoice")}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-between ${
                    activeTab === "multipleChoice"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <span>Multiple Choice Quiz</span>
                  {activeTab === "multipleChoice" && <FaCheckCircle />}
                </button>
              )}

              {tugas.hasEssayQuiz && (
                <button
                  onClick={() => setActiveTab("essayQuiz")}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-between ${
                    activeTab === "essayQuiz"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  <span>Essay Quiz</span>
                  {activeTab === "essayQuiz" && <FaCheckCircle />}
                </button>
              )}

              {/* Show details tab if no content available */}
              {!tugas.hasFileUpload &&
                !tugas.hasShortQuiz &&
                !tugas.hasMultipleChoice &&
                !tugas.hasEssayQuiz && (
                  <div className="p-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-lg">
                    <p>No content available for this assignment.</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right column - Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            {/* File Submission Tab */}
            {activeTab === "fileSubmission" && tugas.hasFileUpload && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  File Submission
                </h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Submission Instructions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {tugas.fileUploadInstructions ||
                        "No instructions provided."}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Your Submission
                    </h3>
                    {tugas.userSubmission ? (
                      <div className="space-y-2">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Status: </span>
                          {tugas.userSubmission.status.charAt(0).toUpperCase() +
                            tugas.userSubmission.status.slice(1)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Submitted On: </span>
                          {formatDate(tugas.userSubmission.submittedAt)}
                        </p>
                        {tugas.userSubmission.score !== undefined && (
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Score: </span>
                            {tugas.userSubmission.score}
                          </p>
                        )}
                        {tugas.userSubmission.fileUrl && (
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">File: </span>
                            <a
                              href={tugas.userSubmission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              View Submitted File
                            </a>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        Not submitted yet.
                      </p>
                    )}
                    {!isExpired &&
                      !tugas.userSubmission &&
                      user?.role !== "Guru" && (
                        <Link
                          to={`/students/tugas/submit/${tugas._id}`}
                          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <FaFileUpload className="inline-block mr-2" />
                          Submit File
                        </Link>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Short Quiz */}
            {activeTab === "shortQuiz" && tugas.hasShortQuiz && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {shortQuiz?.title || "Short Answer Quiz"}
                </h2>

                {shortQuiz?.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {shortQuiz.description}
                  </p>
                )}

                {shortQuiz ? (
                  <div className="space-y-6">
                    {shortQuiz.questions.map((question, index) => (
                      <div
                        key={question._id}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Question {index + 1}: {question.question}
                        </h3>
                        {user?.role === "Guru" && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Correct Answer:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900 p-2 rounded mt-1">
                              {question.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                  </div>
                )}
              </div>
            )}

            {/* Essay Quiz */}
            {activeTab === "essayQuiz" && tugas.hasEssayQuiz && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {essayQuiz?.title || "Essay Quiz"}
                </h2>

                {essayQuiz?.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {essayQuiz.description}
                  </p>
                )}

                {essayQuiz ? (
                  <div className="space-y-6">
                    {essayQuiz.questions.map((question, index) => (
                      <div
                        key={question._id}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Question {index + 1}: {question.question}
                        </h3>
                        {user?.role === "Guru" && question.modelAnswer && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Model Answer:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900 p-2 rounded mt-1">
                              {question.modelAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                  </div>
                )}
              </div>
            )}

            {/* Multiple Choice Quiz */}
            {activeTab === "multipleChoice" && tugas.hasMultipleChoice && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {multipleChoice?.title || "Multiple Choice Quiz"}
                </h2>

                {multipleChoice?.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {multipleChoice.description}
                  </p>
                )}

                {multipleChoice ? (
                  <div className="space-y-6">
                    {multipleChoice.questions.map((question, index) => (
                      <div
                        key={question._id}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Question {index + 1}: {question.question}
                        </h3>

                        <div className="space  space-y-2 ml-2">
                          {question.options.map((option) => (
                            <div
                              key={option._id}
                              className={`p-2 rounded ${
                                user?.role === "Guru" && option.isCorrect
                                  ? "bg-green-100 dark:bg-green-900"
                                  : "bg-gray-100 dark:bg-gray-600"
                              }`}
                            >
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`question-${question._id}`}
                                  value={option._id}
                                  disabled
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span
                                  className={
                                    user?.role === "Guru" && option.isCorrect
                                      ? "font-medium text-green-800 dark:text-green-300"
                                      : "text-gray-700 dark:text-gray-300"
                                  }
                                >
                                  {option.text}
                                </span>
                                {user?.role === "Guru" && option.isCorrect && (
                                  <span className="ml-2 text-green-600 dark:text-green-400 text-sm">
                                    (Correct)
                                  </span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                  </div>
                )}
              </div>
            )}

            {/* Details tab (if no content) */}
            {activeTab === "details" && (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No content available for this assignment.
                </p>
                {user?.role === "Guru" && (
                  <Link
                    to={`/teachers/tugas/edit/${tugas._id}`}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Edit Assignment
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TugasDetail;
