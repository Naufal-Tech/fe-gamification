const EssayQuestions = ({ questions, answers, setAnswers }) => {
  const handleAnswerChange = (questionId, answer) => {
    const newAnswers = answers.filter((a) => a.question !== questionId);
    if (answer) {
      newAnswers.push({ question: questionId, answer });
    }
    setAnswers(newAnswers);
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Essay Questions</h3>
      {questions.map((q) => (
        <div key={q._id} className="mb-6">
          <p className="font-medium mb-2">{q.question}</p>
          <textarea
            value={answers.find((a) => a.question === q._id)?.answer || ""}
            onChange={(e) => handleAnswerChange(q._id, e.target.value)}
            className="w-full border rounded p-2 min-h-[100px]"
          />
        </div>
      ))}
    </div>
  );
};

export default EssayQuestions;
