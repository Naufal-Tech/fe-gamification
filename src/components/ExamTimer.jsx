import { useEffect, useState } from "react";

const ExamTimer = ({ initialMinutes, onTimeUp }) => {
  const [minutes, setMinutes] = useState(Math.floor(initialMinutes));
  const [seconds, setSeconds] = useState(Math.floor((initialMinutes % 1) * 60));

  useEffect(() => {
    const timer = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else if (minutes > 0) {
        setMinutes(minutes - 1);
        setSeconds(59);
      } else {
        clearInterval(timer);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [minutes, seconds, onTimeUp]);

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
      <div className="flex items-center">
        <Clock className="h-5 w-5 text-yellow-700 mr-2" />
        <span className="font-semibold">
          Time Remaining: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </span>
      </div>
    </div>
  );
};

export default ExamTimer;
