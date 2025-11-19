import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { IndianRupee, TrendingDown } from "lucide-react";

interface CostComparisonChartProps {
  totalCost: number;
  optimizedCost: number;
  savings: number;
}

const CostComparisonChart: React.FC<CostComparisonChartProps> = ({ totalCost, optimizedCost, savings }) => {
  const chartData = [
    {
      name: "Current Cost",
      value: totalCost,
      color: "#ef4444", // red
    },
    {
      name: "Optimized Cost",
      value: optimizedCost,
      color: "#10b981", // green
    },
  ];

  const savingsPercentage = totalCost > 0 ? ((savings / totalCost) * 100).toFixed(1) : "0";

  return (
    <div className="chart-container bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Cost Comparison</h3>
        <div className="flex items-center gap-2 text-green-600">
          <TrendingDown className="h-5 w-5" />
          <span className="text-sm font-semibold">Save {savingsPercentage}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 14, fill: "#6b7280", fontWeight: 500 }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{ value: "Cost (₹)", angle: -90, position: "insideLeft", style: { fill: "#6b7280" } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            formatter={(value: number) => {
              return [
                <div key="tooltip" className="space-y-1">
                  <p className="font-semibold text-slate-900">{value.toLocaleString('en-IN')} ₹</p>
                </div>,
                ""
              ];
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs text-red-600 mb-1">Current</p>
          <p className="text-lg font-bold text-red-900">₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-600 mb-1">Optimized</p>
          <p className="text-lg font-bold text-green-900">₹{optimizedCost.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 mb-1">Savings</p>
          <p className="text-lg font-bold text-blue-900">₹{savings.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
};

export default CostComparisonChart;

