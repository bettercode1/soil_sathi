import type { IntegrationStep } from "@/types/sensor-integration";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";

export const STEP_LABEL_KEYS: Record<IntegrationStep, keyof typeof si> = {
  "company-selection": "stepSelectCompany",
  "sensor-listing": "stepViewSensors",
  "live-collection": "stepCollectData",
  "data-processing": "stepProcess",
  "ai-analysis": "stepAiAnalysis",
  recommendations: "stepRecommendations",
  "final-report": "stepReport",
};

export const INTEGRATION_STEP_ORDER: IntegrationStep[] = [
  "company-selection",
  "sensor-listing",
  "live-collection",
  "data-processing",
  "ai-analysis",
  "recommendations",
  "final-report",
];

export const stepIndex = (step: IntegrationStep): number =>
  INTEGRATION_STEP_ORDER.findIndex((s) => s === step);
