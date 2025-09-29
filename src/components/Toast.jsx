import { AlertCircle, CheckCircle, X, XCircle } from "lucide-react";
import { useEffect } from "react";

export const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: "bg-green-500 border-green-600",
    error: "bg-red-500 border-red-600",
    warning: "bg-yellow-500 border-yellow-600",
    info: "bg-blue-500 border-blue-600",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    error: <XCircle className="w-5 h-5 text-white" />,
    warning: <AlertCircle className="w-5 h-5 text-white" />,
    info: <AlertCircle className="w-5 h-5 text-white" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`${styles[type]} text-white px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center space-x-3 animate-slide-in-right`}
      >
        {icons[type]}
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
