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
} from 'chart.js';
import type { ActiveElement } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line, Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import SettingsButton from './SettingButton';
import BinsCountInput from './BinsCountInput';
import StepSizeInput from './StepSizeInput';
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
  ChartDataLabels,
  annotationPlugin // Register the annotation plugin
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

// Initial data for the chart datasets
const initialData = {
  labels,
  datasets: [
    {
      label: 'Beginning balance',
      data: [500, -712, 520, 480, 600, 580, -620, 610, 590, -570, 530, 510],
      borderColor: '#ff6384',
      backgroundColor: '#ff6384',
      hoverBackgroundColor: '#ff6384cc',
      fill: false,
      borderWidth: 2,
    },
    {
      label: 'Revenue',
      data: [200, 250, -300, 280, 350, -400, 420, 390, -360, 330, 310, 290],
      borderColor: '#36a2eb',
      backgroundColor: '#36a2eb',
      hoverBackgroundColor: '#36a2ebcc',
      fill: false,
      borderWidth: 2,
    },
    {
      label: 'Payroll',
      data: [-150, -180, -200, -170, 220, -210, -230, 200, -190, -180, -160, 150],
      borderColor: '#056d1d',
      backgroundColor: '#056d1d',
      hoverBackgroundColor: '#056d1dcc',
      fill: false,
      borderWidth: 2,
    },
  ],
};

