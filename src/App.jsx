import { Toaster } from "react-hot-toast";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { userLoader } from "./loaders";

import {
  AboutUs,
  AdminActivityLogs,
  AdminBadges,
  AdminDailyTaskManagement,
  AdminDashboardHome,
  AdminDashboardOutlet,
  AdminLogin,
  AdminMilestones,
  AdminPlayersManagement,
  AdminProfile,
  AdminXPTransactions,
  Badges,
  ContactUs,
  DailyTasks,
  DueDate,
  Error,
  ForgotPassword,
  HomeLayout,
  JoinUs,
  LandingPage,
  Leaderboard,
  Milestones,
  ResendOtp,
  ResetPassword,
  SignIn,
  SignUp,
  SuperAdminManagement,
  SuperDailyTaskManagement,
  SuperDashboardHome,
  SuperDashboardOutlet,
  SuperPlayersManagement,
  SuperProfile,
  UserDashboardHome,
  UserDashboardOutlet,
  UserProfile,
  VerifyEmail,
  VerifyOtp,
  XPStats,
} from "./pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    loader: userLoader,
    errorElement: <Error />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "admin/login", element: <AdminLogin /> },
      { path: "profile/super", element: <SuperProfile /> },

      { path: "sign-in", element: <SignIn /> },
      { path: "about-us", element: <AboutUs /> },
      { path: "contact-us", element: <ContactUs /> },
      { path: "join-us", element: <JoinUs /> },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["User"]}>
            <UserDashboardOutlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <UserDashboardHome /> },
          { path: "dashboard", element: <UserDashboardHome /> },
          {
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <UserProfile />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "daily-tasks",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <DailyTasks />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "due-dates",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <DueDate />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "milestones",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <Milestones />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "badges",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <Badges />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "xp-stats",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <XPStats />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
          },
          {
            path: "leaderboard",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <Leaderboard />
              </ProtectedRoute>
            ),
            errorElement: <Error />,
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
            path: "players",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminPlayersManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "daily-tasks",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDailyTaskManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "milestones",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminMilestones />
              </ProtectedRoute>
            ),
          },
          {
            path: "badges",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminBadges />
              </ProtectedRoute>
            ),
          },
          {
            path: "xp-transactions",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminXPTransactions />
              </ProtectedRoute>
            ),
          },
          {
            path: "activity-logs",
            element: (
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminActivityLogs />
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
      {
        path: "super",
        element: (
          <ProtectedRoute allowedRoles={["Super"]}>
            <SuperDashboardOutlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <SuperDashboardHome /> },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute allowedRoles={["Super"]}>
                <SuperDashboardHome />
              </ProtectedRoute>
            ),
          },
          {
            path: "admin-management",
            element: (
              <ProtectedRoute allowedRoles={["Super"]}>
                <SuperAdminManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "players-management",
            element: (
              <ProtectedRoute allowedRoles={["Super"]}>
                <SuperPlayersManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "daily-tasks",
            element: (
              <ProtectedRoute allowedRoles={["Super"]}>
                <SuperDailyTaskManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["Super"]}>
                <SuperProfile />
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
      { path: "sign-up", element: <SignUp /> },
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
