import React, { useState } from "react";
import {
  FaBolt,
  FaCrown,
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

function SignIn() {
  const [formData, setFormData] = useState({
    userLogin: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Helper function to sanitize user input
  const sanitizeUserLogin = (input) => {
    const trimmed = input.trim();

    // Check if input looks like an email (contains @ symbol)
    if (trimmed.includes("@")) {
      return trimmed.toLowerCase(); // Email should be lowercase
    }

    // Check if input looks like a phone number (contains only digits, spaces, +, -, (, ))
    if (/^[\d\s+\-()]+$/.test(trimmed)) {
      return trimmed.replace(/\s+/g, ""); // Remove spaces from phone numbers
    }

    // For username, convert to lowercase for case-insensitive matching
    return trimmed.toLowerCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.submit || errors.emailVerification) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors.submit;
        delete newErrors.emailVerification;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate userLogin after sanitization
    const sanitizedUserLogin = sanitizeUserLogin(formData.userLogin);
    if (!sanitizedUserLogin) {
      newErrors.userLogin =
        "Champion ID, Email, or Phone required to enter the realm";
    }

    if (!formData.password) {
      newErrors.password = "Secret passphrase is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Sanitize the userLogin before sending to API
      const sanitizedUserLogin = sanitizeUserLogin(formData.userLogin);

      const loginPayload = {
        ...formData,
        userLogin: sanitizedUserLogin,
      };

      // Simulated login process for demo
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful login
      console.log("Quest Master login successful!", loginPayload);

      // Redirect to dashboard or home page after successful login
      // navigate('/dashboard'); // Uncomment this when you have a dashboard route
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({
        submit:
          "Login quest failed. Check your credentials and try again, brave adventurer!",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle navigation to sign-up page
  const handleCreateChampion = () => {
    navigate("/sign-up");
  };

  // Function to handle forgot password navigation
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

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
      </div>

      <div className="w-full max-w-md relative z-10">
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
            ENTER THE REALM
          </p>
          <p className="text-purple-300/80 text-sm mt-2">
            Sign in to continue your epic journey
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
          {/* Header with gaming stats */}
          <div className="bg-gradient-to-r from-purple-800/90 to-blue-800/90 p-6 text-center border-b border-purple-500/30">
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <FaTrophy className="text-yellow-400" />
                <span className="text-yellow-300">Champions Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaFire className="text-orange-400 animate-pulse" />
                <span className="text-orange-300">1,247</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6" noValidate>
            {errors.submit && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg text-sm backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <FaShield className="text-red-400" />
                  <span>{errors.submit}</span>
                </div>
              </div>
            )}

            {errors.emailVerification && (
              <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 p-4 rounded-lg text-sm backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <FaBolt className="text-yellow-400" />
                  <span>{errors.emailVerification}</span>
                </div>
                <button className="font-medium text-yellow-400 hover:text-yellow-300 underline">
                  Resend Verification Quest
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="userLogin"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                <div className="flex items-center space-x-2">
                  <FaUser className="text-purple-400" />
                  <span>Champion ID / Email / Phone</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="userLogin"
                  name="userLogin"
                  value={formData.userLogin}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                    errors.userLogin
                      ? "border-red-500 focus:ring-red-400"
                      : "border-purple-500/50 hover:border-purple-400"
                  }`}
                  placeholder="Enter your champion credentials"
                  disabled={loading}
                  autoComplete="username"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <FaRocket className="h-5 w-5 text-purple-400/60" />
                </div>
              </div>
              {errors.userLogin && (
                <p className="mt-2 text-xs text-red-400 flex items-center space-x-1">
                  <FaShield className="text-red-400" />
                  <span>{errors.userLogin}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                <div className="flex items-center space-x-2">
                  <FaLock className="text-purple-400" />
                  <span>Secret Passphrase</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm ${
                    errors.password
                      ? "border-red-500 focus:ring-red-400"
                      : "border-purple-500/50 hover:border-purple-400"
                  }`}
                  placeholder="Enter your secret passphrase"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400 hover:text-yellow-400 focus:outline-none transition-colors duration-200"
                  aria-label={
                    showPassword ? "Hide passphrase" : "Show passphrase"
                  }
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 bg-gray-800 border-purple-500 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-3 block text-sm text-purple-200"
                >
                  Remember this champion
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                >
                  Forgot passphrase?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105 ${
                  loading
                    ? "opacity-70 cursor-not-allowed scale-100"
                    : "shadow-yellow-500/30 hover:shadow-yellow-500/50"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span>Entering Realm...</span>
                  </>
                ) : (
                  <>
                    <FaRocket className="mr-3 animate-pulse" />
                    <span>BEGIN QUEST</span>
                    <FaStar className="ml-3 animate-pulse" />
                  </>
                )}
              </button>
            </div>

            {/* Gaming elements */}
            <div className="pt-4 border-t border-purple-500/30">
              <div className="flex justify-center space-x-4 text-xs text-purple-300">
                <div className="flex items-center space-x-1">
                  <FaCrown className="text-yellow-400" />
                  <span>Premium</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaShield className="text-blue-400" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaBolt className="text-purple-400" />
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </form>

          <div className="bg-gray-800/50 px-8 py-6 text-center border-t border-purple-500/30 backdrop-blur-sm">
            <p className="text-sm text-purple-300">
              New to the realm?{" "}
              <button
                onClick={handleCreateChampion}
                className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors duration-200 underline"
              >
                Create Champion Account
              </button>
            </p>
            <p className="text-xs text-purple-400 mt-2">
              Join thousands of adventurers on epic quests
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-purple-400/80">
            © {new Date().getFullYear()} Quest Master Academy. All rights
            reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-purple-500">
            <span>Privacy Shield</span>
            <span>•</span>
            <span>Terms of Quest</span>
            <span>•</span>
            <span>Help Center</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
