import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  EssayQuestions,
  MultipleChoiceQuestions,
  ShortAnswerQuestions,
} from "../../components";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const QuizSubmission = () => {
  const { id, type } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [submission, setSubmission] = useState({
    essayAnswers: [],
    multipleChoiceAnswers: [],
    shortAnswers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        let endpoint = "";
        if (type === "essay") endpoint = `/v1/essay-quiz/${id}`;
        else if (type === "multiple-choice")
          endpoint = `/v1/multiple-choice/${id}`;
        else if (type === "short") endpoint = `/v1/short-quiz/${id}`;

        const res = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setQuiz(res.data);

        // Initialize empty answers
        if (res.data.questions) {
          setSubmission((prev) => ({
            ...prev,
            essayAnswers:
              type === "essay"
                ? res.data.questions.map((q) => ({
                    question: q._id,
                    answer: "",
                  }))
                : [],
            shortAnswers:
              type === "short"
                ? res.data.questions.map((q) => ({
                    question: q._id,
                    answer: "",
                  }))
                : [],
            multipleChoiceAnswers:
              type === "multiple-choice"
                ? res.data.questions.map((q) => ({
                    question: q._id,
                    option: null,
                  }))
                : [],
          }));
        }
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        navigate("/student/assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, type, user.token, navigate]);

  const handleSubmit = async () => {
    try {
      let endpoint = "";
      if (type === "essay") endpoint = "/v1/essay-quiz/submit";
      else if (type === "multiple-choice")
        endpoint = "/v1/multiple-choice/submit";
      else if (type === "short") endpoint = "/v1/short-quiz/submit";

      await api.post(
        endpoint,
        {
          quizId: id,
          ...submission,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      navigate("/student/assignments", { state: { success: true } });
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{quiz?.title}</h1>

      {type === "essay" && (
        <EssayQuestions
          questions={quiz?.questions || []}
          answers={submission.essayAnswers}
          setAnswers={(answers) =>
            setSubmission({ ...submission, essayAnswers: answers })
          }
        />
      )}

      {type === "multiple-choice" && (
        <MultipleChoiceQuestions
          questions={quiz?.questions || []}
          answers={submission.multipleChoiceAnswers}
          setAnswers={(answers) =>
            setSubmission({ ...submission, multipleChoiceAnswers: answers })
          }
        />
      )}

      {type === "short" && (
        <ShortAnswerQuestions
          questions={quiz?.questions || []}
          answers={submission.shortAnswers}
          setAnswers={(answers) =>
            setSubmission({ ...submission, shortAnswers: answers })
          }
        />
      )}

      <button
        onClick={handleSubmit}
        className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
      >
        Submit Quiz
      </button>
    </div>
  );
};

export default QuizSubmission;
