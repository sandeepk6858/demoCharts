import { useState, useRef, useEffect } from 'react';
import type { ReactElement } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Filler,
  type ChartEvent,
  // type ActiveElement,
  // type ChartType,
  // Chart,

} from 'chart.js';

import type {  ActiveElement } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line, Bar, } from 'react-chartjs-2';

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Filler,
  ChartDataLabels
);

// Define month labels for the X-axis
const labels: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Define constraints for Y-axis bins and step size
const minBinCount: number = 2;
const maxBinCount: number = 15;
const minStepSize: number = 10;
const maxStepSize: number = 1000;

// Sample data for the chart datasets
const fixedData: Record<string, number[]> = {
  'Beginning balance': [500, -712, 520, 480, 600, 580, -620, 610, 590, -570, 530, 510],
  Revenue: [200, 250, -300, 280, 350, -400, 420, 390, -360, 330, 310, 290],
  Payroll: [-150, -180, -200, -170, 220, -210, -230, 200, -190, -180, -160, 150],
};

// Configure chart datasets with labels, data, and styling
const data = {
  labels,
  datasets: [
    {
      label: 'Beginning balance',
      data: fixedData['Beginning balance'],
      borderColor: '#ff6384',
      backgroundColor: '#ff6384',
      hoverBackgroundColor: '#ff6384cc',
      fill: false,
      hoverBorderWidth: 4,
    },
    {
      label: 'Revenue',
      data: fixedData.Revenue,
      borderColor: '#36a2eb',
      backgroundColor: '#36a2eb',
      hoverBackgroundColor: '#36a2ebcc',
      fill: false,
      hoverBorderWidth: 4,
    },
    {
      label: 'Payroll',
      data: fixedData.Payroll,
      borderColor: '#056d1d',
      backgroundColor: '#056d1d',
      hoverBackgroundColor: '#056d1dcc',
      fill: false,
      hoverBorderWidth: 4,
    },
  ],
};

