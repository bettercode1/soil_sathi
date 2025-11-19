import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SoilQualityGaugeProps {
  score: number;
  rating: string;
}

const SoilQualityGauge: React.FC<SoilQualityGaugeProps> = ({ score, rating }) => {
  const getColor = (score: number): string => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#3b82f6"; // blue
    if (score >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getRatingColor = (rating: string): string => {
    const ratingLower = rating.toLowerCase();
    if (ratingLower.includes("excellent") || ratingLower.includes("very good")) {
      return "#10b981";
    } else if (ratingLower.includes("good") || ratingLower.includes("fair")) {
      return "#3b82f6";
    } else if (ratingLower.includes("poor") || ratingLower.includes("needs improvement")) {
      return "#f59e0b";
    }
    return "#ef4444";
  };

  const data = [
    { name: "Score", value: score, fill: getColor(score) },
    { name: "Remaining", value: 100 - score, fill: "#e5e7eb" },
  ];

  const COLORS = [getColor(score), "#e5e7eb"];

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 text-center">Soil Quality Score</h3>
      <ResponsiveContainer width="100%" height={300}>
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
            formatter={(value: number) => [`${value}%`, "Score"]}
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-4xl font-bold"
            fill={getColor(score)}
          >
            {score.toFixed(1)}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-semibold"
            fill={getRatingColor(rating)}
          >
            {rating}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SoilQualityGauge;

