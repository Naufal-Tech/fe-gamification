import React, { useEffect, useRef, useState } from "react";
import {
  FiAward,
  FiDatabase,
  FiEye,
  FiEyeOff,
  FiSettings,
  FiShield,
  FiUpload,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function SuperProfile() {
  const { user, accessToken, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    currentPassword: "",
    newPassword: "",
    reconfirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState({
    file: null,
    preview: "",
    current: "",
  });

  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReconfirmPassword, setShowReconfirmPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalXP: 0,
    systemUptime: 0,
  });

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        currentPassword: "",
        newPassword: "",
        reconfirmPassword: "",
      });
      setProfileImage((prev) => ({
        ...prev,
        current: user.img_profile || "",
      }));
    }
  }, [user]);

  // Fetch admin stats
  useEffect(() => {
    if (user?.role === "Super") {
      fetchAdminStats();
    }
  }, [user]);

  // Check for changes in profile data
  useEffect(() => {
    if (!user) return;

    const changesExist =
      formData.username !== user.username ||
      formData.fullName !== user.fullName ||
      formData.email !== user.email ||
      formData.phoneNumber !== user.phoneNumber ||
      formData.currentPassword ||
      formData.newPassword ||
      formData.reconfirmPassword ||
      profileImage.file;

    setHasChanges(changesExist);
  }, [formData, profileImage.file, user]);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get("/v1/xp-transactions/admin/stats", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setAdminStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      toast.error("Failed to load admin statistics");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.match("image.*")) {
      toast.error("Please select an image file (JPEG, PNG)");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setProfileImage({
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
      current: profileImage.current,
    });
  };

  const removeImage = () => {
    setProfileImage({
      file: null,
      preview: "",
      current: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return "Username is required";
    }

    if (!formData.email.trim()) {
      return "Email is required";
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      return "Please enter a valid email address";
    }

    if (formData.phoneNumber && !/^\d{10,}$/.test(formData.phoneNumber)) {
      return "Phone number must be at least 10 digits";
    }

    if (
      formData.currentPassword ||
      formData.newPassword ||
      formData.reconfirmPassword
    ) {
      if (!formData.currentPassword) {
        return "Current password is required to change password";
      }

      if (!formData.newPassword) {
        return "New password is required";
      }

      if (formData.newPassword.length < 6) {
        return "New password must be at least 6 characters";
      }

      if (formData.newPassword !== formData.reconfirmPassword) {
        return "New password and confirmation do not match";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      if (formData.username !== user.username) {
        formDataToSend.append("username", formData.username);
      }
      if (formData.fullName !== user.fullName) {
        formDataToSend.append("fullName", formData.fullName);
      }
      if (formData.email !== user.email) {
        formDataToSend.append("email", formData.email);
      }
      if (formData.phoneNumber !== user.phoneNumber) {
        formDataToSend.append("phoneNumber", formData.phoneNumber);
      }
      if (formData.currentPassword) {
        formDataToSend.append("currentPassword", formData.currentPassword);
        formDataToSend.append("newPassword", formData.newPassword);
      }
      if (profileImage.file) {
        formDataToSend.append("img_profile", profileImage.file);
      } else if (!profileImage.current && !profileImage.preview) {
        formDataToSend.append("removeImage", "true");
      }

      const response = await api.patch(
        `/v1/users/${user._id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setUser(response.data.user);

        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          reconfirmPassword: "",
        }));

        setProfileImage((prev) => ({
          file: null,
          preview: "",
          current: response.data.user.img_profile || "",
        }));

        fetchAdminStats();
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(
        err.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not a super admin
  useEffect(() => {
    if (!user || user.role !== "Super") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "Super") {
    return null;
  }

  const imageToDisplay = profileImage.preview || profileImage.current;

  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Super Admin Header Card */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="px-6 py-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-white/20 overflow-hidden border-4 border-white shadow-2xl">
                  {imageToDisplay ? (
                    <img
                      src={imageToDisplay}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <FiUser className="w-16 h-16" />
                    </div>
                  )}
                </div>

                {/* SUPER Badge */}
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold border-2 border-white shadow-lg z-10">
                  SUPER
                </div>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-white text-purple-600 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-purple-600 z-10"
                  title="Change photo"
                >
                  <FiUpload className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {user.fullName || user.username}
                  </h1>
                  <FiShield className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-purple-100 mb-1">@{user.username}</p>
                <p className="text-purple-200 text-sm mb-4">
                  Super Administrator
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FiUsers className="text-yellow-300" />
                      <span className="text-sm text-purple-100">
                        Total Users
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {adminStats.totalUsers?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FiZap className="text-yellow-300" />
                      <span className="text-sm text-purple-100">
                        Active Users
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {adminStats.activeUsers?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FiAward className="text-yellow-300" />
                      <span className="text-sm text-purple-100">Total XP</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {adminStats.totalXP?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FiDatabase className="text-yellow-300" />
                      <span className="text-sm text-purple-100">Uptime</span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatUptime(adminStats.systemUptime)}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/super/dashboard")}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate("/super/users")}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => navigate("/super/system")}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    System Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FiSettings className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">
                Super Admin Profile
              </h2>
            </div>
            <p className="mt-1 text-red-100">
              Update your administrator account information
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiShield className="w-5 h-5 text-red-500" />
                  Change Password
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Leave blank to keep current"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Leave blank to keep current"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <FiEyeOff className="h-5 w-5" />
                        ) : (
                          <FiEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reconfirmPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showReconfirmPassword ? "text" : "password"}
                        name="reconfirmPassword"
                        id="reconfirmPassword"
                        value={formData.reconfirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowReconfirmPassword(!showReconfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showReconfirmPassword ? (
                          <FiEyeOff className="h-5 w-5" />
                        ) : (
                          <FiEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={loading || !hasChanges}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperProfile;
