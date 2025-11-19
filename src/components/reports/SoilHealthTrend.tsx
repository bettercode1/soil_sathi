import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface TrendData {
  month: string;
  score: number;
  target: number;
}

interface SoilHealthTrendProps {
  currentScore: number;
}

const SoilHealthTrend: React.FC<SoilHealthTrendProps> = ({ currentScore }) => {
  // Generate trend data (simulated - in real app, this would come from historical data)
  const trendData: TrendData[] = [
    { month: "Jan", score: currentScore - 15, target: 80 },
    { month: "Feb", score: currentScore - 12, target: 80 },
    { month: "Mar", score: currentScore - 8, target: 80 },
    { month: "Apr", score: currentScore - 5, target: 80 },
    { month: "May", score: currentScore - 2, target: 80 },
    { month: "Jun", score: currentScore, target: 80 },
  ];

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Soil Health Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorTarget)"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorScore)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-slate-600">Current Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
          <span className="text-slate-600">Target (80)</span>
        </div>
      </div>
    </div>
  );
};

export default SoilHealthTrend;

