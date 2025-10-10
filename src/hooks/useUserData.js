import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";

export const useUserData = () => {
  const { user } = useAuthStore();

  // ✅ Just return cached data from the outlet query
  const { data: userData } = useQuery({
    queryKey: ["userDetails", user?._id],
    enabled: false, // ✅ Never fetch, just read from cache
  });

  return {
    userData: userData || user,
    isLoading: false,
  };
};
