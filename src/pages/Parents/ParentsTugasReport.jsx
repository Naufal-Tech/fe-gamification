import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilter,
  FaTimesCircle,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import { Link, useLoaderData } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

function ParentsTugasReports() {
  const [studentsData, setStudentsData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const user = useLoaderData();

  const isAuthorized = useAuthStore((state) => state.user?.role === "Parents");

  // Fetch linked students data
  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        const response = await api.get("/v1/parents/child-list");
        if (response.data.success) {
          setStudentsData(response.data);
        } else {
          setError(response.data.message || "Failed to fetch students");
        }
      } catch (err) {
        setError("Failed to fetch students data");
        console.error("Error fetching students data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  // Fetch student report data
  const fetchStudentReport = async (studentId) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const params = new URLSearchParams({ period: reportPeriod });
      if (reportPeriod === "custom" && startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await api.get(
        `/v1/tugas-report/student/${studentId}?${params}`
      );
      setReportData(response.data.data);
    } catch (err) {
      setReportError("Failed to fetch student report");
      console.error("Error fetching student report:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Download student report
  const downloadStudentReport = async (studentId) => {
    setDownloadLoading(true);
    try {
      const params = new URLSearchParams({ period: reportPeriod });
      if (reportPeriod === "custom" && startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await api.get(
        `/v1/tugas-report/report-student/${studentId}/download?${params}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `tugas-report-${selectedStudent.username}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setReportData(null);
    setReportError(null);
    fetchStudentReport(student._id);
  };

  const handlePeriodChange = (newPeriod) => {
    setReportPeriod(newPeriod);
    if (selectedStudent) {
      fetchStudentReport(selectedStudent._id);
    }
  };

  const handleCustomDateFilter = () => {
    if (selectedStudent && startDate && endDate) {
      fetchStudentReport(selectedStudent._id);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (typeof timestamp === "string") return timestamp;

    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6 w-full max-w-none bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Unauthorized
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Only parents can view student tugas reports.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <FaUserGraduate className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-1">
          <StudentsList
            studentsData={studentsData}
            selectedStudent={selectedStudent}
            onSelect={handleStudentSelect}
          />
        </div>

        {/* Report Content */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <NoStudentSelected />
          ) : (
            <div className="space-y-6">
              <ReportControls
                student={selectedStudent}
                reportPeriod={reportPeriod}
                onPeriodChange={handlePeriodChange}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onCustomFilter={handleCustomDateFilter}
                onDownload={() => downloadStudentReport(selectedStudent._id)}
                downloadLoading={downloadLoading}
                reportData={reportData}
              />

              {reportLoading ? (
                <ReportLoading />
              ) : reportError ? (
                <ReportError
                  error={reportError}
                  onRetry={() => fetchStudentReport(selectedStudent._id)}
                />
              ) : reportData ? (
                <ReportContent
                  reportData={reportData}
                  formatDate={formatDate}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components

const LoadingState = () => (
  <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 h-64"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div className="text-center py-10">
      <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
        <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        Error loading students
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
        {error}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Try Again
      </button>
    </div>
  </div>
);

const Header = () => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
        Student Tugas Reports
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        View and download tugas grading reports for your children.
      </p>
    </div>
    <Link
      to="/parents/dashboard"
      className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm sm:text-base"
    >
      <FaArrowLeft className="mr-2 h-4 w-4" />
      Back to Dashboard
    </Link>
  </div>
);

const StudentsList = ({ studentsData, selectedStudent, onSelect }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Select Student
        </h2>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FaUsers className="mr-1 h-4 w-4" />
          {studentsData?.totalStudents || 0}
        </div>
      </div>
    </div>
    <div className="p-4">
      {studentsData?.students?.length > 0 ? (
        <div className="space-y-3">
          {studentsData.students.map((student) => (
            <StudentSelectCard
              key={student._id}
              student={student}
              isSelected={selectedStudent?._id === student._id}
              onSelect={() => onSelect(student)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <FaUserGraduate className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No linked students found.
          </p>
        </div>
      )}
    </div>
  </div>
);

const StudentSelectCard = ({ student, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
      isSelected
        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
    }`}
  >
    <div className="flex items-center space-x-3">
      <div className="relative flex-shrink-0">
        {student.img_profile ? (
          <img
            src={student.img_profile}
            alt={student.fullName}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <FaUserGraduate className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {student.fullName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {student.kelas?.name || "No class"} • {student.noIdentity}
        </p>
      </div>
      {isSelected && (
        <FaCheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
      )}
    </div>
  </button>
);

const NoStudentSelected = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
      <FaChartBar className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Select a Student
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Choose a student from the list to view their tugas report.
    </p>
  </div>
);

const ReportControls = ({
  student,
  reportPeriod,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onCustomFilter,
  onDownload,
  downloadLoading,
  reportData,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {student.fullName}'s Report
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {student.kelas?.name || "No class assigned"}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={reportPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        <button
          onClick={onDownload}
          disabled={downloadLoading || !reportData}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors"
        >
          {downloadLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          ) : (
            <FaDownload className="mr-2 h-4 w-4" />
          )}
          Download PDF
        </button>
      </div>
    </div>

    {reportPeriod === "custom" && (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            placeholder="End Date"
          />
          <button
            onClick={onCustomFilter}
            disabled={!startDate || !endDate}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors"
          >
            <FaFilter className="mr-2 h-4 w-4" />
            Apply Filter
          </button>
        </div>
      </div>
    )}
  </div>
);

const ReportLoading = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const ReportError = ({ error, onRetry }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
    <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
      <FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Error Loading Report
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
    >
      Try Again
    </button>
  </div>
);

const ReportContent = ({ reportData, formatDate }) => {
  const { stats, tugasDetails, period, dateRange, student } = reportData;

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Student Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
            <p className="font-medium">{student.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
            <p className="font-medium">{student.className}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Student ID
            </p>
            <p className="font-medium">{student.noIdentity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Report Period
            </p>
            <p className="font-medium">
              {period} ({dateRange.start} to {dateRange.end})
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={FaFileAlt}
          title="Total Tugas"
          value={stats.totalTugas}
          color="blue"
        />
        <StatCard
          icon={FaCheckCircle}
          title="Completed"
          value={stats.completedTugas}
          color="green"
        />
        <StatCard
          icon={FaChartBar}
          title="Average Score"
          value={stats.averageScore}
          color="indigo"
          isPercentage={true}
        />
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pass Rate
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stats.passRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.passRate}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Score Range
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stats.lowestScore} - {stats.highestScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
              <div
                className="bg-indigo-600 h-2 rounded-full absolute"
                style={{
                  left: `${stats.lowestScore}%`,
                  width: `${stats.highestScore - stats.lowestScore}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tugas Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tugas Details
          </h3>
        </div>
        <div className="p-6">
          {tugasDetails && tugasDetails.length > 0 ? (
            <div className="space-y-4">
              {tugasDetails.map((tugas, index) => (
                <TugasDetailCard
                  key={index}
                  tugas={tugas}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No tugas found in the selected period.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  isPercentage = false,
}) => {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
    yellow:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300",
    red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
    indigo:
      "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
            {isPercentage ? "%" : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

const TugasDetailCard = ({ tugas, formatDate }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      graded: {
        color:
          "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
        icon: FaCheckCircle,
        text: "Graded",
      },
      submitted: {
        color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
        icon: FaClock,
        text: "Submitted",
      },
      late: {
        color:
          "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
        icon: FaClock,
        text: "Late",
      },
      missing: {
        color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
        icon: FaTimesCircle,
        text: "Missing",
      },
    };

    const config = statusConfig[status] || statusConfig.missing;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent className="mr-1 h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const getScoreDetails = () => {
    const scoreTypes = [];
    if (tugas.multipleChoiceScore > 0) {
      scoreTypes.push(`MC: ${tugas.multipleChoiceScore}%`);
    }
    if (tugas.essayScore > 0) {
      scoreTypes.push(`Essay: ${tugas.essayScore}%`);
    }
    if (tugas.shortQuizScore > 0) {
      scoreTypes.push(`Quiz: ${tugas.shortQuizScore}%`);
    }
    if (tugas.fileUploadScore > 0) {
      scoreTypes.push(`File: ${tugas.fileUploadScore}%`);
    }
    return scoreTypes.join(" • ");
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {tugas.tugasTitle}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tugas.className} • {tugas.teacherName}
          </p>
        </div>
        {getStatusBadge(tugas.status)}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
          <p className="text-sm">{formatDate(tugas.tugasDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
          <p className="text-sm">{formatDate(tugas.dueDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
          <p className="text-sm">{formatDate(tugas.submittedAt)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Graded</p>
          <p className="text-sm">{formatDate(tugas.gradedAt)}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total Score: {tugas.score}%
            </p>
            {getScoreDetails() && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getScoreDetails()}
              </p>
            )}
          </div>
          {tugas.isLate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Late Submission
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentsTugasReports;
