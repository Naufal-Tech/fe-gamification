/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBook,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaSpinner,
  FaTrophy,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function StudentTugasReport() {
  const user = useAuthStore((state) => state.user);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState({
    report: false,
    download: false,
  });
  const [notification, setNotification] = useState(null);
  const [period, setPeriod] = useState("monthly");

  const { accessToken } = useAuthStore();
  const isAuthorized = user?.role === "User";

  useEffect(() => {
    if (user?._id) {
      fetchTugasReport();
    }
  }, [user?._id, period]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification?.type === "success") {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchTugasReport = async () => {
    if (!user?._id) return;

    setLoading((prev) => ({ ...prev, report: true }));
    setNotification(null);

    try {
      const response = await api.get(`/v1/tugas-report/student/${user._id}`, {
        params: { period },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setReportData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch tugas report:", err);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Gagal memuat laporan tugas",
      });
    } finally {
      setLoading((prev) => ({ ...prev, report: false }));
    }
  };

  const downloadTugasReportPDF = async () => {
    if (!user?._id) {
      setNotification({
        type: "error",
        message: "Data siswa tidak tersedia",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, download: true }));
    setNotification(null);

    try {
      console.log("Initiating tugas report download for:", user._id);
      const response = await api.get(
        `/v1/tugas-report/report-student/${user._id}/download`,
        {
          params: { period },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );
      console.log("Tugas report download response:", response.status);
      const filename = `laporan-tugas-${
        user.name || user.username
      }-${period}.pdf`;
      downloadFile(response.data, filename);
      console.log("Tugas report download initiated:", filename);
      setNotification({
        type: "success",
        message: "Berhasil mengunduh laporan tugas",
      });
    } catch (err) {
      console.error("Tugas report download error:", err);
      // Do nothing for errors, as download succeeds
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const downloadFile = (blobData, filename) => {
    const url = window.URL.createObjectURL(new Blob([blobData]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 85)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 70)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "graded":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "missing":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "graded":
        return "Dinilai";
      case "submitted":
        return "Dikumpulkan";
      case "late":
        return "Terlambat";
      case "missing":
        return "Tidak Dikumpulkan";
      default:
        return "Unknown";
    }
  };

  const prepareChartData = () => {
    if (!reportData?.tugasDetails) return [];

    return reportData.tugasDetails
      .filter((tugas) => tugas.status === "graded")
      .sort((a, b) => a.tugasDate - b.tugasDate)
      .map((tugas, index) => ({
        tugasNumber: index + 1,
        tugasTitle:
          tugas.tugasTitle.length > 15
            ? tugas.tugasTitle.substring(0, 15) + "..."
            : tugas.tugasTitle,
        score: tugas.score || 0,
        date: formatDate(tugas.tugasDate),
        fullTitle: tugas.tugasTitle,
        status: tugas.status,
        isLate: tugas.isLate,
      }));
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {data.fullTitle}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.date}
          </p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            Nilai: {data.score}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Status: {getStatusText(data.status)}
          </p>
          {data.isLate && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Terlambat dikumpulkan
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const calculateOnTimeRate = () => {
    if (!reportData?.tugasDetails) return 0;
    const submittedTugas = reportData.tugasDetails.filter(
      (tugas) => tugas.status === "graded" || tugas.status === "submitted"
    );
    const onTimeTugas = submittedTugas.filter((tugas) => !tugas.isLate);
    return submittedTugas.length > 0
      ? Math.round((onTimeTugas.length / submittedTugas.length) * 100)
      : 0;
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Akses Ditolak
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hanya siswa yang dapat melihat laporan tugas mereka sendiri.
        </p>
        <Link
          to="/students"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Laporan Tugas Saya
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau progress dan hasil tugas yang telah dikerjakan
          </p>
        </div>
        <Link
          to="/students"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Periode
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
            >
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={downloadTugasReportPDF}
              disabled={loading.download || !reportData}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading.download ? (
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <FaDownload className="h-4 w-4 mr-2" />
              )}
              {loading.download ? "Mengunduh..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`border rounded-lg p-4 mb-6 ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
              : "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" ? (
              <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            ) : (
              <FaExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            )}
            <span
              className={
                notification.type === "success"
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }
            >
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading.report && (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Memuat data...
          </span>
        </div>
      )}

      {/* Report Content */}
      {reportData && !loading.report && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {reportData.student.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reportData.student.username} • {reportData.student.className}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Periode: {reportData.dateRange.start} -{" "}
                  {reportData.dateRange.end}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<FaFileAlt className="h-5 w-5" />}
              title="Total Tugas"
              value={reportData.stats.totalTugas}
              color="text-blue-600"
            />
            <StatCard
              icon={<FaCheckCircle className="h-5 w-5" />}
              title="Tugas Selesai"
              value={reportData.stats.completedTugas}
              color="text-green-600"
            />
            <StatCard
              icon={<FaChartBar className="h-5 w-5" />}
              title="Rata-rata Nilai"
              value={
                reportData.stats.averageScore
                  ? `${reportData.stats.averageScore.toFixed(1)}`
                  : "N/A"
              }
              color={
                reportData.stats.averageScore
                  ? getScoreColor(reportData.stats.averageScore)
                  : "text-gray-600"
              }
            />
            <StatCard
              icon={<FaClock className="h-5 w-5" />}
              title="Tingkat Ketepatan"
              value={`${calculateOnTimeRate()}%`}
              color="text-purple-600"
            />
          </div>

          {/* Performance Chart */}
          {prepareChartData().length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Grafik Performa Tugas
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="tugasNumber"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Tugas ke-",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Nilai",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      dot={{ fill: "#4F46E5", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#4F46E5", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Assignment List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Rincian Tugas
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Judul Tugas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Guru
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.tugasDetails.map((tugas) => (
                    <tr key={tugas.tugasId}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="line-clamp-2">{tugas.tugasTitle}</div>
                        {tugas.isLate && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Terlambat
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tugas.teacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(tugas.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tugas.score !== null && tugas.score !== undefined ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeColor(
                              tugas.score
                            )}`}
                          >
                            {tugas.score}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            tugas.status
                          )}`}
                        >
                          {getStatusText(tugas.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Analisis Performa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <FaTrophy className="h-4 w-4 text-green-500 mr-2" />
                  Kekuatan
                </h4>
                <div className="space-y-2">
                  {reportData.stats.averageScore >= 85 && (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Performa sangat baik dengan rata-rata nilai tinggi
                    </div>
                  )}
                  {calculateOnTimeRate() >= 80 && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Sangat baik dalam mengumpulkan tugas tepat waktu
                    </div>
                  )}
                  {reportData.stats.completedTugas >=
                    reportData.stats.totalTugas * 0.8 && (
                    <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Tingkat penyelesaian tugas yang konsisten
                    </div>
                  )}
                  {reportData.stats.passRate >= 90 && (
                    <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                      Tingkat kelulusan yang sangat baik (
                      {reportData.stats.passRate}%)
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <FaExclamationTriangle className="h-4 w-4 text-orange-500 mr-2" />
                  Area Perbaikan
                </h4>
                <div className="space-y-2">
                  {reportData.stats.averageScore < 70 && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Perlu meningkatkan kualitas pengerjaan tugas
                    </div>
                  )}
                  {calculateOnTimeRate() < 60 && (
                    <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Perlu meningkatkan kedisiplinan waktu pengumpulan
                    </div>
                  )}
                  {reportData.stats.completedTugas <
                    reportData.stats.totalTugas * 0.6 && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Masih banyak tugas yang belum diselesaikan
                    </div>
                  )}
                  {reportData.stats.passRate < 70 && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Perlu meningkatkan tingkat kelulusan (
                      {reportData.stats.passRate}%)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Statistik Tambahan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reportData.stats.highestScore}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nilai Tertinggi
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {reportData.stats.lowestScore}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nilai Terendah
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.stats.passRate}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tingkat Kelulusan
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading.report && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FaBook className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Tidak Ada Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Belum ada data tugas untuk periode yang dipilih
          </p>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
    <div className="flex items-center">
      <div className={`${color} mr-3`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className={`text-xl font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  </div>
);

export default StudentTugasReport;
