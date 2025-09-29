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
  (error) => Promise.reject(error)
);

// Response interceptor - CRITICAL: Don't update auth on non-auth endpoints
api.interceptors.response.use(
  (response) => {
    // IMPORTANT: Only update auth state for login/refresh endpoints
    const authEndpoints = ["/v1/users/login", "/v1/users/refresh"];
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      response.config.url?.includes(endpoint)
    );

    // Don't automatically update auth state from non-auth endpoints
    if (!isAuthEndpoint && response.data?.user) {
      console.warn(
        "Received user data from non-auth endpoint:",
        response.config.url
      );
      // Don't update auth state here
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/v1/users/refresh`,
            {
              refreshToken,
            }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data;

          // Update tokens safely
          const { setTokens } = useAuthStore.getState();
          setTokens(newAccessToken, newRefreshToken, true); // skipUserCheck = true for refresh

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }

      const { clearAuth } = useAuthStore.getState();
      clearAuth();

      if (window.location.pathname !== "/sign-in") {
        window.location.href = "/sign-in";
      }
    }

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

  // Add other endpoints as needed
  dashboard: "/v1/dashboard",
  // courses: '/v1/courses',
  // assignments: '/v1/assignments',
};

export default api;
