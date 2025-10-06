import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FaBell,
  FaCheck,
  FaCog,
  FaDatabase,
  FaExclamationTriangle,
  FaPalette,
  FaSave,
  FaServer,
  FaShieldAlt,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import api from "../../utils/api";

const SystemSettingsManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Fetch system settings
  const {
    data: settingsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const response = await api.get("/v1/admin/system/settings", {
        withCredentials: true,
      });
      return response.data;
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedSettings) => {
      const response = await api.patch(
        "/v1/admin/system/settings",
        updatedSettings,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["systemSettings"]);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleSaveSettings = async (category, settings) => {
    setSaving(true);
    updateMutation.mutate({
      [category]: settings,
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  const settings = settingsData?.data || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaCog className="h-8 w-8 text-purple-600" />
              System Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure system-wide settings and preferences
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === "success" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-lg">
                <FaCheck className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Settings saved successfully
                </span>
              </div>
            )}

            {saveStatus === "error" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg">
                <FaExclamationTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Failed to save settings
                </span>
              </div>
            )}

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-600 rounded-lg"
              title="Refresh Settings"
            >
              <FaSync className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "general", name: "General", icon: FaCog },
                { id: "security", name: "Security", icon: FaShieldAlt },
                { id: "notifications", name: "Notifications", icon: FaBell },
                { id: "appearance", name: "Appearance", icon: FaPalette },
                { id: "database", name: "Database", icon: FaDatabase },
                { id: "api", name: "API", icon: FaServer },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="p-6">
            {activeTab === "general" && (
              <GeneralSettings
                settings={settings.general}
                onSave={(data) => handleSaveSettings("general", data)}
                saving={saving}
              />
            )}

            {activeTab === "security" && (
              <SecuritySettings
                settings={settings.security}
                onSave={(data) => handleSaveSettings("security", data)}
                saving={saving}
              />
            )}

            {activeTab === "notifications" && (
              <NotificationSettings
                settings={settings.notifications}
                onSave={(data) => handleSaveSettings("notifications", data)}
                saving={saving}
              />
            )}

            {activeTab === "appearance" && (
              <AppearanceSettings
                settings={settings.appearance}
                onSave={(data) => handleSaveSettings("appearance", data)}
                saving={saving}
              />
            )}

            {activeTab === "database" && (
              <DatabaseSettings
                settings={settings.database}
                onSave={(data) => handleSaveSettings("database", data)}
                saving={saving}
              />
            )}

            {activeTab === "api" && (
              <ApiSettings
                settings={settings.api}
                onSave={(data) => handleSaveSettings("api", data)}
                saving={saving}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// General Settings Component
const GeneralSettings = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    siteName: settings?.siteName || "XP Gamification",
    siteDescription: settings?.siteDescription || "",
    maintenanceMode: settings?.maintenanceMode || false,
    maxFileSize: settings?.maxFileSize || 5,
    allowedFileTypes: settings?.allowedFileTypes || [
      "jpg",
      "jpeg",
      "png",
      "gif",
    ],
    userRegistration: settings?.userRegistration || true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        General Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <SettingInput
            label="Site Name"
            name="siteName"
            value={formData.siteName}
            onChange={(value) => handleChange("siteName", value)}
            type="text"
            placeholder="Enter site name"
          />

          <SettingInput
            label="Site Description"
            name="siteDescription"
            value={formData.siteDescription}
            onChange={(value) => handleChange("siteDescription", value)}
            type="textarea"
            placeholder="Enter site description"
          />

          <SettingInput
            label="Max File Size (MB)"
            name="maxFileSize"
            value={formData.maxFileSize}
            onChange={(value) => handleChange("maxFileSize", parseInt(value))}
            type="number"
            min="1"
            max="50"
          />

          <SettingInput
            label="User Registration"
            name="userRegistration"
            value={formData.userRegistration}
            onChange={(value) => handleChange("userRegistration", value)}
            type="switch"
            description="Allow new users to register"
          />

          <SettingInput
            label="Maintenance Mode"
            name="maintenanceMode"
            value={formData.maintenanceMode}
            onChange={(value) => handleChange("maintenanceMode", value)}
            type="switch"
            description="Put the site in maintenance mode"
          />
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Security Settings Component
const SecuritySettings = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    passwordMinLength: settings?.passwordMinLength || 8,
    passwordRequireSpecial: settings?.passwordRequireSpecial || true,
    passwordRequireNumbers: settings?.passwordRequireNumbers || true,
    maxLoginAttempts: settings?.maxLoginAttempts || 5,
    loginLockoutTime: settings?.loginLockoutTime || 15,
    sessionTimeout: settings?.sessionTimeout || 24,
    twoFactorAuth: settings?.twoFactorAuth || false,
    httpsOnly: settings?.httpsOnly || true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FaShieldAlt className="h-5 w-5 text-red-500" />
        Security Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingInput
              label="Password Minimum Length"
              name="passwordMinLength"
              value={formData.passwordMinLength}
              onChange={(value) =>
                handleChange("passwordMinLength", parseInt(value))
              }
              type="number"
              min="6"
              max="32"
            />

            <SettingInput
              label="Max Login Attempts"
              name="maxLoginAttempts"
              value={formData.maxLoginAttempts}
              onChange={(value) =>
                handleChange("maxLoginAttempts", parseInt(value))
              }
              type="number"
              min="1"
              max="10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingInput
              label="Login Lockout Time (minutes)"
              name="loginLockoutTime"
              value={formData.loginLockoutTime}
              onChange={(value) =>
                handleChange("loginLockoutTime", parseInt(value))
              }
              type="number"
              min="1"
              max="60"
            />

            <SettingInput
              label="Session Timeout (hours)"
              name="sessionTimeout"
              value={formData.sessionTimeout}
              onChange={(value) =>
                handleChange("sessionTimeout", parseInt(value))
              }
              type="number"
              min="1"
              max="168"
            />
          </div>

          <div className="space-y-4">
            <SettingInput
              label="Require Special Characters"
              name="passwordRequireSpecial"
              value={formData.passwordRequireSpecial}
              onChange={(value) =>
                handleChange("passwordRequireSpecial", value)
              }
              type="switch"
              description="Passwords must contain special characters"
            />

            <SettingInput
              label="Require Numbers"
              name="passwordRequireNumbers"
              value={formData.passwordRequireNumbers}
              onChange={(value) =>
                handleChange("passwordRequireNumbers", value)
              }
              type="switch"
              description="Passwords must contain numbers"
            />

            <SettingInput
              label="Two-Factor Authentication"
              name="twoFactorAuth"
              value={formData.twoFactorAuth}
              onChange={(value) => handleChange("twoFactorAuth", value)}
              type="switch"
              description="Enable two-factor authentication for all users"
            />

            <SettingInput
              label="HTTPS Only"
              name="httpsOnly"
              value={formData.httpsOnly}
              onChange={(value) => handleChange("httpsOnly", value)}
              type="switch"
              description="Force HTTPS connections"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Notification Settings Component
const NotificationSettings = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    emailNotifications: settings?.emailNotifications || true,
    pushNotifications: settings?.pushNotifications || false,
    adminAlerts: settings?.adminAlerts || true,
    userWelcomeEmail: settings?.userWelcomeEmail || true,
    xpGainNotifications: settings?.xpGainNotifications || true,
    levelUpNotifications: settings?.levelUpNotifications || true,
    badgeUnlockNotifications: settings?.badgeUnlockNotifications || true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FaBell className="h-5 w-5 text-yellow-500" />
        Notification Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Notification Channels
            </h3>
            <div className="space-y-4">
              <SettingInput
                label="Email Notifications"
                name="emailNotifications"
                value={formData.emailNotifications}
                onChange={(value) => handleChange("emailNotifications", value)}
                type="switch"
                description="Send notifications via email"
              />

              <SettingInput
                label="Push Notifications"
                name="pushNotifications"
                value={formData.pushNotifications}
                onChange={(value) => handleChange("pushNotifications", value)}
                type="switch"
                description="Enable browser push notifications"
              />

              <SettingInput
                label="Admin Alert Notifications"
                name="adminAlerts"
                value={formData.adminAlerts}
                onChange={(value) => handleChange("adminAlerts", value)}
                type="switch"
                description="Send system alerts to administrators"
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              User Notifications
            </h3>
            <div className="space-y-4">
              <SettingInput
                label="Welcome Email"
                name="userWelcomeEmail"
                value={formData.userWelcomeEmail}
                onChange={(value) => handleChange("userWelcomeEmail", value)}
                type="switch"
                description="Send welcome email to new users"
              />

              <SettingInput
                label="XP Gain Notifications"
                name="xpGainNotifications"
                value={formData.xpGainNotifications}
                onChange={(value) => handleChange("xpGainNotifications", value)}
                type="switch"
                description="Notify users when they gain XP"
              />

              <SettingInput
                label="Level Up Notifications"
                name="levelUpNotifications"
                value={formData.levelUpNotifications}
                onChange={(value) =>
                  handleChange("levelUpNotifications", value)
                }
                type="switch"
                description="Notify users when they level up"
              />

              <SettingInput
                label="Badge Unlock Notifications"
                name="badgeUnlockNotifications"
                value={formData.badgeUnlockNotifications}
                onChange={(value) =>
                  handleChange("badgeUnlockNotifications", value)
                }
                type="switch"
                description="Notify users when they unlock badges"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Appearance Settings Component
const AppearanceSettings = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    theme: settings?.theme || "light",
    primaryColor: settings?.primaryColor || "#3B82F6",
    secondaryColor: settings?.secondaryColor || "#10B981",
    darkMode: settings?.darkMode || true,
    roundedCorners: settings?.roundedCorners || true,
    animations: settings?.animations || true,
    fontFamily: settings?.fontFamily || "Inter",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FaPalette className="h-5 w-5 text-pink-500" />
        Appearance Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <SettingInput
            label="Theme"
            name="theme"
            value={formData.theme}
            onChange={(value) => handleChange("theme", value)}
            type="select"
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "auto", label: "Auto (System)" },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingInput
              label="Primary Color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={(value) => handleChange("primaryColor", value)}
              type="color"
            />

            <SettingInput
              label="Secondary Color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={(value) => handleChange("secondaryColor", value)}
              type="color"
            />
          </div>

          <SettingInput
            label="Font Family"
            name="fontFamily"
            value={formData.fontFamily}
            onChange={(value) => handleChange("fontFamily", value)}
            type="select"
            options={[
              { value: "Inter", label: "Inter" },
              { value: "Roboto", label: "Roboto" },
              { value: "Open Sans", label: "Open Sans" },
              { value: "Montserrat", label: "Montserrat" },
              { value: "System UI", label: "System Default" },
            ]}
          />

          <div className="space-y-4">
            <SettingInput
              label="Dark Mode Support"
              name="darkMode"
              value={formData.darkMode}
              onChange={(value) => handleChange("darkMode", value)}
              type="switch"
              description="Enable dark mode theme"
            />

            <SettingInput
              label="Rounded Corners"
              name="roundedCorners"
              value={formData.roundedCorners}
              onChange={(value) => handleChange("roundedCorners", value)}
              type="switch"
              description="Use rounded corners in UI elements"
            />

            <SettingInput
              label="Animations"
              name="animations"
              value={formData.animations}
              onChange={(value) => handleChange("animations", value)}
              type="switch"
              description="Enable UI animations and transitions"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Database Settings Component
const DatabaseSettings = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    backupInterval: settings?.backupInterval || 24,
    backupRetention: settings?.backupRetention || 7,
    queryTimeout: settings?.queryTimeout || 30,
    maxConnections: settings?.maxConnections || 100,
    slowQueryThreshold: settings?.slowQueryThreshold || 1000,
    logQueries: settings?.logQueries || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FaDatabase className="h-5 w-5 text-blue-500" />
        Database Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingInput
              label="Backup Interval (hours)"
              name="backupInterval"
              value={formData.backupInterval}
              onChange={(value) =>
                handleChange("backupInterval", parseInt(value))
              }
              type="number"
              min="1"
              max="168"
            />

            <SettingInput
              label="Backup Retention (days)"
              name="backupRetention"
              value={formData.backupRetention}
              onChange={(value) =>
                handleChange("backupRetention", parseInt(value))
              }
              type="number"
              min="1"
              max="30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingInput
              label="Query Timeout (seconds)"
              name="queryTimeout"
              value={formData.queryTimeout}
              onChange={(value) =>
                handleChange("queryTimeout", parseInt(value))
              }
              type="number"
              min="5"
              max="300"
            />

            <SettingInput
              label="Max Connections"
              name="maxConnections"
              value={formData.maxConnections}
              onChange={(value) =>
                handleChange("maxConnections", parseInt(value))
              }
              type="number"
              min="10"
              max="1000"
            />
          </div>

          <SettingInput
            label="Slow Query Threshold (ms)"
            name="slowQueryThreshold"
            value={formData.slowQueryThreshold}
            onChange={(value) =>
              handleChange("slowQueryThreshold", parseInt(value))
            }
            type="number"
            min="100"
            max="10000"
          />

          <SettingInput
            label="Log All Queries"
            name="logQueries"
            value={formData.logQueries}
            onChange={(value) => handleChange("logQueries", value)}
            type="switch"
            description="Log all database queries (for debugging)"
          />
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// API Settings Component
const ApiSettings = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    rateLimit: settings?.rateLimit || 100,
    rateLimitWindow: settings?.rateLimitWindow || 15,
    corsEnabled: settings?.corsEnabled || true,
    apiDocumentation: settings?.apiDocumentation || true,
    maxRequestSize: settings?.maxRequestSize || 10,
    enableGraphQL: settings?.enableGraphQL || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FaServer className="h-5 w-5 text-green-500" />
        API Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingInput
              label="Rate Limit (requests)"
              name="rateLimit"
              value={formData.rateLimit}
              onChange={(value) => handleChange("rateLimit", parseInt(value))}
              type="number"
              min="10"
              max="1000"
            />

            <SettingInput
              label="Rate Limit Window (minutes)"
              name="rateLimitWindow"
              value={formData.rateLimitWindow}
              onChange={(value) =>
                handleChange("rateLimitWindow", parseInt(value))
              }
              type="number"
              min="1"
              max="60"
            />
          </div>

          <SettingInput
            label="Max Request Size (MB)"
            name="maxRequestSize"
            value={formData.maxRequestSize}
            onChange={(value) =>
              handleChange("maxRequestSize", parseInt(value))
            }
            type="number"
            min="1"
            max="50"
          />

          <div className="space-y-4">
            <SettingInput
              label="CORS Enabled"
              name="corsEnabled"
              value={formData.corsEnabled}
              onChange={(value) => handleChange("corsEnabled", value)}
              type="switch"
              description="Enable Cross-Origin Resource Sharing"
            />

            <SettingInput
              label="API Documentation"
              name="apiDocumentation"
              value={formData.apiDocumentation}
              onChange={(value) => handleChange("apiDocumentation", value)}
              type="switch"
              description="Enable API documentation endpoint"
            />

            <SettingInput
              label="GraphQL API"
              name="enableGraphQL"
              value={formData.enableGraphQL}
              onChange={(value) => handleChange("enableGraphQL", value)}
              type="switch"
              description="Enable GraphQL API endpoint"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Reusable Setting Input Component
const SettingInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  options = [],
  description,
  ...props
}) => {
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            {...props}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "switch":
        return (
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              value ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
            {...props}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                value ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        );

      case "color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
              {...props}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {value}
            </span>
          </div>
        );

      default:
        return (
          <input
            type={type}
            value={value}
            onChange={(e) =>
              onChange(
                type === "number" ? parseInt(e.target.value) : e.target.value
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            {...props}
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      {renderInput()}
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-t-xl animate-pulse"></div>
        <div className="p-6">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

// Error State
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-96">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaTimes className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to Load Settings
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default SystemSettingsManagement;
