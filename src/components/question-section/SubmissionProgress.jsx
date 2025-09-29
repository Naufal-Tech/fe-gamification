const SubmissionProgress = ({ step, setStep }) => {
  const steps = ["Questions", "File Upload", "Review"];

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {steps.map((label, index) => (
          <button
            key={label}
            onClick={() => setStep(index + 1)}
            className={`flex flex-col items-center ${
              step >= index + 1 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center
              ${
                step > index + 1
                  ? "bg-green-100 text-green-600"
                  : step === index + 1
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }`}
            >
              {step > index + 1 ? "✓" : index + 1}
            </div>
            <span className="text-sm mt-1">{label}</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 z-0"></div>
        <div
          className="absolute top-3 left-0 h-1 bg-blue-600 z-10 transition-all duration-300"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default SubmissionProgress;
