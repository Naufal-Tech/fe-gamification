/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

// Function to create initial options with unique IDs
const createInitialOptions = (count = 3) => {
  const options = [];
  for (let i = 0; i < count; i++) {
    options.push({
      id: Date.now() + Math.random() * 10000 + i,
      text: "",
      isCorrect: false,
    });
  }
  return options;
};

function MultipleChoiceCreate() {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const { categories, kelas } = useLoaderData();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    kelas: [],
    semester: "",
    questions: [
      {
        question: "",
        options: createInitialOptions(3),
      },
    ],
  });
  const [errors, setErrors] = useState({});

  // Mutation for creating bundle
  const createMutation = useMutation({
    mutationFn: (data) =>
      api.post("/v1/multiple-choice", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Bundle created successfully");
      navigate("/teachers/multiple-choice");
    },
    onError: (err) => {
      console.error(
        "Create mutation failed:",
        err.response?.data || err.message
      );
      toast.error(
        err.response?.data?.error || "Failed to create multiple-choice bundle"
      );
      if (err.response?.data?.errors) {
        setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
      }
    },
  });

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    if (
      !formData.category ||
      !categories?.some((c) => c._id === formData.category)
    ) {
      if (categories === undefined)
        newErrors.category = "Categories are loading...";
      else if (!categories)
        newErrors.category = "Categories unavailable. Contact support.";
      else newErrors.category = "Valid category is required";
    }

    if (!Array.isArray(formData.kelas) || formData.kelas.length === 0) {
      newErrors.kelas = "At least one class is required";
    } else {
      const invalidKelas = formData.kelas.filter(
        (k) => !kelas?.some((kls) => kls._id === k)
      );
      if (invalidKelas.length > 0) {
        newErrors.kelas = `Invalid classes selected: ${invalidKelas.join(
          ", "
        )}`;
      }
    }

    if (!formData.semester.trim()) newErrors.semester = "Semester is required";

    if (!formData.questions.length)
      newErrors.questions = "At least one question is required";

    formData.questions.forEach((q, qIndex) => {
      if (!q.question.trim()) {
        newErrors[`question_${qIndex}`] = `Question ${
          qIndex + 1
        } text is required`;
      }
      if (q.options.length < 2) {
        newErrors[`options_${qIndex}`] = `Question ${
          qIndex + 1
        } must have at least two options`;
      }
      if (q.options.length > 5) {
        newErrors[`options_${qIndex}`] = `Question ${
          qIndex + 1
        } allows maximum five options`;
      }
      const correctCount = q.options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        newErrors[`correct_${qIndex}`] = `Question ${
          qIndex + 1
        }: Exactly one option must be marked as correct`;
      }
      q.options.forEach((opt, oIndex) => {
        if (!opt.text.trim()) {
          newErrors[`option_${qIndex}_${oIndex}`] = `Option ${
            oIndex + 1
          } text is required in Question ${qIndex + 1}`;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, categories, kelas]);

  // Handle input changes
  const handleInputChange = useCallback((e, questionIndex, optionIndex) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev };
      if (questionIndex === undefined) {
        newData[name] = value;
      } else if (optionIndex === undefined) {
        newData.questions[questionIndex] = {
          ...newData.questions[questionIndex],
          question: value,
        };
      } else {
        newData.questions[questionIndex].options[optionIndex] = {
          ...newData.questions[questionIndex].options[optionIndex],
          text: value,
        };
      }
      return newData;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (questionIndex === undefined) {
        delete newErrors[name];
      } else if (optionIndex === undefined) {
        delete newErrors[`question_${questionIndex}`];
      } else {
        delete newErrors[`option_${questionIndex}_${optionIndex}`];
      }
      return newErrors;
    });
  }, []);

  // Handle kelas selection change
  const handleKelasChange = useCallback((kelasId) => {
    setFormData((prev) => {
      const newKelas = prev.kelas.includes(kelasId)
        ? prev.kelas.filter((id) => id !== kelasId)
        : [...prev.kelas, kelasId];
      return { ...prev, kelas: newKelas };
    });
    setErrors((prev) => ({ ...prev, kelas: "" }));
  }, []);

  // Remove kelas
  const removeKelas = useCallback((kelasId) => {
    setFormData((prev) => ({
      ...prev,
      kelas: prev.kelas.filter((id) => id !== kelasId),
    }));
    setErrors((prev) => ({ ...prev, kelas: "" }));
  }, []);

  // Handle correct option selection
  const handleCorrectOption = useCallback((questionIndex, optionIndex) => {
    setFormData((prev) => {
      const newData = { ...prev };
      newData.questions[questionIndex] = {
        ...newData.questions[questionIndex],
        options: newData.questions[questionIndex].options.map((opt, i) => ({
          ...opt,
          isCorrect: i === optionIndex,
        })),
      };
      return newData;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`correct_${questionIndex}`];
      return newErrors;
    });
  }, []);

  // Add question
  const addQuestion = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: createInitialOptions(3),
        },
      ],
    }));
  }, []);

  // Remove question
  const removeQuestion = useCallback((questionIndex) => {
    if (window.confirm("Are you sure you want to remove this question?")) {
      setFormData((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== questionIndex),
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (
            key.startsWith(`question_${questionIndex}`) ||
            key.startsWith(`options_${questionIndex}`) ||
            key.startsWith(`correct_${questionIndex}`) ||
            key.startsWith(`option_${questionIndex}_`)
          ) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  }, []);

  // Add option
  const addOption = useCallback(
    (questionIndex) => {
      setFormData((prev) => {
        const newData = { ...prev };
        const currentOptions = newData.questions[questionIndex].options;
        if (currentOptions.length < 5) {
          const newOption = {
            id: Date.now() + Math.random() * 10000,
            text: "",
            isCorrect: false,
          };
          newData.questions[questionIndex] = {
            ...newData.questions[questionIndex],
            options: [...currentOptions, newOption],
          };
        } else {
          toast.error("Maximum 5 options allowed per question.");
        }
        return newData;
      });
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`options_${questionIndex}`];
        return newErrors;
      });
    },
    [toast]
  );

  // Remove option
  const removeOption = useCallback(
    (questionIndex, optionIndex) => {
      setFormData((prev) => {
        const newData = { ...prev };
        const currentOptions = newData.questions[questionIndex].options;
        if (currentOptions.length <= 3) {
          toast.error(`Question must have at least 3 options.`);
          return newData;
        }
        newData.questions[questionIndex] = {
          ...newData.questions[questionIndex],
          options: currentOptions.filter((_, i) => i !== optionIndex),
        };
        return newData;
      });
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`option_${questionIndex}_${optionIndex}`];
        delete newErrors[`options_${questionIndex}`];
        return newErrors;
      });
    },
    [toast]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (validateForm()) {
        const submitData = {
          ...formData,
          questions: formData.questions.map((q) => ({
            ...q,
            options: q.options.map(({ id, ...rest }) => rest),
          })),
        };
        createMutation.mutate(submitData);
      } else {
        toast.error("Please fix the errors in the form.");
      }
    },
    [formData, validateForm, createMutation]
  );

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Create New Multiple Choice Bundle
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange(e)}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter quiz title"
            disabled={createMutation.isLoading}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange(e)}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter quiz description"
            rows={4}
            disabled={createMutation.isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Category
          </label>
          <select
            name="category"
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange(e)}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              createMutation.isLoading || !categories || categories.length === 0
            }
          >
            <option value="">Select a category</option>
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))
            ) : categories === undefined ? (
              <option value="" disabled>
                Loading categories...
              </option>
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

        {/* Classes */}
        <div>
          <label
            htmlFor="kelas"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Classes
          </label>
          {/* Selected Classes as Tags */}
          {formData.kelas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.kelas.map((kelasId) => {
                const kls = kelas?.find((k) => k._id === kelasId);
                return kls ? (
                  <span
                    key={kelasId}
                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 rounded-full text-sm"
                  >
                    {kls.name}
                    <button
                      type="button"
                      onClick={() => removeKelas(kelasId)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                      disabled={createMutation.isLoading}
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
            {kelas && kelas.length > 0 ? (
              kelas.map((kls) => (
                <div key={kls._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`kelas-${kls._id}`}
                    checked={formData.kelas.includes(kls._id)}
                    onChange={() => handleKelasChange(kls._id)}
                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createMutation.isLoading}
                  />
                  <label
                    htmlFor={`kelas-${kls._id}`}
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {kls.name} {kls.level ? `(Level ${kls.level})` : ""}
                  </label>
                </div>
              ))
            ) : kelas === undefined ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading classes...
              </p>
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
        <div>
          <label
            htmlFor="semester"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Semester
          </label>
          <select
            name="semester"
            id="semester"
            value={formData.semester}
            onChange={(e) => handleInputChange(e)}
            className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createMutation.isLoading}
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
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Questions ({formData.questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createMutation.isLoading}
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Question
            </button>
          </div>
          {errors.questions && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">
              {errors.questions}
            </p>
          )}
          {formData.questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="border p-4 rounded-lg mb-6 bg-white dark:bg-gray-800 shadow-sm"
            >
              <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Question {qIndex + 1}
                </h3>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove Question"
                    disabled={createMutation.isLoading}
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                )}
              </div>

              <textarea
                value={question.question}
                onChange={(e) => handleInputChange(e, qIndex)}
                className="p-2 w-full border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-indigo-500 focus:border-indigo-500 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter question text"
                rows={2}
                disabled={createMutation.isLoading}
              />
              {errors[`question_${qIndex}`] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors[`question_${qIndex}`]}
                </p>
              )}

              {/* Options */}
              <div className="ml-4 mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Options ({question.options.length})
                </label>
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
                {question.options.map((option, oIndex) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={option.isCorrect}
                      onChange={() => handleCorrectOption(qIndex, oIndex)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={createMutation.isLoading}
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleInputChange(e, qIndex, oIndex)}
                      className="p-2 flex-1 border rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={`Option ${oIndex + 1}`}
                      disabled={createMutation.isLoading}
                    />
                    {question.options.length > 3 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Option"
                        disabled={createMutation.isLoading}
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    )}
                    {errors[`option_${qIndex}_${oIndex}`] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors[`option_${qIndex}_${oIndex}`]}
                      </p>
                    )}
                  </div>
                ))}

                {question.options.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createMutation.isLoading}
                  >
                    <FaPlus className="h-4 w-4 mr-1" />
                    Add Option
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/teachers/multiple-choice")}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createMutation.isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {createMutation.isLoading ? (
              <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-white rounded-full"></div>
            ) : null}
            {createMutation.isLoading ? "Creating..." : "Create Bundle"}
          </button>
        </div>
        {errors.submit && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
            {errors.submit}
          </p>
        )}
      </form>
    </div>
  );
}

export default MultipleChoiceCreate;
