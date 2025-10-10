import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const UserDashboardOutlet = () => {
  const { user, isAuthenticated, accessToken, clearAuth, setUser } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Prevent duplicate auth checks
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (hasCheckedAuth.current) return;

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to sign-in");
      navigate("/sign-in", { replace: true });
      hasCheckedAuth.current = true;
    } else if (user?.role !== "User") {
      console.log("redirecting to sign-in");
      navigate("/sign-in", { replace: true });
      hasCheckedAuth.current = true;
    }
  }, [isAuthenticated, user?.role, navigate]);

  // ✅ CRITICAL FIX: Only fetch user details ONCE when needed
  const {
    data: userDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userDetails", user?._id], // ✅ Added user ID to key
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/users/info-user", config);
      console.log("User details fetched:", response.data);
      const fullUser = response.data.user;

      // ✅ Only update if data actually changed
      if (JSON.stringify(fullUser) !== JSON.stringify(user)) {
        setUser(fullUser); // Don't call setAuth, just setUser to avoid token refresh
      }

      return fullUser;
    },
    enabled: isAuthenticated && user?.role === "User" && !!user?._id,
    staleTime: 10 * 60 * 1000, // ✅ Increased to 10 minutes
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false, // ✅ Prevent refetch on focus
    refetchOnMount: false, // ✅ Prevent refetch on remount
    refetchOnReconnect: false, // ✅ Prevent refetch on reconnect
    retry: 1, // ✅ Only retry once
    onError: (err) => {
      console.error("Error fetching user details:", {
        message: err.message,
        status: err.response?.status,
      });

      if (err.response?.status === 401) {
        console.log("Session expired (401), clearing auth");
        clearAuth();
        navigate("/sign-in", { replace: true });
      }
    },
  });

  // Handle session expiration
  useEffect(() => {
    if (error?.response?.status === 401) {
      console.log("Session expired detected, redirecting to sign-in");
      clearAuth();
      navigate("/sign-in", { replace: true });
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

  // For 401 errors, redirect immediately
  if (error?.response?.status === 401) {
    console.log("401 error in render, redirecting to sign-in");
    clearAuth();
    navigate("/sign-in", { replace: true });
    return null;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg text-center">
          Error loading user data. Please try again.
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

  const displayUser = userDetails || user;

  if (!displayUser) {
    console.log("No displayUser, likely initial load or fetch failed");
    if (!isAuthenticated) {
      navigate("/sign-in", { replace: true });
    }
    return null;
  }

  return location.pathname === "/users" ? (
    <Navigate to="/users/dashboard" replace />
  ) : (
    <Outlet />
  );
};

export default UserDashboardOutlet;
