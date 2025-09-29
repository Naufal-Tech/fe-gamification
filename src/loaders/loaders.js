/* eslint-disable no-unused-vars */
import { redirect } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

// Centralized auth service - FIXED
function getAccessToken() {
  const storeToken = useAuthStore.getState().accessToken;
  const localToken = localStorage.getItem("accessToken");

  // Use store token first, fallback to localStorage
  return storeToken || localToken;
}

// Enhanced auth check - NEW
function isValidAuth() {
  const { isAuthenticated, accessToken, user } = useAuthStore.getState();
  const localToken = localStorage.getItem("accessToken");

  return isAuthenticated && (accessToken || localToken) && user;
}

// Handle auth errors consistently - NEW
function handleAuthError() {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();
  throw redirect("/sign-in");
}

export const userLoader = async () => {
  // Check auth state first
  if (!isValidAuth()) {
    return null;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const response = await api.get("/v1/users/info-user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    });

    console.log("Loader fetched user info:", response.data);

    const { setUser } = useAuthStore.getState();
    setUser(response.data.user);

    return response.data.user;
  } catch (error) {
    console.error("Loader failed to fetch user info:", error);
    if (error.response?.status === 401) {
      handleAuthError();
    }
    return null;
  }
};
