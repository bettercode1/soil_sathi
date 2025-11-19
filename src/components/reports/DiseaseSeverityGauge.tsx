import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";

interface DiseaseSeverityGaugeProps {
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  diseaseName: string;
}

const DiseaseSeverityGauge: React.FC<DiseaseSeverityGaugeProps> = ({ severity, confidence, diseaseName }) => {
  const getSeverityValue = (severity: string): number => {
    switch (severity) {
      case "low": return 25;
      case "medium": return 50;
      case "high": return 75;
      case "critical": return 100;
      default: return 0;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "low": return "#10b981"; // green
      case "medium": return "#f59e0b"; // amber
      case "high": return "#f97316"; // orange
      case "critical": return "#ef4444"; // red
      default: return "#6b7280";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low": return <CheckCircle className="h-6 w-6" />;
      case "medium": return <Shield className="h-6 w-6" />;
      case "high": return <AlertTriangle className="h-6 w-6" />;
      case "critical": return <AlertTriangle className="h-8 w-8" />;
      default: return null;
    }
  };

  const severityValue = getSeverityValue(severity);
  const color = getSeverityColor(severity);
  const icon = getSeverityIcon(severity);

  const data = [
    { name: "Severity", value: severityValue, fill: color },
    { name: "Remaining", value: 100 - severityValue, fill: "#e5e7eb" },
  ];

  const COLORS = [color, "#e5e7eb"];

  return (
    <div className="chart-container bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 text-center">Disease Severity</h3>
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
            formatter={(value: number) => [`${value}%`, "Severity"]}
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-2xl font-bold"
            fill={color}
          >
            {severity.toUpperCase()}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-medium"
            fill="#6b7280"
          >
            {confidence}% Confidence
          </text>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-700" style={{ color }}>
          {icon}
          <p className="text-sm font-semibold">{diseaseName}</p>
        </div>
      </div>
    </div>
  );
};

export default DiseaseSeverityGauge;

