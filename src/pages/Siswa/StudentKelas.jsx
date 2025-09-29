/* eslint-disable react-hooks/exhaustive-deps */
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Loader,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const StudentKelas = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classAssignments, setClassAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Check for query parameter to set active tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "assignments") {
      setActiveTab("assignments");
    }
  }, [location.search]);

  // Redirect if not a student
  useEffect(() => {
    if (!user || user.role !== "User") {
      toast.error("You must be a student to access this page", {
        toastId: "auth-error",
      });
      navigate("/");
    }
  }, [user, navigate]);

  // Load user classes
  useEffect(() => {
    if (user) {
      loadUserClasses();
    }
  }, [user]);

  // Load assignments when selectedClass changes and we're on assignments tab
  useEffect(() => {
    if (activeTab === "assignments") {
      if (selectedClass) {
        loadClassAssignments(selectedClass);
      } else if (classes.length > 0) {
        setSelectedClass(classes[0]._id);
      }
    }
  }, [selectedClass, activeTab, classes]);

  const loadUserClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/v1/kelas/my-class", {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Classes response:", response.data);
      setClasses(response.data.classes);
      if (response.data.classes.length === 0) {
        toast.info("No classes found. Contact your administrator to enroll.", {
          toastId: "no-classes",
        });
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error(
        "Error loading classes: " +
          (error.response?.data?.message || error.message),
        {
          toastId: "fetch-error",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const loadClassAssignments = async (kelasId) => {
    try {
      setAssignmentsLoading(true);
      console.log("Loading assignments for class:", kelasId);

      const response = await api.get(`/v1/kelas/info/${kelasId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Full API response:", response.data);
      setClassAssignments(response.data);
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error(
        "Error loading assignments: " +
          (error.response?.data?.message || error.message),
        {
          toastId: "fetch-assignments-error",
        }
      );
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const AssignmentsLoader = () => (
    <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Loading Assignments...
      </h3>
      <p className="text-gray-600">
        Please wait while we fetch the class assignments and exams.
      </p>
    </div>
  );

  if (loading && classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Kelas Siswa
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                Welcome, {user?.name || "Student"}!
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 overflow-x-auto py-2 sm:py-0 sm:space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "assignments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tugas & Ujian
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {classes.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Kelas Terdaftar
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {classes.reduce(
                        (sum, cls) => sum + (cls.counts?.tugas || 0),
                        0
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Total Tugas
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {classes.reduce(
                        (sum, cls) => sum + (cls.counts?.exams || 0),
                        0
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Total Ujian
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {classes.reduce(
                        (sum, cls) =>
                          sum +
                          (cls.counts?.shortQuizzes || 0) +
                          (cls.counts?.essayQuizzes || 0) +
                          (cls.counts?.multipleChoiceQuizzes || 0),
                        0
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Total Quizzes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Kelas Siswa
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                {classes.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-gray-600 mb-4 text-base sm:text-lg">
                      Anda tidak terdaftar di kelas mana pun.
                    </p>
                    <button
                      onClick={() => navigate("/")}
                      className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {classes.map((kelas) => (
                      <div
                        key={kelas._id}
                        className={`border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${
                          selectedClass === kelas._id
                            ? "bg-blue-50 border-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {kelas.name}
                          </h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {kelas.userRole}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                          {kelas.description}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">
                              {kelas.counts?.tugas || 0}
                            </p>
                            <p className="text-xs text-gray-500">Tugas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-purple-600">
                              {kelas.counts?.exams || 0}
                            </p>
                            <p className="text-xs text-gray-500">Ujian</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClass(kelas._id);
                            setActiveTab("assignments");
                          }}
                          disabled={assignmentsLoading}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {assignmentsLoading ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <span>Detail</span>
                              <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-4 sm:space-y-6">
            {assignmentsLoading ? (
              <AssignmentsLoader />
            ) : !classAssignments || !classAssignments.classInfo ? (
              <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Pilih Kelas
                </h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Pilih sebuah kelas dari tab Ringkasan untuk melihat tugas dan
                  ujian.
                </p>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Overview
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {classAssignments.classInfo.name}
                      </h2>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {classAssignments.classInfo.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("overview")}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
                    >
                      ← Kembali ke Kelas
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Tugas
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    {!classAssignments.classInfo.assignments?.tugas ||
                    classAssignments.classInfo.assignments.tugas.length ===
                      0 ? (
                      <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                        Belum ada tugas untuk saat ini.
                      </p>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {classAssignments.classInfo.assignments.tugas.map(
                          (tugas) => (
                            <div
                              key={tugas._id}
                              className="border border-gray-200 rounded-lg p-3 sm:p-4"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                      {tugas.title}
                                    </h4>
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  </div>
                                  <p className="text-gray-600 mb-2 sm:mb-3 text-xs sm:text-sm line-clamp-2">
                                    {tugas.description}
                                  </p>
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>
                                        Created: {formatDate(tugas.created_at)}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/students/assignment/tugas/${tugas._id}`
                                      )
                                    }
                                    className="bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/students/submit/tugas/${tugas._id}`
                                      )
                                    }
                                    className="bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                                  >
                                    Kumpulkan
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Ujian
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    {!classAssignments.classInfo.assignments?.exams ||
                    classAssignments.classInfo.assignments.exams.length ===
                      0 ? (
                      <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                        Belum ada ujian yang terjadwal.
                      </p>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {classAssignments.classInfo.assignments.exams.map(
                          (exam) => (
                            <div
                              key={exam._id}
                              className="border border-gray-200 rounded-lg p-3 sm:p-4"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                      {exam.title}
                                    </h4>
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm mb-2 sm:mb-3">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>Durasi: {exam.duration} menit</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span>
                                        Created: {formatDate(exam.created_at)}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                <div className="flex sm:items-center">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/students/submit/exam/${exam._id}`
                                      )
                                    }
                                    className="bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                                  >
                                    Kerjakan Ujian
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentKelas;
