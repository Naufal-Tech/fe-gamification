import React, { useEffect, useRef, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// Helper to filter out soft-deleted addresses
const filterActiveAddresses = (addresses) => {
  if (!Array.isArray(addresses)) {
    return [];
  }
  return addresses.filter((addr) => !addr.deleted_at && !addr.deleted_by);
};

function TeacherProfile() {
  const { user, accessToken, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Main profile form state
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

  // Address management state
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    show: false,
    loading: false,
    editingId: null,
    data: {
      country: "",
      city: "",
      street: "",
      postalCode: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReconfirmPassword, setShowReconfirmPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
      setAddresses(filterActiveAddresses(user.address || []));
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

  // Redirect if not a Guru
  useEffect(() => {
    if (!user || user.role !== "Guru") {
      navigate("/");
    }
  }, [user, navigate]);

  // --- Profile Form Functions ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type and size
    if (!selectedFile.type.match("image.*")) {
      toast.error("Please select an image file (JPEG, PNG)");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast.error("Image size should be less than 2MB");
      return;
    }

    setProfileImage({
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
      current: "",
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
    // Basic validation
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

    // Password validation
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

      // Only append fields that have changed
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
      } else if (profileImage.current === "") {
        // This handles the case when user removes the image
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

        // Update user data in the store using setUser
        setUser(response.data.user);

        // Reset password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          reconfirmPassword: "",
        }));

        // Reset image state but keep the new one if uploaded
        setProfileImage((prev) => ({
          file: null,
          preview: "",
          current: response.data.user.img_profile || "",
        }));
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

  // --- Address Management Functions ---
  const openAddAddressForm = () => {
    if (!addressForm.show && !addressForm.loading) {
      setAddressForm({
        show: true,
        loading: false,
        editingId: null,
        data: { country: "", city: "", street: "", postalCode: "" },
      });
    }
  };

  const openEditAddressForm = (address) => {
    if (!addressForm.show && !addressForm.loading) {
      setAddressForm({
        show: true,
        loading: false,
        editingId: address._id,
        data: {
          country: address.country || "",
          city: address.city || "",
          street: address.street || "",
          postalCode: address.postalCode || "",
        },
      });
    }
  };

  const closeAddressForm = () => {
    setAddressForm({
      show: false,
      loading: false,
      editingId: null,
      data: { country: "", city: "", street: "", postalCode: "" },
    });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      data: { ...prev.data, [name]: value },
    }));
  };

  const validateAddressForm = () => {
    const { street, city } = addressForm.data;
    if (!street || street.trim() === "") {
      toast.error("Street is required for address.");
      return false;
    }
    if (!city || city.trim() === "") {
      toast.error("City is required for address.");
      return false;
    }
    return true;
  };

  const handleSubmitAddress = async () => {
    if (!validateAddressForm()) {
      return;
    }

    if (!user?._id) {
      toast.error("User ID is not available. Cannot save address.");
      return;
    }

    setAddressForm((prev) => ({ ...prev, loading: true }));

    try {
      let response;
      if (addressForm.editingId) {
        response = await api.patch(
          `/v1/address/${addressForm.editingId}`,
          addressForm.data,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      } else {
        response = await api.post(
          "/v1/address",
          {
            ...addressForm.data,
            userId: user._id,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.success
      ) {
        const savedAddress = response.data.address;
        setAddresses((prevAddresses) => {
          if (addressForm.editingId) {
            return prevAddresses.map((addr) =>
              addr._id === savedAddress._id ? savedAddress : addr
            );
          } else {
            if (!savedAddress.deleted_at && !savedAddress.deleted_by) {
              return [...prevAddresses, savedAddress];
            }
            return prevAddresses;
          }
        });

        if (user && setUser) {
          const updatedUserAddresses = Array.isArray(user.address)
            ? [...user.address]
            : [];
          if (addressForm.editingId) {
            const index = updatedUserAddresses.findIndex(
              (addr) => addr._id === savedAddress._id
            );
            if (index !== -1) {
              updatedUserAddresses[index] = savedAddress;
            } else {
              updatedUserAddresses.push(savedAddress);
            }
          } else {
            updatedUserAddresses.push(savedAddress);
          }
          setUser({ ...user, address: updatedUserAddresses });
        }

        toast.success(
          addressForm.editingId
            ? "Address updated successfully!"
            : "Address added successfully!"
        );
        closeAddressForm();
      } else {
        toast.error(response.data?.error || "Operation failed.");
      }
    } catch (error) {
      console.error(
        "Address operation error:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.error ||
        (error.response?.status
          ? `Request failed with status code ${error.response.status}`
          : error.message) ||
        `Failed to ${addressForm.editingId ? "update" : "add"} address.`;
      toast.error(errorMessage);
    } finally {
      setAddressForm((prev) => ({ ...prev, loading: false }));
    }
  };

  const showDeleteConfirmation = (addressId) => {
    if (addressForm.loading) return;

    toast.info(
      <div className="p-2 sm:p-4">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
          Confirm Deletion
        </h3>
        <p className="text-sm sm:text-base">
          Are you sure you want to delete this address? This cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-4">
          <button
            type="button"
            onClick={() => toast.dismiss()}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition text-sm sm:text-base"
            disabled={addressForm.loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleDeleteAddress(addressId)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm sm:text-base"
            disabled={addressForm.loading}
          >
            Delete
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        className: "w-full max-w-sm sm:max-w-md mx-4",
        hideProgressBar: true,
      }
    );
  };

  const handleDeleteAddress = async (addressId) => {
    toast.dismiss();
    setAddressForm((prev) => ({ ...prev, loading: true }));

    try {
      const response = await api.delete(`/v1/address/${addressId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.success
      ) {
        setAddresses((prevAddresses) =>
          prevAddresses.filter((addr) => addr._id !== addressId)
        );

        if (user && setUser && Array.isArray(user.address)) {
          const updatedUserAddresses = user.address.filter(
            (addr) => addr._id !== addressId
          );
          setUser({ ...user, address: updatedUserAddresses });
        }

        toast.success(response.data.message || "Address deleted successfully!");
      } else {
        toast.error(response.data?.error || "Deletion failed.");
      }
    } catch (error) {
      console.error(
        "Delete address error:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.error ||
        (error.response?.status
          ? `Request failed with status code ${error.response.status}`
          : error.message) ||
        "Failed to delete address.";
      toast.error(errorMessage);
    } finally {
      setAddressForm((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!user || user.role !== "Guru") {
    return null;
  }

  const imageToDisplay = profileImage.preview || profileImage.current;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Teacher Profile</h1>
            <p className="mt-1 text-indigo-100">
              Manage your account information and settings
            </p>
          </div>

          {/* Main Content */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                    {imageToDisplay ? (
                      <img
                        src={imageToDisplay}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiUser className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="p-2 bg-white bg-opacity-80 rounded-full text-indigo-600 hover:bg-opacity-100 transition-all"
                      title="Change photo"
                    >
                      <FiUpload className="w-5 h-5" />
                    </button>
                    {imageToDisplay && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="ml-2 p-2 bg-white bg-opacity-80 rounded-full text-red-600 hover:bg-opacity-100 transition-all"
                        title="Remove photo"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Profile Photo
                    </h2>
                    <p className="text-sm text-gray-500">
                      Recommended size: 500x500px. Max file size: 2MB.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiUpload className="-ml-1 mr-2 h-4 w-4" />
                      Upload photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Username */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Full Name */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Phone Number */}
                <div className="sm:col-span-4">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Current Password */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Leave blank to keep current"
                  />
                </div>

                {/* New Password */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                      placeholder="Leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    >
                      {showNewPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Reconfirm Password */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="reconfirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showReconfirmPassword ? "text" : "password"}
                      name="reconfirmPassword"
                      id="reconfirmPassword"
                      value={formData.reconfirmPassword}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowReconfirmPassword(!showReconfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
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

              {/* Form Actions */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !hasChanges}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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

            {/* Address Section */}
            <div className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  My Addresses
                </h2>
                {!addressForm.show && (
                  <button
                    type="button"
                    onClick={openAddAddressForm}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={addressForm.loading || addressForm.show}
                  >
                    <FiPlus className="mr-1 sm:mr-2 h-4 w-4" /> Add Address
                  </button>
                )}
              </div>

              {/* Existing Addresses */}
              <div className="space-y-3 sm:space-y-4">
                {addresses && addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address._id}
                      className={`p-3 sm:p-4 border rounded-lg bg-gray-50 shadow-sm relative transition-all duration-200 ${
                        addressForm.editingId === address._id
                          ? "ring-2 ring-indigo-500 border-indigo-500"
                          : "hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                        <div className="flex-1 pr-0 sm:pr-4">
                          <p className="text-sm sm:text-base font-medium text-gray-900 break-words">
                            {address.street || "No street provided"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">
                            {address.city || "No city provided"}
                            {address.city && address.country ? ", " : ""}
                            {address.country || ""}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {address.postalCode || "No postal code provided"}
                          </p>
                        </div>
                        <div className="flex space-x-2 sm:space-x-3 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditAddressForm(address)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={addressForm.loading || addressForm.show}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => showDeleteConfirmation(address._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={addressForm.loading || addressForm.show}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">
                        No addresses found
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        Get started by adding your first address.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Add/Edit Address Form */}
              {addressForm.show && (
                <div className="mt-6 sm:mt-8 border-t pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      {addressForm.editingId
                        ? "Edit Address"
                        : "Add New Address"}
                    </h3>
                    <button
                      type="button"
                      onClick={closeAddressForm}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={addressForm.loading}
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="street"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="street"
                          id="street"
                          value={addressForm.data.street}
                          onChange={handleAddressChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Enter street address"
                          disabled={addressForm.loading}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={addressForm.data.city}
                          onChange={handleAddressChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Enter city"
                          disabled={addressForm.loading}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          id="country"
                          value={addressForm.data.country}
                          onChange={handleAddressChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Enter country"
                          disabled={addressForm.loading}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="postalCode"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          id="postalCode"
                          value={addressForm.data.postalCode}
                          onChange={handleAddressChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          placeholder="Enter postal code"
                          disabled={addressForm.loading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeAddressForm}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                        disabled={addressForm.loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitAddress}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                        disabled={addressForm.loading}
                      >
                        {addressForm.loading ? (
                          <svg
                            className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white"
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
                        ) : null}
                        {addressForm.loading
                          ? "Saving..."
                          : addressForm.editingId
                          ? "Update Address"
                          : "Add Address"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
