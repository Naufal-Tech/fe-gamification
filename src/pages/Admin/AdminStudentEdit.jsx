import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaTimes, FaUser } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const AdminStudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: adminUser, accessToken } = useAuthStore();

  // Fetch user data
  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const response = await api.get(`/v1/admin/view-students/detail/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.data;
    },
  });

  // Fetch classes for the class dropdown
  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const response = await api.get("/v1/kelas", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.kelas || [];
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    noIdentity: "",
    birthdate: "",
    kelas: "",
    isVerified: false,
    memberships: false,
    img_profile: "",
  });

  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  // Set initial form data when user data loads
  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || "",
        fullName: userData.fullName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        gender: userData.gender || "",
        noIdentity: userData.noIdentity || "",
        birthdate: userData.birthdate ? userData.birthdate.split("T")[0] : "",
        kelas: userData.kelas?._id || userData.kelas || "",
        isVerified: userData.isVerified || false,
        memberships: userData.memberships || false,
        img_profile: userData.img_profile || "",
      });
      setPreviewImage(userData.img_profile || "");
    }
  }, [userData]);

  // Handle file changes
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setPreviewImage(reader.result);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (formDataToSend) => {
      const response = await api.patch(`/v1/users/${id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("User profile updated successfully");
      navigate(`/admin/students`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Failed to update user profile"
      );
    },
  });

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Create FormData for multipart/form-data submission
    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username);
    formDataToSend.append("fullName", formData.fullName);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phoneNumber", formData.phoneNumber);
    formDataToSend.append("gender", formData.gender);
    formDataToSend.append("noIdentity", formData.noIdentity);

    if (formData.birthdate) {
      formDataToSend.append("birthdate", formData.birthdate);
    }

    if (formData.kelas) {
      formDataToSend.append("kelas", formData.kelas);
    }

    formDataToSend.append("isVerified", String(formData.isVerified));
    formDataToSend.append("memberships", String(formData.memberships));

    if (file) {
      formDataToSend.append("img_profile", file);
    }

    updateUserMutation.mutate(formDataToSend);
  };

  // Loading and error states
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
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          <div className="flex items-center">
            <FaTimes className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {error.response?.data?.error || "Failed to load user data"}
            </span>
          </div>
        </div>
        <Link
          to="/admin/students"
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
        >
          <FaArrowLeft className="mr-2" />
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link
          to={`/admin/students/detail/${id}`}
          className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to User
        </Link>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit User Profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update the user's information below
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-gray-600 border-4 border-white dark:border-gray-600 shadow-md flex items-center justify-center">
                    <FaUser className="h-16 w-16 text-indigo-400 dark:text-gray-400" />
                  </div>
                )}
              </div>
              <label className="flex flex-col items-center px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm tracking-wide border border-blue-300 dark:border-blue-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
                <span className="text-sm font-medium">Change Photo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                />
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>

              {/* Student ID / NIS */}
              <div>
                <label
                  htmlFor="noIdentity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Student ID (NIS)
                </label>
                <input
                  type="text"
                  id="noIdentity"
                  name="noIdentity"
                  value={formData.noIdentity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">Select Gender</option>
                  <option value="Laki-Laki">Male</option>
                  <option value="Perempuan">Female</option>
                </select>
              </div>

              {/* Birthdate */}
              <div>
                <label
                  htmlFor="birthdate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Birthdate
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>

              {/* Class */}
              <div>
                <label
                  htmlFor="kelas"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Class
                </label>
                <select
                  id="kelas"
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">Select Class</option>
                  {classesData?.map((classItem) => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verification Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVerified"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isVerified"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Verified Account
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(`/admin/students/detail/${id}`)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={updateUserMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                disabled={updateUserMutation.isLoading}
              >
                {updateUserMutation.isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentEdit;
