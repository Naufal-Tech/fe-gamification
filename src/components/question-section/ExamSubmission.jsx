/* eslint-disable no-unused-vars */
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// --- Utility Components ---

const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: "bg-green-500 border-green-600",
    error: "bg-red-500 border-red-600",
    warning: "bg-yellow-500 border-yellow-600",
    info: "bg-blue-500 border-blue-600",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    error: <XCircle className="w-5 h-5 text-white" />,
    warning: <AlertCircle className="w-5 h-5 text-white" />,
    info: <AlertCircle className="w-5 h-5 text-white" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center space-x-3 animate-slide-in-right`}
      >
        {icons[type]}
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const EssayQuestions = ({ questions, answers, setAnswers }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Essay Questions</h3>
    {questions.length === 0 ? (
      <p className="text-gray-500">No essay questions for this exam.</p>
    ) : (
      questions.map((q, index) => (
        <div key={q._id} className="mb-6">
          <p className="font-medium mb-2">
            {index + 1}. {q.question}
          </p>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md h-32 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition duration-150 ease-in-out"
            placeholder="Enter your answer..."
            value={answers.find((a) => a.question === q._id)?.answer || ""}
            onChange={(e) => {
              const newAnswers = [...answers];
              const existingIndex = newAnswers.findIndex(
                (a) => a.question === q._id
              );
              if (existingIndex >= 0) {
                newAnswers[existingIndex].answer = e.target.value;
              } else {
                newAnswers.push({ question: q._id, answer: e.target.value });
              }
              setAnswers(newAnswers);
            }}
          />
        </div>
      ))
    )}
  </div>
);

const MultipleChoiceQuestions = ({ questions, answers, setAnswers }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Multiple Choice Questions</h3>
    {questions.length === 0 ? (
      <p className="text-gray-500">
        No multiple choice questions for this exam.
      </p>
    ) : (
      questions.map((q, index) => (
        <div key={q._id} className="mb-6">
          <p className="font-medium mb-3">
            {index + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((option) => (
              <label
                key={option._id}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition duration-150 ease-in-out border border-gray-200"
              >
                <input
                  type="radio"
                  name={`question-${q._id}`}
                  value={option._id}
                  checked={
                    answers.find((a) => a.question === q._id)?.option ===
                    option._id
                  }
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    const existingIndex = newAnswers.findIndex(
                      (a) => a.question === q._id
                    );
                    if (existingIndex >= 0) {
                      newAnswers[existingIndex].option = e.target.value;
                    } else {
                      newAnswers.push({
                        question: q._id,
                        option: e.target.value,
                      });
                    }
                    setAnswers(newAnswers);
                  }}
                  className="form-radio h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))
    )}
  </div>
);

const ExamTimer = ({ initialSeconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const SUBMIT_BUFFER_SECONDS = 2; // Align with backend grace period

  useEffect(() => {
    if (timeLeft <= SUBMIT_BUFFER_SECONDS && timeLeft > 0) {
      onTimeUp();
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft < 300;

  return (
    <div
      className={`sticky top-4 z-10 mb-6 rounded-lg shadow-lg border-b-4 transition-all duration-300 ${
        isLowTime
          ? "bg-red-50 border-red-400 shadow-red-200/50"
          : "bg-blue-50 border-blue-400 shadow-blue-200/50"
      }`}
    >
      {/* Main timer display */}
      <div className="flex items-center justify-center p-6 space-x-4">
        <Clock
          className={`w-7 h-7 transition-colors duration-300 ${
            isLowTime ? "text-red-600" : "text-blue-600"
          }`}
        />
        <div className="text-center">
          <div className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
            Time Remaining
          </div>
          <div
            className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${
              isLowTime ? "text-red-700" : "text-blue-700"
            }`}
          >
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Warning message */}
      {isLowTime && (
        <div className="px-6 pb-4">
          <div className="bg-red-100 border border-red-200 rounded-md p-3 flex items-center justify-center space-x-2">
            <span className="text-red-600 text-lg">⚠️</span>
            <p className="text-red-700 text-sm font-medium">
              Less than 5 minutes remaining! Please submit soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-gray-700">
    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
    <p className="text-lg font-medium">{message}</p>
  </div>
);

const Alert = ({ type, children }) => {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div
      className={`flex items-center space-x-3 p-4 rounded-lg border ${styles[type]} mb-4 shadow-sm`}
    >
      {icons[type]}
      <div className="flex-1">{children}</div>
    </div>
  );
};

