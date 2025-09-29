import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const TugasResults = () => {
  const { submissionId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await api.post(
          `/v1/tugas/auto-grade/${submissionId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setResults(response.data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(err.response?.data?.message || "Failed to load results");
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    if (user && submissionId) {
      fetchResults();
    }
  }, [submissionId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
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

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Results Found
          </h2>
          <p className="text-gray-600 mb-4">
            The submission results could not be found.
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
      <ToastContainer />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Submission Results
          </h1>

          {/* Objective Scores */}
          {results.scores && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Objective Questions
              </h2>

              {results.scores.multipleChoice !== undefined && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Multiple Choice</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${results.scores.multipleChoice}%` }}
                      ></div>
                    </div>
                    <span className="ml-4 font-medium">
                      {Math.round(results.scores.multipleChoice)}%
                    </span>
                  </div>
                </div>
              )}

              {results.scores.shortQuiz !== undefined && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Short Quiz</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{ width: `${results.scores.shortQuiz}%` }}
                      ></div>
                    </div>
                    <span className="ml-4 font-medium">
                      {Math.round(results.scores.shortQuiz)}%
                    </span>
                  </div>
                </div>
              )}

              {results.scores.totalObjective !== undefined && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-2">
                    Total Objective Score
                  </h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-purple-600 h-6 rounded-full"
                        style={{ width: `${results.scores.totalObjective}%` }}
                      ></div>
                    </div>
                    <span className="ml-4 font-bold text-xl">
                      {Math.round(results.scores.totalObjective)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Essay Notice */}
          {results.scores?.needsEssayGrading && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Essay Questions Pending Review
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your essay answers are currently being reviewed by your
                      teacher. You'll receive a notification when your final
                      grade is available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Score (if fully graded) */}
          {results.status === "graded" && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800">
                    Final Grade Available
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p className="font-bold">
                      Your final score:{" "}
                      {Math.round(results.scores.totalObjective)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => navigate("/students/classes")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TugasResults;
