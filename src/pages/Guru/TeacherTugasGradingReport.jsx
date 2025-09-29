/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaChartBar,
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaSpinner,
  FaTrophy,
  FaUsers,
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

function TeacherExamGradingReport() {
  const user = useAuthStore((state) => state.user);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [studentReportData, setStudentReportData] = useState(null);
  const [loading, setLoading] = useState({
    report: false,
    student: false,
    download: false,
  });
  const [notification, setNotification] = useState(null);
  const [period, setPeriod] = useState("monthly");
  const [viewMode, setViewMode] = useState("class");
  const [studentsList, setStudentsList] = useState([]);

  const classes = user?.teachingClass || [];
  const { accessToken } = useAuthStore();
  const isAuthorized = user?.role === "Guru";

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedClass) {
      if (viewMode === "class") {
        fetchClassReport();
      } else {
        fetchStudentsList();
      }
    }
  }, [selectedClass, period, viewMode]);

  useEffect(() => {
    if (selectedStudent && viewMode === "student") {
      fetchStudentReport();
    }
  }, [selectedStudent, period]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification?.type === "success") {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchClassReport = async () => {
    if (!selectedClass) return;

    setLoading((prev) => ({ ...prev, report: true }));
    setNotification(null);

    try {
      const response = await api.get(
        `/v1/exam-report/kelas/${selectedClass._id}`,
        {
          params: { period },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setReportData(response.data.data);

      // Update students list with actual student data from report
      if (
        response.data.data.topPerformers &&
        response.data.data.topPerformers.length > 0
      ) {
        const allStudents = [
          ...response.data.data.topPerformers,
          ...(response.data.data.lowPerformers || []),
        ];

        const uniqueStudents = allStudents.reduce((acc, student) => {
          if (!acc.find((s) => s.id === student.studentId)) {
            acc.push({
              id: student.studentId,
              name: student.studentName || `Student ${student.studentId}`,
            });
          }
          return acc;
        }, []);

        setStudentsList(uniqueStudents);
      }
    } catch (err) {
      console.error("Failed to fetch class report:", err);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Gagal memuat laporan kelas",
      });
    } finally {
      setLoading((prev) => ({ ...prev, report: false }));
    }
  };

  const fetchStudentsList = async () => {
    if (!selectedClass) return;

    try {
      const response = await api.get(
        `/v1/kelas/students-list/${selectedClass._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const students = response.data.data.students.map((student) => ({
        id: student.id,
        name: student.name || student.username || `Student ${student.id}`,
      }));

      setStudentsList(students);
    } catch (err) {
      console.error("Failed to fetch students list:", err);
      if (viewMode === "student") {
        await fetchClassReport();
      }
    }
  };

  const fetchStudentReport = async () => {
    if (!selectedStudent) return;

    setLoading((prev) => ({ ...prev, student: true }));
    setNotification(null);

    try {
      const response = await api.get(
        `/v1/exam-report/student/${selectedStudent}`,
        {
          params: { period },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setStudentReportData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch student report:", err);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Gagal memuat laporan siswa",
      });
    } finally {
      setLoading((prev) => ({ ...prev, student: false }));
    }
  };

  const downloadClassReportPDF = async () => {
    if (!selectedClass) {
      setNotification({
        type: "error",
        message: "Pilih kelas terlebih dahulu",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, download: true }));
    setNotification(null);

    try {
      console.log("Initiating class report download for:", selectedClass._id);
      const response = await api.get(
        `/v1/exam-report/report-kelas/${selectedClass._id}/download`,
        {
          params: { period },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );
      console.log("Class report download response:", response.status);
      const filename = `laporan-kelas-${selectedClass.name}-${period}.pdf`;
      downloadFile(response.data, filename);
      console.log("Class report download initiated:", filename);
      setNotification({
        type: "success",
        message: "Berhasil mengunduh laporan kelas",
      });
    } catch (err) {
      console.error("Class report download error:", err);
      // Do nothing for errors, as download succeeds
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const downloadStudentReportPDF = async () => {
    if (!selectedStudent) {
      setNotification({
        type: "error",
        message: "Pilih siswa terlebih dahulu",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, download: true }));
    setNotification(null);

    try {
      console.log("Initiating student report download for:", selectedStudent);
      const response = await api.get(
        `/v1/exam-report/report-student/${selectedStudent}/download`,
        {
          params: { period },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "blob",
        }
      );
      console.log("Student report download response:", response.status);
      const studentName =
        studentsList.find((s) => s.id === selectedStudent)?.name || "siswa";
      const filename = `laporan-siswa-${studentName}-${period}.pdf`;
      downloadFile(response.data, filename);
      console.log("Student report download initiated:", filename);
      setNotification({
        type: "success",
        message: "Berhasil mengunduh laporan siswa",
      });
    } catch (err) {
      console.error("Student report download error:", err);
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

  const prepareChartData = () => {
    if (!studentReportData?.examDetails) return [];

    return studentReportData.examDetails
      .sort((a, b) => a.examDate - b.examDate)
      .map((exam, index) => ({
        examNumber: index + 1,
        examTitle:
          exam.examTitle.length > 15
            ? exam.examTitle.substring(0, 15) + "..."
            : exam.examTitle,
        score: exam.score,
        date: formatDate(exam.examDate),
        fullTitle: exam.examTitle,
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
        </div>
      );
    }
    return null;
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Akses Ditolak
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hanya guru yang dapat melihat laporan penilaian ujian.
        </p>
        <Link
          to="/teachers"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FaFileAlt className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Tidak Ada Kelas yang Ditugaskan
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            Anda belum ditugaskan ke kelas mana pun. Harap hubungi
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Laporan Penilaian Ujian
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau dan analisis hasil ujian siswa di kelas Anda
          </p>
        </div>
        <Link
          to="/teachers"
          className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Kelas
            </label>
            <select
              value={selectedClass?._id || ""}
              onChange={(e) => {
                const classId = e.target.value;
                const kelas = classes.find((c) => c._id === classId);
                setSelectedClass(kelas);
                setViewMode("class");
                setSelectedStudent(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
            >
              {classes.map((kelas) => (
                <option key={kelas._id} value={kelas._id}>
                  {kelas.name}
                </option>
              ))}
            </select>
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode Tampilan
            </label>
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                if (e.target.value === "class") {
                  setSelectedStudent(null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
            >
              <option value="class">Laporan Kelas</option>
              <option value="student">Laporan Siswa</option>
            </select>
          </div>
          {viewMode === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Siswa
              </label>
              <select
                value={selectedStudent || ""}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
              >
                <option value="">Pilih Siswa</option>
                {studentsList.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
      {(loading.report || loading.student) && (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Memuat data...
          </span>
        </div>
      )}

      {/* Class Report View */}
      {viewMode === "class" && reportData && !loading.report && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {reportData.className}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Periode: {reportData.dateRange.start} -{" "}
                  {reportData.dateRange.end}
                </p>
              </div>
              <button
                onClick={downloadClassReportPDF}
                disabled={loading.download}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<FaFileAlt className="h-5 w-5" />}
              title="Total Ujian"
              value={reportData.overallStats.totalExams}
              color="text-blue-600"
            />
            <StatCard
              icon={<FaUsers className="h-5 w-5" />}
              title="Total Siswa"
              value={reportData.overallStats.totalStudents}
              color="text-green-600"
            />
            <StatCard
              icon={<FaChartBar className="h-5 w-5" />}
              title="Rata-rata Nilai"
              value={`${reportData.overallStats.averageScore.toFixed(1)}`}
              color={getScoreColor(reportData.overallStats.averageScore)}
            />
            <StatCard
              icon={<FaTrophy className="h-5 w-5" />}
              title="Tingkat Kelulusan"
              value={`${reportData.overallStats.passRate}%`}
              color="text-purple-600"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Rincian per Ujian
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Judul Ujian
                    </th>
                    <th className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rata-rata
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tertinggi
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Terendah
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.examSummaries.map((exam) => (
                    <tr key={exam.examId}>
                      <td className="w-2/5 px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="line-clamp-2">{exam.examTitle}</div>
                      </td>
                      <td className="w-1/5 px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(exam.examDate)}
                      </td>
                      <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${getScoreColor(
                            exam.averageScore
                          )}`}
                        >
                          {exam.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeColor(
                            exam.highestScore
                          )}`}
                        >
                          {exam.highestScore}
                        </span>
                      </td>
                      <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeColor(
                            exam.lowestScore
                          )}`}
                        >
                          {exam.lowestScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <FaTrophy className="h-5 w-5 text-yellow-500 mr-2" />
                Siswa Terbaik
              </h3>
              <div className="space-y-3">
                {reportData.topPerformers.map((student, index) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200 mr-3">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {student.studentName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student.completedExams} ujian selesai
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {student.averageScore.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-2" />
                Siswa Perlu Perhatian
              </h3>
              <div className="space-y-3">
                {reportData.lowPerformers.map((student, index) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-red-800 dark:text-red-200 mr-3">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {student.studentName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student.completedExams} ujian selesai
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {student.averageScore.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Report View */}
      {viewMode === "student" && studentReportData && !loading.student && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {studentReportData.student.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Periode: {studentReportData.dateRange.start} -{" "}
                  {studentReportData.dateRange.end}
                </p>
              </div>
              <button
                onClick={downloadStudentReportPDF}
                disabled={loading.download}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<FaFileAlt className="h-5 w-5" />}
              title="Total Ujian"
              value={studentReportData.overallStats.totalExams}
              color="text-blue-600"
            />
            <StatCard
              icon={<FaChartBar className="h-5 w-5" />}
              title="Rata-rata Nilai"
              value={`${studentReportData.overallStats.averageScore.toFixed(
                1
              )}`}
              color={getScoreColor(studentReportData.overallStats.averageScore)}
            />
            <StatCard
              icon={<FaTrophy className="h-5 w-5" />}
              title="Nilai Tertinggi"
              value={studentReportData.overallStats.highestScore}
              color="text-green-600"
            />
            <StatCard
              icon={<FaExclamationTriangle className="h-5 w-5" />}
              title="Nilai Terendah"
              value={studentReportData.overallStats.lowestScore}
              color="text-red-600"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Grafik Performa
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="examNumber"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Ujian ke-",
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Rincian Ujian
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Judul Ujian
                    </th>
                    <th className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {studentReportData.examDetails.map((exam) => (
                    <tr key={exam.examId}>
                      <td className="w-2/5 px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="line-clamp-2">{exam.examTitle}</div>
                      </td>
                      <td className="w-1/5 px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(exam.examDate)}
                      </td>
                      <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${getScoreColor(
                            exam.score
                          )}`}
                        >
                          {exam.score}
                        </span>
                      </td>
                      <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            exam.score >= 70
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {exam.score >= 70 ? "Lulus" : "Tidak Lulus"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                  {studentReportData.overallStats.averageScore >= 85 && (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Performa sangat baik dengan rata-rata tinggi
                    </div>
                  )}
                  {studentReportData.overallStats.averageScore >= 70 &&
                    studentReportData.overallStats.averageScore < 85 && (
                      <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Performa stabil dengan nilai memuaskan
                      </div>
                    )}
                  {studentReportData.overallStats.totalExams >= 5 && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Aktif mengikuti ujian secara konsisten
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
                  {studentReportData.overallStats.averageScore < 70 && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Perlu meningkatkan pemahaman materi
                    </div>
                  )}
                  {studentReportData.overallStats.lowestScore < 50 && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Ada ujian dengan nilai sangat rendah
                    </div>
                  )}
                  {studentReportData.overallStats.totalExams < 3 && (
                    <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Perlu lebih aktif mengikuti ujian
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Student View */}
      {viewMode === "student" && !selectedStudent && !loading.student && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FaUsers className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Pilih Siswa
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Pilih siswa dari dropdown di atas untuk melihat laporan individual
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

export default TeacherExamGradingReport;
