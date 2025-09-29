// src/pages/VerifyEmail.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";

function VerifyEmail() {
  const { state } = useLocation(); // Get email and userId from navigation state
  const email = state?.email || "your email"; // Fallback if no state
  const userId = state?.userId; // User ID from signup response
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 4) setOtp(value); // Limit to 4 digits
    if (verifyError) setVerifyError("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      setVerifyError("Please enter the OTP code");
      return;
    }
    if (!userId) {
      setVerifyError("User ID is missing. Please sign up again.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");
    try {
      const response = await api.post(
        `/v1/users/verify`,
        { userId, otp },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (response.data.success) {
        setVerifySuccess(true);
        setTimeout(() => navigate("/sign-in"), 2000); // Redirect after 2s
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      setVerifyError(
        error.response?.data?.message || error.message || "Failed to verify OTP"
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setResendError("");
    try {
      const response = await api.post(
        `/v1/users/resend-otp`,
        { email },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (response.data.success) {
        setResendMessage(
          response.data.message || "OTP has been resent successfully!"
        );
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      setResendError(
        error.response?.data?.message || error.message || "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold">Verify Your Email</h1>
          <p className="mt-2 opacity-90">We've sent an OTP code to {email}</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Success Message */}
          {verifySuccess ? (
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500 mx-auto mb-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-700">
                OTP verified successfully! Redirecting to sign-in...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-green-500 mx-auto mb-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-700">
                  Please enter the OTP code sent to your email to verify your
                  account.
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    OTP Code
                  </label>
                  <input
                    type="text"
                    name="otp"
                    id="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      verifyError ? "border-red-300" : "border-gray-300"
                    } focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors text-center`}
                    placeholder="1234"
                    maxLength={4}
                    disabled={verifyLoading}
                  />
                  {verifyError && (
                    <p className="mt-1 text-sm text-red-600">{verifyError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center ${
                    verifyLoading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={verifyLoading}
                >
                  {verifyLoading ? (
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
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </form>

              {/* Resend Message */}
              {resendMessage && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-700">
                  {resendMessage}
                </div>
              )}

              {/* Resend Error */}
              {resendError && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
                  {resendError}
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-4">
                <Link
                  to="/sign-in"
                  className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleResend}
                  className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                  disabled={resendLoading || verifyLoading}
                >
                  {resendLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800"
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
                      Resending...
                    </>
                  ) : (
                    "Resend OTP Code"
                  )}
                </button>

                {/* New Home Button */}
                <Link
                  to="/"
                  className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center"
                >
                  Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
