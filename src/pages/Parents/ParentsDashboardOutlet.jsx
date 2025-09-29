import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const ParentsDashboardOutlet = () => {
  const { user, isAuthenticated, accessToken, clearAuth, setAuth } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not authenticated or not a parent
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to parents login");
      navigate("/parents/login");
    } else if (user?.role !== "Parents") {
      console.log("User is not a parent, redirecting to sign-in");
      navigate("/sign-in");
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch full user details
  const {
    data: userDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["parentDetails"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/users/info-user", config);
      console.log("Parent details fetched:", response.data);
      const fullUser = response.data.user;
      setAuth(fullUser, accessToken);
      return fullUser;
    },
    enabled: isAuthenticated && user?.role === "Parents",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    onError: (err) => {
      console.error("Error fetching parent details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status === 401) {
        console.log("Session expired, redirecting to parents login");
        clearAuth();
        navigate("/parents/login", { replace: true });
      }
    },
  });

  // Handle session expiration
  useEffect(() => {
    if (error?.response?.status === 401) {
      console.log("Session expired detected, redirecting to parents login");
      clearAuth();
      navigate("/parents/login", { replace: true });
    }
  }, [error, clearAuth, navigate]);

  // Loading state
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

  // For 401 errors (session expired)
  if (error?.response?.status === 401) {
    console.log("401 error in render, redirecting to parents login");
    clearAuth();
    navigate("/parents/login", { replace: true });
    return null;
  }

  // Error state with retry button for non-401 errors
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg text-center">
          Error loading parent data. Please try again.
          <button
            onClick={() => refetch()}
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
    if (!isAuthenticated) {
      navigate("/parents/login", { replace: true });
    }
    return null;
  }

  // Redirect to dashboard if at base parent path `/parents`
  return location.pathname === "/parents" ? (
    <Navigate to="/parents/dashboard" replace />
  ) : (
    <Outlet />
  );
};

export default ParentsDashboardOutlet;
