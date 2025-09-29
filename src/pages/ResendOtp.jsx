// src/pages/ResendOtp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function ResendOtp() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
    if (message) setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await api.post(
        `/v1/users/resend-otp`,
        { email },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (response.data.success) {
        setMessage(
          response.data.message || "OTP has been resent successfully!"
        );
        // Navigate to VerifyOtp with email and userId
        setTimeout(
          () =>
            navigate("/verify-otp", {
              state: { email, userId: response.data.userId },
            }),
          2000
        );
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Failed to resend OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold">Resend OTP Verification</h1>
          <p className="mt-2 opacity-90">
            Enter your email to resend the OTP code
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Success Message */}
          {message && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-700">
              {message} Redirecting to verification...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          {!message && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      error ? "border-red-300" : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors`}
                    placeholder="john.doe@example.com"
                    disabled={loading}
                  />
                  {!error && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 absolute right-3 top-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center ${
                  loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
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
                    Sending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Back to{" "}
              <Link
                to="/sign-up"
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResendOtp;
