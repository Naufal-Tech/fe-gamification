import React from "react";

const SubmissionReview = ({ submission, tugas }) => {
  const getAnswerCount = () => {
    let count = 0;
    if (submission.essayAnswers) count += submission.essayAnswers.length;
    if (submission.multipleChoiceAnswers)
      count += submission.multipleChoiceAnswers.length;
    if (submission.shortAnswers) count += submission.shortAnswers.length;
    return count;
  };

  const getTotalQuestions = () => {
    let total = 0;
    if (tugas.essayQuestions) total += tugas.essayQuestions.length;
    if (tugas.multipleChoiceQuestions)
      total += tugas.multipleChoiceQuestions.length;
    if (tugas.shortQuestions) total += tugas.shortQuestions.length;
    return total;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Review Your Submission
        </h3>

        {/* Assignment Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">{tugas.title}</h4>
          {tugas.description && (
            <p className="text-gray-600 text-sm">{tugas.description}</p>
          )}
        </div>

        {/* Submission Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getAnswerCount()}
            </div>
            <div className="text-sm text-gray-600">Questions Answered</div>
            <div className="text-xs text-gray-500">
              out of {getTotalQuestions()}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {submission.file ? "1" : "0"}
            </div>
            <div className="text-sm text-gray-600">File Uploaded</div>
            {tugas.requiresFileUpload && (
              <div className="text-xs text-gray-500">
                {submission.file ? "Required" : "Required - Missing!"}
              </div>
            )}
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((getAnswerCount() / getTotalQuestions()) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="space-y-4">
          {/* Essay Questions Review */}
          {tugas.essayQuestions && tugas.essayQuestions.length > 0 && (
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">
                Essay Questions ({submission.essayAnswers?.length || 0}/
                {tugas.essayQuestions.length})
              </h5>
              <div className="space-y-3">
                {tugas.essayQuestions.map((question, index) => {
                  const answer = submission.essayAnswers?.find(
                    (a) => a.question === question._id
                  );
                  return (
                    <div key={question._id} className="bg-gray-50 rounded p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Question {index + 1}: {question.question}
                      </p>
                      {answer ? (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            Your Answer:
                          </p>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {answer.answer}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {answer.answer.length} characters
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">✗ Not answered</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multiple Choice Questions Review */}
          {tugas.multipleChoiceQuestions &&
            tugas.multipleChoiceQuestions.length > 0 && (
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">
                  Multiple Choice Questions (
                  {submission.multipleChoiceAnswers?.length || 0}/
                  {tugas.multipleChoiceQuestions.length})
                </h5>
                <div className="space-y-3">
                  {tugas.multipleChoiceQuestions.map((question, index) => {
                    const answer = submission.multipleChoiceAnswers?.find(
                      (a) => a.question === question._id
                    );
                    const selectedOption = answer
                      ? question.options?.find(
                          (opt) => opt._id === answer.option
                        )
                      : null;
                    return (
                      <div
                        key={question._id}
                        className="bg-gray-50 rounded p-3"
                      >
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Question {index + 1}: {question.question}
                        </p>
                        {selectedOption ? (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                              Your Answer:
                            </p>
                            <div className="bg-white p-2 rounded border border-gray-200 inline-block">
                              <p className="text-sm text-green-600">
                                {selectedOption.text}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-red-500">✗ Not answered</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Short Answer Questions Review */}
          {tugas.shortQuestions && tugas.shortQuestions.length > 0 && (
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">
                Short Answer Questions ({submission.shortAnswers?.length || 0}/
                {tugas.shortQuestions.length})
              </h5>
              <div className="space-y-3">
                {tugas.shortQuestions.map((question, index) => {
                  const answer = submission.shortAnswers?.find(
                    (a) => a.question === question._id
                  );
                  return (
                    <div key={question._id} className="bg-gray-50 rounded p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Question {index + 1}: {question.question}
                      </p>
                      {answer ? (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            Your Answer:
                          </p>
                          <div className="bg-white p-2 rounded border border-gray-200">
                            <p className="text-sm text-gray-800">
                              {answer.answer}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">✗ Not answered</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File Upload Review */}
          <div className="border rounded-lg p-4">
            <h5 className="font-semibold text-gray-900 mb-3">File Upload</h5>
            <div className="bg-gray-50 rounded p-3">
              {submission.file ? (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {submission.file.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Size: {(submission.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-gray-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {tugas.requiresFileUpload
                      ? "No file uploaded (Required)"
                      : "No file uploaded (Optional)"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        {tugas.requiresFileUpload && !submission.file && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> File upload is required for this
                assignment but no file has been uploaded.
              </p>
            </div>
          </div>
        )}

        {getAnswerCount() < getTotalQuestions() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-yellow-800">
                <strong>Notice:</strong> You have{" "}
                {getTotalQuestions() - getAnswerCount()} unanswered question(s).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionReview;
