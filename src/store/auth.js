import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      error: null,

      setAuth: (user, accessToken, refreshToken = null) => {
        // Store token in localStorage for API interceptor
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        set({
          user,
          isAuthenticated: true,
          accessToken,
          refreshToken,
          error: null,
        });
      },

      // IMPORTANT: Only update user data, not tokens
      setUser: (user) => set({ user }),

      // IMPORTANT: Only update tokens if it's the same user
      setTokens: (accessToken, refreshToken = null, skipUserCheck = false) => {
        const currentUser = get().user;

        // Prevent token replacement unless explicitly allowed
        if (!skipUserCheck && currentUser) {
          console.warn(
            "Attempted to update tokens while user is logged in. Use skipUserCheck=true if intentional."
          );
          return;
        }

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        set({
          accessToken,
          refreshToken: refreshToken || get().refreshToken,
          error: null,
        });
      },

      // Safe method to refresh current user data without changing tokens
      refreshUserData: async () => {
        const { accessToken } = get();
        if (!accessToken) return null;

        try {
          const response = await api.get("/v1/users/info-user", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) throw new Error("Failed to refresh user data");

          const data = await response.json();
          const userData = data.data || data.user;

          // Only update user data, keep existing tokens
          set({ user: userData });
          return userData;
        } catch (error) {
          console.error("Failed to refresh user data:", error);
          throw error;
        }
      },

      clearAuth: () => {
        // Clear all auth-related data from localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authToken");

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      setError: (error) => set({ error }),

      isValidAuth: () => {
        const state = get();
        return !!(state.isAuthenticated && state.accessToken && state.user);
      },

      initializeAuth: () => {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const state = get();

        if (accessToken && !state.accessToken) {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: !!state.user,
          });
        }

        if (!accessToken && state.isAuthenticated) {
          get().clearAuth();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
