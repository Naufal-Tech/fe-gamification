import { Card, Divider, Space, Spin, Table, Tabs, Tag, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import api from "../utils/api";

const { Title, Text } = Typography;

// Helper function to format date as DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

// Helper function to calculate age
const calculateAge = (birthdate) => {
  if (!birthdate) return "N/A";
  try {
    const today = new Date();
    const birthDate = new Date(birthdate);

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return "Invalid Date";
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if the birthday hasn't occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // Return age, ensure it's not negative
    return age >= 0 ? age : "N/A";
  } catch (error) {
    console.error("Error calculating age:", error);
    return "Error";
  }
};

// Static card component for displaying numeric stats
const StatCard = ({ title, value, color }) => (
  <Card style={{ width: "100%" }}>
    <Text type="secondary" strong>
      {title}
    </Text>
    <Title level={3} style={{ marginTop: "4px", marginBottom: "0", color }}>
      {value || 0}
    </Title>
  </Card>
);

const TeacherClassDetails = () => {
  const { kelasId } = useParams();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/v1/kelas/statistics/${kelasId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setClassData(response.data);
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [kelasId, accessToken]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <Spin size="large" />
        <Text style={{ marginTop: 8 }}>Loading class data...</Text>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Text type="danger">Failed to load class data. Please try again.</Text>
      </div>
    );
  }

  const { classInfo, details } = classData;

  const studentColumns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => text || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => text || "N/A",
    },
    {
      title: "ID Number",
      dataIndex: "noIdentity",
      key: "noIdentity",
      render: (text) => text || "N/A",
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (text) => text || "N/A",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => {
        if (!gender) return "N/A";
        const color = gender === "Laki-Laki" ? "blue" : "pink";
        return <Tag color={color}>{gender}</Tag>;
      },
    },
    {
      title: "Birthdate",
      dataIndex: "birthdate",
      key: "birthdate",
      render: (date) => formatDate(date),
    },
    {
      title: "Age",
      key: "age",
      render: (_, record) => calculateAge(record.birthdate),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (address) => {
        // Handle case where address is a single object, not an array
        if (address && !Array.isArray(address) && typeof address === "object") {
          const addr = address;
          return `${addr.street || ""}, ${addr.city || ""}${
            addr.country ? ", " + addr.country : ""
          }${addr.postalCode ? " " + addr.postalCode : ""}`;
        }

        // Handle array of addresses
        if (Array.isArray(address) && address.length > 0) {
          return address.map((addr, index) => (
            <span key={addr._id || index}>
              {`${addr.street || ""}, ${addr.city || ""}${
                addr.country ? ", " + addr.country : ""
              }${addr.postalCode ? " " + addr.postalCode : ""}`}
              {index < address.length - 1 ? "; " : ""}
            </span>
          ));
        }

        return "N/A";
      },
    },
  ];

  const quizColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) =>
        record.quizType && record._id ? (
          <Link to={`/quizzes/${record.quizType}/${record._id}`}>{text}</Link>
        ) : (
          text || "N/A"
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "N/A",
    },
    {
      title: "Semester",
      dataIndex: "semester",
      key: "semester",
      render: (semester) => (semester ? <Tag>{semester}</Tag> : "N/A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === "published" ? "green" : "orange";
        return <Tag color={color}>{status || "N/A"}</Tag>;
      },
    },
    {
      title: "Questions",
      dataIndex: "questions",
      key: "questions",
      render: (questions) => (Array.isArray(questions) ? questions.length : 0),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (timestamp) => {
        if (!timestamp) return "N/A";
        // Handle both timestamp (number) and ISO string formats
        const date =
          typeof timestamp === "number"
            ? new Date(timestamp)
            : new Date(timestamp);
        return formatDate(date);
      },
    },
  ];

  const examColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => text || "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "N/A",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration) =>
        duration !== undefined && duration !== null
          ? `${duration} minutes`
          : "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === "active" ? "green" : "red";
        return <Tag color={color}>{status || "N/A"}</Tag>;
      },
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return formatDate(date);
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return formatDate(date);
      },
    },
  ];

  const assignmentColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => text || "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "N/A",
    },
    {
      title: "File Upload Required",
      dataIndex: "requiresFileUpload",
      key: "requiresFileUpload",
      render: (required) => (
        <Tag color={required ? "blue" : "default"}>
          {required ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "tags",
      key: "tags",
      render: (status) => {
        const color = status === "active" ? "green" : "red";
        return <Tag color={color}>{status || "N/A"}</Tag>;
      },
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return formatDate(date);
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return formatDate(date);
      },
    },
  ];

  const teacherColumns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => text || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => text || "N/A",
    },
  ];

  const tabItems = [
    {
      label: "Overview",
      key: "overview",
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card title="Statistik Kelas">
            <div
              className="stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <StatCard
                title="Total Peserta Didik"
                value={classInfo?.studentsCount || 0}
                color="#1890ff"
              />
              <StatCard
                title="Murid Laki-Laki"
                value={classInfo?.maleStudentsCount || 0}
                color="#52c41a"
              />
              <StatCard
                title="Murid Perempuan"
                value={classInfo?.femaleStudentsCount || 0}
                color="#eb2f96"
              />
              <StatCard
                title="Total Guru"
                value={classInfo?.teachersCount || 0}
                color="#722ed1"
              />
              <StatCard
                title="Kuis Essay"
                value={classInfo?.essayQuizzesCount || 0}
                color="#fa8c16"
              />
              <StatCard
                title="Kuis Pilihan Ganda"
                value={classInfo?.multipleChoiceQuizzesCount || 0}
                color="#13c2c2"
              />
              <StatCard
                title="Kuis Jawaban Singkat"
                value={classInfo?.shortQuizzesCount || 0}
                color="#a0d911"
              />
              <StatCard
                title="Ujian"
                value={classInfo?.examsCount || 0}
                color="#f5222d"
              />
              <StatCard
                title="Tugas"
                value={classInfo?.tugasCount || 0}
                color="#faad14"
              />
            </div>
          </Card>
        </Space>
      ),
    },
    {
      label: `Peserta Didik (${classInfo?.studentsCount || 0})`,
      key: "students",
      children: (
        <Table
          dataSource={Array.isArray(details?.students) ? details.students : []}
          columns={studentColumns}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} students`,
          }}
          scroll={{ x: 1200 }}
        />
      ),
    },
    {
      label: `Guru (${classInfo?.teachersCount || 0})`,
      key: "teachers",
      children: (
        <Table
          dataSource={Array.isArray(details?.teachers) ? details.teachers : []}
          columns={teacherColumns}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      ),
    },
    {
      label: `Kuis Essay (${classInfo?.essayQuizzesCount || 0})`,
      key: "essayQuizzes",
      children: (
        <Table
          dataSource={
            Array.isArray(details?.essayQuizzes)
              ? details.essayQuizzes.map((q) => ({
                  ...q,
                  quizType: "essay",
                }))
              : []
          }
          columns={quizColumns}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      label: `Kuis Pilihan Ganda (${
        classInfo?.multipleChoiceQuizzesCount || 0
      })`,
      key: "multipleChoiceQuizzes",
      children: (
        <Table
          dataSource={
            Array.isArray(details?.multipleChoiceQuizzes)
              ? details.multipleChoiceQuizzes.map((q) => ({
                  ...q,
                  quizType: "multiple-choice",
                }))
              : []
          }
          columns={quizColumns}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      label: `Short Quizzes (${classInfo?.shortQuizzesCount || 0})`,
      key: "shortQuizzes",
      children: (
        <Table
          dataSource={
            Array.isArray(details?.shortQuizzes)
              ? details.shortQuizzes.map((q) => ({
                  ...q,
                  quizType: "short",
                }))
              : []
          }
          columns={quizColumns}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      label: `Ujian (${classInfo?.examsCount || 0})`,
      key: "exams",
      children: (
        <Table
          dataSource={Array.isArray(details?.exams) ? details.exams : []}
          columns={examColumns}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      label: `Tugas (${classInfo?.tugasCount || 0})`,
      key: "tugas",
      children: (
        <Table
          dataSource={Array.isArray(details?.tugas) ? details.tugas : []}
          columns={assignmentColumns}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      ),
    },
  ];

  return (
    <div className="class-details-container" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Title level={2}>{classInfo?.name || "Class Details"}</Title>
        <Text type="secondary" style={{ fontSize: "16px" }}>
          {classInfo?.description || "No description available"}
        </Text>
      </div>
      <Divider />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
        size="large"
      />
    </div>
  );
};

export default TeacherClassDetails;
