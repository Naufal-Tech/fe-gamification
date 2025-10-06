// hooks/useUserData.js
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

export const useUserData = () => {
  const { accessToken, user, setUser } = useAuthStore();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["userData", user?._id],
    queryFn: async () => {
      if (!accessToken) throw new Error("No access token");

      const response = await api.get("/v1/users/info-user", {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      const freshUserData = response.data?.user || response.data;

      // Update the auth store with fresh data
      if (freshUserData) {
        setUser(freshUserData);
      }

      return freshUserData;
    },
    enabled: !!accessToken && !!user?._id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Use persisted user data immediately, then update with fresh data
  const displayUser = userData || user;

  return {
    userData: displayUser,
    isLoading,
  };
};
