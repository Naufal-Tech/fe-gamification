import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCpu,
  FaDatabase,
  FaExclamationTriangle,
  FaHdd,
  FaMemory,
  FaNetworkWired,
  FaRocket,
  FaServer,
  FaShieldAlt,
  FaSync,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";
import api from "../../utils/api";

const SuperSystemHealthManagement = () => {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch system health data
  const {
    data: healthData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: async () => {
      const response = await api.get("/v1/admin/system/health", {
        withCredentials: true,
      });
      setLastUpdated(new Date());
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
  });

  // Toggle auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "up":
      case "online":
        return "green";
      case "warning":
      case "degraded":
        return "yellow";
      case "error":
      case "down":
      case "offline":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "up":
      case "online":
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
      case "degraded":
        return <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
      case "down":
      case "offline":
        return <FaTimesCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaExclamationTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

  const health = healthData?.data || {};
  const systemInfo = health.system || {};
  const services = health.services || [];
  const performance = health.performance || {};
  const database = health.database || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaServer className="h-8 w-8 text-blue-600" />
              System Health Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor system performance, services, and overall health status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh
              </label>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FaSync className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            icon={<FaServer />}
            title="System Status"
            status={systemInfo.status}
            value={
              systemInfo.uptime ? formatUptime(systemInfo.uptime) : "Unknown"
            }
            subtitle="Uptime"
            color={getStatusColor(systemInfo.status)}
          />

          <StatusCard
            icon={<FaDatabase />}
            title="Database"
            status={database.status}
            value={
              database.connections
                ? `${database.connections.active}/${database.connections.max}`
                : "Unknown"
            }
            subtitle="Active Connections"
            color={getStatusColor(database.status)}
          />

          <StatusCard
            icon={<FaCpu />}
            title="CPU Usage"
            status={performance.cpu?.usage > 80 ? "warning" : "healthy"}
            value={performance.cpu ? `${performance.cpu.usage}%` : "Unknown"}
            subtitle={`${performance.cpu?.cores || 0} Cores`}
            color={performance.cpu?.usage > 80 ? "yellow" : "green"}
          />

          <StatusCard
            icon={<FaMemory />}
            title="Memory Usage"
            status={performance.memory?.usage > 85 ? "warning" : "healthy"}
            value={
              performance.memory ? `${performance.memory.usage}%` : "Unknown"
            }
            subtitle={
              performance.memory
                ? formatBytes(performance.memory.used)
                : "Unknown"
            }
            color={performance.memory?.usage > 85 ? "yellow" : "green"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services Status */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaShieldAlt className="h-5 w-5 text-blue-500" />
                  Services Status
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <ServiceStatusItem key={index} service={service} />
                  ))}

                  {services.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No service data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaChartLine className="h-5 w-5 text-green-500" />
                  Performance
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <MetricItem
                  icon={<FaCpu />}
                  label="CPU Usage"
                  value={performance.cpu ? `${performance.cpu.usage}%` : "N/A"}
                  color={
                    performance.cpu?.usage > 80
                      ? "red"
                      : performance.cpu?.usage > 60
                      ? "yellow"
                      : "green"
                  }
                />

                <MetricItem
                  icon={<FaMemory />}
                  label="Memory Usage"
                  value={
                    performance.memory ? `${performance.memory.usage}%` : "N/A"
                  }
                  color={
                    performance.memory?.usage > 85
                      ? "red"
                      : performance.memory?.usage > 70
                      ? "yellow"
                      : "green"
                  }
                />

                <MetricItem
                  icon={<FaHdd />}
                  label="Disk Usage"
                  value={
                    performance.disk ? `${performance.disk.usage}%` : "N/A"
                  }
                  color={
                    performance.disk?.usage > 90
                      ? "red"
                      : performance.disk?.usage > 80
                      ? "yellow"
                      : "green"
                  }
                />

                <MetricItem
                  icon={<FaNetworkWired />}
                  label="Network I/O"
                  value={
                    performance.network
                      ? `${formatBytes(performance.network.bytesSec)}/s`
                      : "N/A"
                  }
                  color="blue"
                />
              </div>
            </div>

            {/* Database Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaDatabase className="h-5 w-5 text-purple-500" />
                  Database
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <MetricItem
                  icon={<FaUsers />}
                  label="Active Connections"
                  value={
                    database.connections
                      ? `${database.connections.active}/${database.connections.max}`
                      : "N/A"
                  }
                  color={
                    database.connections?.active >
                    database.connections?.max * 0.8
                      ? "yellow"
                      : "green"
                  }
                />

                <MetricItem
                  icon={<FaClock />}
                  label="Query Time"
                  value={
                    database.performance
                      ? `${database.performance.avgQueryTime}ms`
                      : "N/A"
                  }
                  color={
                    database.performance?.avgQueryTime > 100
                      ? "yellow"
                      : "green"
                  }
                />

                <MetricItem
                  icon={<FaRocket />}
                  label="Operations/sec"
                  value={
                    database.performance
                      ? database.performance.opsPerSecond.toLocaleString()
                      : "N/A"
                  }
                  color="blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaServer className="h-5 w-5 text-gray-500" />
              System Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InfoItem label="Platform" value={systemInfo.platform || "N/A"} />
              <InfoItem label="Architecture" value={systemInfo.arch || "N/A"} />
              <InfoItem
                label="Node.js Version"
                value={systemInfo.nodeVersion || "N/A"}
              />
              <InfoItem
                label="Environment"
                value={systemInfo.environment || "N/A"}
              />
              <InfoItem label="Process ID" value={systemInfo.pid || "N/A"} />
              <InfoItem
                label="Uptime"
                value={
                  systemInfo.uptime ? formatUptime(systemInfo.uptime) : "N/A"
                }
              />
              <InfoItem
                label="Memory (Total)"
                value={
                  performance.memory
                    ? formatBytes(performance.memory.total)
                    : "N/A"
                }
              />
              <InfoItem
                label="CPU Cores"
                value={performance.cpu?.cores || "N/A"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Card Component
const StatusCard = ({ icon, title, status, value, subtitle, color }) => {
  const colorClasses = {
    green:
      "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    yellow:
      "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    red: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    gray: "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800",
  };

  const statusColors = {
    green: "text-green-800 dark:text-green-300",
    yellow: "text-yellow-800 dark:text-yellow-300",
    red: "text-red-800 dark:text-red-300",
    gray: "text-gray-800 dark:text-gray-300",
  };

  return (
    <div
      className={`rounded-xl border p-6 ${
        colorClasses[color] || colorClasses.gray
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}
          >
            {React.cloneElement(icon, { className: "h-6 w-6" })}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <div
          className={`text-sm font-medium capitalize ${
            statusColors[color] || statusColors.gray
          }`}
        >
          {status || "Unknown"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value || "N/A"}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

// Service Status Item
const ServiceStatusItem = ({ service }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "up":
      case "healthy":
        return "text-green-500";
      case "degraded":
      case "warning":
        return "text-yellow-500";
      case "down":
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "up":
      case "healthy":
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
      case "warning":
        return <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />;
      case "down":
      case "error":
        return <FaTimesCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaExclamationTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        {getStatusIcon(service.status)}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {service.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {service.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-medium ${getStatusColor(service.status)}`}
        >
          {service.status?.toUpperCase() || "UNKNOWN"}
        </span>
        {service.responseTime && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {service.responseTime}ms
          </span>
        )}
      </div>
    </div>
  );
};

// Metric Item Component
const MetricItem = ({ icon, label, value, color }) => {
  const colorClasses = {
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">
          {React.cloneElement(icon, { className: "h-4 w-4" })}
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-semibold ${
          colorClasses[color] || colorClasses.blue
        }`}
      >
        {value}
      </span>
    </div>
  );
};

// Info Item Component
const InfoItem = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </dt>
    <dd className="text-sm text-gray-900 dark:text-white mt-1">{value}</dd>
  </div>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
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
        <FaTimesCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to Load System Health
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default SuperSystemHealthManagement;
