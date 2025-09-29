import React, { useState } from "react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminTeacherCreate() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    gender: "",
    noIdentity: "",
    birthdate: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if user is authorized (Admin or Super)
  const isAuthorized = user && (user.role === "Admin" || user.role === "Super");

  // Ensure only admins can access this form
  if (!user || !["Admin", "Super"].includes(user.role)) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Access denied. Admin privileges required.
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    else if (formData.username.includes(" "))
      newErrors.username = "Username cannot contain spaces";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email address";

    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    else if (!/^\d{10,}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Phone number must be at least 10 digits";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.fullName) newErrors.fullName = "Full name is required";

    if (!formData.noIdentity) newErrors.noIdentity = "Teacher ID is required";
    else if (!/^\d+$/.test(formData.noIdentity))
      newErrors.noIdentity = "Teacher ID must contain only numbers";

    if (!formData.gender) newErrors.gender = "Gender is required";

    if (formData.birthdate) {
      const birthdate = new Date(formData.birthdate);
      const today = new Date();
      if (isNaN(birthdate.getTime())) {
        newErrors.birthdate = "Please enter a valid date";
      } else if (birthdate > today) {
        newErrors.birthdate = "Birthdate cannot be in the future";
      }
    }

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
      // Get token from localStorage or cookies
      const token =
        localStorage.getItem("accessToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];

      await api.post(
        `/v1/admin/register`,
        {
          ...formData,
          role: "Guru", // Force Guru role for this form
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add this line
          },
        }
      );

      setSuccess(true);
      navigate("/admin/teachers", {
        state: { successMessage: "Teacher account created successfully" },
      });
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg =
        error.response?.data?.error || error.message || "Registration failed";
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
            to="/admin/teachers"
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
            Back to Teachers
          </Link>
          <div className="text-center pt-8 pb-4">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-white text-indigo-600">
                <FaChalkboardTeacher className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Register New Teacher</h1>
            <p className="mt-2 opacity-90">Add a new teacher to the system</p>
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
                Teacher account created successfully!
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.username
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    placeholder="teacher_username"
                    disabled={loading}
                  />
                  {!errors.username && formData.username && (
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
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.email
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    placeholder="teacher@example.com"
                    disabled={loading}
                  />
                  {!errors.email && formData.email && (
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
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.phoneNumber
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    placeholder="1234567890"
                    disabled={loading}
                  />
                  {!errors.phoneNumber && formData.phoneNumber && (
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
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Birthdate */}
              <div>
                <label
                  htmlFor="birthdate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Birthdate (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="birthdate"
                    id="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.birthdate
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    disabled={loading}
                  />
                </div>
                {errors.birthdate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.birthdate}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                {formData.password && !errors.password && (
                  <p className="mt-1 text-xs text-green-600">
                    Password meets requirements
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword &&
                  !errors.confirmPassword && (
                    <p className="mt-1 text-xs text-green-600">
                      Passwords match
                    </p>
                  )}
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.fullName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                  placeholder="John Doe"
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.gender
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors appearance-none bg-white`}
                  disabled={loading}
                >
                  <option value="">Select gender</option>
                  <option value="Laki-Laki">Male</option>
                  <option value="Perempuan">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>

              {/* Teacher ID */}
              <div>
                <label
                  htmlFor="noIdentity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Teacher ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="noIdentity"
                  id="noIdentity"
                  value={formData.noIdentity}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.noIdentity
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                  placeholder="123456789"
                  disabled={loading}
                />
                {errors.noIdentity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.noIdentity}
                  </p>
                )}
              </div>
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
                  Creating teacher account...
                </>
              ) : (
                "Register Teacher"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminTeacherCreate;
