import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveSoilHealthPrediction } from "@/services/firebase/reportService";
import { TrendingUp, AlertTriangle, Loader2, Activity, CheckCircle2, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { commonTranslations } from "@/constants/allTranslations";

type PredictionResponse = {
  language: string;
  predictedHealthScore: number;
  predictedParameters: Record<string, number>;
  riskAlerts: string[];
  recommendations: string[];
};

const SoilHealthPrediction = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [region, setRegion] = useState("");
  const [cropName, setCropName] = useState("");
  const [forecastMonths, setForecastMonths] = useState("6");
  const [soilData, setSoilData] = useState({ pH: "", nitrogen: "", phosphorus: "", potassium: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  const handlePredict = async () => {
    if (!region.trim()) {
      toast({
        title: t(commonTranslations.regionRequired),
        description: t(commonTranslations.provideRegion),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);

    try {
      const currentSoilData: Record<string, number> = {};
      if (soilData.pH) currentSoilData.pH = parseFloat(soilData.pH);
      if (soilData.nitrogen) currentSoilData.nitrogen = parseFloat(soilData.nitrogen);
      if (soilData.phosphorus) currentSoilData.phosphorus = parseFloat(soilData.phosphorus);
      if (soilData.potassium) currentSoilData.potassium = parseFloat(soilData.potassium);

      const response = await fetch(buildApiUrl("/api/soil-health-prediction"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          region: region.trim(),
          cropName: cropName.trim() || undefined,
          currentSoilData: Object.keys(currentSoilData).length > 0 ? currentSoilData : undefined,
          forecastPeriodMonths: parseInt(forecastMonths),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<PredictionResponse>(response);
      setPrediction(result);

      // Save to Firebase
      try {
        await saveSoilHealthPrediction({
          language: result.language as any,
          region: region.trim(),
          cropName: cropName.trim() || undefined,
          predictionDate: new Date(),
          forecastPeriodMonths: parseInt(forecastMonths),
          predictedHealthScore: result.predictedHealthScore,
          predictedParameters: result.predictedParameters,
          riskAlerts: result.riskAlerts,
          recommendations: result.recommendations,
        });
      } catch (err) {
        console.error("Failed to save prediction:", err);
      }

      toast({
        title: t(commonTranslations.predictionComplete),
        description: `${t(commonTranslations.predictedHealthScore)}: ${result.predictedHealthScore.toFixed(0)}/100`,
      });
    } catch (error) {
      toast({
        title: t(commonTranslations.errorPredicting),
        description: error instanceof Error ? error.message : t(commonTranslations.errorPredicting),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: t(commonTranslations.excellent), color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" };
    if (score >= 60) return { label: t(commonTranslations.good), color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" };
    if (score >= 40) return { label: t(commonTranslations.fair), color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" };
    return { label: t(commonTranslations.poor), color: "text-red-600", bg: "bg-red-100", border: "border-red-200" };
  };

  return (
    <Layout>
      <PageHero
        title={t(commonTranslations.soilInformation)}
        subtitle={t(commonTranslations.provideCurrentSoilData)}
        icon={AlertTriangle}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>{t(commonTranslations.soilInformation)}</CardTitle>
                <CardDescription>
                  {t(commonTranslations.provideCurrentSoilData)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.region)} *</label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder={t(commonTranslations.regionPlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.cropName)}</label>
                    <Input
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder={t(commonTranslations.cropNamePlaceholder)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t(commonTranslations.forecastPeriod)}
                  </label>
                  <Select value={forecastMonths} onValueChange={setForecastMonths}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 {t(commonTranslations.months)}</SelectItem>
                      <SelectItem value="6">6 {t(commonTranslations.months)}</SelectItem>
                      <SelectItem value="12">12 {t(commonTranslations.months)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.phLevel)}</label>
                    <Input
                      type="number"
                      value={soilData.pH}
                      onChange={(e) => setSoilData({ ...soilData, pH: e.target.value })}
                      placeholder="7.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.nitrogen)}</label>
                    <Input
                      type="number"
                      value={soilData.nitrogen}
                      onChange={(e) => setSoilData({ ...soilData, nitrogen: e.target.value })}
                      placeholder="kg/ha"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.phosphorus)}</label>
                    <Input
                      type="number"
                      value={soilData.phosphorus}
                      onChange={(e) => setSoilData({ ...soilData, phosphorus: e.target.value })}
                      placeholder="kg/ha"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.potassium)}</label>
                    <Input
                      type="number"
                      value={soilData.potassium}
                      onChange={(e) => setSoilData({ ...soilData, potassium: e.target.value })}
                      placeholder="kg/ha"
                    />
                  </div>
                </div>
                <Button
                  onClick={handlePredict}
                  disabled={isLoading || !region.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t(commonTranslations.predicting)}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-5 w-5" />
                      {t(commonTranslations.predictSoilHealth)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {prediction && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Visual Health Score Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={`border-l-4 shadow-md ${getHealthStatus(prediction.predictedHealthScore).border} ${getHealthStatus(prediction.predictedHealthScore).bg.replace('100', '50/50')}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-slate-600">{t(commonTranslations.predictedHealthScore)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full bg-white shadow-sm border ${getHealthStatus(prediction.predictedHealthScore).border}`}>
                          <Activity className={`h-8 w-8 ${getHealthStatus(prediction.predictedHealthScore).color}`} />
                        </div>
                        <div>
                          <span className={`text-4xl font-bold ${getHealthStatus(prediction.predictedHealthScore).color}`}>
                            {prediction.predictedHealthScore.toFixed(0)}
                          </span>
                          <span className="text-slate-400 text-xl font-light">/100</span>
                          <p className={`font-medium ${getHealthStatus(prediction.predictedHealthScore).color}`}>
                            {getHealthStatus(prediction.predictedHealthScore).label} {t(commonTranslations.condition)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-400 shadow-md bg-blue-50/30">
                     <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-slate-600">{t(commonTranslations.forecastOverview)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded border border-blue-100">
                          <span className="text-sm text-slate-500">{t(commonTranslations.forecastPeriod)}</span>
                          <span className="font-bold text-blue-700">{forecastMonths} {t(commonTranslations.months)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border border-blue-100">
                          <span className="text-sm text-slate-500">{t(commonTranslations.region)}</span>
                          <span className="font-bold text-slate-700">{region}</span>
                        </div>
                         {cropName && (
                          <div className="flex justify-between items-center p-2 bg-white rounded border border-blue-100">
                            <span className="text-sm text-slate-500">{t(commonTranslations.crop)}</span>
                            <span className="font-bold text-slate-700">{cropName}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {prediction.riskAlerts.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                        {t(commonTranslations.riskAlerts)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {prediction.riskAlerts.map((alert, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-amber-800 bg-white p-3 rounded border border-amber-100">
                            <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" />
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      {t(sensorTranslations.recommendations)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 gap-3">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-slate-700">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SoilHealthPrediction;
