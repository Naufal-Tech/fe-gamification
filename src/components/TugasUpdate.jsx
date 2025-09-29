import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaPlus,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function TugasUpdate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { accessToken } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    kelas: "",
    essayQuiz: "",
    multipleChoice: "",
    shortQuiz: "",
    due_date: moment().add(7, "days").format("YYYY-MM-DD"),
    tags: "active",
    requiresFileUpload: false,
    fileUploadInstructions: "",
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
  const [shortQuizData, setShortQuizData] = useState({
    data: [],
    pagination: {},
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingKelas, setIsLoadingKelas] = useState(false);
  const [isLoadingEssayQuiz, setIsLoadingEssayQuiz] = useState(false);
  const [isLoadingMultipleChoice, setIsLoadingMultipleChoice] = useState(false);
  const [isLoadingShortQuiz, setIsLoadingShortQuiz] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  // Pagination states
  const [essayQuizPage, setEssayQuizPage] = useState(1);
  const [multipleChoicePage, setMultipleChoicePage] = useState(1);
  const [shortQuizPage, setShortQuizPage] = useState(1);

  // Active tab state for quiz selection
  const [activeTab, setActiveTab] = useState("essay");

  // Error state
  const [error, setError] = useState(null);

  // Fetch initial assignment data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingInitialData(true);
      try {
        const response = await api.get(`/v1/tugas/detail/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const assignment = response.data.data;

        // Format the due date for the date input
        const formattedDueDate = moment(assignment.due_date).format(
          "YYYY-MM-DD"
        );

        setFormData({
          title: assignment.title || "",
          description: assignment.description || "",
          kelas: assignment.kelas?._id || "",
          essayQuiz: assignment.essayQuiz?._id || "",
          multipleChoice: assignment.multipleChoice?._id || "",
          shortQuiz: assignment.shortQuiz?._id || "",
          due_date: formattedDueDate,
          tags: assignment.tags || "active",
          requiresFileUpload: assignment.requiresFileUpload || false,
          fileUploadInstructions: assignment.fileUploadInstructions || "",
        });

        // Set active tab based on which quiz is present
        if (assignment.essayQuiz) setActiveTab("essay");
        else if (assignment.multipleChoice) setActiveTab("multipleChoice");
        else if (assignment.shortQuiz) setActiveTab("shortQuiz");
      } catch (err) {
        console.error("Error fetching assignment details:", err);
        toast.error("Failed to load assignment details");
        setError(err.response?.data?.error || "Failed to load assignment");
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    fetchInitialData();
  }, [id, accessToken]);

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
        const response = await api.get(`/v1/essay-quiz?page=${essayQuizPage}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
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
          `/v1/multiple-choice?page=${multipleChoicePage}`,
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

  // Fetch short quiz data
  useEffect(() => {
    const fetchShortQuiz = async () => {
      setIsLoadingShortQuiz(true);
      try {
        const response = await api.get(`/v1/short-quiz?page=${shortQuizPage}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setShortQuizData(response.data);
      } catch (err) {
        console.error("Error fetching short quiz:", err);
        toast.error("Failed to load short quizzes");
      } finally {
        setIsLoadingShortQuiz(false);
      }
    };

    fetchShortQuiz();
  }, [accessToken, shortQuizPage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle quiz removal
  const handleRemoveQuiz = (type) => {
    setFormData((prev) => ({ ...prev, [type]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Format date to DD-MM-YYYY as required by the API
    const formattedDueDate = moment(formData.due_date).format("DD-MM-YYYY");

    // Create a cleaned data object
    const cleanedData = {
      ...formData,
      due_date: formattedDueDate,
      // Ensure fileUploadInstructions is included even if empty
      fileUploadInstructions: formData.fileUploadInstructions || "",
    };

    try {
      await api.put(`/v1/tugas/${id}`, cleanedData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      toast.success("Assignment updated successfully");
      navigate("/teachers/assignments");
    } catch (err) {
      console.error("Error updating tugas:", err);
      setError(err.response?.data?.error || "Failed to update assignment");
      toast.error(err.response?.data?.error || "Failed to update assignment");
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
      [type]: prev[type] === id ? "" : id, // Toggle selection
    }));
  };

  if (isLoadingInitialData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading assignment data...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link
          to="/teachers/assignments"
          className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <FaArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Update Assignment
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
            placeholder="Enter assignment title"
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
            placeholder="Enter assignment description"
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

        {/* File Submission Settings */}
        <div className="mb-6">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              name="requiresFileUpload"
              checked={formData.requiresFileUpload}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Requires File Upload
            </span>
          </label>
          {formData.requiresFileUpload && (
            <div className="mt-2">
              <label
                htmlFor="fileUploadInstructions"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                File Upload Instructions
              </label>
              <textarea
                id="fileUploadInstructions"
                name="fileUploadInstructions"
                value={formData.fileUploadInstructions}
                onChange={handleInputChange}
                rows="4"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Enter instructions for file submission (e.g., file format, size limits)"
              ></textarea>
            </div>
          )}
        </div>

        {/* Currently Selected Quizzes */}
        {(formData.essayQuiz ||
          formData.multipleChoice ||
          formData.shortQuiz) && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="text-md font-medium text-blue-800 dark:text-blue-200 mb-2">
              Currently Selected Quizzes
            </h3>
            {formData.essayQuiz && (
              <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Essay Quiz:{" "}
                  </span>
                  {essayQuizData.data.find((q) => q._id === formData.essayQuiz)
                    ?.title || "Loading..."}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuiz("essayQuiz")}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FaTrash />
                </button>
              </div>
            )}
            {formData.multipleChoice && (
              <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Multiple Choice Quiz:{" "}
                  </span>
                  {multipleChoiceData.data.find(
                    (q) => q._id === formData.multipleChoice
                  )?.title || "Loading..."}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuiz("multipleChoice")}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FaTrash />
                </button>
              </div>
            )}
            {formData.shortQuiz && (
              <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Short Quiz:{" "}
                  </span>
                  {shortQuizData.data.find((q) => q._id === formData.shortQuiz)
                    ?.title || "Loading..."}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuiz("shortQuiz")}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quiz Selection Tabs */}
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
            Quiz Selection (optional; click to add or remove quizzes)
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
              Essay Quiz
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
              Multiple Choice
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("shortQuiz")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "shortQuiz"
                  ? "text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-500 dark:border-indigo-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Short Quiz
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

          {/* Short Quiz */}
          {activeTab === "shortQuiz" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                  Select a Short Quiz
                </h3>
                <Link
                  to="/teachers/short-quiz/new"
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-400"
                >
                  <FaPlus className="mr-1" /> Create New
                </Link>
              </div>

              {isLoadingShortQuiz ? (
                <div className="flex justify-center items-center h-40">
                  <FaSpinner className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
              ) : shortQuizData.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No short quizzes found. Please create one first.
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {shortQuizData.data.map((quiz) => (
                      <div
                        key={quiz._id}
                        onClick={() =>
                          handleQuizSelection("shortQuiz", quiz._id)
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.shortQuiz === quiz._id
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
                          {formData.shortQuiz === quiz._id && (
                            <FaCheck className="text-green-500 h-5 w-5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {shortQuizData.pagination && (
                    <div className="flex justify-between items-center mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setShortQuizPage((prevPage) =>
                            Math.max(1, prevPage - 1)
                          )
                        }
                        disabled={!shortQuizData.pagination.prevPage}
                        className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:text-indigo-500 dark:border-indigo-500"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {shortQuizPage} of{" "}
                        {shortQuizData.pagination.totalPages || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setShortQuizPage((prevPage) => prevPage + 1)
                        }
                        disabled={!shortQuizData.pagination.nextPage}
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
                Updating...
              </>
            ) : (
              "Update Assignment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TugasUpdate;
