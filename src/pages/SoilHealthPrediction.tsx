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
import { TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { commonTranslations } from "@/constants/allTranslations";
import HealthScoreGauge from "@/components/reports/HealthScoreGauge";

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
                    <label className="text-sm font-medium">pH</label>
                    <Input
                      type="number"
                      value={soilData.pH}
                      onChange={(e) => setSoilData({ ...soilData, pH: e.target.value })}
                      placeholder="7.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nitrogen (N)</label>
                    <Input
                      type="number"
                      value={soilData.nitrogen}
                      onChange={(e) => setSoilData({ ...soilData, nitrogen: e.target.value })}
                      placeholder="kg/ha"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phosphorus (P)</label>
                    <Input
                      type="number"
                      value={soilData.phosphorus}
                      onChange={(e) => setSoilData({ ...soilData, phosphorus: e.target.value })}
                      placeholder="kg/ha"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Potassium (K)</label>
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t(commonTranslations.predicting)}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {t(commonTranslations.predictSoilHealth)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {prediction && (
              <div className="space-y-6">
                {/* Visual Health Score Chart */}
                <HealthScoreGauge 
                  score={prediction.predictedHealthScore} 
                  title="Predicted Health Score"
                />

                {prediction.riskAlerts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Risk Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        {prediction.riskAlerts.map((alert, idx) => (
                          <li key={idx} className="text-amber-600">{alert}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
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

