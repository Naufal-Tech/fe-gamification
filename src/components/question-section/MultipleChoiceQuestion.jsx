const MultipleChoiceQuestions = ({ questions, answers, setAnswers }) => {
  const handleAnswerChange = (questionId, optionId) => {
    const newAnswers = answers.filter((a) => a.question !== questionId);
    newAnswers.push({ question: questionId, option: optionId });
    setAnswers(newAnswers);
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Multiple Choice Questions</h3>
      {questions.map((q) => (
        <div key={q._id} className="mb-6">
          <p className="font-medium mb-2">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <label key={opt._id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question-${q._id}`}
                  checked={
                    answers.find((a) => a.question === q._id)?.option ===
                    opt._id
                  }
                  onChange={() => handleAnswerChange(q._id, opt._id)}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MultipleChoiceQuestions;
