import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  EssayQuestions,
  FileUploadSection,
  MultipleChoiceQuestions,
  ShortAnswerQuestions,
  SubmissionProgress,
  SubmissionReview,
} from "../../components";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">Loading assignment...</p>
    </div>
  </div>
);

const TugasSubmission = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tugas, setTugas] = useState(null);
  const [submission, setSubmission] = useState({
    tugasId: id,
    essayAnswers: [],
    multipleChoiceAnswers: [],
    shortAnswers: [],
    file: null, // This 'file' state holds the File object
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "User") {
      toast.error("You must be a student to access this page");
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchTugas = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching tugas with ID:", id);
        const response = await api.get(`/v1/tugas/questions/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Tugas data received:", response.data);
        setTugas(response.data);

        setSubmission((prev) => ({
          ...prev,
          tugasId: id,
        }));
      } catch (err) {
        console.error("Failed to fetch tugas:", err);
        setError(err.response?.data?.message || "Failed to load assignment");
        toast.error(
          "Failed to load assignment: " +
            (err.response?.data?.message || err.message)
        );

        setTimeout(() => {
          navigate("/students/classes");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchTugas();
    }
  }, [id, user, navigate]); // Added navigate to dependency array

  const handleSubmit = async () => {
    console.log("Submission Data:", {
      tugasId: id,
      essayAnswers: submission.essayAnswers,
      multipleChoiceAnswers: submission.multipleChoiceAnswers,
      shortAnswers: submission.shortAnswers,
      file: submission.file ? "File Attached" : "No File",
    });

    console.log(
      "Multiple Choice Answers to Submit:",
      submission.multipleChoiceAnswers
    );

    try {
      // Check if we have any content to submit
      const hasAnswers =
        submission.essayAnswers.length > 0 ||
        submission.multipleChoiceAnswers.length > 0 ||
        submission.shortAnswers.length > 0;

      const hasFile = !!submission.file;

      // Validate that we have some content to submit
      if (!hasAnswers && !hasFile) {
        toast.error("Please provide answers or upload a file!");
        return;
      }

      // Validate required fields
      if (tugas.requiresFileUpload && !submission.file) {
        toast.error("File upload is required for this assignment");
        return;
      }

      // Show loading state
      toast.info("Submitting assignment...", {
        autoClose: false,
        toastId: "submission-loading",
      });

      // Prepare submission data
      const submissionData = {
        tugasId: id,
        essayAnswers: submission.essayAnswers || [],
        multipleChoiceAnswers: submission.multipleChoiceAnswers || [],
        shortAnswers: submission.shortAnswers || [],
      };

      console.log("Submitting assignment with data:", submissionData);

      let response;

      // Always use FormData to handle both file and non-file submissions consistently
      const formData = new FormData();

      // Add the main data as a JSON string
      formData.append("data", JSON.stringify(submissionData));

      // Add individual fields for backward compatibility
      formData.append("tugasId", id);
      formData.append(
        "essayAnswers",
        JSON.stringify(submission.essayAnswers || [])
      );
      formData.append(
        "multipleChoiceAnswers",
        JSON.stringify(submission.multipleChoiceAnswers || [])
      );
      formData.append(
        "shortAnswers",
        JSON.stringify(submission.shortAnswers || [])
      );

      // Add the file if it exists
      if (submission.file) {
        formData.append("fileTugas", submission.file);
        console.log("File attached:", submission.file.name);
      }

      // DEBUG: Log FormData entries
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // DEBUG: Log FormData entries
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, `File: ${value.name} (${value.size} bytes)`);
        } else {
          console.log(key, value);
        }
      }

      response = await api.post(`/v1/tugas/submit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("Submission response:", response.data);

      toast.dismiss("submission-loading");
      toast.success("Assignment submitted successfully!");

      // Navigate to results page instead of classes
      setTimeout(() => {
        navigate(`/students/tugas/results/${response.data.submission._id}`, {
          state: {
            success: true,
            message: "Assignment submitted successfully!",
          },
        });
      }, 1000);
    } catch (err) {
      console.error("Submission failed:", err);
      toast.dismiss("submission-loading");

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to submit assignment";

      toast.error(errorMessage);

      // Log detailed error information
      if (err.response) {
        console.error("Error response:", err.response.data);
        console.error("Error status:", err.response.status);
      }
    }
  };

  const canProceedToNextStep = () => {
    if (step === 1) {
      const totalQuestions =
        (tugas?.essayQuestions?.length || 0) +
        (tugas?.multipleChoiceQuestions?.length || 0) +
        (tugas?.shortQuestions?.length || 0);

      // If there are no questions, allow proceeding (file-only assignment)
      if (totalQuestions === 0) return true;

      const totalAnswers =
        submission.essayAnswers.length +
        submission.multipleChoiceAnswers.length +
        submission.shortAnswers.length;

      // Allow proceeding if there are some answers OR if there are no questions
      return totalAnswers > 0 || totalQuestions === 0;
    }

    if (step === 2) {
      // Allow proceeding if file upload is not required OR if file is uploaded
      return !tugas?.requiresFileUpload || !!submission.file;
    }

    return true;
  };

  const canSubmit = () => {
    const hasAnswers =
      submission.essayAnswers.length > 0 ||
      submission.multipleChoiceAnswers.length > 0 ||
      submission.shortAnswers.length > 0;

    const hasFile = !!submission.file;

    // Must have either answers or file
    const hasContent = hasAnswers || hasFile;

    // If file upload is required, must have file
    const fileRequirementMet = !tugas?.requiresFileUpload || hasFile;

    return hasContent && fileRequirementMet;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Answer Questions";
      case 2:
        return "Upload File";
      case 3:
        return "Review & Submit";
      default:
        return "Assignment Submission";
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Assignment
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/students/classes")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  if (!tugas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Assignment Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested assignment could not be found.
          </p>
          <button
            onClick={() => navigate("/students/classes")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/students/classes")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {tugas.title}
                </h1>
                <p className="text-sm text-gray-500">{getStepTitle()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmissionProgress step={step} setStep={setStep} />

        {step === 1 && (
          <div className="space-y-6">
            {/* Assignment Description */}
            {tugas.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Assignment Instructions
                </h3>
                <p className="text-gray-700">{tugas.description}</p>
              </div>
            )}

            {tugas.essayQuestions?.length > 0 && (
              <EssayQuestions
                questions={tugas.essayQuestions}
                answers={submission.essayAnswers}
                setAnswers={(answers) =>
                  setSubmission({ ...submission, essayAnswers: answers })
                }
              />
            )}

            {tugas.multipleChoiceQuestions?.length > 0 && (
              <MultipleChoiceQuestions
                questions={tugas.multipleChoiceQuestions}
                answers={submission.multipleChoiceAnswers}
                setAnswers={(answers) =>
                  setSubmission({
                    ...submission,
                    multipleChoiceAnswers: answers,
                  })
                }
              />
            )}

            {tugas.shortQuestions?.length > 0 && (
              <ShortAnswerQuestions
                questions={tugas.shortQuestions}
                answers={submission.shortAnswers}
                setAnswers={(answers) =>
                  setSubmission({ ...submission, shortAnswers: answers })
                }
              />
            )}

            {/* Show message if no questions */}
            {(!tugas.essayQuestions || tugas.essayQuestions.length === 0) &&
              (!tugas.multipleChoiceQuestions ||
                tugas.multipleChoiceQuestions.length === 0) &&
              (!tugas.shortQuestions || tugas.shortQuestions.length === 0) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Questions
                  </h3>
                  <p className="text-gray-600">
                    This assignment only requires file submission.
                  </p>
                </div>
              )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <FileUploadSection
              file={submission.file}
              setFile={(file) => setSubmission({ ...submission, file })}
              required={tugas.requiresFileUpload}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <SubmissionReview tugas={tugas} submission={submission} />

            {/* Submission Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Submission Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Essay Answers:</span>
                  <span className="font-medium">
                    {submission.essayAnswers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Multiple Choice Answers:
                  </span>
                  <span className="font-medium">
                    {submission.multipleChoiceAnswers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Short Answers:</span>
                  <span className="font-medium">
                    {submission.shortAnswers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File Attached:</span>
                  <span className="font-medium">
                    {submission.file ? submission.file.name : "No file"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
                className={`inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  canProceedToNextStep()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className={`inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  canSubmit()
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Submit Assignment
              </button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Step {step} of 3
        </div>
      </div>
    </div>
  );
};

export default TugasSubmission;
