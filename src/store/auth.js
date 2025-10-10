// store/auth.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      error: null,
      isLoading: false,

      // ✅ NEW: Task reset tracking
      lastTaskReset: null,
      tasksResetToday: false,

      setAuth: (
        user,
        accessToken,
        refreshToken = null,
        tasksResetData = null
      ) => {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // ✅ Handle task reset tracking
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem(`lastTaskReset_${user._id}`);

        let tasksResetToday = false;
        if (tasksResetData?.tasksReset) {
          tasksResetToday = true;
          localStorage.setItem(`lastTaskReset_${user._id}`, today);
        } else if (lastReset === today) {
          tasksResetToday = true;
        }

        set({
          user,
          isAuthenticated: true,
          accessToken,
          refreshToken,
          error: null,
          isLoading: false,
          lastTaskReset: tasksResetData?.resetStats || null,
          tasksResetToday,
        });
      },

      setUser: (user) => set({ user }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Clear task reset tracking
        const user = get().user;
        if (user) {
          localStorage.removeItem(`lastTaskReset_${user._id}`);
          localStorage.removeItem(`lastActive_${user._id}`);
        }

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false,
          lastTaskReset: null,
          tasksResetToday: false,
        });
      },

      setError: (error) => set({ error }),

      // ✅ NEW: Mark tasks as reset for today
      markTasksReset: (resetStats = null) => {
        const user = get().user;
        if (user) {
          const today = new Date().toDateString();
          localStorage.setItem(`lastTaskReset_${user._id}`, today);
        }

        set({
          tasksResetToday: true,
          lastTaskReset: resetStats,
        });
      },

      // ✅ NEW: Check if tasks need reset
      checkTasksReset: () => {
        const user = get().user;
        if (!user) return false;

        const today = new Date().toDateString();
        const lastReset = localStorage.getItem(`lastTaskReset_${user._id}`);
        const lastActive = localStorage.getItem(`lastActive_${user._id}`);

        return lastReset !== today || lastActive !== today;
      },

      isValidAuth: () => {
        const state = get();
        return !!(state.isAuthenticated && state.accessToken && state.user);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        lastTaskReset: state.lastTaskReset,
        tasksResetToday: state.tasksResetToday,
      }),
    }
  )
);
