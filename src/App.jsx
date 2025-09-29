import { Toaster } from "react-hot-toast";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { userLoader } from "./loaders";

import {
  AboutUs,
  AdminDashboardHome,
  AdminDashboardOutlet,
  AdminLogin,
  ContactUs,
  Error,
  ForgotPassword,
  HomeLayout,
  LandingPage,
  ResendOtp,
  ResetPassword,
  SignIn,
  SignUp,
  StudentDashboardHome,
  StudentDashboardOutlet,
  StudentProfile,
  SuperDashboard,
  SuperProfile,
  VerifyEmail,
  VerifyOtp,
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
            path: "profile",
            element: (
              <ProtectedRoute allowedRoles={["User"]}>
                <StudentProfile />
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
