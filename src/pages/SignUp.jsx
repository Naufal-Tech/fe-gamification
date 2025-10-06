import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaBolt,
  FaCheckCircle,
  FaCrown,
  FaDragon,
  FaExclamationCircle,
  FaFire,
  FaGamepad,
  FaLock,
  FaRocket,
  FaStar,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; // Adjust path to your API utility

function SignUp() {
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
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [rateLimitTimeRemaining, setRateLimitTimeRemaining] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case "username":
        if (!value) return "Champion name is required";
        if (value.length < 3)
          return "Champion name must be at least 3 characters";
        if (value.length > 20)
          return "Champion name must be less than 20 characters";
        if (value.includes(" ")) return "Champion name cannot contain spaces";
        if (!/^[a-zA-Z0-9_]+$/.test(value))
          return "Only letters, numbers and underscores allowed";
        return "";
      case "email":
        if (!value) return "Magic scroll (email) is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid magic scroll address";
        return "";
      case "phoneNumber":
        if (!value) return "Crystal ball number is required";
        if (!/^\d+$/.test(value)) return "Only numbers allowed";
        if (value.length < 10)
          return "Crystal ball number must be at least 10 digits";
        if (value.length > 15) return "Crystal ball number seems too long";
        return "";
      case "password":
        if (!value) return "Secret spell is required";
        if (value.length < 8)
          return "Secret spell must be at least 8 characters";
        if (value.length > 50) return "Secret spell is too long";
        return "";
      case "confirmPassword":
        if (!value) return "Confirm your secret spell";
        if (value !== formData.password) return "Secret spells do not match";
        return "";
      case "fullName":
        if (!value) return "True name is required";
        if (value.length < 3) return "True name must be at least 3 characters";
        if (value.length > 50)
          return "True name must be less than 50 characters";
        return "";
      case "gender":
        if (!value) return "Choose your path";
        return "";
      case "birthdate":
        if (value) {
          const date = new Date(value);
          const today = new Date();
          if (isNaN(date.getTime()))
            return "Please enter a valid day of awakening";
          if (date > today) return "Day of awakening cannot be in the future";
          const age = Math.floor(
            (today - date) / (365.25 * 24 * 60 * 60 * 1000)
          );
          if (age < 13) return "You must be at least 13 years old to join";
        }
        return "";
      default:
        return "";
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (
      name === "password" &&
      formData.confirmPassword &&
      touched.confirmPassword
    ) {
      const confirmError =
        formData.confirmPassword !== value ? "Secret spells do not match" : "";
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }

    if (errors.submit) setErrors((prev) => ({ ...prev, submit: "" }));
    if (rateLimited) {
      setRateLimited(false);
      setRateLimitMessage("");
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const parseBackendError = (error) => {
    if (error.response?.status === 429) {
      const errorMsg =
        error.response?.data?.message ||
        "Too many champions joining from this realm, please try again after 15 minutes";
      setRateLimited(true);
      setRateLimitMessage(errorMsg);
      const retryAfterSeconds =
        parseInt(error.response.headers?.["retry-after"], 10) || 900;
      setRateLimitTimeRemaining(retryAfterSeconds);
      return { submit: errorMsg };
    }

    const errorMsg =
      error.response?.data?.error || error.message || "Quest failed";

    if (errorMsg.includes("email") && errorMsg.includes("already")) {
      return {
        email:
          "This magic scroll is already registered. Please use a different one.",
        submit: "Quest failed: Magic scroll already exists",
      };
    } else if (errorMsg.includes("username") && errorMsg.includes("already")) {
      return {
        username:
          "This champion name is already taken. Please choose a different one.",
        submit: "Quest failed: Champion name already taken",
      };
    }

    return { submit: errorMsg };
  };

  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rateLimited) return;

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(
        Object.keys(formData).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        )
      );
      return;
    }

    setLoading(true);
    try {
      // ACTUAL API CALL to your backend
      const response = await api.post("/v1/users/register", {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        fullName: formData.fullName,
        gender: formData.gender,
        birthdate: formData.birthdate || undefined,
      });

      console.log("Registration successful:", response.data);

      // Show success toast
      toast.success(
        "Registration successful! Check your email for OTP verification."
      );

      // Redirect to verification page with user ID
      navigate("/verify-otp", {
        state: {
          userId: response.data.user._id,
          email: formData.email,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      const parsedErrors = parseBackendError(error);
      setErrors(parsedErrors);

      // Show error toast
      if (parsedErrors.submit) {
        toast.error(parsedErrors.submit);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  const isFieldValid = (name) => {
    return touched[name] && !errors[name] && formData[name];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
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
      </div>

      <div className="w-full max-w-4xl relative z-10">
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
            {rateLimited && (
              <div className="mb-6 p-4 bg-amber-900/50 border border-amber-500/50 rounded-lg flex items-start backdrop-blur-sm animate-pulse">
                <FaShield className="h-5 w-5 text-amber-400 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
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

            {errors.submit && !rateLimited && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-start backdrop-blur-sm">
                <FaExclamationCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 shrink-0" />
                <span className="text-red-300">{errors.submit}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username Field */}
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
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.username && touched.username
                          ? "border-red-500 focus:ring-red-400"
                          : isFieldValid("username")
                          ? "border-green-500"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Enter your champion name"
                      disabled={loading || rateLimited}
                    />
                    {isFieldValid("username") && (
                      <FaCheckCircle className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.username && touched.username && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.username}</span>
                    </p>
                  )}
                </div>

                {/* Email Field */}
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
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.email && touched.email
                          ? "border-red-500 focus:ring-red-400"
                          : isFieldValid("email")
                          ? "border-green-500"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="your@magic.scroll"
                      disabled={loading || rateLimited}
                    />
                    {isFieldValid("email") && (
                      <FaCheckCircle className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Phone Number Field */}
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
                      type="tel"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.phoneNumber && touched.phoneNumber
                          ? "border-red-500 focus:ring-red-400"
                          : isFieldValid("phoneNumber")
                          ? "border-green-500"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Enter crystal ball digits"
                      disabled={loading || rateLimited}
                    />
                    {isFieldValid("phoneNumber") && (
                      <FaCheckCircle className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.phoneNumber && touched.phoneNumber && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.phoneNumber}</span>
                    </p>
                  )}
                </div>

                {/* Birthdate Field */}
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
                    onBlur={handleBlur}
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 ${
                      errors.birthdate && touched.birthdate
                        ? "border-red-500 focus:ring-red-400"
                        : "border-purple-500/50 hover:border-purple-400"
                    }`}
                    style={{
                      colorScheme: "dark",
                      backgroundColor: "#1f2937",
                    }}
                    disabled={loading || rateLimited}
                  />
                  {errors.birthdate && touched.birthdate && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.birthdate}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
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
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.password && touched.password
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
                  {errors.password && touched.password && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.password}</span>
                    </p>
                  )}
                  {formData.password && !errors.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-purple-300">Spell Strength:</span>
                        <span
                          className={`font-medium ${
                            passwordStrength < 40
                              ? "text-red-400"
                              : passwordStrength < 70
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
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
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-500 focus:ring-red-400"
                          : isFieldValid("confirmPassword")
                          ? "border-green-500"
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
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                  {isFieldValid("confirmPassword") && (
                    <p className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                      <FaCheckCircle />
                      <span>Spells resonate perfectly</span>
                    </p>
                  )}
                </div>

                {/* Full Name Field */}
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
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                        errors.fullName && touched.fullName
                          ? "border-red-500 focus:ring-red-400"
                          : isFieldValid("fullName")
                          ? "border-green-500"
                          : "border-purple-500/50 hover:border-purple-400"
                      }`}
                      placeholder="Your true identity"
                      disabled={loading || rateLimited}
                    />
                    {isFieldValid("fullName") && (
                      <FaCheckCircle className="h-5 w-5 text-green-400 absolute right-3 top-3" />
                    )}
                  </div>
                  {errors.fullName && touched.fullName && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Gender Field */}
                {/* Gender Field - Updated */}
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
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                      errors.gender && touched.gender
                        ? "border-red-500 focus:ring-red-400"
                        : isFieldValid("gender")
                        ? "border-green-500"
                        : "border-purple-500/50 hover:border-purple-400"
                    }`}
                    disabled={loading || rateLimited}
                  >
                    <option value="">Select your path</option>
                    <option value="Laki-Laki">Warrior of Light</option>
                    <option value="Perempuan">Mistress of Magic</option>
                  </select>
                  {errors.gender && touched.gender && (
                    <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                      <FaExclamationCircle />
                      <span>{errors.gender}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="w-4 h-4 text-yellow-400 bg-gray-800 border-purple-500 rounded focus:ring-yellow-400 focus:ring-2"
                    required
                  />
                </div>
                <div className="text-sm">
                  <label
                    htmlFor="terms"
                    className="font-medium text-purple-200"
                  >
                    I accept the Ancient Scrolls of Covenant
                  </label>
                  <p className="text-purple-300 mt-1">
                    By joining Quest Master, you agree to our{" "}
                    <a
                      href="#"
                      className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                    >
                      Terms of Service
                    </a>
                    ,{" "}
                    <a
                      href="#"
                      className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                    >
                      Privacy Policy
                    </a>
                    , and the sacred{" "}
                    <a
                      href="#"
                      className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
                    >
                      Code of Champions
                    </a>
                    .
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || rateLimited}
                className={`w-full py-4 px-6 border border-transparent rounded-lg text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-300 transform hover:scale-105 focus:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                  loading ? "animate-pulse" : ""
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>FORGING LEGEND...</span>
                    </>
                  ) : (
                    <>
                      <FaDragon className="h-5 w-5" />
                      <span>BEGIN YOUR QUEST</span>
                    </>
                  )}
                </div>
              </button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-purple-500/30">
                <p className="text-purple-300">
                  Already a champion?{" "}
                  <a
                    href="/sign-in"
                    className="text-yellow-400 hover:text-yellow-300 font-bold underline transition-colors"
                  >
                    Enter the Realm
                  </a>
                </p>
              </div>
            </form>
          </div>

          {/* Footer Stats */}
          <div className="bg-gradient-to-r from-purple-800/90 to-blue-800/90 p-4 text-center border-t border-purple-500/30">
            <div className="flex justify-center space-x-6 text-xs text-purple-200">
              <div className="flex items-center space-x-1">
                <FaShield className="text-green-400" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaLock className="text-blue-400" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaTrophy className="text-yellow-400" />
                <span>No Spells</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-center">
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
            <FaTrophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-yellow-300 font-bold mb-1">Epic Quests</h3>
            <p className="text-purple-200 text-sm">
              Join thousands in legendary adventures
            </p>
          </div>
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
            <FaDragon className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-red-300 font-bold mb-1">Real-time Battles</h3>
            <p className="text-purple-200 text-sm">
              Challenge champions worldwide
            </p>
          </div>
          <div className="bg-purple-900/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
            <FaCrown className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <h3 className="text-orange-300 font-bold mb-1">
              Exclusive Rewards
            </h3>
            <p className="text-purple-200 text-sm">
              Earn unique treasures and titles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
