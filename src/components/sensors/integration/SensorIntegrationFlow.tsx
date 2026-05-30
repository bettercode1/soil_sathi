import { useState, useCallback, useMemo } from "react";
import { IntegrationPlatformHeader } from "./IntegrationPlatformHeader";
import { GsapPageTransition } from "./GsapPageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import type { IntegrationStep, SensorCompany, CompanySensor, SoilHealthReportData } from "@/types/sensor-integration";
import type { SensorDataCollection } from "@/types/sensor-data";
import { SENSOR_COMPANIES } from "@/data/sensorCompanies";
import { NORTHEAST_SENSOR_COMPANIES } from "@/data/northeastSensorCompanies";
import { buildIntegrationAnalysis, calculateSoilHealthScore } from "@/utils/sensorIntegrationAnalysis";
import {
  useLocalizedSensorIntegration,
  getDemoFarmerName,
  getDemoFarmLocation,
} from "@/utils/useLocalizedSensorIntegration";
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

  const stepContent = (() => {
    switch (step) {
      case "company-selection":
        return (
          <CompanySelection
            nationalCompanies={SENSOR_COMPANIES}
            northeastCompanies={NORTHEAST_SENSOR_COMPANIES}
            onSelect={handleSelectCompany}
          />
        );
      case "sensor-listing":
        return company ? (
          <SensorListing
            company={company}
            onBack={() => {
              setCompany(null);
              setStep("company-selection");
            }}
            onConnect={handleConnectSensor}
          />
        ) : null;
      case "live-collection":
        return company && sensor ? (
          <LiveDataDashboard
            company={company}
            sensor={sensor}
            onBack={() => setStep("sensor-listing")}
            onComplete={handleCollectionComplete}
          />
        ) : null;
      case "data-processing":
        return <DataProcessingPipeline onComplete={() => setStep("ai-analysis")} />;
      case "ai-analysis":
        return analysis ? (
          <AIAnalysisDashboard
            analysis={analysis}
            insights={insights}
            onContinue={() => setStep("recommendations")}
          />
        ) : null;
      case "recommendations":
        return (
          <AIRecommendationsPanel
            recommendations={recommendations}
            onContinue={() => setStep("final-report")}
          />
        );
      case "final-report":
        return report ? <SoilHealthReportView report={report} onRestart={handleRestart} /> : null;
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-6">
      <IntegrationPlatformHeader currentStep={step} />

      <GsapPageTransition stepKey={`${step}-${language}`}>{stepContent}</GsapPageTransition>
    </div>
  );
};
