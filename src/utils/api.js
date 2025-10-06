// utils/api.js
import axios from "axios";
import { useAuthStore } from "../store/auth";

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return "/api";
  }
  return import.meta.env.VITE_API_URL || "https://api.cobalms.web.id/api";
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      hasToken: !!token,
    });

    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log("API Response:", {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data,
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("401 Error - Attempting token refresh...");

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/v1/users/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: updatedUser,
        } = response.data;

        // Update auth store with new tokens and user data
        const { setAuth, user: currentUser } = useAuthStore.getState();
        const userToStore = updatedUser || currentUser;

        setAuth(userToStore, newAccessToken, newRefreshToken);

        console.log("Token refresh successful");

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Clear auth and redirect to login
        const { clearAuth } = useAuthStore.getState();
        clearAuth();

        // Only redirect if not already on sign-in page
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/sign-in"
        ) {
          window.location.href = "/sign-in";
        }

        return Promise.reject(refreshError);
      }
    }

    // Log other errors
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

// Export API endpoints for easy use
export const apiEndpoints = {
  // Auth endpoints
  login: "/v1/users/login",
  getUserInfo: "/v1/users/info-user",
  register: "/v1/users/register",
  logout: "/v1/users/logout",
  refresh: "/v1/users/refresh",

  // Dashboard endpoints
  userDashboard: "/v1/dashboard/user-dashboard",
  adminDashboard: "/v1/dashboard/admin-dashboard",
  superDashboard: "/v1/dashboard/super-dashboard",

  // Add other endpoints as needed
  dashboard: "/v1/dashboard",
};

export default api;
