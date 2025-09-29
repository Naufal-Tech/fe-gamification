import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
            <h3 className="text-2xl font-bold text-red-700 mb-4">
              Something Went Wrong
            </h3>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try again or contact support.
            </p>
            <Link
              to="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
