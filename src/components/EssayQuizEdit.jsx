import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function EssayQuizEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    kelas: [],
    semester: "",
    questions: [{ question: "" }],
  });
  const [errors, setErrors] = useState({});

  // Fetch quiz, categories, and kelas options
  const { data, isLoading, error } = useQuery({
    queryKey: ["essayQuizEdit", id],
    queryFn: async () => {
      const [quizRes, categoriesRes, kelasRes] = await Promise.all([
        api.get(`/v1/essay-quiz/detail/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        api.get("/v1/category-quiz", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        api.get("/v1/kelas", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      return {
        quiz: quizRes.data,
        categories: categoriesRes.data.data,
        kelasList: kelasRes.data.kelas || [],
      };
    },
    onError: (err) => {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/sign-in";
      }
      toast.error(
        err.response?.data?.error ||
          "Failed to load quiz, categories, or classes",
        {
          duration: 6000,
          style: {
            background: "#ef4444",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "12px",
            maxWidth: "90vw",
            fontSize: "14px",
          },
        }
      );
    },
  });

  // Initialize form data when quiz is loaded
  useEffect(() => {
    if (data?.quiz) {
      const { quiz } = data;
      setFormData({
        title: quiz.title || "",
        description: quiz.description || "",
        category: quiz.category?._id || quiz.category || "",
        kelas: quiz.kelas?.map((k) => k._id) || [],
        semester: quiz.semester || "",
        questions: quiz.questions?.map((q) => ({
          _id: q._id,
          question: q.question,
        })) || [{ question: "" }],
      });
    }
  }, [data]);

  // Mutation for updating quiz
  const updateMutation = useMutation({
    mutationFn: (data) =>
      api.put(`/v1/essay-quiz/${id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries(["essayQuizEdit", id]);
      await queryClient.cancelQueries(["essayQuiz"]);
      const previousQuiz = queryClient.getQueryData(["essayQuizEdit", id]);
      const previousList = queryClient.getQueryData(["essayQuiz"]);
      queryClient.setQueryData(["essayQuizEdit", id], (old) => ({
        ...old,
        quiz: { ...old.quiz, ...updatedData },
      }));
      queryClient.setQueryData(["essayQuiz"], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((q) =>
            q._id === id ? { ...q, ...updatedData } : q
          ),
        };
      });
      return { previousQuiz, previousList };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["essayQuizEdit", id], context?.previousQuiz);
      queryClient.setQueryData(["essayQuiz"], context?.previousList);
      toast.error(err.response?.data?.error || "Failed to update essay quiz", {
        duration: 6000,
        style: {
          background: "#ef4444",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
    },
    onSuccess: (response) => {
      toast.success(
        response.data?.message || "Essay quiz updated successfully",
        {
          duration: 4000,
          style: {
            background: "#10b981",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "12px",
            maxWidth: "90vw",
            fontSize: "14px",
          },
        }
      );
      queryClient.invalidateQueries(["essayQuizEdit", id]);
      queryClient.invalidateQueries(["essayQuiz"]);
      navigate("/teachers/essay-quizzes");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleKelasChange = (kelasId) => {
    const updatedKelas = formData.kelas.includes(kelasId)
      ? formData.kelas.filter((id) => id !== kelasId)
      : [...formData.kelas, kelasId];
    setFormData({ ...formData, kelas: updatedKelas });
    setErrors({ ...errors, kelas: "" });
  };

  const removeKelas = (kelasId) => {
    setFormData({
      ...formData,
      kelas: formData.kelas.filter((id) => id !== kelasId),
    });
    setErrors({ ...errors, kelas: "" });
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index].question = value;
    setFormData({ ...formData, questions: newQuestions });
    setErrors({ ...errors, [`question${index}`]: "" });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: "" }],
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, questions: newQuestions });
      setErrors({ ...errors, [`question${index}`]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (formData.title.length > 200)
      newErrors.title = "Title must be 200 characters or less";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (formData.description.length > 1000)
      newErrors.description = "Description must be 1000 characters or less";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.kelas.length)
      newErrors.kelas = "At least one class is required";
    if (formData.semester && !["I", "II"].includes(formData.semester))
      newErrors.semester = "Semester must be I or II";
    if (!formData.questions.length)
      newErrors.questions = "At least one question is required";
    formData.questions.forEach((q, i) => {
      if (!q.question.trim())
        newErrors[`question${i}`] = "Question is required";
      if (q.question.length > 500)
        newErrors[`question${i}`] = "Question must be 500 characters or less";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        kelas: formData.kelas,
        semester: formData.semester || undefined,
        questions: formData.questions.map((q) => ({
          _id: q._id || undefined,
          question: q.question,
        })),
      };
      updateMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm sm:text-base">
          {error.response?.data?.error ||
            "Failed to load quiz, categories, or classes"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Essay Quiz
        </h1>
        <Link
          to="/teachers/essay-quizzes"
          className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Link>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border dark:border-gray-700"
      >
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg text-sm sm:text-base">
            {errors.submit}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
            placeholder="Enter quiz title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
            placeholder="Enter quiz description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="mb-4">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
          >
            <option value="">Select a category</option>
            {data?.categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.category}
            </p>
          )}
        </div>

        {/* Classes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Classes
          </label>
          {/* Selected Classes as Tags */}
          {formData.kelas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.kelas.map((kelasId) => {
                const kelas = data?.kelasList?.find((k) => k._id === kelasId);
                return kelas ? (
                  <span
                    key={kelasId}
                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 rounded-full text-sm"
                  >
                    {kelas.name}
                    <button
                      type="button"
                      onClick={() => removeKelas(kelasId)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
          {/* Checkbox List for Available Classes */}
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 dark:border-gray-700">
            {data?.kelasList?.length > 0 ? (
              data.kelasList.map((kelas) => (
                <div key={kelas._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`kelas-${kelas._id}`}
                    checked={formData.kelas.includes(kelas._id)}
                    onChange={() => handleKelasChange(kelas._id)}
                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`kelas-${kelas._id}`}
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {kelas.name} {kelas.level ? `(Level ${kelas.level})` : ""}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No classes available
              </p>
            )}
          </div>
          {errors.kelas && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.kelas}
            </p>
          )}
        </div>

        {/* Semester */}
        <div className="mb-4">
          <label
            htmlFor="semester"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Semester
          </label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
          >
            <option value="">Select a semester</option>
            <option value="I">I</option>
            <option value="II">II</option>
          </select>
          {errors.semester && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.semester}
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Questions
          </label>
          {formData.questions.map((question, index) => (
            <div key={question._id || index} className="flex items-center mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  placeholder={`Question ${index + 1}`}
                  className="p-2 w-full border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
                />
                {errors[`question${index}`] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors[`question${index}`]}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                disabled={formData.questions.length === 1}
                className="ml-2 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
              >
                <FaTrash className="h-5 w-5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
          >
            <FaPlus className="mr-1 h-4 w-4" />
            Add Question
          </button>
          {errors.questions && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.questions}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/teachers/essay-quizzes")}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {updateMutation.isLoading && (
              <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
            )}
            Update Quiz
          </button>
        </div>
      </form>
    </div>
  );
}

export default EssayQuizEdit;
