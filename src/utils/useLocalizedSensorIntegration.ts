import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationSet } from "@/constants/languages";
import type { IntegrationAnalysis, AIInsight, AIRecommendation } from "@/types/sensor-integration";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { interpolateTranslation } from "@/utils/interpolateTranslation";

type TranslateFn = (translations: TranslationSet) => string;

const getAvg = (analysis: IntegrationAnalysis, type: string): number => {
  const entry = analysis.averageValues[type];
  return entry?.value ?? 0;
};

export function useLocalizedSensorIntegration(analysis: IntegrationAnalysis | null) {
  const { t, language } = useLanguage();

  const insights = useMemo((): AIInsight[] => {
    if (!analysis) return [];
    return buildLocalizedInsights(analysis, t);
  }, [analysis, language]);

  const recommendations = useMemo((): AIRecommendation[] => {
    if (!analysis) return [];
    return buildLocalizedRecommendations(analysis, t);
  }, [analysis, language]);

  const cropSuggestions = useMemo((): string[] => {
    if (!analysis) return [];
    return buildLocalizedCrops(analysis, t);
  }, [analysis, language]);

  return { insights, recommendations, cropSuggestions, t, language };
}

function statusFromScore(score: number): AIInsight["status"] {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "moderate";
  if (score >= 40) return "poor";
  return "critical";
}

export function buildLocalizedInsights(
  analysis: IntegrationAnalysis,
  t: TranslateFn,
): AIInsight[] {
  const pH = getAvg(analysis, "pH") || 7;
  const moisture = getAvg(analysis, "moisture") || 50;
  const nitrogen = getAvg(analysis, "nitrogen") || 250;
  const phosphorus = getAvg(analysis, "phosphorus") || 25;
  const potassium = getAvg(analysis, "potassium") || 200;
  const organic = getAvg(analysis, "organic_matter") || 2;
  const salinity = getAvg(analysis, "salinity") || 1;

  const phScore = pH >= 6.5 && pH <= 7.5 ? 90 : pH >= 6.0 && pH <= 8.0 ? 70 : 45;
  const moistureScore = moisture >= 40 && moisture <= 60 ? 88 : moisture >= 30 && moisture <= 70 ? 65 : 40;
  const fertilityScore = Math.round(
    ((nitrogen >= 200 ? 85 : 65) + (phosphorus >= 25 ? 85 : 65) + (potassium >= 180 ? 85 : 65)) / 3,
  );
  const salinityScore = salinity <= 1.5 ? 90 : salinity <= 3 ? 60 : 35;
  const organicScore = organic >= 3 ? 90 : organic >= 1.5 ? 70 : 45;

  const vars = {
    pH: pH.toFixed(1),
    moisture: moisture.toFixed(0),
    nitrogen: nitrogen.toFixed(0),
    phosphorus: phosphorus.toFixed(0),
    potassium: potassium.toFixed(0),
    organic: organic.toFixed(1),
    salinity: salinity.toFixed(1),
  };

  const phDescKey =
    pH >= 6.5 && pH <= 7.5
      ? "insightPhOptimal"
      : pH < 6.5
        ? "insightPhAcidic"
        : "insightPhAlkaline";

  const moistureDescKey =
    moisture < 40 ? "insightMoistureLow" : moisture > 65 ? "insightMoistureHigh" : "insightMoistureOptimal";

  const nutrientDescKey =
    nitrogen < 200 || phosphorus < 20 || potassium < 150
      ? "insightNutrientDeficient"
      : "insightNutrientBalanced";

  const fertilityDescKey = fertilityScore >= 80 ? "insightFertilityGood" : "insightFertilityModerate";
  const salinityDescKey = salinity <= 1.5 ? "insightSalinityLow" : "insightSalinityModerate";
  const organicDescKey =
    organic >= 3 ? "insightOrganicGood" : organic >= 1.5 ? "insightOrganicModerate" : "insightOrganicLow";

  return [
    {
      id: "ph-status",
      title: t(si.insightPhTitle),
      description: interpolateTranslation(t(si[phDescKey as keyof typeof si] as TranslationSet), vars),
      status: statusFromScore(phScore),
      category: t(si.categoryChemical),
    },
    {
      id: "irrigation",
      title: t(si.insightIrrigationTitle),
      description: interpolateTranslation(t(si[moistureDescKey as keyof typeof si] as TranslationSet), vars),
      status: statusFromScore(moistureScore),
      category: t(si.categoryWater),
    },
    {
      id: "nutrient-deficiency",
      title: t(si.insightNutrientTitle),
      description: interpolateTranslation(t(si[nutrientDescKey as keyof typeof si] as TranslationSet), vars),
      status: statusFromScore(fertilityScore),
      category: t(si.categoryNutrients),
    },
    {
      id: "fertility",
      title: t(si.insightFertilityTitle),
      description: t(si[fertilityDescKey as keyof typeof si] as TranslationSet),
      status: statusFromScore(fertilityScore),
      category: t(si.categoryFertility),
    },
    {
      id: "salinity",
      title: t(si.insightSalinityTitle),
      description: interpolateTranslation(t(si[salinityDescKey as keyof typeof si] as TranslationSet), vars),
      status: statusFromScore(salinityScore),
      category: t(si.categorySalinity),
    },
    {
      id: "organic-matter",
      title: t(si.insightOrganicTitle),
      description: interpolateTranslation(t(si[organicDescKey as keyof typeof si] as TranslationSet), vars),
      status: statusFromScore(organicScore),
      category: t(si.categoryOrganic),
    },
  ];
}