// Main App component for rendering the chart and controls
function ReactJsChart() {
  const chartRef = useRef<ChartJS<'line' | 'bar', number[], unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [isXgridActive, setIsXgridActive] = useState<boolean>(false);
  const [isYgridActive, setIsYgridActive] = useState<boolean>(false);
  const [yAxisBinsCount, setYaxisBinCount] = useState<number>(9);
  const [stepSize, setStepSize] = useState<number>(200);
  const [clickedPoint, setClickedPoint] = useState<{
    x: number;
    y: number;
    datasetIndex: number;
    dataIndex: number;
  } | null>(null);
  const [pointTexts, setPointTexts] = useState<{ [key: string]: string[] }>({});
  const [showInput, setShowInput] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [highlightedDataset, setHighlightedDataset] = useState<number | null>(null);
  const [chartData, setChartData] = useState(initialData);

  const absoluteMax: number = Math.max(
    Math.abs(Math.max(...chartData.datasets[0].data, ...chartData.datasets[1].data, ...chartData.datasets[2].data)),
    Math.abs(Math.min(...chartData.datasets[0].data, ...chartData.datasets[1].data, ...chartData.datasets[2].data))
  );
  const ticksPerSide: number = Math.floor((yAxisBinsCount - 1) / 2);
  const minTicksNeeded: number = Math.ceil(absoluteMax / stepSize);
  const ticksPerSideAdjusted: number = Math.max(ticksPerSide, minTicksNeeded);
  const maxAmount: number = stepSize * ticksPerSideAdjusted;
  const minAmount: number = -maxAmount;

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
      annotation: {
        annotations: {
          zeroLine: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: '#c9c9c9ff',
            borderWidth: 1,
            borderDash: [10, 3], // Dashed line for visibility
            drawTime: 'afterDatasetsDraw', // Draw after datasets to ensure visibility
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: isXgridActive },
        ticks: { color: '#595757ff' },
      },
      y: {
        grid: {
          display: isYgridActive,
          drawTicks: true,
          drawOnChartArea: isYgridActive,
        },
        min: minAmount,
        max: maxAmount,
        ticks: {
          stepSize: stepSize,
          callback: function (value: number) {
            return Math.abs(value) < 0.0001 ? 0 : value;
          },
        },
      },
    },
    elements: {
      line: { tension: chartType === 'line' ? 0.1 : 0 },
      point: { radius: chartType === 'line' ? 3 : 0, hoverRadius: chartType === 'line' ? 5 : 0 },
      bar: { borderWidth: 1 },
    },
    interaction: { mode: 'nearest' as const, intersect: true },
  };

  const handlePointClick = (event: ChartEvent, activeElements: ActiveElement[]) => {
    console.log("event", event);
    if (activeElements.length > 0 && chartRef.current && containerRef.current) {
      const chart = chartRef.current;
      const element = activeElements[0];
      const datasetIndex = element.datasetIndex;
      const dataIndex = element.index;
      const meta = chart.getDatasetMeta(datasetIndex);
      const point = meta.data[dataIndex];

      setClickedPoint({
        x: point.x || element.element.x,
        y: point.y || element.element.y,
        datasetIndex,
        dataIndex,
      });
      setShowInput(true);
      setInputText('');
    } else {
      setClickedPoint(null);
      setShowInput(false);
    }
  };

  const handleAddText = (value: string) => {
    if (!clickedPoint || !value.trim()) return;
    const key = `${clickedPoint.datasetIndex}-${clickedPoint.dataIndex}`;
    setPointTexts((prev) => (prev[key] ? { ...prev, [key]: [...prev[key], value] } : { ...prev, [key]: [value] }));
    setShowInput(false);
    setInputText('');
  };

  const highlightDataset = (datasetIndex: number) => {
    setHighlightedDataset(datasetIndex); // Set the highlighted dataset
    setChartData((prev) => ({
      ...prev,
      datasets: prev.datasets.map((ds, idx) => ({
        ...ds,
        borderWidth: idx === datasetIndex ? 4 : 2,
        backgroundColor: chartType === 'bar' && idx !== datasetIndex ? `${ds.backgroundColor}80` : ds.backgroundColor,
      })),
    }));
  };

  const resetHighlight = () => {
    setHighlightedDataset(null); // Reset highlighted dataset
    setChartData((prev) => ({
      ...prev,
      datasets: prev.datasets.map((ds) => ({
        ...ds,
        borderWidth: 2,
        backgroundColor: ds.backgroundColor,
      })),
    }));
  };

  const highlightPoint = (datasetIndex: number, dataIndex: number) => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    setChartData((prev) => ({
      ...prev,
      datasets: prev.datasets.map((ds, idx) => ({
        ...ds,
        borderWidth: idx === datasetIndex ? 4 : 2,
        backgroundColor: chartType === 'bar' && idx !== datasetIndex ? `${ds.backgroundColor}80` : ds.backgroundColor,
      })),
    }));

    const meta = chart.getDatasetMeta(datasetIndex);
    const point = meta.data[dataIndex];

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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        resetHighlight();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartType]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [yAxisBinsCount, stepSize, minAmount, maxAmount, isXgridActive, isYgridActive, chartData]);

  return (
    <div className="bg-white w-full p-12  m-1" ref={containerRef} style={{ position: 'relative' }}>
      {/* Control panel for chart settings */}
      <div className='absolute right-10 z-10 bg-white shadow-lg'>
        <div className="flex justify-end">
          <SettingsButton active={settingsOpen} onClickHandler={() => setSettingsOpen(!settingsOpen)} />
        </div>
        {settingsOpen && (
          <div className="mt-2 grid grid-cols-2 gap-3 w-fit p-4 border border-gray-200 rounded-xl ">
            <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">
              <GridToggle
                label="X Grid"
                isActive={isXgridActive}
                setIsActive={setIsXgridActive}
              />
            </div>
            <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">
              <GridToggle
                label="Y Grid"
                isActive={isYgridActive}
                setIsActive={setIsYgridActive}
              />
            </div>
            <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 col-span-2">
              <ChartTypeToggle
                chartType={chartType}
                setChartType={setChartType}
              />
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <BinsCountInput
                value={yAxisBinsCount}
                onChange={setYaxisBinCount}
                min={minBinCount}
                max={maxBinCount}
              />
            </div>
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
      <div style={{ position: 'relative', height: '500px', marginTop: '' }}>
        {chartType === 'line' ? (
          <Line
            ref={chartRef as any}
            key="line"
            options={{ ...options, onClick: handlePointClick } as any}
            data={chartData}
            plugins={[ChartDataLabels]}
          />
        ) : (
          <Bar
            ref={chartRef as any}
            key="bar"
            options={{ ...options, onClick: handlePointClick } as any}
            data={chartData}
            plugins={[ChartDataLabels]}
          />
        )}
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

      {/* Data table */}
      <div className="mt-6 overflow-x-auto text-black">
        <table ref={tableRef} className="table-auto border-collapse border border-gray-300 w-full text-sm">
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
            {chartData.datasets.map((ds, datasetIndex) => (
              <tr
                key={datasetIndex}
                className={highlightedDataset === datasetIndex ? 'bg-gray-200' : ''}
              >
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent click from triggering document-level reset
                      highlightDataset(datasetIndex);
                    }}
                    className={`font-semibold px-3 py-1 rounded-lg
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-1
                    ${datasetIndex === 0
                        ? `bg-pink-100 bg-opacity-30 text-pink-700 hover:bg-pink-200 hover:bg-opacity-50 focus:ring-pink-300
                          ${highlightedDataset === datasetIndex ? 'bg-pink-200 bg-opacity-50' : ''}`
                        : datasetIndex === 1
                          ? `bg-blue-100 bg-opacity-30 text-blue-700 hover:bg-blue-200 hover:bg-opacity-50 focus:ring-blue-300
                            ${highlightedDataset === datasetIndex ? 'bg-blue-200 bg-opacity-50' : ''}`
                          : `bg-green-100 bg-opacity-30 text-green-700 hover:bg-green-200 hover:bg-opacity-50 focus:ring-green-300
                            ${highlightedDataset === datasetIndex ? 'bg-green-200 bg-opacity-50' : ''}`
                      }`}
                  >
                    {ds.label}
                  </button>
                </td>
                {ds.data.map((value, dataIndex) => (
                  <td
                    key={dataIndex}
                    className="border border-gray-300 px-2 py-1 cursor-pointer hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent click from triggering document-level reset
                      highlightPoint(datasetIndex, dataIndex);
                    }}
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



interface ChartTypeToggleProps {
  chartType: 'line' | 'bar';
  setChartType: (t: 'line' | 'bar') => void;
}

function ChartTypeToggle({ chartType, setChartType }: ChartTypeToggleProps) {
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

export default ReactJsChart;