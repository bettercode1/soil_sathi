import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface NutrientData {
  parameter: string;
  value: number;
  status: string;
  optimalMin: number;
  optimalMax: number;
}

interface NutrientChartProps {
  data: NutrientData[];
}

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("low") || statusLower.includes("deficient")) {
    return "#ef4444"; // red
  } else if (statusLower.includes("high") || statusLower.includes("excess")) {
    return "#f59e0b"; // amber
  } else if (statusLower.includes("optimal") || statusLower.includes("good") || statusLower.includes("adequate")) {
    return "#10b981"; // green
  } else if (statusLower.includes("moderate") || statusLower.includes("medium")) {
    return "#3b82f6"; // blue
  }
  return "#6b7280"; // gray
};

const NutrientChart: React.FC<NutrientChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.parameter,
    value: item.value,
    optimalMin: item.optimalMin,
    optimalMax: item.optimalMax,
    status: item.status,
  }));

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Nutrient Levels Overview</h3>
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
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px",
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === "value") {
                return [
                  <div key="tooltip">
                    <p className="font-semibold">{props.payload.name}</p>
                    <p className="text-sm">Value: <span className="font-bold">{value}</span></p>
                    <p className="text-sm">Status: <span className="font-semibold" style={{ color: getStatusColor(props.payload.status) }}>{props.payload.status}</span></p>
                    <p className="text-xs text-slate-500">Optimal Range: {props.payload.optimalMin} - {props.payload.optimalMax}</p>
                  </div>,
                  ""
                ];
              }
              return [value, name];
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NutrientChart;

