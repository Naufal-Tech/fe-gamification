/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/VerifyOtp.jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import api from "../utils/api";

function VerifyOtp() {
  const { state } = useLocation(); // Get email and userId from navigation state
  const [searchParams] = useSearchParams(); // Get query params from URL
  const navigate = useNavigate();

  // Extract from state (from ResendOtp) or URL (from email link)
  const email = state?.email || "your email";
  const userIdFromState = state?.userId;
  const userIdFromUrl = searchParams.get("user");
  const otpFromUrl = searchParams.get("otp");

  const [otp, setOtp] = useState(otpFromUrl || "");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  // Use userId from URL if present, otherwise fall back to state
  const userId = userIdFromUrl || userIdFromState;

  useEffect(() => {
    // Debug state and URL params
    console.log("VerifyOtp state:", state);
    console.log("URL params - userId:", userIdFromUrl, "otp:", otpFromUrl);

    // Auto-verify if both userId and otp are in URL
    if (userIdFromUrl && otpFromUrl && !verifyLoading && !verifySuccess) {
      handleAutoVerify();
    }
  }, [userIdFromUrl, otpFromUrl]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 4) setOtp(value);
    if (verifyError) setVerifyError("");
  };

  const handleAutoVerify = async () => {
    setVerifyLoading(true);
    setVerifyError("");
    setVerifySuccess("");
    try {
      const response = await api.post(
        `/v1/users/verify`,
        { userId: userIdFromUrl, otp: otpFromUrl },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (response.data.success) {
        setVerifySuccess(response.data.message || "OTP verified successfully!");
        setTimeout(() => navigate("/sign-in"), 2000);
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

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      setVerifyError("Please enter the OTP code");
      return;
    }
    if (!userId) {
      setVerifyError("User ID is missing. Please resend OTP.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");
    setVerifySuccess("");
    try {
      const response = await api.post(
        `/v1/users/verify`,
        { userId, otp },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (response.data.success) {
        setVerifySuccess(response.data.message || "OTP verified successfully!");
        setTimeout(() => navigate("/sign-in"), 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold">Verify OTP</h1>
          <p className="mt-2 opacity-90">Enter the OTP sent to {email}</p>
        </div>

        <div className="p-8 space-y-6">
          {verifySuccess && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-700">
              {verifySuccess} Redirecting to sign-in...
            </div>
          )}
          {verifyError && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
              {verifyError}
            </div>
          )}
          {!verifySuccess && (
            <form onSubmit={handleManualVerify} className="space-y-6">
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
          )}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/"
              className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center"
            >
              Home
            </Link>
            <Link
              to="/resend-otp"
              className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center"
            >
              Resend OTP Again
            </Link>
            <Link
              to="/sign-up"
              className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center"
            >
              Sign Up
            </Link>
            <Link
              to="/sign-in"
              className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
