import React, { Component, useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Footer, Header } from "../components/";
import { AdminSidebar, SuperSidebar, UserSidebar } from "../pages";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const location = useLocation();

  const sidebarRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        window.innerWidth < 768
      ) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

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
          <UserSidebar
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

  const isDashboardRoute = () => {
    const dashboardRoutes = [
      "/admin/dashboard",
      "/super/dashboard",
      "/users/dashboard",
    ];
    return dashboardRoutes.some((route) => location.pathname.includes(route));
  };

  const showFooter =
    !isAuthenticated && !isDashboardRoute() && location.pathname === "/";

  return (
    <div
      className={`min-h-screen w-full ${
        isAuthenticated
          ? "flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900" // Changed to flex layout
          : "flex flex-col"
      }`}
    >
      {/* Mobile Overlay */}
      {isAuthenticated && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isAuthenticated && (
        <div
          ref={sidebarRef}
          className={`
            fixed inset-y-0 left-0 z-40 transform transition-all duration-300
            md:relative md:translate-x-0 md:flex-shrink-0
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
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <Header
          toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          toggleCollapse={toggleCollapse}
          isSidebarOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
        />
        <main
          className={`flex-1 w-full ${
            isAuthenticated ? "p-6 bg-gray-50 dark:bg-gray-900" : ""
          }`}
        >
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
