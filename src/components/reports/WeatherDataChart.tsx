import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherDataChartProps {
  temperature: number;
  humidity: number;
  precipitation?: number;
  windSpeed?: number;
}

const WeatherDataChart: React.FC<WeatherDataChartProps> = ({ 
  temperature, 
  humidity, 
  precipitation, 
  windSpeed 
}) => {
  // Create data points for visualization
  const chartData = [
    {
      name: "Temperature",
      value: temperature,
      unit: "°C",
      icon: "🌡️",
    },
    {
      name: "Humidity",
      value: humidity,
      unit: "%",
      icon: "💧",
    },
    ...(precipitation !== undefined ? [{
      name: "Precipitation",
      value: precipitation,
      unit: "mm",
      icon: "🌧️",
    }] : []),
    ...(windSpeed !== undefined ? [{
      name: "Wind Speed",
      value: windSpeed,
      unit: "km/h",
      icon: "💨",
    }] : []),
  ];

  return (
    <div className="chart-container bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Weather Data Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#6b7280" }}
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
                  <p className="font-semibold text-slate-900">
                    {props.payload.icon} {props.payload.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-bold text-lg">{value}</span>{" "}
                    <span className="text-slate-600">{props.payload.unit}</span>
                  </p>
                </div>,
                ""
              ];
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#3b82f6">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={
                entry.name === "Temperature" ? "#ef4444" :
                entry.name === "Humidity" ? "#3b82f6" :
                entry.name === "Precipitation" ? "#06b6d4" :
                "#8b5cf6"
              } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
          <Thermometer className="h-5 w-5 text-red-600 mx-auto mb-1" />
          <p className="text-xs text-red-600 mb-1">Temperature</p>
          <p className="text-lg font-bold text-red-900">{temperature}°C</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
          <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-blue-600 mb-1">Humidity</p>
          <p className="text-lg font-bold text-blue-900">{humidity}%</p>
        </div>
        {precipitation !== undefined && (
          <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200 text-center">
            <Cloud className="h-5 w-5 text-cyan-600 mx-auto mb-1" />
            <p className="text-xs text-cyan-600 mb-1">Precipitation</p>
            <p className="text-lg font-bold text-cyan-900">{precipitation}mm</p>
          </div>
        )}
        {windSpeed !== undefined && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">
            <Wind className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-purple-600 mb-1">Wind Speed</p>
            <p className="text-lg font-bold text-purple-900">{windSpeed} km/h</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDataChart;

