import React from "react";

const ShortAnswerQuestions = ({ questions, answers, setAnswers }) => {
  const handleAnswerChange = (questionId, answer) => {
    const newAnswers = answers.filter((a) => a.question !== questionId);
    if (answer.trim()) {
      newAnswers.push({ question: questionId, answer: answer.trim() });
    }
    setAnswers(newAnswers);
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        Short Answer Questions
      </h3>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div
            key={question._id}
            className="border-b border-gray-100 pb-4 last:border-b-0"
          >
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question {index + 1}
              </label>
              <p className="text-gray-900 font-medium mb-3">
                {question.question}
              </p>
              {question.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {question.description}
                </p>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={
                  answers.find((a) => a.question === question._id)?.answer || ""
                }
                onChange={(e) =>
                  handleAnswerChange(question._id, e.target.value)
                }
                placeholder="Enter your answer here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                maxLength={question.maxLength || 500}
              />
              {question.maxLength && (
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {
                    (
                      answers.find((a) => a.question === question._id)
                        ?.answer || ""
                    ).length
                  }{" "}
                  / {question.maxLength} characters
                </div>
              )}
            </div>
            {question.required &&
              !answers.find((a) => a.question === question._id)?.answer && (
                <p className="text-red-500 text-xs mt-1">
                  This question is required
                </p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortAnswerQuestions;