export function buildLocalizedRecommendations(
  analysis: IntegrationAnalysis,
  t: TranslateFn,
): AIRecommendation[] {
  const pH = getAvg(analysis, "pH") || 7;
  const moisture = getAvg(analysis, "moisture") || 50;
  const nitrogen = getAvg(analysis, "nitrogen") || 250;
  const phosphorus = getAvg(analysis, "phosphorus") || 25;
  const organic = getAvg(analysis, "organic_matter") || 2;
  const salinity = getAvg(analysis, "salinity") || 1;

  const recs: AIRecommendation[] = [];

  if (moisture < 45) {
    recs.push({
      id: "irrigation-rec",
      title: t(si.recIrrigationTitle),
      message: t(si.recIrrigationMsg),
      priority: "high",
      category: t(si.categoryWaterManagement),
    });
  }
  if (nitrogen < 220) {
    recs.push({
      id: "nitrogen-rec",
      title: t(si.recNitrogenTitle),
      message: t(si.recNitrogenMsg),
      priority: "high",
      category: t(si.categoryFertilizer),
    });
  }
  if (pH >= 6.5 && pH <= 7.5) {
    recs.push({
      id: "ph-rec",
      title: t(si.recPhTitle),
      message: t(si.recPhMsg),
      priority: "low",
      category: t(si.categoryCropPlanning),
    });
  }
  if (phosphorus < 25) {
    recs.push({
      id: "phosphorus-rec",
      title: t(si.recPhosphorusTitle),
      message: t(si.recPhosphorusMsg),
      priority: "medium",
      category: t(si.categoryFertilizer),
    });
  }
  if (organic < 2.5) {
    recs.push({
      id: "organic-rec",
      title: t(si.recOrganicTitle),
      message: t(si.recOrganicMsg),
      priority: "medium",
      category: t(si.categorySoilHealth),
    });
  }
  if (salinity > 1.5) {
    recs.push({
      id: "salinity-rec",
      title: t(si.recSalinityTitle),
      message: t(si.recSalinityMsg),
      priority: "high",
      category: t(si.categorySalinity),
    });
  }
  recs.push({
    id: "monitor-rec",
    title: t(si.recMonitorTitle),
    message: t(si.recMonitorMsg),
    priority: "low",
    category: t(si.categoryMonitoring),
  });

  return recs;
}