const ExamSubmission = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState({
    essayAnswers: [],
    multipleChoiceAnswers: [],
    timeRemainingSeconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("loading");
  const [examToken, setExamToken] = useState("");
  const [submissionId, setSubmissionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [isTimeUpTriggered, setIsTimeUpTriggered] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const getExamQuestions = useCallback(() => {
    if (!exam) return { essay: [], multipleChoice: [] };
    return {
      essay:
        exam.examQuestions?.essayQuestions || exam.essayQuiz?.questions || [],
      multipleChoice:
        exam.examQuestions?.multipleChoiceQuestions ||
        exam.multipleChoice?.questions ||
        [],
    };
  }, [exam]);

  // --- API Calls ---
  const fetchExamDetails = useCallback(
    async (id) => {
      try {
        const response = await api.get(`/v1/exam/detail/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        return response.data;
      } catch (err) {
        console.error("API Error: Fetching exam details failed", err);
        throw err;
      }
    },
    [user.token]
  );

  const startExamAPI = useCallback(
    async (token) => {
      try {
        const response = await api.post(
          "/v1/exam/start",
          { token },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        return response.data;
      } catch (err) {
        console.error("API Error: Starting exam failed", err);
        throw err;
      }
    },
    [user.token]
  );

  const submitExamAPI = useCallback(
    async (submissionData) => {
      try {
        const response = await api.post(
          "/v1/exam/submit",
          {
            submissionId,
            ...submissionData,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        return response.data;
      } catch (err) {
        console.error("API Error: Submitting exam failed", err);
        throw err;
      }
    },
    [submissionId, user.token]
  );

  const saveProgressAPI = useCallback(
    async (submissionData) => {
      try {
        await api.post(
          "/v1/exam/save-progress",
          {
            submissionId,
            ...submissionData,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },
    [submissionId, user.token]
  );

  // --- Auto-Save Effect ---
  useEffect(() => {
    if (phase === "exam" && !isSubmitting) {
      const autoSaveInterval = setInterval(async () => {
        const submissionData = {
          essayAnswers: submission.essayAnswers,
          multipleChoiceAnswers: submission.multipleChoiceAnswers,
        };
        await saveProgressAPI(submissionData);
        showToast("Progress saved automatically.", "info");
      }, 60000); // Every 60 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [
    phase,
    isSubmitting,
    submission.essayAnswers,
    submission.multipleChoiceAnswers,
    saveProgressAPI,
    showToast,
  ]);

  // --- Initial Load Effect ---
  useEffect(() => {
    const loadInitialData = async () => {
      if (!examId) {
        setError(
          "No exam ID found in the URL. Please navigate from a valid link."
        );
        setPhase("error");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetchExamDetails(examId);
        setExam(response.exam);

        if (response.exam.token) {
          setExamToken(response.exam.token);
        }

        if (response.exam.userSubmission) {
          setSubmissionId(response.exam.userSubmission._id);
          if (response.exam.userSubmission.status === "in-progress") {
            const serverTime = response.exam.userSubmission.startTime;
            const startTime = new Date(serverTime).getTime();
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const totalExamSeconds = response.exam.duration * 60;
            const remainingSeconds = Math.max(
              0,
              totalExamSeconds - elapsedSeconds
            );

            setSubmission((prev) => ({
              ...prev,
              essayAnswers: response.exam.userSubmission.essayAnswers || [],
              multipleChoiceAnswers:
                response.exam.userSubmission.multipleChoiceAnswers || [],
              timeRemainingSeconds: remainingSeconds,
            }));
            setPhase("exam");
          } else {
            setPhase("submitted");
          }
        } else {
          setPhase(response.exam.token ? "instructions" : "token");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load exam details. Please try again."
        );
        setPhase("error");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [examId, fetchExamDetails]);

  // --- Handlers ---

  const handleTokenSubmit = useCallback(async () => {
    if (!examToken.trim()) {
      setError("Please enter the exam token.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await startExamAPI(examToken);
      setPhase("instructions");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid exam token. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [examToken, startExamAPI]);

  const handleStartExam = useCallback(async () => {
    if (!exam) {
      setError("Exam data is not available. Please refresh.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await startExamAPI(examToken);
      setSubmissionId(response.submissionId);
      setPhase("exam");

      const { essay, multipleChoice } = getExamQuestions();
      const serverTime = response.serverTime || Date.now();
      const startTime = new Date(serverTime).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingSeconds = Math.max(0, exam.duration * 60 - elapsedSeconds);

      setSubmission((prev) => ({
        ...prev,
        essayAnswers: essay.map((q) => ({ question: q._id, answer: "" })),
        multipleChoiceAnswers: multipleChoice.map((q) => ({
          question: q._id,
          option: null,
        })),
        timeRemainingSeconds: remainingSeconds,
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to start exam. Please try again."
      );
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }, [exam, examToken, startExamAPI, getExamQuestions]);

  const submitWithRetry = useCallback(
    async (submissionData, maxRetries = 3) => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await submitExamAPI(submissionData);
        } catch (err) {
          if (
            err.response?.data?.error.includes("Time expired") ||
            attempt === maxRetries - 1
          ) {
            throw err;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
          attempt++;
        }
      }
    },
    [submitExamAPI]
  );

  const handleSubmitExam = useCallback(
    async (isAutoSubmit = false) => {
      if (isSubmitting) return;

      if (!isAutoSubmit) {
        const { essay, multipleChoice } = getExamQuestions();
        const unansweredEssay = essay.some(
          (q) =>
            !submission.essayAnswers
              .find((a) => a.question === q._id)
              ?.answer?.trim()
        );
        const unansweredMC = multipleChoice.some(
          (q) =>
            !submission.multipleChoiceAnswers.find((a) => a.question === q._id)
              ?.option
        );

        if (unansweredEssay || unansweredMC) {
          const confirmSubmit = window.confirm(
            "You have unanswered questions. Are you sure you want to submit?"
          );
          if (!confirmSubmit) return;
        }
      }

      try {
        setIsSubmitting(true);
        setError("");

        const submissionData = {
          essayAnswers: submission.essayAnswers,
          multipleChoiceAnswers: submission.multipleChoiceAnswers,
          submittedAt: new Date().toISOString(),
        };

        const result = await submitWithRetry(submissionData);
        setSubmissionResult(result.submission);

        // Navigate to exam result page after successful submission
        navigate(`/students/exam-result/${result.submission._id}`, {
          state: { submission: result.submission },
        });

        showToast("Exam submitted successfully!", "success");
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          "Failed to submit exam. Please try again.";
        setError(errorMessage);
        if (errorMessage.includes("Time expired")) {
          showToast(
            "Submission failed: Exam time has expired. Please contact your instructor.",
            "error"
          );
        } else {
          showToast(errorMessage, "error");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      getExamQuestions,
      submission.essayAnswers,
      submission.multipleChoiceAnswers,
      submitWithRetry,
      showToast,
      navigate,
    ]
  );

  const handleTimeUp = useCallback(() => {
    if (phase === "exam" && !isSubmitting && !isTimeUpTriggered) {
      setIsTimeUpTriggered(true);
      showToast(
        "Time is up! Your exam is being submitted automatically.",
        "warning"
      );
      handleSubmitExam(true);
    }
  }, [phase, isSubmitting, isTimeUpTriggered, handleSubmitExam, showToast]);

  // --- Render Logic ---

  if (loading) {
    return <LoadingSpinner message="Fetching exam data..." />;
  }

  if (phase === "error") {
    return (
      <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-lg shadow-lg text-center">
        <Alert type="error">{error || "An unexpected error occurred."}</Alert>
        <button
          onClick={() => navigate("/student/assignments")}
          className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition duration-200"
        >
          Go to Assignments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {error && phase !== "error" && <Alert type="error">{error}</Alert>}

      {phase === "token" && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto mt-20 border-t-4 border-purple-500">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            {examToken ? "Exam Token Ready" : "Enter Exam Token"}
          </h1>
          <p className="text-gray-600 mb-6">
            {examToken
              ? "Your exam token has been automatically provided."
              : "Please enter the unique token provided by your instructor to start the exam."}
          </p>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="e.g., EXAM-ABCD-1234"
                value={examToken}
                onChange={(e) => setExamToken(e.target.value)}
                className={`w-full p-4 border-2 rounded-lg text-center text-lg font-mono tracking-wider focus:outline-none transition duration-150 ease-in-out ${
                  examToken
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                }`}
                disabled={loading || !!examToken}
                autoFocus={!examToken}
              />
              {examToken && (
                <p className="text-sm text-green-600 mt-2">
                  Token auto-filled. Click "Continue" to proceed.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleTokenSubmit}
              disabled={loading || !examToken.trim()}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition duration-200 ease-in-out transform hover:scale-105"
            >
              {loading ? "Validating Token..." : "Continue"}
            </button>
          </div>
        </div>
      )}

      {phase === "instructions" && exam && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-2xl mx-auto mt-10 border-t-4 border-blue-500">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            {exam.title}
          </h1>
          <p className="text-gray-600 mb-8">
            Please review the exam details and instructions carefully before
            starting.
          </p>

          <div className="text-left space-y-5 mb-8">
            <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-800 text-lg mb-2">
                Exam Information
              </h3>
              <p className="text-blue-700">
                <span className="font-medium">Class:</span>{" "}
                {exam.class?.name || "N/A"}
              </p>
              <p className="text-blue-700">
                <span className="font-medium">Created by:</span>{" "}
                {exam.creator?.fullName || "N/A"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-gray-50 p-5 rounded-lg shadow-inner">
                <h4 className="font-semibold mb-2 text-gray-700">Duration</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {exam.duration} minutes
                </p>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg shadow-inner">
                <h4 className="font-semibold mb-2 text-gray-700">Questions</h4>
                <p className="text-xl font-bold text-gray-700">
                  {getExamQuestions().essay.length} Essay +{" "}
                  {getExamQuestions().multipleChoice.length} Multiple Choice
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800 text-lg mb-2">
                Important Notes:
              </h4>
              <ul className="text-yellow-700 space-y-2 text-base list-disc pl-5">
                <li>Once started, the timer cannot be paused.</li>
                <li>
                  Ensure a stable internet connection throughout the exam.
                </li>
                <li>Your answers will be periodically saved automatically.</li>
                <li>
                  You can review and change your answers before final
                  submission.
                </li>
                <li>
                  The exam will auto-submit when time runs out, with a 20-second
                  grace period for network delays.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-200">
            <p className="text-orange-700 font-medium text-center">
              <span className="font-bold">⚠️ Auto-Submit Notice:</span> When
              time expires, your exam will automatically submit with whatever
              answers you've provided - no confirmation needed.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
            <p className="text-green-700 font-medium">
              <span className="font-bold">Exam Token:</span> {examToken}
            </p>
            <p className="text-sm text-green-600 mt-1">
              Your token was automatically provided by the system.
            </p>
          </div>

          <button
            onClick={handleStartExam}
            disabled={loading}
            className="bg-green-600 text-white px-10 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xl transition duration-200 ease-in-out transform hover:scale-105"
          >
            {loading ? "Starting Exam..." : "Start Exam Now"}
          </button>
        </div>
      )}

      {phase === "exam" && exam && (
        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              {exam.title}
            </h1>
            <p className="text-center text-gray-600">{exam.class?.name}</p>
          </div>

          <ExamTimer
            initialSeconds={submission.timeRemainingSeconds}
            onTimeUp={handleTimeUp}
          />

          <EssayQuestions
            questions={getExamQuestions().essay}
            answers={submission.essayAnswers}
            setAnswers={(answers) =>
              setSubmission((prev) => ({ ...prev, essayAnswers: answers }))
            }
          />

          <MultipleChoiceQuestions
            questions={getExamQuestions().multipleChoice}
            answers={submission.multipleChoiceAnswers}
            setAnswers={(answers) =>
              setSubmission((prev) => ({
                ...prev,
                multipleChoiceAnswers: answers,
              }))
            }
          />

          <div className="bg-white rounded-lg shadow p-6 text-center border-b-4 border-purple-500">
            <button
              onClick={() => handleSubmitExam(false)}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-10 py-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold text-xl transition duration-200 ease-in-out transform hover:scale-105"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                "Submit Exam"
              )}
            </button>

            <p className="text-sm text-gray-500 mt-3">
              Double-check your answers before final submission. If time runs
              out, your current answers will be automatically submitted.
            </p>
          </div>
        </div>
      )}

      {phase === "submitted" && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto mt-15 border-t-4 border-green-500">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Exam Submitted!
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Your exam has been successfully submitted. You'll be notified when
            results are available. Good job!
          </p>
          <button
            onClick={() => navigate("/students/classes")}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold transition duration-200 ease-in-out"
          >
            Back to Assignments
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamSubmission;
