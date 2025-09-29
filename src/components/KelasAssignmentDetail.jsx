/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaBook, FaClock } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

const KelasAssignmentDetail = () => {
  const { type, id } = useParams();
  const { user, accessToken } = useAuthStore();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState({
    essayQuestions: [],
    multipleChoiceQuestions: [],
    shortQuestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const isTugas = type === "tugas";
  const isExam = type === "exam";

  useEffect(() => {
    if (!user || user.role !== "User") {
      console.error("You must be a student to access this page");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (isTugas) {
          const response = await api.get(`/v1/tugas/questions/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const tugasData = response.data;

          setAssignment({
            tugasId: tugasData.tugasId,
            title: tugasData.title,
            description: tugasData.description,
            due_date: tugasData.due_date,
            requiresFileUpload: tugasData.requiresFileUpload,
            fileUploadInstructions: tugasData.fileUploadInstructions,
            submission: tugasData.submission,
            kelas: tugasData.kelas,
          });

          setQuestions({
            essayQuestions: tugasData.essayQuestions || [],
            multipleChoiceQuestions: tugasData.multipleChoiceQuestions || [],
            shortQuestions: tugasData.shortQuestions || [],
          });
        } else if (isExam) {
          const response = await api.get(`/v1/exam/detail/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          setAssignment(response.data.exam);
          setQuestions({
            essayQuestions: response.data.exam.essayQuiz?.questions || [],
            multipleChoiceQuestions:
              response.data.exam.multipleChoice?.questions || [],
            shortQuestions: [],
          });
          setTimeRemaining(
            response.data.exam.userSubmission?.timeRemaining || null
          );
        }
      } catch (error) {
        console.error("Fetch error:", error.response?.data || error.message);
        alert(
          error.response?.data?.error || "Failed to load assignment details"
        );
        navigate("/students/classes?tab=assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, accessToken, id, isTugas, isExam, navigate]);

  useEffect(() => {
    if (isExam && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, isExam]);

  const handleGoToSubmission = () => {
    navigate(`/students/submit/tugas/${id}`);
  };

  const handleBackToAssignments = () => {
    navigate("/students/classes?tab=assignments");
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClassDisplayName = (kelas) => {
    if (!kelas) return "No class assigned";

    if (Array.isArray(kelas)) {
      if (kelas.length === 0) return "No class assigned";
      return kelas.map((k) => k.name || k).join(", ");
    }

    return kelas.name || kelas;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Assignment Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The assignment you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBackToAssignments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assignments & Exams
          </button>
        </div>
      </div>
    );
  }

  const isExpired = assignment.due_date < Date.now();
  const isSubmitted =
    assignment.submission && assignment.submission.status !== "pending";
  const canGoToSubmission = isTugas && !isExpired && !isSubmitted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {assignment.title}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {assignment.description || "No description provided"}
              </p>
            </div>
            <div className="ml-6">
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isExpired
                    ? "bg-red-100 text-red-800"
                    : isSubmitted
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {isExpired ? "Expired" : isSubmitted ? "Submitted" : "Active"}
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <FaBook className="text-blue-600 text-xl" />
              <div>
                <p className="text-sm text-gray-500 font-medium">Class</p>
                <p className="text-gray-900 font-semibold">
                  {getClassDisplayName(assignment.kelas)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <FaClock className="text-blue-600 text-xl" />
              <div>
                <p className="text-sm text-gray-500 font-medium">Due Date</p>
                <p
                  className={`font-semibold ${
                    isExpired ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatDate(assignment.due_date)}
                  {isExpired && (
                    <span className="text-red-600 ml-2">(Expired)</span>
                  )}
                </p>
              </div>
            </div>

            {isExam && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <FaClock className="text-orange-600 text-xl" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Time Remaining
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {timeRemaining !== null
                      ? `${timeRemaining} minutes`
                      : "Not started"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submission Status */}
          {assignment.submission && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                📋 Submission Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p
                    className={`font-semibold capitalize ${
                      assignment.submission.status === "graded"
                        ? "text-green-600"
                        : assignment.submission.status === "submitted"
                        ? "text-blue-600"
                        : "text-orange-600"
                    }`}
                  >
                    {assignment.submission.status}
                  </p>
                </div>

                {assignment.submission.score !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="font-semibold text-green-600">
                      {assignment.submission.score}/100
                    </p>
                  </div>
                )}

                {assignment.submission.submittedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Submitted At</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(assignment.submission.submittedAt)}
                    </p>
                  </div>
                )}

                {assignment.submission.fileTugas && (
                  <div>
                    <p className="text-sm text-gray-600">Submitted File</p>
                    <a
                      href={assignment.submission.fileTugas}
                      className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 View File
                    </a>
                  </div>
                )}
              </div>

              {assignment.submission.feedback && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Teacher Feedback</p>
                  <p className="text-gray-800">
                    {assignment.submission.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Questions Section */}
        {(questions.essayQuestions.length > 0 ||
          questions.multipleChoiceQuestions.length > 0 ||
          questions.shortQuestions.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📚 Questions Preview
            </h2>

            {/* Essay Questions */}
            {questions.essayQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  ✍️ Essay Questions ({questions.essayQuestions.length})
                </h3>
                <div className="space-y-4">
                  {questions.essayQuestions.map((q, index) => (
                    <div
                      key={q._id}
                      className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                    >
                      <p className="text-sm text-purple-600 font-medium mb-2">
                        Question {index + 1}
                      </p>
                      <p className="text-gray-800 leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Choice Questions */}
            {questions.multipleChoiceQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  ☑️ Multiple Choice Questions (
                  {questions.multipleChoiceQuestions.length})
                </h3>
                <div className="space-y-4">
                  {questions.multipleChoiceQuestions.map((q, index) => (
                    <div
                      key={q._id}
                      className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
                    >
                      <p className="text-sm text-blue-600 font-medium mb-2">
                        Question {index + 1}
                      </p>
                      <p className="text-gray-800 font-semibold mb-3">
                        {q.question}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={opt._id}
                            className="flex items-center p-3 bg-white rounded-md border"
                          >
                            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className="text-gray-700">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Short Questions */}
            {questions.shortQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  💬 Short Answer Questions ({questions.shortQuestions.length})
                </h3>
                <div className="space-y-4">
                  {questions.shortQuestions.map((q, index) => (
                    <div
                      key={q._id}
                      className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                    >
                      <p className="text-sm text-green-600 font-medium mb-2">
                        Question {index + 1}
                      </p>
                      <p className="text-gray-800 leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Upload Instructions */}
        {isTugas && assignment.requiresFileUpload && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              📎 File Upload Requirements
            </h3>
            {assignment.fileUploadInstructions ? (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-gray-800 leading-relaxed">
                  {assignment.fileUploadInstructions}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  Please upload your assignment file when submitting.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {canGoToSubmission && (
            <button
              onClick={handleGoToSubmission}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🚀 Start Assignment
            </button>
          )}

          <button
            onClick={handleBackToAssignments}
            className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Assignments & Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default KelasAssignmentDetail;
