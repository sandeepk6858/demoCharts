import Chart from "./components/Chart";
import MixedChart from "./components/MixedChart";
import ReactJsChart from "./components/ReactJsChart";

function App() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Chart 1 */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-lg font-bold text-center bg-red-100 mb-4">Chart 1 "Bar chart"</h1>
        <Chart chartType="bar" />
      </div>

      {/* Chart 2 */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-lg font-bold text-center bg-green-100 mb-4">Chart 2 "Line chart"</h1>
        <Chart chartType="line" />
      </div>

      {/* Chart 3 */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-lg font-bold text-center bg-yellow-100 mb-4">Chart 3 "Area chart"</h1>
        <Chart chartType="area" />
      </div>

      {/* Chart 4 */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-lg font-bold text-center bg-blue-100 mb-4">Chart 4 "Mixed chart"</h1>
        <MixedChart />
      </div>
      <div className="bg-white p-4 rounded shadow col-span-2">
        <h1 className="text-lg font-bold text-center bg-blue-100 mb-4">Chart 5 "React js  chart"</h1>
        <ReactJsChart />
      </div>
    </div>

  );
}

export default App;
