import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Target,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";
import { Toast } from "../Toast";

const ExamResult = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [result, setResult] = useState(location.state?.submission || null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Toast handling
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Obfuscate submission ID
  const obfuscateSubmissionId = (id) => {
    if (!id) return "Unknown";
    return `${id.slice(0, 4)}****${id.slice(-4)}`;
  };

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // Fetch submission details
  useEffect(() => {
    if (!user || user.role !== "User") {
      showToast("You must be a student to access this page", "error");
      navigate("/");
      return;
    }

    if (!result && submissionId) {
      const fetchSubmissionDetails = async () => {
        try {
          setLoading(true);
          const response = await api.get(
            `/v1/exam/submission/${submissionId}`,
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
          setResult(response.data.submission);
        } catch (err) {
          const errorMessage =
            err.response?.data?.message || "Failed to fetch exam results.";
          setError(errorMessage);
          showToast(errorMessage, "error");
        } finally {
          setLoading(false);
        }
      };
      fetchSubmissionDetails();
    } else {
      setLoading(false);
    }
  }, [submissionId, user, navigate, result, showToast]);

  // Score styling utilities
  const getScoreColor = (score) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return "bg-emerald-50 border-emerald-200";
    if (score >= 80) return "bg-blue-50 border-blue-200";
    if (score >= 70) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90)
      return {
        text: "Outstanding Performance!",
        emoji: "🏆",
        color: "text-emerald-600",
      };
    if (score >= 80)
      return { text: "Excellent Work!", emoji: "🎉", color: "text-blue-600" };
    if (score >= 70)
      return { text: "Good Job!", emoji: "👏", color: "text-amber-600" };
    if (score >= 60)
      return { text: "Keep Improving!", emoji: "💪", color: "text-orange-600" };
    return { text: "More Practice Needed", emoji: "📚", color: "text-red-500" };
  };

  const getScoreGradientClasses = (score) => {
    if (score >= 90) return "from-emerald-500 to-green-500";
    if (score >= 80) return "from-blue-500 to-cyan-500";
    if (score >= 70) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  // User Avatar Component with fixed styling
  const UserAvatar = ({ size = "md", className = "" }) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-12 h-12 text-sm",
      lg: "w-16 h-16 text-base",
    };

    if (user?.img_profile && !imageError) {
      return (
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-purple-200 ${className}`}
        >
          <img
            src={user.img_profile}
            alt={user.fullName || user.username}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg ${className}`}
      >
        {(user?.fullName || user?.username || "U")
          .split(" ")
          .map((name) => name.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("")}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto"
              style={{ animationDelay: "0.5s", animationDuration: "1.5s" }}
            ></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Loading Your Results
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch your exam data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-red-100">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/students/classes")}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/students/classes")}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors duration-200 hover:shadow-md"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                <UserAvatar />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Exam Results
                  </h1>
                  <p className="text-gray-600">
                    Welcome back, {user?.fullName || user?.username}!
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Results Card */}
        {result?.status === "graded" && result?.finalResult && (
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-8 h-8 text-yellow-900" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Final Score</h2>
                        <p className="text-blue-100">
                          Exam Completed Successfully
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold mb-2">
                        {result.totalScore}%
                      </div>
                      <div
                        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                          result.totalScore >= 90
                            ? "bg-green-500 bg-opacity-20 text-green-100"
                            : result.totalScore >= 80
                            ? "bg-blue-500 bg-opacity-20 text-blue-100"
                            : result.totalScore >= 70
                            ? "bg-yellow-500 bg-opacity-20 text-yellow-100"
                            : "bg-red-500 bg-opacity-20 text-red-100"
                        }`}
                      >
                        <span className="text-lg">
                          {getPerformanceMessage(result.totalScore).emoji}
                        </span>
                        <span>
                          {getPerformanceMessage(result.totalScore).text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-4 mb-6 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${result.totalScore}%` }}
                    ></div>
                  </div>

                  <p className="text-blue-100 text-lg">
                    🎉 Congratulations on completing your exam! Keep up the
                    excellent work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Alert for Pending Results */}
        {(result?.essayStatus === "pending_grading" ||
          result?.partialResult) && (
          <div className="mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    Results Under Review
                  </h3>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    {result.essayMessage ||
                      "Your essay answers are being reviewed by the instructor. You will receive your complete score once all questions have been graded."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Question Type Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multiple Choice Results */}
            {(result?.multipleChoiceScore !== undefined ||
              result?.multipleChoiceStats) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getScoreGradientClasses(
                    result.multipleChoiceScore || 0
                  )} p-6 text-white`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                      <Target className="w-6 h-6 text-white" fill="none" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Multiple Choice</h3>
                      <p className="text-blue-100">Auto-graded questions</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700">
                        Your Score
                      </span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(
                          result.multipleChoiceScore || 0
                        )}`}
                      >
                        {(result.multipleChoiceScore || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.multipleChoiceStats?.totalQuestions || 0}{" "}
                        questions
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown with background colors */}
                  <div
                    className={`p-4 rounded-xl mb-4 ${getScoreBgColor(
                      result.multipleChoiceScore || 0
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Performance Level
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          getPerformanceMessage(result.multipleChoiceScore || 0)
                            .color
                        }`}
                      >
                        {
                          getPerformanceMessage(result.multipleChoiceScore || 0)
                            .text
                        }
                      </span>
                    </div>
                  </div>

                  {result.multipleChoiceStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-emerald-600 mb-1">
                          {result.multipleChoiceStats.correctAnswers}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          Correct
                        </div>
                      </div>

                      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                        <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {result.multipleChoiceStats.incorrectAnswers}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          Incorrect
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-600 mb-1">
                          {result.multipleChoiceStats.unansweredQuestions}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          Skipped
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Essay Results */}
            {result?.essayStatus && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-white" fill="none" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Essay Questions</h3>
                      <p className="text-purple-100">Written responses</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-700">Status</span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                          result.essayStatus === "pending_grading"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {result.essayStatus === "pending_grading" ? (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Under Review
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Graded
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {result.essayStatus === "pending_grading" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-amber-800 font-medium mb-1">
                            Your essays are being reviewed
                          </p>
                          <p className="text-xs text-amber-700">
                            Our instructors are carefully reviewing your written
                            responses. You'll receive detailed feedback once the
                            review is complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Submission Details */}
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                Student Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <UserAvatar />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {user?.fullName || user?.username}
                    </div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>

                {user?.kelas && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Class:</span>
                      <span className="font-medium text-gray-900">
                        {user.teachingClass?.find((c) => c._id === user.kelas)
                          ?.name || "Unknown Class"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Reference */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Submission Info
              </h3>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Reference ID</div>
                  <div className="font-mono text-sm text-gray-800">
                    {obfuscateSubmissionId(result?._id)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Status</div>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      result?.status === "graded"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {result?.status === "graded" ? "Completed" : "In Progress"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/students/classes")}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            Back to Classes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
