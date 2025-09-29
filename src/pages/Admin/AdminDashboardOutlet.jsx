import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api, { apiEndpoints } from "../../utils/api";

function AdminDashboardOutlet() {
  const { user, isAuthenticated, accessToken, clearAuth, setAuth } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
    } else if (user?.role !== "Admin") {
      console.log("User is not an admin, redirecting to dashboard");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch full admin details
  const {
    data: adminDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminDetails"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token available");
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      };
      const response = await api.get(apiEndpoints.getUserInfo, config);
      console.log("Admin details fetched:", response.data);
      const fullUser = response.data.user;
      setAuth(fullUser, accessToken);
      return fullUser;
    },
    enabled: isAuthenticated && user?.role === "Admin",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    onError: (error) => {
      console.error("Error fetching admin details:", {
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
      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
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
    console.log("401 error in render, redirecting to login");
    clearAuth();
    navigate("/login", { replace: true });
    return null;
  }

  // Error state with retry button for non-401 errors
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg text-center">
          Error loading admin data. Please try again.
          <button
            onClick={() => refetch()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use adminDetails if available, fallback to user
  const displayAdmin = adminDetails || user;

  if (!displayAdmin) {
    console.log("No displayAdmin, likely initial load or fetch failed");
    // If not authenticated and no admin data, navigate to login
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
    return null;
  }

  // Redirect to dashboard if at /admin
  return location.pathname === "/admin" ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Outlet />
  );
}

export default AdminDashboardOutlet;
