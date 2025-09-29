/* eslint-disable no-unused-vars */
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaClock,
  FaPlus,
  FaSpinner,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function ExamCreate() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    kelas: "",
    essayQuiz: "",
    multipleChoice: "",
    duration: 60, // Default duration in minutes
    due_date: moment().add(7, "days").format("YYYY-MM-DD"),
  });

  // Data states
  const [kelasData, setKelasData] = useState([]);
  const [essayQuizData, setEssayQuizData] = useState({
    data: [],
    pagination: {},
  });
  const [multipleChoiceData, setMultipleChoiceData] = useState({
    data: [],
    pagination: {},
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingKelas, setIsLoadingKelas] = useState(false);
  const [isLoadingEssayQuiz, setIsLoadingEssayQuiz] = useState(false);
  const [isLoadingMultipleChoice, setIsLoadingMultipleChoice] = useState(false);

  // Pagination states
  const [essayQuizPage, setEssayQuizPage] = useState(1);
  const [multipleChoicePage, setMultipleChoicePage] = useState(1);

  // Active tab state for quiz selection
  const [activeTab, setActiveTab] = useState("essay");

  // Error state
  const [error, setError] = useState(null);

  // Fetch kelas data
  useEffect(() => {
    const fetchKelas = async () => {
      setIsLoadingKelas(true);
      try {
        const response = await api.get("/v1/kelas", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setKelasData(response.data.kelas || []);
      } catch (err) {
        console.error("Error fetching kelas:", err);
        toast.error("Failed to load classes");
        setError(err.response?.data?.error || "Failed to load classes");
      } finally {
        setIsLoadingKelas(false);
      }
    };

    fetchKelas();
  }, [accessToken]);

  // Fetch essay quiz data
  useEffect(() => {
    const fetchEssayQuiz = async () => {
      setIsLoadingEssayQuiz(true);
      try {
        const response = await api.get(
          `/v1/essay-quiz?page=${essayQuizPage}&myQuizzes=true`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setEssayQuizData(response.data);
      } catch (err) {
        console.error("Error fetching essay quiz:", err);
        toast.error("Failed to load essay quizzes");
      } finally {
        setIsLoadingEssayQuiz(false);
      }
    };

    fetchEssayQuiz();
  }, [accessToken, essayQuizPage]);

  // Fetch multiple choice quiz data
  useEffect(() => {
    const fetchMultipleChoice = async () => {
      setIsLoadingMultipleChoice(true);
      try {
        const response = await api.get(
          `/v1/multiple-choice?page=${multipleChoicePage}&myQuizzes=true`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setMultipleChoiceData(response.data);
      } catch (err) {
        console.error("Error fetching multiple choice quiz:", err);
        toast.error("Failed to load multiple choice quizzes");
      } finally {
        setIsLoadingMultipleChoice(false);
      }
    };

    fetchMultipleChoice();
  }, [accessToken, multipleChoicePage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // For duration, ensure it's a positive number
    if (name === "duration") {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue <= 0) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Format date to DD-MM-YYYY as required by the API
    const formattedDueDate = moment(formData.due_date).format("DD-MM-YYYY");

    // Check if at least one quiz type is selected
    const hasQuiz = formData.essayQuiz || formData.multipleChoice;
    if (!hasQuiz) {
      setError("At least one quiz type (essay or multiple-choice) is required");
      setIsSubmitting(false);
      return;
    }

    // Create a cleaned data object
    const cleanedData = {
      ...formData,
      due_date: formattedDueDate,
      // Convert empty strings to null for ObjectId fields
      essayQuiz: formData.essayQuiz || null,
      multipleChoice: formData.multipleChoice || null,
      // Ensure duration is a number
      duration: parseInt(formData.duration, 10),
    };

    try {
      await api.post("/v1/exam", cleanedData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      toast.success("Exam created successfully");
      navigate("/teachers/exams");
    } catch (err) {
      console.error("Error creating exam:", err);
      setError(err.response?.data?.error || "Failed to create exam");
      toast.error(err.response?.data?.error || "Failed to create exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle quiz selection
  const handleQuizSelection = (type, id) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type] === id ? "" : id,
    }));
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link
          to="/teachers/exams"
          className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <FaArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Create New Exam
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
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
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Enter exam title"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label
            htmlFor="description"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Enter exam description"
          ></textarea>
        </div>

        {/* Kelas (Class) Selection */}
        <div className="mb-6">
          <label
            htmlFor="kelas"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Class*
          </label>
          {isLoadingKelas ? (
            <div className="flex items-center">
              <FaSpinner className="h-5 w-5 mr-2 animate-spin text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Loading classes...
              </span>
            </div>
          ) : (
            <select
              id="kelas"
              name="kelas"
              value={formData.kelas}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">Select a class</option>
              {kelasData.map((kelas) => (
                <option key={kelas._id} value={kelas._id}>
                  {kelas.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Duration */}
        <div className="mb-6">
          <label
            htmlFor="duration"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Duration (minutes)*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaClock className="text-gray-400" />
            </div>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Enter exam duration in minutes"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter the time allowed for this exam in minutes (e.g., 60 for 1
            hour)
          </p>
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <label
            htmlFor="due_date"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Due Date*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-400" />
            </div>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              required
              className="w-full p-2 pl-10 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              min={moment().format("YYYY-MM-DD")}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Due date must be in the future (format: DD-MM-YYYY)
          </p>
        </div>

        {/* Quiz Selection Tabs */}
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
            Quiz Selection (at least one required)
          </p>
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleTabChange("essay")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "essay"
                  ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-500 dark:border-indigo-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Essay Quiz{" "}
              {formData.essayQuiz && (
                <FaCheck className="inline-block ml-1 text-green-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("multipleChoice")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "multipleChoice"
                  ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-500 dark:border-indigo-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Multiple Choice{" "}
              {formData.multipleChoice && (
                <FaCheck className="inline-block ml-1 text-green-500" />
              )}
            </button>
          </div>
        </div>

        {/* Quiz Selection Content */}
        <div className="mb-6 border rounded-lg dark:border-gray-700 p-4">
          {/* Essay Quiz */}
          {activeTab === "essay" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                  Select an Essay Quiz
                </h3>
                <Link
                  to="/teachers/essay-quiz/new"
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-400"
                >
                  <FaPlus className="mr-1" /> Create New
                </Link>
              </div>

              {isLoadingEssayQuiz ? (
                <div className="flex justify-center items-center h-40">
                  <FaSpinner className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
              ) : essayQuizData.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No essay quizzes found. Please create one first.
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {essayQuizData.data.map((quiz) => (
                      <div
                        key={quiz._id}
                        onClick={() =>
                          handleQuizSelection("essayQuiz", quiz._id)
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.essayQuiz === quiz._id
                            ? "bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-700"
                            : "bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {quiz.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {quiz.questions?.length || 0} questions
                            </p>
                          </div>
                          {formData.essayQuiz === quiz._id && (
                            <FaCheck className="text-green-500 h-5 w-5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {essayQuizData.pagination && (
                    <div className="flex justify-between items-center mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setEssayQuizPage((prevPage) =>
                            Math.max(1, prevPage - 1)
                          )
                        }
                        disabled={!essayQuizData.pagination.prevPage}
                        className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:text-indigo-500 dark:border-indigo-500"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {essayQuizPage} of{" "}
                        {essayQuizData.pagination.totalPages || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEssayQuizPage((prevPage) => prevPage + 1)
                        }
                        disabled={!essayQuizData.pagination.nextPage}
                        className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:text-indigo-500 dark:border-indigo-500"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Multiple Choice Quiz */}
          {activeTab === "multipleChoice" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                  Select a Multiple Choice Quiz
                </h3>
                <Link
                  to="/teachers/multiple-choice/new"
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-400"
                >
                  <FaPlus className="mr-1" /> Create New
                </Link>
              </div>

              {isLoadingMultipleChoice ? (
                <div className="flex justify-center items-center h-40">
                  <FaSpinner className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
              ) : multipleChoiceData.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No multiple choice quizzes found. Please create one first.
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {multipleChoiceData.data.map((quiz) => (
                      <div
                        key={quiz._id}
                        onClick={() =>
                          handleQuizSelection("multipleChoice", quiz._id)
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.multipleChoice === quiz._id
                            ? "bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-700"
                            : "bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {quiz.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {quiz.questions?.length || 0} questions
                            </p>
                          </div>
                          {formData.multipleChoice === quiz._id && (
                            <FaCheck className="text-green-500 h-5 w-5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {multipleChoiceData.pagination && (
                    <div className="flex justify-between items-center mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setMultipleChoicePage((prevPage) =>
                            Math.max(1, prevPage - 1)
                          )
                        }
                        disabled={!multipleChoiceData.pagination.prevPage}
                        className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:text-indigo-500 dark:border-indigo-500"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {multipleChoicePage} of{" "}
                        {multipleChoiceData.pagination.totalPages || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMultipleChoicePage((prevPage) => prevPage + 1)
                        }
                        disabled={!multipleChoiceData.pagination.nextPage}
                        className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:text-indigo-500 dark:border-indigo-500"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-4 mb-0 text-sm text-gray-500 dark:text-gray-400">
            <strong>Note:</strong> You must select at least one quiz type to
            create an exam.
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FaPlus className="h-5 w-5 mr-2" />
                Create Exam
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExamCreate;
