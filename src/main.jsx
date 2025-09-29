import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";
import { useAuthStore } from "./store/auth";

useAuthStore.getState().initializeAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      onError: (error) => {
        console.error("Query error:", error);
        toast.error("An error occurred. Please try again.");
      },
    },
    mutations: {
      onError: (error) => {
        console.error("Mutation error:", error);
        toast.error("Action failed. Please try again.");
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <ToastContainer position="top-center" />
    </React.StrictMode>
  </QueryClientProvider>
);
