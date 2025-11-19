import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface HealthScoreGaugeProps {
  score: number;
  title?: string;
}

const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ score, title = "Health Score" }) => {
  const getColor = (score: number): string => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#3b82f6"; // blue
    if (score >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6" />;
    if (score >= 60) return <TrendingUp className="h-6 w-6" />;
    return <AlertTriangle className="h-6 w-6" />;
  };

  const color = getColor(score);
  const icon = getIcon(score);

  const data = [
    { name: "Score", value: score, fill: color },
    { name: "Remaining", value: 100 - score, fill: "#e5e7eb" },
  ];

  const COLORS = [color, "#e5e7eb"];

  return (
    <div className="chart-container bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value}/100`, "Score"]}
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-3xl font-bold"
            fill={color}
          >
            {score.toFixed(0)}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-medium"
            fill="#6b7280"
          >
            / 100
          </text>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2" style={{ color }}>
          {icon}
          <p className="text-sm font-semibold text-slate-700">
            {score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Improvement"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreGauge;

