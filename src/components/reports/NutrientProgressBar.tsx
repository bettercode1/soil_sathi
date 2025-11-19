import React from "react";

interface NutrientProgressBarProps {
  label: string;
  value: number;
  status: string;
  optimalMin: number;
  optimalMax: number;
  unit?: string;
}

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("low") || statusLower.includes("deficient")) {
    return "bg-red-500";
  } else if (statusLower.includes("high") || statusLower.includes("excess")) {
    return "bg-amber-500";
  } else if (statusLower.includes("optimal") || statusLower.includes("good") || statusLower.includes("adequate")) {
    return "bg-green-500";
  } else if (statusLower.includes("moderate") || statusLower.includes("medium")) {
    return "bg-blue-500";
  }
  return "bg-gray-500";
};

const getStatusTextColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("low") || statusLower.includes("deficient")) {
    return "text-red-600";
  } else if (statusLower.includes("high") || statusLower.includes("excess")) {
    return "text-amber-600";
  } else if (statusLower.includes("optimal") || statusLower.includes("good") || statusLower.includes("adequate")) {
    return "text-green-600";
  } else if (statusLower.includes("moderate") || statusLower.includes("medium")) {
    return "text-blue-600";
  }
  return "text-gray-600";
};

const NutrientProgressBar: React.FC<NutrientProgressBarProps> = ({
  label,
  value,
  status,
  optimalMin,
  optimalMax,
  unit = "",
}) => {
  const range = optimalMax - optimalMin;
  const center = optimalMin + range / 2;
  const maxValue = Math.max(optimalMax * 1.2, value);
  const percentage = Math.min((value / maxValue) * 100, 100);
  const optimalStart = (optimalMin / maxValue) * 100;
  const optimalEnd = (optimalMax / maxValue) * 100;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">{value}{unit}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusTextColor(status)} ${getStatusColor(status).replace('-500', '-100')}`}>
              {status}
            </span>
          </div>
        </div>
      )}
      {!label && (
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-xs font-bold text-slate-700">{value}{unit}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusTextColor(status)} ${getStatusColor(status).replace('-500', '-100')}`}>
            {status}
          </span>
        </div>
      )}
      <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden nutrient-indicator">
        {/* Optimal Range Indicator */}
        <div
          className="absolute h-full bg-green-200 opacity-30"
          style={{
            left: `${optimalStart}%`,
            width: `${optimalEnd - optimalStart}%`,
          }}
        />
        {/* Current Value Bar */}
        <div
          className={`h-full ${getStatusColor(status)} progress-animate rounded-lg transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
        {/* Value Marker */}
        <div
          className="absolute top-0 h-full w-1 bg-slate-900 opacity-50"
          style={{ left: `${percentage}%` }}
        />
        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-slate-600">
          <span>0{unit}</span>
          <span className="text-green-600 font-semibold">Optimal: {optimalMin}-{optimalMax}{unit}</span>
          <span>{Math.round(maxValue)}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default NutrientProgressBar;

