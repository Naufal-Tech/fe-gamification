// components/DeleteTaskModal.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useAuthStore } from "../../store/auth";
import api from "../../utils/api";

const DeleteTaskModal = ({ isOpen, onClose, task }) => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const config = {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      };
      const response = await api.delete(`/v1/daily-tasks/${task._id}`, config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dailyTasks"]);
      onClose();
    },
  });

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Delete Task
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete the task{" "}
                <strong>"{task.title}"</strong>? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleteTaskMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTaskMutation.mutate()}
              disabled={deleteTaskMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleteTaskMutation.isLoading ? "Deleting..." : "Delete Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaskModal;
