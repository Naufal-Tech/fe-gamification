// components/SuperDashboardOutlet.tsx
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api, { apiEndpoints } from "../../utils/api";

function SuperDashboardOutlet() {
  const { user, isAuthenticated, accessToken, clearAuth, setAuth } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not authenticated or not a Super admin
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
    } else if (user?.role !== "Super") {
      console.log("User is not a Super admin, redirecting to dashboard");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch full Super admin details
  const {
    data: superDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["superDetails"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token available");
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      };
      const response = await api.get(apiEndpoints.getUserInfo, config);
      console.log("Super admin details fetched:", response.data);
      const fullUser = response.data.user;
      setAuth(fullUser, accessToken);
      return fullUser;
    },
    enabled: isAuthenticated && user?.role === "Super",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    onError: (error) => {
      console.error("Error fetching Super admin details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        console.log(
          "Session expired (401), clearing auth and redirecting to login"
        );
        clearAuth();
        navigate("/login", { replace: true });
      }
    },
  });

  // Handle session expiration - redirect immediately if 401 error
  useEffect(() => {
    if (error?.response?.status === 401) {
      console.log("Session expired detected, redirecting to login");
      clearAuth();
      navigate("/login", { replace: true });
    }
  }, [error, clearAuth, navigate]);

  // Loading state with skeleton loader
  if (isLoading) {
    return (
      <div className="flex-1 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-purple-300 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-purple-300 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-purple-300 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-purple-300 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-purple-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-40 bg-purple-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // For 401 errors (session expired), redirect immediately instead of showing error UI
  if (error?.response?.status === 401) {
    console.log("401 error in render, redirecting to login");
    clearAuth();
    navigate("/login", { replace: true });
    return null;
  }

  // Error state with retry button for non-401 errors
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-red-600 dark:text-red-400 text-lg text-center">
          Error loading Super admin data. Please try again.
          <button
            onClick={() => refetch()}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors block mx-auto"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use superDetails if available, fallback to user
  const displaySuper = superDetails || user;

  if (!displaySuper) {
    console.log("No displaySuper, likely initial load or fetch failed");
    // If not authenticated and no super admin data, navigate to login
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
    return null;
  }

  // Redirect to dashboard if at /super
  return location.pathname === "/super" ? (
    <Navigate to="/super/dashboard" replace />
  ) : (
    <Outlet />
  );
}

export default SuperDashboardOutlet;
