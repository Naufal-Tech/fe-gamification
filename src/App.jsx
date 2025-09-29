import { Toaster } from "react-hot-toast";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { userLoader } from "./loaders";

import {
  AboutUs,
  AdminAnnouncementEdit,
  AdminCreateAnnouncement,
  AdminDashboardHome,
  AdminDashboardOutlet,
  AdminKelasCreate,
  AdminKelasManagement,
  AdminLogin,
  AdminProfile,
  AdminStudentCreate,
  AdminStudentDetail,
  AdminStudentEdit,
  AdminStudentManagement,
  AdminTeacherCreate,
  AdminTeacherDetail,
  AdminTeacherEdit,
  AdminTeacherManagement,
  AdminUserActivity,
  Announcements,
  CategoryQuiz,
  ContactUs,
  Error,
  EssayQuiz,
  Exam,
  ExamRanking,
  ForgotPassword,
  HomeLayout,
  KelasExam,
  KelasTugas,
  LandingPage,
  LinkedStudents,
  MultipleChoice,
  MyExamDetailScore,
  MyExamSubmission,
  MyRankExam,
  MyRankTugas,
  MyTugasDetailScore,
  MyTugasSubmission,
  ParentProfile,
  ParentsDashboardHome,
  ParentsDashboardOutlet,
  ParentsLogin,
  ParentsRegister,
  QuizSubmission,
  ResendOtp,
  ResetPassword,
  SignIn,
  SignUp,
  StudentDashboardHome,
  StudentDashboardOutlet,
  StudentExamReport,
  StudentKelas,
  StudentProfile,
  StudentTugasReport,
  StudyResource,
  StudyResourceGuru,
  SubmissionDetail,
  SuperDashboard,
  SuperProfile,
  TeacherClasses,
  TeacherDashboardHome,
  TeacherExamGradingReport,
  TeacherLogin,
  TeacherProfile,
  TeachersDashboard,
  TeacherTugasGradingReport,
  Tugas,
  TugasRankings,
  TugasResult,
  TugasSubmission,
  VerifyEmail,
  VerifyOtp,
} from "./pages";

