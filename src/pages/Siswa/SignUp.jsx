/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  FaBolt,
  FaCrown,
  FaDragon,
  FaFire,
  FaGamepad,
  FaLock,
  FaMagic,
  FaRocket,
  FaStar,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function SignUp() {
  const classes = useLoaderData();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    gender: "",
    birthdate: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [rateLimitTimeRemaining, setRateLimitTimeRemaining] = useState(0);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errors.submit) setErrors((prev) => ({ ...prev, submit: "" }));

    // Clear rate limit error when user starts editing the form again
    if (rateLimited) {
      setRateLimited(false);
      setRateLimitMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Champion name is required";
    else if (formData.username.includes(" "))
      newErrors.username = "Champion name cannot contain spaces";

    if (!formData.email) newErrors.email = "Magic scroll (email) is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid magic scroll address";

    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Crystal ball number is required";
    else if (!/^\d{10,}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Crystal ball number must be at least 10 digits";

    if (!formData.password) newErrors.password = "Secret spell is required";
    else if (formData.password.length < 8)
      newErrors.password = "Secret spell must be at least 8 characters";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm your secret spell";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Secret spells do not match";

    if (!formData.fullName) newErrors.fullName = "True name is required";

    if (!formData.gender) newErrors.gender = "Choose your path";

    // Birthdate validation (optional field)
    if (formData.birthdate) {
      const birthdate = new Date(formData.birthdate);
      const today = new Date();
      if (isNaN(birthdate.getTime())) {
        newErrors.birthdate = "Please enter a valid day of awakening";
      } else if (birthdate > today) {
        newErrors.birthdate = "Day of awakening cannot be in the future";
      }
    }

    return newErrors;
  };

  // Parse backend error messages into user-friendly format
  const parseBackendError = (error) => {
    // Check for rate limiting errors first
    if (error.response?.status === 429) {
      const errorMsg =
        error.response?.data?.message ||
        "Too many champions joining from this realm, please try again after 15 minutes";

      setRateLimited(true);
      setRateLimitMessage(errorMsg);

      // Calculate time remaining if possible
      if (error.response?.headers?.["retry-after"]) {
        const retryAfterSeconds = parseInt(
          error.response.headers["retry-after"],
          10
        );
        setRateLimitTimeRemaining(retryAfterSeconds);
      } else {
        // Default to 15 minutes if no retry-after header
        setRateLimitTimeRemaining(15 * 60);
      }

      return { submit: errorMsg };
    }

    const errorMsg =
      error.response?.data?.error || error.message || "Quest failed";

    // Handle specific error cases
    if (errorMsg.includes("duplicate key error")) {
      // Check for specific duplicate key errors
      if (errorMsg.includes("email")) {
        return {
          email:
            "This magic scroll is already registered. Please use a different one.",
          submit: "Quest failed: Magic scroll already exists",
        };
      } else if (errorMsg.includes("username")) {
        return {
          username:
            "This champion name is already taken. Please choose a different one.",
          submit: "Quest failed: Champion name already taken",
        };
      }
    }

    // Handle specific validation errors
    if (errorMsg.includes("Username cannot contain spaces")) {
      return { username: "Champion name cannot contain spaces" };
    }

    if (errorMsg.includes("valid phone number")) {
      return {
        phoneNumber:
          "Please provide a valid crystal ball number with at least 10 digits",
      };
    }

    if (errorMsg.includes("valid birthdate")) {
      return {
        birthdate:
          "Please provide a valid day of awakening that is not in the future",
      };
    }

    // Default case - display the error in the submit field
    return { submit: errorMsg };
  };

  // Format remaining time for rate limit display
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Don't submit if rate limited
    if (rateLimited) {
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        `/v1/users/register`,
        {
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          fullName: formData.fullName,
          gender: formData.gender,
          birthdate: formData.birthdate || undefined,
        },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );
      console.log("Success:", response.data);

      let userData = formData;
      if (response.data.user) {
        userData = response.data.user;
        setUser(response.data.user);
      } else {
        setUser({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          birthdate: formData.birthdate,
        });
      }

      setSuccess(true);
      navigate("/verify-email", {
        state: { email: formData.email, userId: userData._id },
      });
    } catch (error) {
      console.error("Registration error:", error);
      const parsedErrors = parseBackendError(error);
      setErrors(parsedErrors);
    } finally {
      setLoading(false);
    }
  };

  // Set up countdown timer for rate limit if active
  React.useEffect(() => {
    let timer;
    if (rateLimited && rateLimitTimeRemaining > 0) {
      timer = setInterval(() => {
        setRateLimitTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setRateLimited(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [rateLimited, rateLimitTimeRemaining]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-60 right-40 w-24 h-24 bg-purple-400/10 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-40 w-20 h-20 bg-blue-400/10 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-28 h-28 bg-pink-400/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-green-400/10 rounded-full blur-lg animate-bounce"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div className="relative">
              <FaGamepad className="text-5xl text-yellow-400 drop-shadow-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-purple-900"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
            QUEST MASTER
          </h1>
          <p className="text-purple-200 text-lg font-medium tracking-wide">
            FORGE YOUR LEGEND
          </p>
          <p className="text-purple-300/80 text-sm mt-2">
            Join thousands of champions in epic adventures
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
          {/* Header with gaming stats */}
          <div className="bg-gradient-to-r from-purple-800/90 to-blue-800/90 p-6 text-center border-b border-purple-500/30">
            <div className="flex justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <FaTrophy className="text-yellow-400" />
                <span className="text-yellow-300">2,847 Champions</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaFire className="text-orange-400 animate-pulse" />
                <span className="text-orange-300">156 Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaDragon className="text-red-400" />
                <span className="text-red-300">78 Quests Today</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Rate Limit Alert */}
            {rateLimited && (
              <div className="mb-6 p-4 bg-amber-900/50 border border-amber-500/50 rounded-lg flex items-start backdrop-blur-sm">
                <FaShield className="h-5 w-5 text-amber-400 mt-0.5 mr-3 shrink-0" />
                <div>
                  <span className="text-amber-300 font-medium">
                    Realm Protection Active
                  </span>
                  <p className="text-amber-200 mt-1">{rateLimitMessage}</p>
                  {rateLimitTimeRemaining > 0 && (
                    <p className="text-amber-200 mt-1 font-medium">
                      Portal reopens in:{" "}
                      {formatTimeRemaining(rateLimitTimeRemaining)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errors.submit && !rateLimited && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-start backdrop-blur-sm">
                <FaShield className="h-5 w-5 text-red-400 mt-0.5 mr-3 shrink-0" />
                <span className="text-red-300">{errors.submit}</span>
              </div>
            )}

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Champion Name */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-purple-400" />
                      <span>Champion Name</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.username
                          ? "border-red-500 focus:ring-red-400"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Enter your champion name"
                      disabled={loading || rateLimited}
                    />
                    {!errors.username && formData.username && (
                      <FaMagic className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.username}</span>
                    </p>
                  )}
                </div>

                {/* Magic Scroll (Email) */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaBolt className="text-purple-400" />
                      <span>Magic Scroll (Email)</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.email
                          ? "border-red-500 focus:ring-red-400"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="your@magic.scroll"
                      disabled={loading || rateLimited}
                    />
                    {!errors.email && formData.email && (
                      <FaMagic className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Crystal Ball Number */}
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaDragon className="text-purple-400" />
                      <span>Crystal Ball Number</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.phoneNumber
                          ? "border-red-500 focus:ring-red-400"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Enter crystal ball digits"
                      disabled={loading || rateLimited}
                    />
                    {!errors.phoneNumber && formData.phoneNumber && (
                      <FaMagic className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.phoneNumber}</span>
                    </p>
                  )}
                </div>

                {/* Day of Awakening */}
                <div>
                  <label
                    htmlFor="birthdate"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaCrown className="text-purple-400" />
                      <span>Day of Awakening (Optional)</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    id="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                      errors.birthdate
                        ? "border-red-500 focus:ring-red-400"
                        : "border-purple-500/50 hover:border-purple-400"
                    }`}
                    disabled={loading || rateLimited}
                  />
                  {errors.birthdate && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.birthdate}</span>
                    </p>
                  )}
                </div>

                {/* Secret Spell */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaLock className="text-purple-400" />
                      <span>Secret Spell</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.password
                          ? "border-red-500 focus:ring-red-400"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Cast your secret spell"
                      disabled={loading || rateLimited}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-purple-400 hover:text-yellow-400 focus:outline-none transition-colors duration-200"
                      disabled={loading || rateLimited}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                  {formData.password && !errors.password && (
                    <p className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                      <FaMagic className="text-green-400" />
                      <span>Spell power sufficient</span>
                    </p>
                  )}
                </div>

                {/* Confirm Secret Spell */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaLock className="text-purple-400" />
                      <span>Confirm Secret Spell</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.confirmPassword
                          ? "border-red-500 focus:ring-red-400"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Re-cast your secret spell"
                      disabled={loading || rateLimited}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-purple-400 hover:text-yellow-400 focus:outline-none transition-colors duration-200"
                      disabled={loading || rateLimited}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                  {formData.confirmPassword &&
                    formData.password === formData.confirmPassword &&
                    !errors.confirmPassword && (
                      <p className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                        <FaMagic className="text-green-400" />
                        <span>Spells resonate perfectly</span>
                      </p>
                    )}
                </div>

                {/* True Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-purple-400" />
                      <span>True Name</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                      errors.fullName
                        ? "border-red-500 focus:ring-red-400"
                        : "border-purple-500/50 hover:border-purple-400"
                    }`}
                    placeholder="Your true identity"
                    disabled={loading || rateLimited}
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Choose Your Path */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-purple-200 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <FaRocket className="text-purple-400" />
                      <span>Choose Your Path</span>
                      <FaStar className="text-yellow-400 text-xs" />
                    </div>
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white backdrop-blur-sm appearance-none ${
                      errors.gender
                        ? "border-red-500 focus:ring-red-400"
                        : "border-purple-500/50 hover:border-purple-400"
                    }`}
                    disabled={loading || rateLimited}
                  >
                    <option value="">Select your warrior path</option>
                    <option value="Laki-Laki">Warrior of Strength</option>
                    <option value="Perempuan">Warrior of Wisdom</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaShield className="text-red-400" />
                      <span>{errors.gender}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Required fields notice */}
              <p className="text-sm text-purple-300 mt-4 flex items-center space-x-1">
                <FaStar className="text-yellow-400 text-xs" />
                <span>Required fields to begin your quest</span>
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105 ${
                  loading || rateLimited
                    ? "opacity-70 cursor-not-allowed scale-100"
                    : "shadow-yellow-500/30 hover:shadow-yellow-500/50"
                }`}
                disabled={loading || rateLimited}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span>Forging Your Legend...</span>
                  </>
                ) : rateLimited ? (
                  "Portal Temporarily Sealed"
                ) : (
                  <>
                    <FaRocket className="mr-3 animate-pulse" />
                    <span>BEGIN YOUR QUEST</span>
                    <FaStar className="ml-3 animate-pulse" />
                  </>
                )}
              </button>

              {/* Login Link */}
              <div className="text-center mt-6 pt-6 border-t border-purple-500/30">
                <p className="text-purple-300">
                  Already a champion?{" "}
                  <Link
                    to="/sign-in"
                    className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors duration-200 underline"
                  >
                    Enter the Realm
                  </Link>
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-purple-500/30">
              <p className="text-xs text-purple-400 text-center">
                By forging your legend, you agree to our{" "}
                <Link
                  to="/terms"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Quest Charter
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Realm Privacy
                </Link>
                .
              </p>

              {/* Gaming elements */}
              <div className="flex justify-center space-x-6 mt-4 text-xs text-purple-300">
                <div className="flex items-center space-x-1">
                  <FaCrown className="text-yellow-400" />
                  <span>Elite</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaShield className="text-blue-400" />
                  <span>Protected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaBolt className="text-purple-400" />
                  <span>Instant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-purple-400/80">
            © {new Date().getFullYear()} Quest Master Academy. All rights
            reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-purple-500">
            <span>Realm Privacy</span>
            <span>•</span>
            <span>Quest Terms</span>
            <span>•</span>
            <span>Champion Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
