// hooks/useDailyTaskReset.js
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

/**
 * Enhanced hook for daily task reset with comprehensive tracking
 */
export const useEnhancedDailyTaskReset = (options = {}) => {
  const {
    enabled = true,
    onReset,
    onNewDayDetected,
    showNotification = true,
    queriesToInvalidate = [],
  } = options;

  const { user, accessToken, markTasksReset, checkTasksReset } = useAuthStore();
  const queryClient = useQueryClient();
  const hasChecked = useRef(false);
  const [resetState, setResetState] = useState({
    isNewDay: false,
    lastReset: null,
    isLoading: false,
    resetStats: null,
  });

  useEffect(() => {
    if (!enabled || !user || hasChecked.current) {
      return;
    }

    const checkAndHandleReset = async () => {
      setResetState((prev) => ({ ...prev, isLoading: true }));

      try {
        const today = new Date().toDateString();
        const lastActive = localStorage.getItem(`lastActive_${user._id}`);
        const needsReset = checkTasksReset();

        if (needsReset) {
          console.log("🌅 New day detected - Resetting tasks...");

          // Update tracking
          localStorage.setItem(`lastActive_${user._id}`, today);

          if (onNewDayDetected) {
            await onNewDayDetected();
          }

          // Invalidate all task-related queries
          const defaultQueries = [
            "dailyTasks",
            "userData",
            "taskStats",
            "userBadges",
          ];

          const allQueries = [...defaultQueries, ...queriesToInvalidate];

          await Promise.all(
            allQueries.map((query) =>
              queryClient.invalidateQueries([query], { exact: false })
            )
          );

          // Mark tasks as reset in store
          markTasksReset();

          setResetState({
            isNewDay: true,
            lastReset: Date.now(),
            isLoading: false,
            resetStats: null,
          });

          if (onReset) {
            await onReset();
          }

          console.log("✅ Daily reset completed!");
        } else {
          setResetState((prev) => ({ ...prev, isLoading: false }));
          console.log("✓ Same day - no reset needed");
        }

        hasChecked.current = true;
      } catch (error) {
        console.error("❌ Daily reset check failed:", error);
        setResetState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkAndHandleReset();
  }, [
    enabled,
    user,
    onReset,
    onNewDayDetected,
    queriesToInvalidate,
    queryClient,
    checkTasksReset,
    markTasksReset,
  ]);

  return resetState;
};

/**
 * Hook to manually refresh tasks
 */
export const useManualTaskRefresh = () => {
  const { user, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTasks = async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setIsRefreshing(true);
    try {
      console.log("🔄 Manually refreshing tasks...");

      // Call backend reset endpoint
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };

      const response = await api.post(
        `/v1/daily-tasks/reset-day/${user._id}`,
        {},
        config
      );

      // Invalidate all task-related queries
      await Promise.all([
        queryClient.invalidateQueries(["dailyTasks"]),
        queryClient.invalidateQueries(["userData"]),
        queryClient.invalidateQueries(["taskStats"]),
      ]);

      // Update tracking
      localStorage.setItem(`lastActive_${user._id}`, new Date().toDateString());

      console.log("✅ Manual refresh complete!", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshTasks, isRefreshing };
};

/**
 * Hook to get time until next reset
 */
export const useTimeUntilReset = () => {
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const calculateTimeUntilReset = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow - now;
      const totalDayMs = 24 * 60 * 60 * 1000;
      const elapsedMs = totalDayMs - diff;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
      setPercentage(Math.round((elapsedMs / totalDayMs) * 100));
    };

    calculateTimeUntilReset();
    const interval = setInterval(calculateTimeUntilReset, 1000);

    return () => clearInterval(interval);
  }, []);

  return { timeUntilReset, percentage };
};