import {
  CategoryQuizDetail,
  CategoryQuizEdit,
  EssayDetail,
  EssayQuizCreate,
  EssayQuizEdit,
  ExamCreate,
  ExamDetail,
  ExamGradingPage,
  ExamResult,
  ExamSubmission,
  ExamUpdate,
  KelasAssignmentDetail,
  MultipleChoiceCreate,
  MultipleChoiceDetail,
  MultipleChoiceEdit,
  PenilaianExam,
  PenilaianTugas,
  QuizDetailView,
  ShortQuizCreate,
  ShortQuizDetail,
  ShortQuizEdit,
  StudyResourceDetail,
  StudyResourceEdit,
  StudyResourceUpload,
  TeacherClassDetails,
  TugasCreate,
  TugasDetail,
  TugasGradingPage,
  TugasSubmit,
  TugasUpdate,
} from "./components";
import CategoryQuizCreate from "./components/CateogryQuizCreate";
import ShortQuiz from "./pages/Kuis/ShortQuiz";
import ParentsExamReports from "./pages/Parents/ParentsExamReport";
import ParentsTugasReports from "./pages/Parents/ParentsTugasReport";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    loader: userLoader,
    errorElement: <Error />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "parents", element: <ParentsLogin /> },
      { path: "parents/register", element: <ParentsRegister /> },
      { path: "parents/login", element: <ParentsLogin /> },
      { path: "admin/login", element: <AdminLogin /> },
      { path: "profile/super", element: <SuperProfile /> },
      {
        path: "super/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Super"]}>
            <SuperDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "super/announcements",
        element: (
          <ProtectedRoute allowedRoles={["Super"]}>
            <Announcements />
          </ProtectedRoute>
        ),
      },
      { path: "sign-in", element: <SignIn /> },
      { path: "about-us", element: <AboutUs /> },
      { path: "contact-us", element: <ContactUs /> },
      { path: "teacher-login", element: <TeacherLogin /> },
      {
        path: "teachers",
        element: (
          <ProtectedRoute allowedRoles={["Guru"]}>
            <TeachersDashboard />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <TeacherDashboardHome /> },
          { path: "dashboard", element: <TeacherDashboardHome /> },
          {
            path: "announcements",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <Announcements />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TeacherProfile />
              </ProtectedRoute>
            ),
          },
          {
            path: "category-quiz",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <CategoryQuiz />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "category-quiz/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <CategoryQuizCreate />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "category-quiz/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <CategoryQuizEdit />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "category-quiz/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <CategoryQuizDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "essay-quizzes",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <EssayQuiz />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "/teachers/essay-quiz/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <EssayQuizCreate />
              </ProtectedRoute>
            ),
            loader: async () => ({
              kelas: await kelasLoader(),
              categories: await categoryLoader(),
            }),
            errorElement: <Error />,
          },
          {
            path: "/teachers/essay-quiz/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <EssayQuizEdit />
              </ProtectedRoute>
            ),
            loader: async () => ({
              kelas: await kelasLoader(),
              categories: await categoryLoader(),
            }),
          },
          {
            path: "essay-quiz/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <EssayDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "multiple-choice",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <MultipleChoice />
              </ProtectedRoute>
            ),
            loader: multipleChoiceLoader,
            errorElement: <Error />,
          },
          {
            path: "multiple-choice/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <MultipleChoiceCreate />
              </ProtectedRoute>
            ),
            loader: multipleChoiceCreateLoader,
            errorElement: <Error />,
          },
          {
            path: "multiple-choice/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <MultipleChoiceEdit />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "multiple-choice/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <MultipleChoiceDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "short-quiz",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ShortQuiz />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
            loader: shortQuizLoader,
          },
          {
            path: "short-quiz/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ShortQuizCreate />
              </ProtectedRoute>
            ),
            loader: shortQuizAddLoader,
            errorElement: <Error />,
          },
          {
            path: "short-quiz/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ShortQuizDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "short-quiz/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ShortQuizEdit />
              </ProtectedRoute>
            ),
            loader: shortQuizEditLoader,
            errorElement: <Error />,
          },
          {
            path: "classes",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TeacherClasses />
              </ProtectedRoute>
            ),
            loader: teacherClassesLoader,
            errorElement: <Error />,
          },
          {
            path: "classes/:kelasId",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TeacherClassDetails />
              </ProtectedRoute>
            ),
            loader: teacherClassesLoader,
            errorElement: <Error />,
          },
          {
            path: "quizzes/:quizType/:quizId",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <QuizDetailView />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "assignments",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <Tugas />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
            loader: tugasLoader,
          },
          {
            path: "tugas/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TugasDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TugasCreate />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TugasUpdate />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas/submit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TugasSubmit />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "penilaian-tugas",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <PenilaianTugas />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
            loader: penilaianTugasLoader,
          },
          {
            path: "tugas-submissions/grade/:submissionId",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TugasGradingPage />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas-submissions/view/:submissionId",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <SubmissionDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exams",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <Exam />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
            loader: examLoader,
          },
          {
            path: "exams/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ExamCreate />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exams/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ExamDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exams/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ExamUpdate />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "penilaian-exam",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <PenilaianExam />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exam-submissions/grade/:submissionId",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <ExamGradingPage />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "resources",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <StudyResourceGuru />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "study-resources/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <StudyResourceDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "study-resources/new",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <StudyResourceUpload />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "study-resources/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <StudyResourceEdit />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "reports-exam",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TeacherExamGradingReport />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "reports-tugas",
            element: (
              <ProtectedRoute allowedRoles={["Guru"]}>
                <TeacherTugasGradingReport />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
        ],
      },
      {
        path: "students",
        element: (
          <ProtectedRoute allowedRoles={["User"]}>
            <StudentDashboardOutlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <StudentDashboardHome /> },
          { path: "dashboard", element: <StudentDashboardHome /> },
          {
            path: "announcements",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <Announcements />
              </ProtectedRoute>
            ),
          },
          {
            path: "assignments",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <KelasTugas />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
            loader: kelasTugasLoader,
          },
          {
            path: "tugas/results/:submissionId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <TugasResult />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "assignment-grades",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <MyTugasSubmission />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas/rankings/:tugasId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <TugasRankings />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas/my-rank/:tugasId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <MyRankTugas />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "tugas/detail-score/:tugasId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <MyTugasDetailScore />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exams",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <KelasExam />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
            loader: kelasExamsLoader,
          },
          {
            path: "exam-result/:submissionId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <ExamResult />
              </ProtectedRoute>
            ),
          },
          {
            path: "exam-grades",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <MyExamSubmission />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exam/rankings/:examId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <ExamRanking />
              </ProtectedRoute>
            ),
          },
          {
            path: "exam/my-rank/:examId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <MyRankExam />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "exam/detail-score/:examId",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <MyExamDetailScore />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "reports-exam",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <StudentExamReport />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "reports-tugas",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <StudentTugasReport />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <StudentProfile />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "classes",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <StudentKelas />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          // Assignment Detail Pages (for viewing requirements/instructions)
          {
            path: "assignment/:type/:id", // <-- This captures both 'type' and 'id'
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <KelasAssignmentDetail />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "submit/tugas/:id",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <TugasSubmission />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "submit/exam/:id",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <ExamSubmission />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "submit/quiz/:id",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <QuizSubmission />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "resources",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <StudyResource />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
        ],
      },
      {
        path: "parents",
        element: (
          <ProtectedRoute allowedRoles={["Parents"]}>
            <ParentsDashboardOutlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ParentsDashboardHome /> },
          { path: "dashboard", element: <ParentsDashboardHome /> },
          {
            path: "announcements",
            element: (
              <ProtectedRoute allowedRoles={["Parents"]}>
                <Announcements />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute allowedRoles={["Parents"]}>
                <ParentsDashboardHome />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["Parents"]}>
                <ParentProfile />
              </ProtectedRoute>
            ),
          },
          {
            path: "tugas-reports",
            element: (
              <ProtectedRoute allowedRoles={["Parents"]}>
                <ParentsTugasReports />
              </ProtectedRoute>
            ),
          },
          {
            path: "exam-reports",
            element: (
              <ProtectedRoute allowedRoles={["Parents"]}>
                <ParentsExamReports />
              </ProtectedRoute>
            ),
          },
          {
            path: "child-profile",
            element: (
              <ProtectedRoute allowedRoles={["Parents"]}>
                <LinkedStudents />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboardOutlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboardHome /> },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboardHome />
              </ProtectedRoute>
            ),
          },
          {
            path: "announcements",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Announcements />
              </ProtectedRoute>
            ),
          },
          {
            path: "teachers",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminTeacherManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "teachers/create",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminTeacherCreate />
              </ProtectedRoute>
            ),
          },
          {
            path: "teachers/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminTeacherDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: "teachers/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminTeacherEdit />
              </ProtectedRoute>
            ),
          },
          {
            path: "students",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminStudentManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "students/create",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminStudentCreate />
              </ProtectedRoute>
            ),
          },
          {
            path: "students/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminStudentDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: "students/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminStudentEdit />
              </ProtectedRoute>
            ),
          },
          {
            path: "kelas",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminKelasManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "kelas/detail/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminKelasDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: "kelas/create",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminKelasCreate />
              </ProtectedRoute>
            ),
          },
          {
            path: "kelas/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminKelasEdit />
              </ProtectedRoute>
            ),
          },
          {
            path: "activity-logs",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminUserActivity />
              </ProtectedRoute>
            ),
          },
          {
            path: "announcements/new",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminCreateAnnouncement />
              </ProtectedRoute>
            ),
          },
          {
            path: "announcements/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminAnnouncementEdit />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminProfile />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    element: (
      <div>
        <Outlet />
      </div>
    ),
    errorElement: <Error />,
    children: [
      { path: "sign-up", element: <SignUp />, loader: classLoader },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "resend-otp", element: <ResendOtp /> },
      { path: "verify-otp", element: <VerifyOtp /> },
    ],
  },
  { path: "*", element: <Error /> },
]);

const App = () => (
  <>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "8px",
          padding: "12px",
          maxWidth: "400px",
          fontSize: "14px",
        },
        success: {
          style: {
            background: "#10b981",
            color: "#ffffff",
          },
        },
        error: {
          style: {
            background: "#ef4444",
            color: "#ffffff",
          },
        },
      }}
    />
  </>
);

export default App;
