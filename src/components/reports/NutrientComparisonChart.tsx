import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface NutrientComparisonData {
  parameter: string;
  current: number;
  optimal: number;
}

interface NutrientComparisonChartProps {
  data: NutrientComparisonData[];
}

const NutrientComparisonChart: React.FC<NutrientComparisonChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    parameter: item.parameter,
    current: item.current,
    optimal: item.optimal,
  }));

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Nutrient Levels vs Optimal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="parameter" 
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 'dataMax']}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Radar
            name="Optimal"
            dataKey="optimal"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px",
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NutrientComparisonChart;

