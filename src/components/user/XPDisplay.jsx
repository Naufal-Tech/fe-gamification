// components/XPDisplay.jsx
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const XPDisplay = () => {
  const { accessToken, user } = useAuthStore();

  const { data: userData } = useQuery({
    queryKey: ["userData"],
    queryFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.get("/v1/users/info-user", config);
      return response.data.user;
    },
    enabled: !!accessToken,
  });

  const currentUser = userData || user;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Your Progress</h3>
          <p className="text-indigo-100">
            Level {currentUser?.currentLevel || 1}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{currentUser?.totalXP || 0} XP</p>
          <p className="text-indigo-100">Total Experience</p>
        </div>
      </div>
      {/* XP Progress Bar */}
      <div className="mt-2 bg-indigo-400 rounded-full h-2">
        <div
          className="bg-white h-2 rounded-full transition-all duration-500"
          style={{
            width: `${((currentUser?.totalXP || 0) % 1000) / 10}%`,
          }}
        ></div>
      </div>
      <p className="text-indigo-100 text-sm mt-1">
        {1000 - ((currentUser?.totalXP || 0) % 1000)} XP to next level
      </p>
    </div>
  );
};

export default XPDisplay;
