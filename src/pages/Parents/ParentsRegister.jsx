/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiBook,
  FiEye,
  FiEyeOff,
  FiLock,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";

function ParentRegister() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    gender: "",
    linkedStudents: "", // This is a string (e.g., "12345678" or "12345678, 789012")
  });

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTimeRemaining, setRateLimitTimeRemaining] = useState(0);
  const rateLimitTimerRef = useRef(null);

  // Rate limit configuration
  const MAX_ATTEMPTS = 5; // Max submission attempts
  const RATE_LIMIT_DURATION = 60; // Duration in seconds
  const storedAttempts = useRef({
    count: parseInt(localStorage.getItem("registerAttempts") || "0"),
    timestamp: parseInt(localStorage.getItem("registerTimestamp") || "0"),
  });

  // Check and reset rate limit on component mount
  useEffect(() => {
    checkRateLimit();
    return () => {
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, []);

  // Check if the user is rate limited
  const checkRateLimit = () => {
    const now = Date.now();
    const { count, timestamp } = storedAttempts.current;

    // If the timestamp is older than the rate limit duration, reset the count
    if (now - timestamp > RATE_LIMIT_DURATION * 1000) {
      storedAttempts.current = { count: 0, timestamp: now };
      localStorage.setItem("registerAttempts", "0");
      localStorage.setItem("registerTimestamp", now.toString());
      setIsRateLimited(false);
      return false;
    }

    // If the user has made too many attempts, they are rate limited
    if (count >= MAX_ATTEMPTS) {
      const timeRemaining = Math.ceil(
        (timestamp + RATE_LIMIT_DURATION * 1000 - now) / 1000
      );
      setIsRateLimited(true);
      setRateLimitTimeRemaining(timeRemaining);
      startRateLimitTimer(timeRemaining);
      return true;
    }

    return false;
  };

  // Start a timer to update the rate limit countdown
  const startRateLimitTimer = (initialTime) => {
    if (rateLimitTimerRef.current) {
      clearInterval(rateLimitTimerRef.current);
    }

    setRateLimitTimeRemaining(initialTime);

    rateLimitTimerRef.current = setInterval(() => {
      setRateLimitTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(rateLimitTimerRef.current);
          setIsRateLimited(false);
          localStorage.setItem("registerAttempts", "0");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Update attempts count and timestamp
  const updateRateLimitAttempts = () => {
    const now = Date.now();
    const newCount = storedAttempts.current.count + 1;
    storedAttempts.current = { count: newCount, timestamp: now };
    localStorage.setItem("registerAttempts", newCount.toString());
    localStorage.setItem("registerTimestamp", now.toString());

    if (newCount >= MAX_ATTEMPTS) {
      setIsRateLimited(true);
      startRateLimitTimer(RATE_LIMIT_DURATION);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    else if (formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    else if (!/^\d{10,}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Must be at least 10 digits";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])/.test(formData.password))
      newErrors.password =
        "Password must include at least one lowercase letter";
    else if (!/(?=.*[A-Z])/.test(formData.password))
      newErrors.password =
        "Password must include at least one uppercase letter";
    else if (!/(?=.*\d)/.test(formData.password))
      newErrors.password = "Password must include at least one number";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords don't match";

    if (!formData.fullName) newErrors.fullName = "Full name is required";
    else if (formData.fullName.length < 2)
      newErrors.fullName = "Full name is too short";

    if (!formData.gender) newErrors.gender = "Gender is required";

    if (!formData.linkedStudents)
      newErrors.linkedStudents = "At least one student NIS is required";
    else {
      const studentNisArray = formData.linkedStudents
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      if (studentNisArray.some((nis) => !/^\d+$/.test(nis))) {
        newErrors.linkedStudents = "Student NIS should only contain numbers";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if rate limited
    if (isRateLimited) {
      return;
    }

    setSubmitCount((prev) => prev + 1);

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // If there are errors, don't count this as an attempt for rate limiting
      return;
    }

    setLoading(true);
    updateRateLimitAttempts(); // Update attempt count

    try {
      // Convert the comma-separated string to a JSON string array
      const linkedStudentsArray = formData.linkedStudents
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s); // Remove empty entries
      const linkedStudentsJSON = JSON.stringify(linkedStudentsArray); // e.g., "[12345678]" or "[12345678, 789012]"

      const response = await api.post(
        `/v1/users/register-parents`,
        {
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          fullName: formData.fullName,
          gender: formData.gender,
          linkedStudents: linkedStudentsJSON, // Send as a JSON string
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000, // 10 seconds timeout
        }
      );

      if (response.data.success) {
        // Reset rate limit attempts on successful registration
        localStorage.setItem("registerAttempts", "0");

        navigate("/verify-email", {
          state: { email: formData.email, userId: response.data.user._id },
        });
      }
    } catch (error) {
      // Handle different types of errors
      if (error.code === "ECONNABORTED") {
        setErrors({
          submit: "Request timed out. Please try again.",
        });
      } else if (error.response) {
        // Server responded with an error
        const serverMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Registration failed. Please try again.";

        // Handle specific error codes
        if (error.response.status === 409) {
          if (serverMessage.includes("email")) {
            setErrors({
              email: "This email is already registered",
              submit:
                "This email is already registered. Please use a different email address.",
            });
          } else if (serverMessage.includes("username")) {
            setErrors({
              username: "This username is already taken",
              submit:
                "This username is already taken. Please choose a different username.",
            });
          } else {
            setErrors({
              submit: serverMessage,
            });
          }
        } else if (error.response.status === 429) {
          setIsRateLimited(true);
          startRateLimitTimer(
            error.response.data.retryAfter || RATE_LIMIT_DURATION
          );
          setErrors({
            submit: "Too many attempts. Please try again later.",
          });
        } else {
          setErrors({
            submit: serverMessage,
          });
        }
      } else if (error.request) {
        // Request was made but no response received
        setErrors({
          submit: "Network error. Please check your connection and try again.",
        });
      } else {
        // Something else happened while setting up the request
        setErrors({
          submit: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

          <div className="p-8 space-y-6">
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Parent Registration
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Create an account to access your child's information
              </p>
            </motion.div>

            {isRateLimited && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-4 rounded-r-md flex items-start space-x-3"
              >
                <FiAlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Too many attempts
                  </span>
                  <span className="text-sm text-amber-600 dark:text-amber-300">
                    Please try again in {rateLimitTimeRemaining} seconds
                  </span>
                </div>
              </motion.div>
            )}

            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-r-md flex items-start space-x-3"
              >
                <FiAlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {errors.submit}
                </span>
              </motion.div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.fullName
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="John Doe"
                    disabled={loading || isRateLimited}
                  />
                </div>
                {errors.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.fullName}
                  </motion.p>
                )}
              </motion.div>

              {/* Username */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Username
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.username
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="johndoe123"
                    disabled={loading || isRateLimited}
                  />
                </div>
                {errors.username && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.email
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="you@example.com"
                    disabled={loading || isRateLimited}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>

              {/* Phone Number */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Phone Number
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.phoneNumber
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="081234567890"
                    disabled={loading || isRateLimited}
                    autoComplete="tel"
                  />
                </div>
                {errors.phoneNumber && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.phoneNumber}
                  </motion.p>
                )}
              </motion.div>

              {/* Gender */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Laki-Laki", "Perempuan"].map((gender) => (
                    <label
                      key={gender}
                      className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.gender === gender
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      } ${
                        loading || isRateLimited
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={handleChange}
                        className="sr-only"
                        disabled={loading || isRateLimited}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {gender}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.gender}
                  </motion.p>
                )}
              </motion.div>

              {/* Linked Students */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="linkedStudents"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Student NIS (Comma separated)
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBook className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type="text"
                    id="linkedStudents"
                    name="linkedStudents"
                    value={formData.linkedStudents}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.linkedStudents
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="12345678, 789012"
                    disabled={loading || isRateLimited}
                  />
                </div>
                {errors.linkedStudents && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.linkedStudents}
                  </motion.p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.password
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="••••••••"
                    disabled={loading || isRateLimited}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none rounded-full p-1 ${
                      loading || isRateLimited
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={loading || isRateLimited}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 rounded-lg border bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${
                      errors.confirmPassword
                        ? "border-red-500 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    placeholder="••••••••"
                    disabled={loading || isRateLimited}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none rounded-full p-1 ${
                      loading || isRateLimited
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={loading || isRateLimited}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-2">
                <button
                  type="submit"
                  disabled={loading || isRateLimited}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300
                    ${
                      loading || isRateLimited
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Processing...
                    </div>
                  ) : (
                    "Register"
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  Log in
                </Link>
              </p>
            </motion.div>
          </div>

          <div className="px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By registering, you agree to our{" "}
              <Link
                to="/terms"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ParentRegister;
