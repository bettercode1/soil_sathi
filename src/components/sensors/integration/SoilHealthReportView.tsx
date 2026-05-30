import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  Share2,
  RotateCcw,
  MapPin,
  User,
  Calendar,
  Cpu,
  Leaf,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { mapLanguageToLocale } from "@/constants/languages";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { translateSensorType } from "@/utils/sensorLanguageHelpers";
import { translateHealthStatus } from "@/utils/useLocalizedSensorIntegration";
import type { SoilHealthReportData } from "@/types/sensor-integration";
import { HEALTH_STATUS_COLORS } from "@/utils/sensorIntegrationAnalysis";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { pageVariants } from "./shared";

interface SoilHealthReportViewProps {
  report: SoilHealthReportData;
  onRestart: () => void;
}

const PIE_COLORS = ["#2e7d32", "#4caf50", "#81c784", "#a5d6a7", "#c8e6c9"];

export const SoilHealthReportView = ({ report, onRestart }: SoilHealthReportViewProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const locale = mapLanguageToLocale(language);

  const barData = Object.entries(report.analysis.averageValues).map(([type, data]) => ({
    name: translateSensorType(type, t).slice(0, 12),
    value: data.value,
    unit: data.unit,
  }));

  const scoreData = [
    { name: t(si.healthScore), value: report.soilHealthScore },
    { name: "—", value: 100 - report.soilHealthScore },
  ];

  const formatDate = (iso: string) => new Date(iso).toLocaleString(locale);

  const translatePriorityLabel = (priority: string) => {
    if (priority === "high") return t(si.priorityHigh);
    if (priority === "medium") return t(si.priorityMedium);
    return t(si.priorityLow);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`soil-health-report-${Date.now()}.pdf`);
      toast({ title: t(si.reportDownloaded), description: t(si.pdfSaved) });
    } catch {
      toast({ title: t(si.downloadFailed), description: t(si.pdfFailed), variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadExcel = () => {
    const rows = [
      [t(si.soilHealthAnalysisReport)],
      [t(si.collectionPeriod), formatDate(report.generatedAt)],
      [t(si.farmer), report.farmerName],
      [t(si.location), report.farmLocation],
      [t(si.company), report.companyName],
      [t(si.sensor), report.sensorDetails.name],
      [t(si.healthScore), report.soilHealthScore.toString()],
      [],
      [t(si.parameter), t(si.avg), t(si.min), t(si.max), t(si.unit)],
      ...Object.entries(report.analysis.averageValues).map(([type, data]) => [
        translateSensorType(type, t),
        data.value.toString(),
        (report.analysis.minValues[type] ?? "").toString(),
        (report.analysis.maxValues[type] ?? "").toString(),
        data.unit,
      ]),
      [],
      [t(si.aiRecommendations)],
      ...report.recommendations.map((r) => [r.title, r.message, translatePriorityLabel(r.priority)]),
      [],
      [t(si.cropSuitability)],
      ...report.cropSuggestions.map((c) => [c]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soil-health-report-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: t(si.spreadsheetDownloaded), description: t(si.csvSaved) });
  };

  const handleShare = async () => {
    const text = `${t(si.soilHealthReport)} — ${t(si.healthScore)}: ${report.soilHealthScore}/100 | ${report.companyName} | ${report.farmLocation}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t(si.soilHealthReport), text });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: t(si.copiedClipboard), description: t(si.reportCopied) });
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <Award className="h-3 w-3 mr-1" />
            {t(si.finalReport)}
          </Badge>
          <h2 className="text-2xl font-bold text-slate-800">{t(si.soilHealthReport)}</h2>
          <p className="text-sm text-slate-500 mt-1">{t(si.reportSubtitle)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t(si.newDemo)}
          </Button>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            {t(si.downloadExcel)}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            {t(si.shareReport)}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleDownloadPDF} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-1" />
            {isDownloading ? t(si.generating) : t(si.downloadPdf)}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="report-unicode bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-green-600 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">{t(si.soilSathiPlatform)}</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">{t(si.soilHealthAnalysisReport)}</h3>
              <p className="text-emerald-100 text-sm mt-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(report.generatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <span className="text-3xl font-bold">{report.soilHealthScore}</span>
                </div>
                <p className="text-xs text-emerald-100 mt-1">{t(si.healthScore)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: User, label: t(si.farmer), value: report.farmerName },
              { icon: MapPin, label: t(si.location), value: report.farmLocation },
              { icon: Cpu, label: t(si.company), value: report.companyName },
              { icon: Cpu, label: t(si.sensor), value: report.sensorDetails.name },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <p className="font-semibold text-sm text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">{t(si.sensorReadingsSummary)}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-slate-500 font-medium">{t(si.parameter)}</th>
                      <th className="text-right py-2 text-slate-500 font-medium">{t(si.avg)}</th>
                      <th className="text-right py-2 text-slate-500 font-medium">{t(si.min)}</th>
                      <th className="text-right py-2 text-slate-500 font-medium">{t(si.max)}</th>
                      <th className="text-right py-2 text-slate-500 font-medium">{t(si.unit)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.analysis.averageValues).map(([type, data]) => (
                      <tr key={type} className="border-b border-slate-50">
                        <td className="py-2 text-slate-700">{translateSensorType(type, t)}</td>
                        <td className="py-2 text-right font-medium">{data.value}</td>
                        <td className="py-2 text-right text-slate-500">{report.analysis.minValues[type]}</td>
                        <td className="py-2 text-right text-slate-500">{report.analysis.maxValues[type]}</td>
                        <td className="py-2 text-right text-slate-400">{data.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-slate-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">{t(si.parameterValues)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      <Bar dataKey="value" fill="#2e7d32" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">{t(si.healthScore)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={scoreData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                        {scoreData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              {t(si.analysisSummary)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.insights.map((insight) => (
                <div key={insight.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{insight.title}</span>
                    <Badge variant="outline" className={`text-[10px] ${HEALTH_STATUS_COLORS[insight.status]}`}>
                      {translateHealthStatus(t, insight.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-slate-800 mb-3">{t(si.aiRecommendations)}</h4>
            <div className="space-y-2">
              {report.recommendations.map((rec) => (
                <div key={rec.id} className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30">
                  <p className="text-sm font-medium text-slate-800">{rec.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-3">{t(si.cropSuitability)}</h4>
            <div className="flex flex-wrap gap-2">
              {report.cropSuggestions.map((crop) => (
                <Badge key={crop} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {crop}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {t(si.reportFooter)} · {report.companyName}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t(si.collectionPeriod)}: {formatDate(report.collection.startTime)} —{" "}
              {report.collection.endTime ? formatDate(report.collection.endTime) : "—"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
