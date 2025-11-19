import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PriceDataPoint {
  date: Date | string;
  price: number;
  unit?: string;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  title?: string;
  description?: string;
  color?: string;
  unit?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  unit = "",
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = data.date instanceof Date ? data.date : new Date(data.date);
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-1">
          {format(date, "MMM dd, yyyy")}
        </p>
        <p className="text-sm text-primary font-semibold flex items-center gap-1">
          <span>₹</span>
          {payload[0].value?.toLocaleString("en-IN")} {unit && `/${unit}`}
        </p>
      </div>
    );
  }
  return null;
};

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  title,
  description,
  color = "hsl(var(--primary))",
  unit = "",
  height = 300,
  showGrid = true,
  className = "",
}) => {
  const chartData = data.map((point) => ({
    date: point.date instanceof Date ? point.date.toISOString() : point.date,
    price: point.price,
    formattedDate:
      point.date instanceof Date
        ? format(point.date, "MMM dd")
        : format(new Date(point.date), "MMM dd"),
  }));

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis
              dataKey="formattedDate"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}${unit ? `/${unit}` : ""}`}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

