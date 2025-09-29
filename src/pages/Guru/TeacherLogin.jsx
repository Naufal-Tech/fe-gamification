import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function TeacherLogin() {
  const [userLogin, setUserLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailVerificationError, setEmailVerificationError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { setAuth, clearAuth } = useAuthStore();

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

    // For username and noIdentity, keep original case but trimmed
    return trimmed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailVerificationError("");

    try {
      // Sanitize the userLogin input
      const sanitizedUserLogin = sanitizeUserLogin(userLogin);

      // Additional validation
      if (!sanitizedUserLogin) {
        throw new Error("Please enter your email, username, phone, or NIS");
      }

      const loginResponse = await api.post(
        "/v1/users/login",
        {
          userLogin: sanitizedUserLogin,
          password,
        },
        { withCredentials: true }
      );

      const userRole = loginResponse.data.user?.role;
      if (userRole !== "Guru") {
        throw new Error(
          "Only teachers can log in here. Please use the appropriate login page."
        );
      }

      if (!loginResponse.data.token) {
        throw new Error("Login failed: No token received");
      }

      const { token, user: apiUser } = loginResponse.data;

      const enhancedUser = {
        ...apiUser,
        img_profile: apiUser.img_profile || "https://placehold.jp/150x150.png",
      };

      setAuth(enhancedUser, token);

      if (rememberMe) {
        localStorage.setItem("accessToken", token);
      } else {
        sessionStorage.setItem("accessToken", token);
        localStorage.removeItem("accessToken");
      }

      navigate("/teachers/dashboard");
    } catch (err) {
      console.error("Teacher login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (
        err.response?.status === 400 &&
        err.response?.data?.error === "Please verify your email first"
      ) {
        setEmailVerificationError(
          "Please verify your email to log in. Resend the verification OTP below."
        );
      } else {
        setError(
          err.message ||
            err.response?.data?.error ||
            "Login failed. Please try again."
        );
      }
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with real-time sanitization for display
  const handleUserLoginChange = (e) => {
    const value = e.target.value;
    setUserLogin(value);

    // Clear errors when user starts typing
    if (error) setError("");
    if (emailVerificationError) setEmailVerificationError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">Teachers Portal</h1>
            <p className="text-indigo-100 mt-1">
              Sign in to your teacher account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 mt-0">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {emailVerificationError && (
              <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm">
                <p>{emailVerificationError}</p>
                <Link
                  to="/resend-otp"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Resend Verification OTP
                </Link>
              </div>
            )}

            <div>
              <label
                htmlFor="userLogin"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email, Username, Phone, or NIS
              </label>
              <div className="relative">
                <input
                  id="userLogin"
                  name="userLogin"
                  type="text"
                  required
                  value={userLogin}
                  onChange={handleUserLoginChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="teacher@email.com or username"
                  disabled={loading}
                  autoComplete="username"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="bg-gray-50 px-8 py-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/teachers/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} School Name. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
