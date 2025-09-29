/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaExclamationCircle,
  FaUserGraduate,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  // Fetch exam details
  const fetchExamDetail = async () => {
    try {
      const response = await api.get(`/v1/exam/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const examData = response.data.exam;
      setExam(examData);

      // Determine default tab based on available content
      if (examData.multipleChoice) {
        setActiveTab("multipleChoice");
      } else if (examData.essayQuiz) {
        setActiveTab("essayQuiz");
      }
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to load exam details");
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        navigate("/sign-in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load data
  useEffect(() => {
    fetchExamDetail();
  }, [id]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate time remaining
  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return { days: 0, isExpired: true };

    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: diffDays,
      isExpired: diffDays < 0,
    };
  };

  // Start Exam function
  const handleStartExam = async () => {
    if (!exam) return;

    try {
      // Check if user already has a submission in progress
      if (exam.userSubmission && exam.userSubmission.status === "in-progress") {
        navigate(`/students/exams/take/${exam._id}`);
        return;
      }

      // Create new submission
      const response = await api.post(
        `/v1/exams/submissions/start/${exam._id}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        navigate(`/students/exams/take/${exam._id}`);
      }
    } catch (err) {
      console.error("Start Exam Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to start exam");
    }
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
            to="/exams"
            className="text-indigo-600 hover:underline mt-2 inline-block"
          >
            Return to Exams
          </Link>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 p-4 rounded-lg mb-4">
          <p>Exam not found</p>
          <Link
            to="/exams"
            className="text-indigo-600 hover:underline mt-2 inline-block"
          >
            Return to Exams
          </Link>
        </div>
      </div>
    );
  }

  const { days: daysRemaining, isExpired } = getTimeRemaining(exam.due_date);
  const userRole = user?.role || "User";
  const hasAttempted = exam.userSubmission !== null;
  const isCompleted =
    hasAttempted &&
    (exam.userSubmission.status === "submitted" ||
      exam.userSubmission.status === "graded");
  const isInProgress =
    hasAttempted && exam.userSubmission.status === "in-progress";

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with back button */}
      <div className="mb-6">
        <Link
          to={userRole === "Guru" ? "/teachers/exams" : "/student/exams"}
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Exams
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {exam.title}
        </h1>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Exam details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Exam Information
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

            {/* Duration info */}
            <div className="flex items-center mb-4 text-gray-700 dark:text-gray-300">
              <FaClock className="mr-2 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="font-medium">Duration</p>
                <p>{exam.duration} minutes</p>
                {isInProgress && exam.userSubmission.timeRemaining !== null && (
                  <p className="mt-1 text-sm font-bold text-red-600 dark:text-red-400">
                    {exam.userSubmission.timeRemaining} minutes remaining
                  </p>
                )}
              </div>
            </div>

            {/* Due date info */}
            <div className="flex items-center mb-4 text-gray-700 dark:text-gray-300">
              <FaCalendarAlt className="mr-2 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="font-medium">Due Date</p>
                <p>{formatDate(exam.due_date)}</p>
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
                {exam.class?.name || "N/A"}
              </p>
            </div>

            {/* Creator info */}
            <div className="mb-4">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Created By
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {exam.creator?.fullName || "N/A"}
              </p>
              {exam.creator?.email && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {exam.creator.email}
                </p>
              )}
            </div>

            {/* Created date */}
            <div className="mb-4">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Created On
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDate(exam.created_at)}
              </p>
            </div>

            {/* Last modified date */}
            <div className="mb-4">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Last Modified
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDate(exam.last_modified)}
              </p>
            </div>

            {/* Description */}
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Description
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {exam.description || "No description"}
              </p>
            </div>

            {/* Teacher's token (only visible to teachers) */}
            {userRole === "Guru" && exam.token && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  Exam Token: <span className="font-bold">{exam.token}</span>
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Share this token with students to access the exam
                </p>
              </div>
            )}
          </div>

          {/* User submission info for students */}
          {userRole === "User" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Your Exam Status
              </h2>

              {hasAttempted ? (
                <div>
                  <div className="flex items-center mb-3">
                    {isCompleted ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <FaCheckCircle className="mr-2" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                        <FaClock className="mr-2" />
                        <span className="font-medium">In Progress</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Start Time: </span>
                      {formatDate(exam.userSubmission.startTime)}
                    </p>

                    {exam.userSubmission.endTime && (
                      <p>
                        <span className="font-medium">End Time: </span>
                        {formatDate(exam.userSubmission.endTime)}
                      </p>
                    )}

                    {exam.userSubmission.status === "graded" && (
                      <p>
                        <span className="font-medium">Score: </span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {exam.userSubmission.score}
                        </span>
                      </p>
                    )}
                  </div>

                  {isInProgress && !isExpired && (
                    <button
                      onClick={handleStartExam}
                      className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Continue Exam
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You haven't started this exam yet.
                  </p>

                  {!isExpired && (
                    <button
                      onClick={handleStartExam}
                      className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Start Exam
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Statistics for teachers */}
          {userRole === "Guru" && exam.statistics && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Submission Statistics
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    Total Students:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {exam.statistics.total}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    In Progress:
                  </span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {exam.statistics.inProgress}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    Submitted:
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {exam.statistics.submitted}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    Graded:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {exam.statistics.graded}
                  </span>
                </div>

                {exam.statistics.averageScore !== null && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">
                      Average Score:
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {exam.statistics.averageScore}
                    </span>
                  </div>
                )}
              </div>

              <Link
                to={`/teachers/exams/${exam._id}/submissions`}
                className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-block text-center"
              >
                <FaUserGraduate className="inline-block mr-2" />
                View All Submissions
              </Link>
            </div>
          )}

          {/* Available content tabs */}
          {(exam.essayQuiz || exam.multipleChoice) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Exam Content
              </h2>
              <div className="space-y-2">
                {exam.multipleChoice && (
                  <button
                    onClick={() => setActiveTab("multipleChoice")}
                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-between ${
                      activeTab === "multipleChoice"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span>Multiple Choice</span>
                    {activeTab === "multipleChoice" && <FaCheckCircle />}
                  </button>
                )}

                {exam.essayQuiz && (
                  <button
                    onClick={() => setActiveTab("essayQuiz")}
                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-between ${
                      activeTab === "essayQuiz"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span>Essay Questions</span>
                    {activeTab === "essayQuiz" && <FaCheckCircle />}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            {/* Multiple Choice Quiz Tab */}
            {activeTab === "multipleChoice" && exam.multipleChoice && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FaClipboardList className="mr-2 text-indigo-600 dark:text-indigo-400" />
                  {exam.multipleChoice.title || "Multiple Choice Questions"}
                </h2>

                <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg mb-6">
                  <p className="text-indigo-700 dark:text-indigo-300">
                    <strong>Note:</strong> This preview shows{" "}
                    {userRole === "Guru"
                      ? "all question details"
                      : "the questions"}
                    .
                    {userRole === "User"
                      ? " Correct answers will not be shown until after you've completed the exam."
                      : ""}
                  </p>
                </div>

                <div className="space-y-6">
                  {exam.multipleChoice.questions &&
                    exam.multipleChoice.questions.map((question, index) => (
                      <div
                        key={question._id || index}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Question {index + 1}: {question.question}
                        </h3>

                        <div className="space-y-2 ml-2">
                          {question.options &&
                            question.options.map((option, optIndex) => (
                              <div
                                key={option._id || optIndex}
                                className={`p-2 rounded ${
                                  userRole === "Guru" && option.isCorrect
                                    ? "bg-green-100 dark:bg-green-900"
                                    : "bg-gray-100 dark:bg-gray-600"
                                }`}
                              >
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`question-${question._id || index}`}
                                    value={option._id}
                                    disabled
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span
                                    className={
                                      userRole === "Guru" && option.isCorrect
                                        ? "font-medium text-green-800 dark:text-green-300"
                                        : "text-gray-700 dark:text-gray-300"
                                    }
                                  >
                                    {option.text}
                                  </span>
                                  {userRole === "Guru" && option.isCorrect && (
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
              </div>
            )}

            {/* Essay Quiz Tab */}
            {activeTab === "essayQuiz" && exam.essayQuiz && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FaChalkboardTeacher className="mr-2 text-indigo-600 dark:text-indigo-400" />
                  {exam.essayQuiz.title || "Essay Questions"}
                </h2>

                <div className="space-y-6">
                  {exam.essayQuiz.questions &&
                    exam.essayQuiz.questions.map((question, index) => (
                      <div
                        key={question._id || index}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Question {index + 1}: {question.question}
                        </h3>

                        {userRole === "Guru" && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900 rounded border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                              Expected Answer Points:
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                              {question.modelAnswer ||
                                "No model answer provided"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Default content if no tabs are selected */}
            {activeTab === "details" && (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a section from the sidebar to view exam content.
                </p>

                {userRole === "User" && !hasAttempted && !isExpired && (
                  <button
                    onClick={handleStartExam}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Start Exam
                  </button>
                )}

                {userRole === "Guru" && (
                  <div className="space-y-3">
                    <Link
                      to={`/teachers/exams/submissions/${exam._id}`}
                      className="block px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
                    >
                      View Submissions
                    </Link>

                    <Link
                      to={`/teachers/exams/edit/${exam._id}`}
                      className="block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Edit Exam
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamDetail;
