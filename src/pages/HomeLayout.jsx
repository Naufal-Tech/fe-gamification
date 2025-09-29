import React, { Component, useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Footer, Header } from "../components/";
import { AdminSidebar, StudentSidebar, SuperSidebar } from "../pages";
import { useAuthStore } from "../store/auth";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 w-full max-w-none">
          <div className="text-red-600 dark:text-red-400 text-lg">
            Something went wrong. Please refresh the page.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function HomeLayout() {
  const { user, isAuthenticated, error } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  }); // Desktop sidebar collapse
  const location = useLocation();

  // Ref for the sidebar element
  const sidebarRef = useRef(null);

  // Persist sidebar collapse state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle click outside on mobile when sidebar is open
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        window.innerWidth < 768 // Only on mobile (below md breakpoint)
      ) {
        setIsSidebarOpen(false);
      }
    };

    // Add event listener when sidebar is open
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Redirect on auth error
  useEffect(() => {
    if (error) {
      console.error("Auth error:", error);
      return <Navigate to="/sign-in" replace />;
    }
  }, [error]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const renderSidebar = () => {
    if (!isAuthenticated || !user) return null;

    switch (user.role) {
      case "User":
        return (
          <StudentSidebar
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
        );
      case "Guru":
        return (
          <TeacherSidebar
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
        );
      case "Admin":
        return (
          <AdminSidebar
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
        );
      case "Parents":
        return (
          <ParentSidebar
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
        );
      case "Super":
        return (
          <SuperSidebar
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
        );
      default:
        return null;
    }
  };

  // Check if current route is a dashboard route
  const isDashboardRoute = () => {
    const dashboardRoutes = [
      "/parents/dashboard",
      "/admin/dashboard",
      "/super/dashboard",
      "/teachers/dashboard",
      "/students/dashboard",
    ];
    return dashboardRoutes.some((route) => location.pathname.includes(route));
  };

  // Show footer on home page when not authenticated
  const showFooter =
    !isAuthenticated && !isDashboardRoute() && location.pathname === "/";

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 w-full max-w-none ${
        isAuthenticated
          ? "grid grid-cols-1 md:grid-cols-[auto_1fr]"
          : "flex flex-col"
      }`}
    >
      {/* Mobile Overlay - Transparent clickable area */}
      {isAuthenticated && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (only for authenticated users) */}
      {isAuthenticated && (
        <div
          ref={sidebarRef}
          className={`
            fixed inset-y-0 left-0 z-40 transform transition-all duration-300
            md:sticky md:top-0 md:translate-x-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            ${isCollapsed ? "md:w-16" : "md:w-64"}
            bg-white dark:bg-gray-800 shadow-lg
          `}
        >
          {renderSidebar()}
          <button
            className="md:hidden absolute top-4 right-4 text-gray-600 dark:text-gray-300"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full max-w-none">
        <Header
          toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          toggleCollapse={toggleCollapse}
          isSidebarOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
        />
        <main className="flex-1 p-6 w-full max-w-none">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

export default HomeLayout;