export function buildLocalizedCrops(analysis: IntegrationAnalysis, t: TranslateFn): string[] {
  const pH = getAvg(analysis, "pH") || 7;
  const moisture = getAvg(analysis, "moisture") || 50;
  const salinity = getAvg(analysis, "salinity") || 1;

  const crops: string[] = [];
  if (pH >= 6.0 && pH <= 7.5 && salinity < 2) {
    crops.push(t(si.cropRice), t(si.cropWheat), t(si.cropMaize));
  }
  if (pH >= 6.5 && pH <= 8.0) {
    crops.push(t(si.cropCotton), t(si.cropSugarcane));
  }
  if (moisture >= 35 && moisture <= 55) {
    crops.push(t(si.cropPulses), t(si.cropGroundnut));
  }
  if (salinity > 1.5) {
    crops.push(t(si.cropBarleySalt), t(si.cropMustard));
  }
  return crops.length ? crops : [t(si.cropRice), t(si.cropWheat), t(si.cropVegetables)];
}

export function translateTrend(t: TranslateFn, trend: string): string {
  if (trend === "increasing") return t(si.trendIncreasing);
  if (trend === "decreasing") return t(si.trendDecreasing);
  return t(si.trendStable);
}

export function translateHealthStatus(t: TranslateFn, status: string): string {
  const key = `status${status.charAt(0).toUpperCase()}${status.slice(1)}` as keyof typeof si;
  if (si[key]) return t(si[key] as TranslationSet);
  return status;
}

export function translatePriority(t: TranslateFn, priority: string): string {
  if (priority === "high") return t(si.priorityHigh);
  if (priority === "medium") return t(si.priorityMedium);
  return t(si.priorityLow);
}

export function getCompanyDescription(companyId: string, t: TranslateFn): string {
  const key = `companyDesc${companyId.charAt(0).toUpperCase()}${companyId.slice(1)}` as keyof typeof si;
  if (si[key]) return t(si[key] as TranslationSet);
  return "";
}

const STATE_KEY_MAP: Record<string, keyof typeof si> = {
  Assam: "stateAssam",
  Meghalaya: "stateMeghalaya",
  Manipur: "stateManipur",
  Mizoram: "stateMizoram",
  Nagaland: "stateNagaland",
  Tripura: "stateTripura",
  "Arunachal Pradesh": "stateArunachal",
  Sikkim: "stateSikkim",
};

const PARTNER_TYPE_KEY_MAP: Record<string, keyof typeof si> = {
  "Agricultural Research Institution": "partnerTypeResearch",
  "Research & Innovation Partner": "partnerTypeInnovation",
  "AgriTech Partner": "partnerTypeAgriTech",
  "Agriculture Technology Partner": "partnerTypeAgTech",
  "Government Agriculture Program": "partnerTypeGovProgram",
  "Agriculture Research Partner": "partnerTypeAgResearch",
  "Agriculture Innovation Partner": "partnerTypeAgInnovation",
  "Research Partner": "partnerTypeResearchPartner",
  "Organic Farming Technology Partner": "partnerTypeOrganic",
};

export function getStateLabel(state: string, t: TranslateFn): string {
  const key = STATE_KEY_MAP[state];
  return key ? t(si[key] as TranslationSet) : state;
}

export function getPartnerTypeLabel(partnerType: string | undefined, t: TranslateFn): string {
  if (!partnerType) return "";
  const key = PARTNER_TYPE_KEY_MAP[partnerType];
  return key ? t(si[key] as TranslationSet) : partnerType;
}

export function getDemoFarmerName(t: TranslateFn): string {
  return t(si.demoFarmerName);
}

export function getDemoFarmLocation(t: TranslateFn): string {
  return t(si.demoFarmLocation);
}
