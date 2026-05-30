import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3, Gauge, Database } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { translateSensorType } from "@/utils/sensorLanguageHelpers";
import { translateTrend, translateHealthStatus } from "@/utils/useLocalizedSensorIntegration";
import { HEALTH_STATUS_COLORS } from "@/utils/sensorIntegrationAnalysis";
import type { IntegrationAnalysis, AIInsight } from "@/types/sensor-integration";
import { pageVariants } from "./shared";

interface AIAnalysisDashboardProps {
  analysis: IntegrationAnalysis;
  insights: AIInsight[];
  onContinue: () => void;
}

export const AIAnalysisDashboard = ({ analysis, insights, onContinue }: AIAnalysisDashboardProps) => {
  const { t } = useLanguage();

  const barData = Object.entries(analysis.averageValues).map(([type, data]) => ({
    name: translateSensorType(type, t).slice(0, 12),
    avg: data.value,
    min: analysis.minValues[type] ?? data.value,
    max: analysis.maxValues[type] ?? data.value,
  }));

  const radarData = Object.entries(analysis.averageValues)
    .slice(0, 6)
    .map(([type, data]) => ({
      metric: translateSensorType(type, t).slice(0, 10),
      value: Math.min(100, (data.value / (data.value + 50)) * 100),
    }));

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (trend === "decreasing") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <BarChart3 className="h-3 w-3 mr-1" />
            {t(si.aiAnalysisEngine)}
          </Badge>
          <h2 className="text-2xl font-bold text-slate-800">{t(si.soilIntelligenceDashboard)}</h2>
          <p className="text-sm text-slate-500 mt-1">{t(si.aiAnalysisSubtitle)}</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onContinue}>
          {t(si.viewRecommendations)}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t(si.qualityScore), value: `${analysis.qualityScore}%`, icon: Gauge, color: "text-emerald-600" },
          { label: t(si.dataCompleteness), value: `${analysis.dataCompleteness}%`, icon: Database, color: "text-blue-600" },
          { label: t(si.parameters), value: Object.keys(analysis.averageValues).length, icon: BarChart3, color: "text-purple-600" },
          { label: t(si.insightsLabel), value: insights.length, icon: TrendingUp, color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardContent className="p-4">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t(si.avgMinMax)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="avg" fill="#2e7d32" name={t(si.avg)} radius={[4, 4, 0, 0]} />
                <Bar dataKey="min" fill="#81c784" name={t(si.min)} radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" fill="#1b5e20" name={t(si.max)} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t(si.soilHealthRadar)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Radar dataKey="value" stroke="#2e7d32" fill="#4caf50" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t(si.parameterTrends)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(analysis.trends).map(([type, trend]) => {
              const avg = analysis.averageValues[type];
              return (
                <div key={type} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{translateSensorType(type, t)}</span>
                    {getTrendIcon(trend)}
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {avg?.value ?? "—"}
                    <span className="text-xs font-normal text-slate-400 ml-1">{avg?.unit}</span>
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                    {translateTrend(t, trend)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t(si.aiPoweredInsights)}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="border-slate-200 h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-slate-800">{insight.title}</h4>
                    <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ${HEALTH_STATUS_COLORS[insight.status]}`}>
                      {translateHealthStatus(t, insight.status)}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-[10px] mb-2">
                    {insight.category}
                  </Badge>
                  <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
