import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBirthdayCake,
  FaCheck,
  FaEnvelope,
  FaExclamationTriangle,
  FaIdCard,
  FaPhone,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function AdminStudentDetail() {
  const { id } = useParams();
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
  const { accessToken, user, setUser, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const hasAdminAccess = user && ["Admin", "Super"].includes(user.role);

  // Data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const response = await api.get(`/v1/admin/view-students/detail/${id}`);
      return response.data;
    },
    enabled: hasAdminAccess && !!accessToken && !isRefreshingUser,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: () =>
      api.post("/v1/admin/toggle-verification", { user_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries(["student", id]);
      toast.success("Verification status updated");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to toggle verification");
    },
  });

  const refreshUserData = async () => {
    if (!accessToken) return null;
    try {
      setIsRefreshingUser(true);
      const response = await api.get("/v1/users/info-user");
      setUser(response.data.data || response.data.user);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) clearAuth();
      throw error;
    } finally {
      setIsRefreshingUser(false);
    }
  };

  // Authentication check
  useEffect(() => {
    if (!accessToken) navigate("/sign-in");
    if (user && !hasAdminAccess) {
      toast.error("Admin privileges required");
      navigate("/");
    }
  }, [accessToken, user, navigate]);

  // Loading states
  if (!accessToken || isRefreshingUser) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Student
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.response?.data?.message || "Failed to load student details"}
          </p>
          <button
            onClick={() => navigate("/admin/students")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  const student = data?.data;

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate("/admin/students")}
              className="mr-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Student Details
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
            Detailed information about {student?.fullName}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              {student?.img_profile ? (
                <img
                  src={student.img_profile}
                  alt={student.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center mb-4">
                  <span className="text-4xl text-gray-500 dark:text-gray-400 font-medium">
                    {student?.fullName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {student?.fullName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                @{student?.username}
              </p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  student?.isVerified
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                {student?.isVerified ? "✓ Verified" : "⏳ Pending"}
              </span>
              <button
                onClick={() => toggleVerificationMutation.mutate()}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  student?.isVerified
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
                    : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                } transition-colors mb-6`}
                disabled={toggleVerificationMutation.isLoading}
              >
                {toggleVerificationMutation.isLoading ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                ) : student?.isVerified ? (
                  <>
                    <FaTimes className="h-4 w-4 mr-2" />
                    Unverify
                  </>
                ) : (
                  <>
                    <FaCheck className="h-4 w-4 mr-2" />
                    Verify
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaUser />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Full Name
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.fullName}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaIdCard />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID Number
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.noIdentity}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaEnvelope />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaPhone />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaBirthdayCake />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Birthdate
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.birthdate
                      ? new Date(student.birthdate).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Class and Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Class Information
            </h3>
            {student?.classInfo ? (
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Class Name
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {student.classInfo.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {student.classInfo.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Teachers
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {student.classInfo.teachers?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Students
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {student.classInfo.students?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">
                  This student is not enrolled in any class
                </p>
              </div>
            )}
          </div>

          {/* Performance Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignments */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Assignments
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Assignments
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student?.totalAssignments || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student?.completedAssignments || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Average Score
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student?.averageAssignmentScore !== null
                        ? `${student.averageAssignmentScore}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exams */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Exams
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Exams
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student?.totalExams || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student?.completedExams || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Average Score
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student?.averageExamScore !== null
                        ? `${student.averageExamScore}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaUser />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Login
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.lastLogin
                      ? new Date(student.lastLogin).toLocaleString()
                      : "Never logged in"}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5">
                  <FaUser />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Created
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {student?.createdAt
                      ? new Date(student.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStudentDetail;
