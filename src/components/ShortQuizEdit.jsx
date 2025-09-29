/* eslint-disable no-unused-vars */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function ShortQuizEdit() {
  // Get data from loader
  const { quiz, categories, kelasList } = useLoaderData();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // Log loader data for debugging
  useEffect(() => {
    console.log("Loader Data:", { quiz, categories, kelasList });
  }, [quiz, categories, kelasList]);

  // Initialize form state with loaded data
  const [formData, setFormData] = useState({
    title: quiz.title || "",
    description: quiz.description || "",
    category: quiz.category?._id || quiz.category || "",
    kelas: Array.isArray(quiz.kelas)
      ? quiz.kelas.map((k) => k._id || k)
      : quiz.kelas?._id
      ? [quiz.kelas._id]
      : quiz.kelas
      ? [quiz.kelas]
      : [],
    semester: quiz.semester || "",
    questions: quiz.questions?.map((q) => ({
      _id: q._id,
      question: q.question,
      correctAnswer: q.correctAnswer,
    })) || [{ question: "", correctAnswer: "" }],
  });

  const [errors, setErrors] = useState({});

  // Mutation for updating quiz
  const updateMutation = useMutation({
    mutationFn: (data) =>
      api.put(`/v1/short-quiz/${quiz._id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries(["shortQuiz"]);
      const previousList = queryClient.getQueryData(["shortQuiz"]);

      queryClient.setQueryData(["shortQuiz"], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((q) =>
            q._id === quiz._id ? { ...q, ...updatedData } : q
          ),
        };
      });
      return { previousList };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["shortQuiz"], context?.previousList);
      toast.error(err.response?.data?.error || "Failed to update short quiz", {
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
        response.data?.message || "Short quiz updated successfully",
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
      queryClient.invalidateQueries(["shortQuiz"]);
      navigate("/teachers/short-quiz");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleKelasChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      let newKelas = [...prev.kelas];
      if (checked) {
        newKelas.push(value);
      } else {
        newKelas = newKelas.filter((id) => id !== value);
      }
      return { ...prev, kelas: newKelas };
    });
    setErrors({ ...errors, kelas: "" });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
    setErrors({ ...errors, [`question${index}`]: "", [`answer${index}`]: "" });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: "", correctAnswer: "" }],
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, questions: newQuestions });
      setErrors({
        ...errors,
        [`question${index}`]: "",
        [`answer${index}`]: "",
      });
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
      if (!q.correctAnswer.trim())
        newErrors[`answer${i}`] = "Correct answer is required";
      if (q.correctAnswer.length > 200)
        newErrors[`answer${i}`] = "Answer must be 200 characters or less";
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
          correctAnswer: q.correctAnswer,
        })),
      };
      updateMutation.mutate(payload);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Short Quiz
        </h1>
        <Link
          to="/teachers/short-quiz"
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
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No categories available
              </option>
            )}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.category}
            </p>
          )}
        </div>

        {/* Class - Updated for multiple selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Classes
          </label>
          <div className="space-y-2">
            {Array.isArray(kelasList) && kelasList.length > 0 ? (
              kelasList.map((kelas) => (
                <div key={kelas._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`kelas-${kelas._id}`}
                    value={kelas._id}
                    checked={formData.kelas.includes(kelas._id)}
                    onChange={handleKelasChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    htmlFor={`kelas-${kelas._id}`}
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {kelas.name}
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
            <div
              key={question._id || index}
              className="mb-4 border-b dark:border-gray-700 pb-4"
            >
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Question {index + 1}
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) =>
                      handleQuestionChange(index, "question", e.target.value)
                    }
                    placeholder={`Enter question ${index + 1}`}
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
                  className="ml-2 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 mt-6"
                >
                  <FaTrash className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) =>
                    handleQuestionChange(index, "correctAnswer", e.target.value)
                  }
                  placeholder={`Enter correct answer for question ${index + 1}`}
                  className="p-2 w-full border rounded-lg dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
                />
                {errors[`answer${index}`] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors[`answer${index}`]}
                  </p>
                )}
              </div>
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
            onClick={() => navigate("/teachers/short-quiz")}
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

export default ShortQuizEdit;
