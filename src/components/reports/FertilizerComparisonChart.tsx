import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Leaf, FlaskConical } from "lucide-react";

interface FertilizerEntry {
  name: string;
  quantity: string;
  frequency?: string;
  details?: string;
}

interface FertilizerComparisonChartProps {
  organic: FertilizerEntry[];
  chemical: FertilizerEntry[];
}

const FertilizerComparisonChart: React.FC<FertilizerComparisonChartProps> = ({ organic, chemical }) => {
  const chartData = [
    {
      category: "Organic",
      primary: organic.filter(f => f.name).length,
      secondary: 0,
      color: "#10b981",
    },
    {
      category: "Chemical",
      primary: chemical.filter(f => f.name).length,
      secondary: 0,
      color: "#3b82f6",
    },
  ];

  return (
    <div className="chart-container bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Fertilizer Recommendations</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            <span className="text-sm text-slate-600">Organic</span>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-slate-600">Chemical</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 14, fill: "#6b7280", fontWeight: 500 }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#6b7280" }}
            label={{ value: "Number of Options", angle: -90, position: "insideLeft", style: { fill: "#6b7280" } }}
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
                  <p className="font-semibold text-slate-900">{props.payload.category} Fertilizers</p>
                  <p className="text-sm">
                    <span className="font-bold text-lg" style={{ color: props.payload.color }}>
                      {value}
                    </span>{" "}
                    <span className="text-slate-600">recommendations</span>
                  </p>
                </div>,
                ""
              ];
            }}
          />
          <Bar dataKey="primary" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Organic: {organic.length}</span>
          </div>
          <p className="text-xs text-green-700">Natural & sustainable</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Chemical: {chemical.length}</span>
          </div>
          <p className="text-xs text-blue-700">Precise & effective</p>
        </div>
      </div>
    </div>
  );
};

export default FertilizerComparisonChart;

