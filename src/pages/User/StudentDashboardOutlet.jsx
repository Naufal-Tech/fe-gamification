import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const StudentDashboardOutlet = () => {
  const { user, isAuthenticated, accessToken, clearAuth, setAuth } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation(); // To check current path for redirection

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to sign-in");
      navigate("/sign-in");
    } else if (user?.role !== "User") {
      // Assuming 'User' is the student role
      console.log("User is not a student, redirecting to sign-in");
      navigate("/sign-in");
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch full user details
  const {
    data: userDetails,
    isLoading,
    error,
    refetch, // Added refetch to allow manual retry
  } = useQuery({
    queryKey: ["userDetails"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/users/info-user", config);
      console.log("User details fetched:", response.data);
      const fullUser = response.data.user;
      setAuth(fullUser, accessToken); // Update auth store with full details
      return fullUser;
    },
    enabled: isAuthenticated && user?.role === "User", // Only fetch if authenticated and is a student
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes, similar to teacher dashboard
    onError: (err) => {
      console.error("Error fetching user details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status === 401) {
        console.log(
          "Session expired (401), clearing auth and redirecting to sign-in"
        );
        clearAuth();
        navigate("/sign-in", { replace: true });
      }
    },
  });

  // Handle session expiration - redirect immediately if 401 error
  useEffect(() => {
    if (error?.response?.status === 401) {
      console.log("Session expired detected, redirecting to sign-in");
      clearAuth();
      navigate("/sign-in", { replace: true });
    }
  }, [error, clearAuth, navigate]);

  // Loading state with skeleton loader (similar to teacher dashboard)
  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // For 401 errors (session expired), redirect immediately instead of showing error UI
  if (error?.response?.status === 401) {
    console.log("401 error in render, redirecting to sign-in");
    clearAuth();
    navigate("/sign-in", { replace: true });
    return null;
  }

  // Error state with retry button for non-401 errors
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg text-center">
          Error loading student data. Please try again.
          <button
            onClick={() => refetch()} // Use refetch from react-query
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use userDetails if available, fallback to user from store
  const displayUser = userDetails || user;

  if (!displayUser) {
    console.log("No displayUser, likely initial load or fetch failed");
    // If not authenticated and no user data, navigate to sign-in
    if (!isAuthenticated) {
      navigate("/sign-in", { replace: true });
    }
    return null;
  }

  // Redirect to dashboard if at base student path `/student`
  // This will ensure /student always goes to /student/dashboard
  return location.pathname === "/students" ? (
    <Navigate to="/students/dashboard" replace />
  ) : (
    <Outlet /> // This is where StudentDashboardHome or other student routes will render
  );
};

export default StudentDashboardOutlet;
