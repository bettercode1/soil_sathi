import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Droplets, Calendar } from "lucide-react";

interface IrrigationScheduleItem {
  date: string;
  duration: number;
  amount: number;
  method: string;
  notes: string;
}

interface IrrigationScheduleChartProps {
  schedule: IrrigationScheduleItem[];
}

const IrrigationScheduleChart: React.FC<IrrigationScheduleChartProps> = ({ schedule }) => {
  // Prepare chart data - show water amount over time
  const chartData = schedule.slice(0, 10).map((item, index) => ({
    name: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    amount: item.amount,
    duration: item.duration,
    fullDate: item.date,
  }));

  const totalWater = schedule.reduce((sum, item) => sum + item.amount, 0);
  const avgAmount = schedule.length > 0 ? totalWater / schedule.length : 0;

  return (
    <div className="chart-container bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Irrigation Schedule Overview</h3>
        <div className="flex items-center gap-2 text-blue-600">
          <Droplets className="h-5 w-5" />
          <span className="text-sm font-semibold">{schedule.length} sessions</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{ value: "Water Amount (L)", angle: -90, position: "insideLeft", style: { fill: "#6b7280" } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            formatter={(value: number, name: string, props: any) => {
              return [
                <div key="tooltip" className="space-y-1">
                  <p className="font-semibold text-slate-900">{props.payload.fullDate}</p>
                  <p className="text-sm">
                    <span className="font-bold text-lg text-blue-600">{value}L</span> water
                  </p>
                  <p className="text-xs text-slate-600">Duration: {props.payload.duration} minutes</p>
                </div>,
                ""
              ];
            }}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#3b82f6">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#3b82f6" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 mb-1">Total Sessions</p>
          <p className="text-lg font-bold text-blue-900">{schedule.length}</p>
        </div>
        <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
          <p className="text-xs text-cyan-600 mb-1">Total Water</p>
          <p className="text-lg font-bold text-cyan-900">{totalWater.toFixed(0)}L</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-xs text-indigo-600 mb-1">Avg per Session</p>
          <p className="text-lg font-bold text-indigo-900">{avgAmount.toFixed(0)}L</p>
        </div>
      </div>
    </div>
  );
};

export default IrrigationScheduleChart;

