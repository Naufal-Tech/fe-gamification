// QuizDetailView.jsx
import { Card, Descriptions, Divider, List, Spin, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

const { Title, Text } = Typography;

const QuizDetailView = () => {
  const { quizId, quizType } = useParams();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/v1/quizzes/${quizType}/${quizId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setQuizData(response.data);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, quizType, accessToken]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (!quizData) {
    return <Text>Failed to load quiz data</Text>;
  }

  const renderQuestions = () => {
    if (!quizData.questions || quizData.questions.length === 0) {
      return <Text>No questions found</Text>;
    }

    return (
      <List
        itemLayout="vertical"
        dataSource={quizData.questions}
        renderItem={(question, index) => (
          <List.Item>
            <Descriptions title={`Question ${index + 1}`} bordered>
              <Descriptions.Item label="Question" span={3}>
                {question.text}
              </Descriptions.Item>
              {quizType === "multiple-choice" && (
                <>
                  <Descriptions.Item label="Options" span={3}>
                    <ul>
                      {question.options.map((opt, i) => (
                        <li key={i}>
                          {opt.text} {opt.isCorrect && "(Correct)"}
                        </li>
                      ))}
                    </ul>
                  </Descriptions.Item>
                </>
              )}
              {quizType === "essay" && question.sampleAnswer && (
                <Descriptions.Item label="Sample Answer" span={3}>
                  {question.sampleAnswer}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Points" span={3}>
                {question.points}
              </Descriptions.Item>
            </Descriptions>
          </List.Item>
        )}
      />
    );
  };

  return (
    <div className="quiz-detail-container">
      <Title level={2}>{quizData.title}</Title>

      <Divider />

      <Descriptions bordered column={2}>
        <Descriptions.Item label="Type">
          {quizType === "essay"
            ? "Essay Quiz"
            : quizType === "multiple-choice"
            ? "Multiple Choice Quiz"
            : "Short Quiz"}
        </Descriptions.Item>
        <Descriptions.Item label="Total Questions">
          {quizData.questions?.length || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Total Points">
          {quizData.questions?.reduce((sum, q) => sum + (q.points || 0), 0)}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {new Date(quizData.created_at).toLocaleString()}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Card title="Questions">{renderQuestions()}</Card>
    </div>
  );
};

export default QuizDetailView;
