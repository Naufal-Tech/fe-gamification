import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api, { apiEndpoints } from "../../utils/api";

function TeachersDashboardOutlet() {
  const { user, isAuthenticated, accessToken, clearAuth, setAuth } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to teacher login");
      navigate("/teacher-login");
    } else if (user?.role !== "Guru") {
      console.log("User is not a teacher, redirecting to sign-in");
      navigate("/sign-in");
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch full teacher details
  const {
    data: teacherDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacherDetails"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token available");
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      };
      const response = await api.get(apiEndpoints.getUserInfo, config);
      console.log("Teacher details fetched:", response.data);
      const fullUser = response.data.user;
      setAuth(fullUser, accessToken);
      return fullUser;
    },
    enabled: isAuthenticated && user?.role === "Guru",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    onError: (error) => {
      console.error("Error fetching teacher details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        console.log(
          "Session expired (401), clearing auth and redirecting to teacher login"
        );
        clearAuth();
        navigate("/teacher-login", { replace: true });
      }
    },
  });

  // Handle session expiration - redirect immediately if 401 error
  useEffect(() => {
    if (error?.response?.status === 401) {
      console.log("Session expired detected, redirecting to teacher login");
      clearAuth();
      navigate("/teacher-login", { replace: true });
    }
  }, [error, clearAuth, navigate]);

  // Loading state with skeleton loader
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
    console.log("401 error in render, redirecting to teacher login");
    clearAuth();
    navigate("/teacher-login", { replace: true });
    return null;
  }

  // Error state with retry button for non-401 errors
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg text-center">
          Error loading teacher data. Please try again.
          <button
            onClick={() => refetch()} // Use refetch from react-query instead of window.location.reload
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use teacherDetails if available, fallback to user
  const displayTeacher = teacherDetails || user;

  if (!displayTeacher) {
    console.log("No displayTeacher, likely initial load or fetch failed");
    // If not authenticated and no teacher data, navigate to teacher login
    if (!isAuthenticated) {
      navigate("/teacher-login", { replace: true });
    }
    return null;
  }

  // Redirect to dashboard if at /teachers
  return location.pathname === "/teachers" ? (
    <Navigate to="/teachers/dashboard" replace />
  ) : (
    <Outlet />
  );
}

export default TeachersDashboardOutlet;
