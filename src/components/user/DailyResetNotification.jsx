// components/DailyResetNotification.jsx
import { useEffect, useState } from "react";

const DailyResetNotification = ({
  isOpen,
  onClose,
  type = "auto",
  message = "",
  resetCount = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "login":
        return "👋";
      case "manual":
        return "🔄";
      default:
        return "🎯";
    }
  };

  const getTitle = () => {
    switch (type) {
      case "login":
        return "Welcome Back!";
      case "manual":
        return "Refresh Complete!";
      default:
        return "Daily Reset!";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md border-l-4 border-emerald-400">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl">{getIcon()}</div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-lg">{getTitle()}</h3>
            </div>
            <p className="text-sm text-white/90 mb-2">
              {message || "Your daily tasks have been refreshed!"}
            </p>
            {resetCount > 0 && (
              <p className="text-xs text-white/80">
                {resetCount} task{resetCount !== 1 ? "s" : ""} reset for today
              </p>
            )}
            <div className="mt-2 flex items-center space-x-2 text-xs text-white/80">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 ml-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 transition-all duration-6000 linear"
            style={{
              width: isVisible ? "0%" : "100%",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default DailyResetNotification;
