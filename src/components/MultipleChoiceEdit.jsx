import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

function MultipleChoiceEdit() {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    kelas: [],
    semester: "",
    questions: [],
  });
  const [errors, setErrors] = useState({});

  // Fetch bundle, categories, and kelas options
  const { data, isLoading, error } = useQuery({
    queryKey: ["multipleChoiceEdit", id],
    queryFn: async () => {
      const [bundleRes, categoriesRes, kelasRes] = await Promise.all([
        api.get(`/v1/multiple-choice/detail/${id}`, {
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
        bundle: bundleRes.data.data,
        categories: categoriesRes.data.data || [], // Use categoriesRes.data
        kelasList: kelasRes.data.kelas || [],
      };
    },
    onError: (err) => {
      console.error("useQuery Error:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.error ||
          "Failed to load bundle, categories, or classes",
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

  // Initialize form data when data is loaded
  useEffect(() => {
    if (data?.bundle) {
      const { bundle } = data;
      setFormData({
        title: bundle.title || "",
        description: bundle.description || "",
        category: bundle.category?._id || bundle.category || "",
        kelas: Array.isArray(bundle.kelas)
          ? bundle.kelas.map((k) => k._id)
          : bundle.kelas?._id
          ? [bundle.kelas._id]
          : [],
        semester: bundle.semester || "",
        questions:
          bundle.questions?.map((q) => ({
            _id: q._id,
            question: q.question,
            options: q.options.map((opt) => ({
              _id: opt._id,
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          })) || [],
      });
    }
  }, [data]);

  // Mutation for updating bundle
  const updateMutation = useMutation({
    mutationFn: (data) =>
      api.put(`/v1/multiple-choice/${id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries(["multipleChoiceEdit", id]);
      await queryClient.cancelQueries(["multipleChoice"]);
      const previousBundle = queryClient.getQueryData([
        "multipleChoiceEdit",
        id,
      ]);
      const previousList = queryClient.getQueryData(["multipleChoice"]);
      queryClient.setQueryData(["multipleChoiceEdit", id], (old) => ({
        ...old,
        bundle: { ...old.bundle, ...updatedData },
      }));
      queryClient.setQueryData(["multipleChoice"], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((b) =>
            b._id === id ? { ...b, ...updatedData } : b
          ),
        };
      });
      return { previousBundle, previousList };
    },
    onError: (err, updatedData, context) => {
      queryClient.setQueryData(
        ["multipleChoiceEdit", id],
        context?.previousBundle
      );
      queryClient.setQueryData(["multipleChoice"], context?.previousList);
      toast.error(
        err.response?.data?.error || "Failed to update multiple-choice bundle",
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
    onSuccess: (response) => {
      toast.success(response.data?.message || "Bundle updated successfully", {
        duration: 4000,
        style: {
          background: "#10b981",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "90vw",
          fontSize: "14px",
        },
      });
      queryClient.invalidateQueries(["multipleChoiceEdit", id]);
      queryClient.invalidateQueries(["multipleChoice"]);
      navigate("/teachers/multiple-choice");
    },
  });

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.description?.trim())
      newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.kelas.length)
      newErrors.kelas = "At least one class is required";
    if (!formData.questions?.length)
      newErrors.questions = "At least one question is required";

    formData.questions?.forEach((q, qIndex) => {
      if (!q.question.trim()) {
        newErrors[`question_${qIndex}`] = "Question text is required";
      }
      if (q.options.length < 2) {
        newErrors[`options_${qIndex}`] = "At least two options are required";
      }
      if (q.options.length > 5) {
        newErrors[`options_${qIndex}`] = "Maximum five options allowed";
      }
      const correctCount = q.options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        newErrors[`correct_${qIndex}`] =
          "Exactly one option must be marked as correct";
      }
      q.options.forEach((opt, oIndex) => {
        if (!opt.text.trim()) {
          newErrors[`option_${qIndex}_${oIndex}`] = "Option text is required";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e, questionIndex, optionIndex) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev };
      if (questionIndex === undefined) {
        newData[name] = value;
      } else if (optionIndex === undefined) {
        newData.questions[questionIndex].question = value;
      } else {
        newData.questions[questionIndex].options[optionIndex].text = value;
      }
      return newData;
    });
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(questionIndex !== undefined
        ? { [`question_${questionIndex}`]: "" }
        : {}),
      ...(optionIndex !== undefined
        ? { [`option_${questionIndex}_${optionIndex}`]: "" }
        : {}),
    }));
  };

  // Handle kelas changes
  const handleKelasChange = (kelasId) => {
    const updatedKelas = formData.kelas.includes(kelasId)
      ? formData.kelas.filter((id) => id !== kelasId)
      : [...formData.kelas, kelasId];
    setFormData({ ...formData, kelas: updatedKelas });
    setErrors({ ...errors, kelas: "" });
  };

  // Remove kelas
  const removeKelas = (kelasId) => {
    setFormData({
      ...formData,
      kelas: formData.kelas.filter((id) => id !== kelasId),
    });
    setErrors({ ...errors, kelas: "" });
  };

  // Handle correct option selection
  const handleCorrectOption = (questionIndex, optionIndex) => {
    setFormData((prev) => {
      const newData = { ...prev };
      newData.questions[questionIndex].options = newData.questions[
        questionIndex
      ].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optionIndex,
      }));
      return newData;
    });
    setErrors((prev) => ({ ...prev, [`correct_${questionIndex}`]: "" }));
  };

  // Add question
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ],
    }));
  };

  // Remove question
  const removeQuestion = (questionIndex) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== questionIndex),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`question_${questionIndex}`)) {
          delete newErrors[key];
        }
        if (key.startsWith(`options_${questionIndex}`)) {
          delete newErrors[key];
        }
        if (key.startsWith(`correct_${questionIndex}`)) {
          delete newErrors[key];
        }
        if (key.startsWith(`option_${questionIndex}`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  // Add option
  const addOption = (questionIndex) => {
    setFormData((prev) => {
      const newData = { ...prev };
      if (newData.questions[questionIndex].options.length < 5) {
        newData.questions[questionIndex].options.push({
          text: "",
          isCorrect: false,
        });
      }
      return newData;
    });
  };

  // Remove option
  const removeOption = (questionIndex, optionIndex) => {
    setFormData((prev) => {
      const newData = { ...prev };
      if (newData.questions[questionIndex].options.length > 2) {
        newData.questions[questionIndex].options = newData.questions[
          questionIndex
        ].options.filter((_, i) => i !== optionIndex);
      }
      return newData;
    });
    setErrors((prev) => ({
      ...prev,
      [`option_${questionIndex}_${optionIndex}`]: "",
      [`options_${questionIndex}`]: "",
    }));
  };

  // Handle form submission
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
          options: q.options.map((opt) => ({
            _id: opt._id || undefined,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        })),
      };
      updateMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg">
          {error.response?.data?.error ||
            "Failed to load bundle, categories, or classes"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Edit Multiple Choice Bundle
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            placeholder="Enter quiz title"
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            placeholder="Enter quiz description"
            rows="4"
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
            required
          >
            <option value="">Select a category</option>
            {data?.categories?.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
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
        <div>
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

        {/* Semester (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Semester (Optional)
          </label>
          <select
            name="semester"
            value={formData.semester}
            onChange={handleInputChange}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
          >
            <option value="">Select Semester</option>
            <option value="I">I</option>
            <option value="II">II</option>
          </select>
        </div>

        {/* Questions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Questions
          </label>
          {formData.questions.map((question, qIndex) => (
            <div
              key={question._id || qIndex}
              className="border p-4 rounded-lg mb-4 bg-white dark:bg-gray-800"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Question {qIndex + 1}
                </h3>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Remove Question"
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={question.question}
                onChange={(e) => handleInputChange(e, qIndex)}
                className="p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base mb-2"
                placeholder="Enter question text"
                required
              />
              {errors[`question_${qIndex}`] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors[`question_${qIndex}`]}
                </p>
              )}

              {/* Options */}
              <div className="ml-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Options
                </label>
                {question.options.map((option, oIndex) => (
                  <div
                    key={option._id || oIndex}
                    className="flex items-center mb-2 gap-2"
                  >
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={option.isCorrect}
                      onChange={() => handleCorrectOption(qIndex, oIndex)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleInputChange(e, qIndex, oIndex)}
                      className="p-2 flex-1 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base"
                      placeholder={`Option ${oIndex + 1}`}
                      required
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove Option"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {errors[`option_${qIndex}_${question.options.length - 1}`] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors[`option_${qIndex}_${question.options.length - 1}`]}
                  </p>
                )}
                {errors[`options_${qIndex}`] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors[`options_${qIndex}`]}
                  </p>
                )}
                {errors[`correct_${qIndex}`] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors[`correct_${qIndex}`]}
                  </p>
                )}
                {question.options.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                  >
                    <FaPlus className="h-4 w-4 mr-1" />
                    Add Option
                  </button>
                )}
              </div>
            </div>
          ))}
          {errors.questions && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.questions}
            </p>
          )}
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Question
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/teachers/multiple-choice")}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {updateMutation.isLoading ? (
              <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
            ) : null}
            Update Bundle
          </button>
        </div>
      </form>
    </div>
  );
}

export default MultipleChoiceEdit;
