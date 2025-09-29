import React, { useState } from "react";
import { FiBook } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminKelasCreate() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if user is authorized (Admin or Super)
  const isAuthorized = user && (user.role === "Admin" || user.role === "Super");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Class name is required";
    else if (formData.name.length < 2)
      newErrors.name = "Class name must be at least 2 characters";
    else if (formData.name.length > 50)
      newErrors.name = "Class name must be less than 50 characters";

    if (formData.description && formData.description.length > 200)
      newErrors.description = "Description must be less than 200 characters";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      setErrors({ submit: "You are not authorized to perform this action" });
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post(
        `/v1/kelas`,
        {
          name: formData.name.trim(),
          description: formData.description?.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setSuccess(true);
      navigate("/admin/kelas", {
        state: { successMessage: "Class created successfully" },
      });
    } catch (error) {
      console.error("Create class error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to create class";
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
            <Link
              to="/admin"
              className="absolute left-6 top-6 flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Admin
            </Link>
            <div className="text-center pt-8 pb-4">
              <h1 className="text-3xl font-bold">Unauthorized Access</h1>
            </div>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <Link
              to="/admin"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with Back Button */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <Link
            to="/admin/kelas"
            className="absolute left-6 top-6 flex items-center text-white hover:text-blue-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Classes
          </Link>
          <div className="text-center pt-8 pb-4">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-white text-indigo-600">
                <FiBook className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Create New Class</h1>
            <p className="mt-2 opacity-90">Add a new class to the system</p>
          </div>
        </div>

        <div className="p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mt-0.5 mr-2 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-700">
                Class created successfully!
              </span>
            </div>
          )}

          {/* Error Alert */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 mt-0.5 mr-2 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700">{errors.submit}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Class Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Class Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                  placeholder="e.g., Mathematics 101"
                  disabled={loading}
                />
                {!errors.name && formData.name && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 absolute right-3 top-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.description
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                placeholder="Brief description about the class..."
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
              {formData.description && !errors.description && (
                <p className="mt-1 text-xs text-gray-500">
                  {200 - formData.description.length} characters remaining
                </p>
              )}
            </div>

            {/* Required fields notice */}
            <p className="text-sm text-gray-500 mt-2">
              <span className="text-red-500">*</span> Required fields
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating class...
                </>
              ) : (
                "Create Class"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminKelasCreate;
