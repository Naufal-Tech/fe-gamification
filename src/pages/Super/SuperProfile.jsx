import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function SuperProfile() {
  const { user, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    currentPassword: "",
    newPassword: "",
    img_profile: user?.img_profile || "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not a super admin (role: "Super")
  useEffect(() => {
    if (!user || user.role !== "Super") {
      navigate("/"); // Redirect to home if not a super admin
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic client-side validation
    if (formData.currentPassword && !formData.newPassword) {
      setError("New password is required when changing password.");
      setLoading(false);
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (formData.phoneNumber && !/^\d{10,}$/.test(formData.phoneNumber)) {
      setError("Phone number must be at least 10 digits.");
      setLoading(false);
      return;
    }
    if (formData.username && formData.username.includes(" ")) {
      setError("Username cannot contain spaces.");
      setLoading(false);
      return;
    }

    const data = new FormData();
    if (formData.username) data.append("username", formData.username);
    if (formData.fullName) data.append("fullName", formData.fullName);
    if (formData.email) data.append("email", formData.email);
    if (formData.phoneNumber) data.append("phoneNumber", formData.phoneNumber);
    if (formData.currentPassword)
      data.append("currentPassword", formData.currentPassword);
    if (formData.newPassword) data.append("newPassword", formData.newPassword);
    if (file) data.append("img_profile", file);

    try {
      const response = await api.patch(`/v1/users/${user._id}`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setSuccess("Profile updated successfully!");
        // Update auth store with new user data
        const updatedUser = {
          ...user,
          username: formData.username || user.username,
          fullName: formData.fullName || user.fullName,
          email: formData.email || user.email,
          phoneNumber: formData.phoneNumber || user.phoneNumber,
          img_profile: file
            ? URL.createObjectURL(file) // Temporary URL for preview
            : user.img_profile,
        };
        useAuthStore.getState().setUser(updatedUser);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Super Admin Profile</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 w-full p-2 border rounded"
            />
            {formData.img_profile && (
              <img
                src={formData.img_profile}
                alt="Current Profile"
                className="mt-2 h-20 w-20 rounded-full object-cover"
                onError={(e) =>
                  (e.target.src = "https://placehold.jp/150x150.png")
                }
              />
            )}
          </div>
          <button
            type="submit"
            className={`w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin inline-block -ml-1 mr-3 h-5 w-5 text-white"
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
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SuperProfile;