// Main App component for rendering the chart and controls
function App() {
  // Chart reference for accessing Chart.js instance
  const chartRef = useRef<ChartJS<'line' | 'bar', number[], unknown> | null>(null);
  // Reference to the chart container for positioning elements
  const containerRef = useRef<HTMLDivElement>(null);
  // State for chart type (line or bar)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  // State for toggling X and Y grid lines
  const [isXgridActive, setIsXgridActive] = useState<boolean>(false);
  const [isYgridActive, setIsYgridActive] = useState<boolean>(false);
  // State for Y-axis bins count and step size
  const [yAxisBinsCount, setYaxisBinCount] = useState<number>(9);
  const [stepSize, setStepSize] = useState<number>(200);
  // State for tracking clicked point/bar for annotations
  const [clickedPoint, setClickedPoint] = useState<{
    x: number;
    y: number;
    datasetIndex: number;
    dataIndex: number;
  } | null>(null);
  // State for storing annotation texts
  const [pointTexts, setPointTexts] = useState<{ [key: string]: string[] }>({});
  // State for showing/hiding the annotation input popup
  const [showInput, setShowInput] = useState<boolean>(false);
  // State for the annotation input text
  const [inputText, setInputText] = useState<string>('');
  // State for toggling settings dropdown
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Calculate the absolute maximum value across all datasets to ensure Y-axis covers all data
  const absoluteMax: number = Math.max(
    Math.abs(Math.max(...fixedData['Beginning balance'], ...fixedData['Payroll'], ...fixedData['Revenue'])),
    Math.abs(Math.min(...fixedData['Beginning balance'], ...fixedData['Payroll'], ...fixedData['Revenue']))
  );
  // Calculate desired ticks per side based on yAxisBinsCount (excluding 0)
  const ticksPerSide: number = Math.floor((yAxisBinsCount - 1) / 2);
  // Calculate minimum ticks needed to cover absoluteMax with stepSize
  const minTicksNeeded: number = Math.ceil(absoluteMax / stepSize);
  // Use the larger of desired or minimum ticks to ensure data coverage
  const ticksPerSideAdjusted: number = Math.max(ticksPerSide, minTicksNeeded);
  // Calculate max and min Y-axis values, ensuring symmetry around 0
  const maxAmount: number = stepSize * ticksPerSideAdjusted;
  const minAmount: number = -maxAmount;

  // Chart configuration options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      datalabels: {
        color: '#707070ff',
        anchor: chartType === 'line' ? 'end' : 'center',
        align: chartType === 'line' ? 'right' : 'top',
        font: { weight: 'bold' as const, size: 12 },
        formatter: (value: number) => value,
      },
    },
    scales: {
      x: {
        grid: { display: isXgridActive },
        ticks: { color: '#595757ff' },
      },
      y: {
        grid: { display: isYgridActive },
        min: minAmount,
        max: maxAmount,
        ticks: {
          stepSize: stepSize,
          // Ensure 0 is displayed as 0, accounting for floating-point precision
          callback: function (value: number) {
            return Math.abs(value) < 0.0001 ? 0 : value;
          },
        },
      },
    },
    elements: {
      line: { tension: chartType === 'line' ? 0.1 : 0, borderWidth: 2 },
      point: { radius: chartType === 'line' ? 3 : 0, hoverRadius: chartType === 'line' ? 5 : 0 },
      bar: { borderWidth: 1 },
    },
    interaction: { mode: 'nearest' as const, intersect: true },
  };

  // Handle clicks on chart points or bars to show annotation popup
  const handlePointClick = (event: ChartEvent, activeElements: ActiveElement[]) => {
    console.log("event", event)
    if (activeElements.length > 0 && chartRef.current && containerRef.current) {
      const chart = chartRef.current;
      const element = activeElements[0];
      const datasetIndex = element.datasetIndex;
      const dataIndex = element.index;
      const meta = chart.getDatasetMeta(datasetIndex);
      const point = meta.data[dataIndex];

      // Set clicked point coordinates and indices, show input popup
      setClickedPoint({
        x: point.x || element.element.x,
        y: point.y || element.element.y,
        datasetIndex,
        dataIndex,
      });
      setShowInput(true);
      setInputText('');
    } else {
      // Hide popup if no point/bar is clicked
      setClickedPoint(null);
      setShowInput(false);
    }
  };

  // Add annotation text to the clicked point/bar
  const handleAddText = (value: string) => {
    if (!clickedPoint || !value.trim()) return;
    const key = `${clickedPoint.datasetIndex}-${clickedPoint.dataIndex}`;
    // Append new text to existing annotations for the point/bar
    setPointTexts((prev) => (prev[key] ? { ...prev, [key]: [...prev[key], value] } : { ...prev, [key]: [value] }));
    setShowInput(false);
    setInputText('');
  };

  // Highlight a dataset when its label is clicked in the table
  const highlightDataset = (datasetIndex: number) => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    chart.data.datasets.forEach((ds: any, idx: any) => {
      const meta = chart.getDatasetMeta(idx);

      if (!meta || !meta.dataset) return; // ✅ safety check

      // TypeScript: dataset options are loosely typed, so we cast to any
      const datasetOptions = meta.dataset.options as any;

      // Highlight border width
      datasetOptions.borderWidth = idx === datasetIndex ? 4 : 2;

      // Preserve original border color
      datasetOptions.borderColor = ds.borderColor;

      if (chartType === "bar") {
        // Adjust bar opacity for highlighting
        datasetOptions.backgroundColor =
          idx === datasetIndex
            ? ds.backgroundColor
            : `${ds.backgroundColor}80`; // add alpha
      }
    });
    chart.update();
  };

  // Highlight a specific point/bar when its table cell is clicked
  const highlightPoint = (datasetIndex: number, dataIndex: number) => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    // Increase border width for the selected dataset
    chart.data.datasets.forEach((ds: any, idx: any) => {
      ds.borderWidth = idx === datasetIndex ? 4 : 2;
    });

    chart.update();

    const meta = chart.getDatasetMeta(datasetIndex);
    const point = meta.data[dataIndex];

    // Set clicked point and show annotation popup
    const datasetElement = meta.data[dataIndex];
    const element = datasetElement as PointElement | BarElement | undefined;

    setClickedPoint({
      x: point?.x ?? element?.x ?? 0,
      y: point?.y ?? element?.y ?? 0,
      datasetIndex,
      dataIndex,
    });
    setShowInput(true);
    setInputText('');
  };

  // Clean up chart instance when chartType changes
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartType]);

  // Update chart when Y-axis parameters or grid settings change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [yAxisBinsCount, stepSize, minAmount, maxAmount, isXgridActive, isYgridActive]);

  // Render the chart and controls
  return (
    <div className="bg-white w-[100vw] p-8" ref={containerRef}>
      {/* Control panel for chart settings */}
      <div className="p-4 bg-white rounded-xl shadow-md border border-gray-200 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Chart Controls</h2>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={settingsOpen ? 'Close settings panel' : 'Open settings panel'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        {settingsOpen && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            {/* X Grid toggle wrapper */}
            <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">
              <GridToggle
                label="X Grid"
                isActive={isXgridActive}
                setIsActive={setIsXgridActive}
              />
            </div>

            {/* Y Grid toggle wrapper */}
            <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">
              <GridToggle
                label="Y Grid"
                isActive={isYgridActive}
                setIsActive={setIsYgridActive}
              />
            </div>

            {/* Chart type toggle wrapper */}
            <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 col-span-2">
              <ChartTypeToggle
                chartType={chartType}
                setChartType={setChartType}
              />
            </div>

            {/* Y-axis bins count input wrapper */}
            <div className="p-2 bg-gray-100 rounded-lg">
              <BinsCountInput
                value={yAxisBinsCount}
                onChange={setYaxisBinCount}
                min={minBinCount}
                max={maxBinCount}
              />
            </div>

            {/* Y-axis step size input wrapper */}
            <div className="p-2 bg-gray-100 rounded-lg">
              <StepSizeInput
                value={stepSize}
                onChange={setStepSize}
                min={minStepSize}
                max={maxStepSize}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chart container */}
      <div style={{ position: 'relative', height: '500px' }}>
        {chartType === 'line' ? (
          <Line
            ref={chartRef as any}
            key="line"
            options={{ ...options, onClick: handlePointClick } as any}
            data={data}
            plugins={[ChartDataLabels]}
          />
        ) : (
          <Bar
            ref={chartRef as any}
            key="bar"
            options={{ ...options, onClick: handlePointClick } as any}
            data={data}
            plugins={[ChartDataLabels]}
          />
        )}
        {/* Annotation input popup */}
        {showInput && clickedPoint && (
          <div
            style={{
              position: 'absolute',
              left: clickedPoint.x + 10,
              top: clickedPoint.y - 40,
              background: 'white',
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1000,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
              placeholder="Add annotation"
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <button
              onClick={() => handleAddText(inputText)}
              style={{
                padding: '5px 10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Data table with dataset highlighting and annotations */}
      <div className="mt-6 overflow-x-auto text-black">
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1">Dataset</th>
              {labels.map((label, dataIndex) => (
                <th key={dataIndex} className="border border-gray-300 px-2 py-1">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.datasets.map((ds, datasetIndex) => (
              <tr key={datasetIndex}>
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    onClick={() => highlightDataset(datasetIndex)}
                    className={`font-semibold px-3 py-1 rounded-lg
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-1
                    ${datasetIndex === 0
                        ? 'bg-pink-100 bg-opacity-30 text-pink-700 hover:bg-pink-200 hover:bg-opacity-50 focus:ring-pink-300'
                        : datasetIndex === 1
                          ? 'bg-blue-100 bg-opacity-30 text-blue-700 hover:bg-blue-200 hover:bg-opacity-50 focus:ring-blue-300'
                          : 'bg-green-100 bg-opacity-30 text-green-700 hover:bg-green-200 hover:bg-opacity-50 focus:ring-green-300'
                      }`}
                  >
                    {ds.label}
                  </button>
                </td>
                {ds.data.map((value, dataIndex) => (
                  <td
                    key={dataIndex}
                    className="border border-gray-300 px-2 py-1 cursor-pointer hover:bg-gray-100"
                    onClick={() => highlightPoint(datasetIndex, dataIndex)}
                  >
                    {value}
                    {pointTexts[`${datasetIndex}-${dataIndex}`]?.map((text, idx) => (
                      <div key={idx} style={{ fontSize: '0.8em', color: '#555' }}>
                        {text}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Component for controlling the number of Y-axis bins
interface BinsCountInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

function BinsCountInput({ value, onChange, min = 2, max = 15 }: BinsCountInputProps) {
  // Increment bins count within constraints
  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  // Decrement bins count within constraints
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  // Handle manual input for bins count
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium text-gray-700">Y-Axis Bins Count:</label>
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
          className="shrink-0 !text-black dark:text-white border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center"
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

// Component for controlling the Y-axis step size
interface StepSizeInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

function StepSizeInput({ value, onChange, min = 10, max = 1000 }: StepSizeInputProps) {
  // Increment step size by 10 within constraints
  const handleIncrement = () => {
    if (value < max) onChange(value + 10);
  };

  // Decrement step size by 10 within constraints
  const handleDecrement = () => {
    if (value > min) onChange(value - 10);
  };

  // Handle manual input for step size
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

// Component for toggling between line and bar chart types
interface ChartTypeToggleProps {
  chartType: 'line' | 'bar';
  setChartType: (t: 'line' | 'bar') => void;
}

function ChartTypeToggle({ chartType, setChartType }: ChartTypeToggleProps) {
  // Icons for line and bar chart buttons
  const icons: Record<'line' | 'bar', ReactElement> = {
    line: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l4-4 4 4 8-8" />
      </svg>
    ),
    bar: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h4v12H4zM10 10h4v8h-4zM16 4h4v14h-4z" />
      </svg>
    ),
  };

  return (
    <div className="inline-flex bg-gray-200 rounded-lg p-1 w-fit gap-1">
      {(['line', 'bar'] as const).map((type) => (
        <button
          key={type}
          onClick={() => setChartType(type)}
          className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center
            ${chartType === type ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {icons[type]}
        </button>
      ))}
    </div>
  );
}

interface GridToggleProps {
  label: string;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
}

function GridToggle({ label, isActive, setIsActive }: GridToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium text-gray-700">{label}</span>
      <button
        onClick={() => setIsActive(!isActive)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
        ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
          ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export default App;