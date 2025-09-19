interface StepSizeInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

function StepSizeInput({ value, onChange, min = 10, max = 1000 }: StepSizeInputProps) {
  const handleIncrement = () => {
    if (value < max) onChange(value + 10);
  };

  const handleDecrement = () => {
    if (value > min) onChange(value - 10);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium text-gray-700">Y-Axis Step Size:</label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleDecrement}
          className="shrink-0 bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 inline-flex items-center justify-center border border-gray-300 rounded-md h-5 w-5 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
        >
          <svg className="w-2.5 h-2.5 text-gray-900 dark:text-white" viewBox="0 0 18 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="shrink-0 !text-black dark:text-white border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[3.5rem] text-center"
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="shrink-0 bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 inline-flex items-center justify-center border border-gray-300 rounded-md h-5 w-5 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
        >
          <svg className="w-2.5 h-2.5 text-gray-900 dark:text-white" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1v16M1 9h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default StepSizeInput