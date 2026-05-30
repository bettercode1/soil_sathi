import { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { translateSensorType } from "@/utils/sensorLanguageHelpers";
import { mapLanguageToLocale } from "@/constants/languages";
import type { SensorReading } from "@/types/sensor-data";

interface LiveSensorChartsProps {
  readings: SensorReading[];
  activeTypes: string[];
}

const CHART_COLORS = ["#2e7d32", "#1565c0", "#e65100", "#6a1b9a", "#00695c"];

export const LiveSensorCharts = ({ readings, activeTypes }: LiveSensorChartsProps) => {
  const { t, language } = useLanguage();

  const chartData = useMemo(() => {
    const locale = mapLanguageToLocale(language);
    const timeMap = new Map<string, Record<string, number | string>>();

    readings.forEach((reading) => {
      const time = new Date(reading.timestamp).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const existing = timeMap.get(time) ?? { time };
      existing[reading.sensorType] = reading.value;
      timeMap.set(time, existing);
    });

    return Array.from(timeMap.values()).slice(-20);
  }, [readings, language]);

  if (chartData.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center text-slate-500">{t(si.waitingReadings)}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">{t(si.realTimeTrends)}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => translateSensorType(String(value), t)} />
              {activeTypes.slice(0, 5).map((type, i) => (
                <Line key={type} type="monotone" dataKey={type} name={type} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} isAnimationActive />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">{t(si.moistureTemperature)}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => translateSensorType(String(value), t)} />
              {["moisture", "temperature", "humidity"].map((type) => (
                <Area
                  key={type}
                  type="monotone"
                  dataKey={type}
                  name={type}
                  stackId="1"
                  stroke={type === "moisture" ? "#1565c0" : type === "temperature" ? "#e65100" : "#00695c"}
                  fill={type === "moisture" ? "#1565c0" : type === "temperature" ? "#e65100" : "#00695c"}
                  fillOpacity={0.15}
                  isAnimationActive
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
