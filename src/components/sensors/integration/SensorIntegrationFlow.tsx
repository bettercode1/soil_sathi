import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Radio, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import type { IntegrationStep, SensorCompany, CompanySensor, SoilHealthReportData } from "@/types/sensor-integration";
import type { SensorDataCollection } from "@/types/sensor-data";
import { SENSOR_COMPANIES } from "@/data/sensorCompanies";
import { buildIntegrationAnalysis, calculateSoilHealthScore } from "@/utils/sensorIntegrationAnalysis";
import {
  useLocalizedSensorIntegration,
  getDemoFarmerName,
  getDemoFarmLocation,
} from "@/utils/useLocalizedSensorIntegration";
import { FlowStepper } from "./shared";
import { CompanySelection } from "./CompanySelection";
import { SensorListing } from "./SensorListing";
import { LiveDataDashboard } from "./LiveDataDashboard";
import { DataProcessingPipeline } from "./DataProcessingPipeline";
import { AIAnalysisDashboard } from "./AIAnalysisDashboard";
import { AIRecommendationsPanel } from "./AIRecommendationsPanel";
import { SoilHealthReportView } from "./SoilHealthReportView";

export const SensorIntegrationFlow = () => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<IntegrationStep>("company-selection");
  const [company, setCompany] = useState<SensorCompany | null>(null);
  const [sensor, setSensor] = useState<CompanySensor | null>(null);
  const [collection, setCollection] = useState<SensorDataCollection | null>(null);

  const analysis = useMemo(
    () => (collection ? buildIntegrationAnalysis(collection) : null),
    [collection],
  );

  const { insights, recommendations, cropSuggestions } = useLocalizedSensorIntegration(analysis);

  const report: SoilHealthReportData | null = useMemo(() => {
    if (!collection || !analysis || !company || !sensor) return null;
    return {
      farmerName: getDemoFarmerName(t),
      farmLocation: collection.location.address ?? getDemoFarmLocation(t),
      companyName: company.name,
      sensorDetails: sensor,
      collection,
      analysis,
      insights,
      recommendations,
      soilHealthScore: calculateSoilHealthScore(analysis),
      cropSuggestions,
      generatedAt: new Date().toISOString(),
    };
  }, [collection, analysis, company, sensor, insights, recommendations, cropSuggestions, t, language]);

  const handleSelectCompany = useCallback((selected: SensorCompany) => {
    setCompany(selected);
    setSensor(null);
    setCollection(null);
    setStep("sensor-listing");
  }, []);

  const handleConnectSensor = useCallback((selected: CompanySensor) => {
    setSensor(selected);
    setCollection(null);
    setStep("live-collection");
  }, []);

  const handleCollectionComplete = useCallback((data: SensorDataCollection) => {
    setCollection(data);
    setStep("data-processing");
  }, []);

  const handleRestart = useCallback(() => {
    setStep("company-selection");
    setCompany(null);
    setSensor(null);
    setCollection(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <Wifi className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800">
                {t(si.platformTitle)}
              </h1>
              <p className="text-xs text-slate-500">{t(si.platformSubtitle)}</p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200">
            <Radio className="h-3 w-3 mr-1 animate-pulse" />
            {t(si.demoMode)}
          </Badge>
        </div>
        <FlowStepper currentStep={step} />
      </div>

      <AnimatePresence mode="wait">
        {step === "company-selection" && (
          <CompanySelection key={`companies-${language}`} companies={SENSOR_COMPANIES} onSelect={handleSelectCompany} />
        )}

        {step === "sensor-listing" && company && (
          <SensorListing
            key={`sensors-${language}`}
            company={company}
            onBack={() => {
              setCompany(null);
              setStep("company-selection");
            }}
            onConnect={handleConnectSensor}
          />
        )}

        {step === "live-collection" && company && sensor && (
          <LiveDataDashboard
            key={`live-${language}`}
            company={company}
            sensor={sensor}
            onBack={() => setStep("sensor-listing")}
            onComplete={handleCollectionComplete}
          />
        )}

        {step === "data-processing" && (
          <DataProcessingPipeline key={`pipeline-${language}`} onComplete={() => setStep("ai-analysis")} />
        )}

        {step === "ai-analysis" && analysis && (
          <AIAnalysisDashboard
            key={`analysis-${language}`}
            analysis={analysis}
            insights={insights}
            onContinue={() => setStep("recommendations")}
          />
        )}

        {step === "recommendations" && (
          <AIRecommendationsPanel
            key={`recs-${language}`}
            recommendations={recommendations}
            onContinue={() => setStep("final-report")}
          />
        )}

        {step === "final-report" && report && (
          <SoilHealthReportView key={`report-${language}`} report={report} onRestart={handleRestart} />
        )}
      </AnimatePresence>
    </div>
  );
};
