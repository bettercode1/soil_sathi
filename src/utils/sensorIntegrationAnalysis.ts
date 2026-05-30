import type { SensorDataCollection, SensorType } from "@/types/sensor-data";
import type {
  IntegrationAnalysis,
  AIInsight,
  AIRecommendation,
  HealthStatus,
} from "@/types/sensor-integration";

const DEMO_VALUES: Record<SensorType, number> = {
  pH: 6.8,
  moisture: 48,
  temperature: 29,
  nitrogen: 245,
  phosphorus: 35,
  potassium: 210,
  organic_matter: 3.8,
  ec: 1.2,
  salinity: 0.8,
  humidity: 71,
};

export const buildIntegrationAnalysis = (
  collection: SensorDataCollection
): IntegrationAnalysis => {
  const readingsByType = new Map<string, { values: number[]; unit: string }>();

  collection.readings.forEach((reading) => {
    const existing = readingsByType.get(reading.sensorType) ?? { values: [], unit: reading.unit };
    existing.values.push(reading.value);
    existing.unit = reading.unit;
    readingsByType.set(reading.sensorType, existing);
  });

  const averageValues: IntegrationAnalysis["averageValues"] = {};
  const minValues: IntegrationAnalysis["minValues"] = {};
  const maxValues: IntegrationAnalysis["maxValues"] = {};
  const trends: IntegrationAnalysis["trends"] = {};

  readingsByType.forEach(({ values, unit }, type) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    averageValues[type] = {
      value: Math.round(avg * 100) / 100,
      unit,
      count: values.length,
    };
    minValues[type] = Math.min(...values);
    maxValues[type] = Math.max(...values);

    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    if (firstHalf.length && secondHalf.length) {
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      trends[type] =
        secondAvg > firstAvg * 1.03
          ? "increasing"
          : secondAvg < firstAvg * 0.97
            ? "decreasing"
            : "stable";
    } else {
      trends[type] = "stable";
    }
  });

  const qualityReadings = collection.readings.filter((r) => r.quality);
  const qualityScore =
    qualityReadings.length > 0
      ? Math.round(
          qualityReadings.reduce(
            (sum, r) => sum + (r.quality === "good" ? 95 : r.quality === "fair" ? 75 : 50),
            0
          ) / qualityReadings.length
        )
      : 88;

  const uniqueTypes = new Set(collection.readings.map((r) => r.sensorType));
  const dataCompleteness = Math.min(100, Math.round((uniqueTypes.size / 10) * 100));

  return { averageValues, minValues, maxValues, trends, qualityScore, dataCompleteness };
};

const getAvg = (analysis: IntegrationAnalysis, type: SensorType): number | null => {
  const entry = analysis.averageValues[type];
  return entry ? entry.value : DEMO_VALUES[type] ?? null;
};

const statusFromScore = (score: number): HealthStatus => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "moderate";
  if (score >= 40) return "poor";
  return "critical";
};

export const generateAIInsights = (analysis: IntegrationAnalysis): AIInsight[] => {
  const pH = getAvg(analysis, "pH") ?? 7;
  const moisture = getAvg(analysis, "moisture") ?? 50;
  const nitrogen = getAvg(analysis, "nitrogen") ?? 250;
  const phosphorus = getAvg(analysis, "phosphorus") ?? 25;
  const potassium = getAvg(analysis, "potassium") ?? 200;
  const organic = getAvg(analysis, "organic_matter") ?? 2;
  const salinity = getAvg(analysis, "salinity") ?? 1;
  const ec = getAvg(analysis, "ec") ?? 1;

  const phScore = pH >= 6.5 && pH <= 7.5 ? 90 : pH >= 6.0 && pH <= 8.0 ? 70 : 45;
  const moistureScore = moisture >= 40 && moisture <= 60 ? 88 : moisture >= 30 && moisture <= 70 ? 65 : 40;
  const nScore = nitrogen >= 200 ? 85 : nitrogen >= 150 ? 65 : 45;
  const pScore = phosphorus >= 25 ? 85 : phosphorus >= 15 ? 65 : 45;
  const kScore = potassium >= 180 ? 85 : potassium >= 120 ? 65 : 45;
  const fertilityScore = Math.round((nScore + pScore + kScore) / 3);
  const salinityScore = salinity <= 1.5 && ec <= 2 ? 90 : salinity <= 3 ? 60 : 35;
  const organicScore = organic >= 3 ? 90 : organic >= 1.5 ? 70 : 45;

  return [
    {
      id: "ph-status",
      title: "Soil pH Status",
      description:
        pH >= 6.5 && pH <= 7.5
          ? `pH at ${pH.toFixed(1)} is in the optimal range for most crops including rice and wheat.`
          : pH < 6.5
            ? `pH at ${pH.toFixed(1)} is slightly acidic. Consider lime application for neutralization.`
            : `pH at ${pH.toFixed(1)} is alkaline. Monitor micronutrient availability closely.`,
      status: statusFromScore(phScore),
      category: "Chemical",
    },
    {
      id: "irrigation",
      title: "Irrigation Requirement",
      description:
        moisture < 40
          ? `Soil moisture at ${moisture.toFixed(0)}% is below optimal. Irrigation recommended within 24 hours.`
          : moisture > 65
            ? `Soil moisture at ${moisture.toFixed(0)}% is high. Reduce irrigation frequency to prevent waterlogging.`
            : `Soil moisture at ${moisture.toFixed(0)}% is within optimal range. Maintain current schedule.`,
      status: statusFromScore(moistureScore),
      category: "Water",
    },
    {
      id: "nutrient-deficiency",
      title: "Nutrient Deficiency Detection",
      description:
        nitrogen < 200 || phosphorus < 20 || potassium < 150
          ? `Detected potential deficiencies — N: ${nitrogen.toFixed(0)} kg/ha, P: ${phosphorus.toFixed(0)} kg/ha, K: ${potassium.toFixed(0)} kg/ha. Targeted fertilization advised.`
          : `NPK levels are balanced. N: ${nitrogen.toFixed(0)}, P: ${phosphorus.toFixed(0)}, K: ${potassium.toFixed(0)} kg/ha.`,
      status: statusFromScore(fertilityScore),
      category: "Nutrients",
    },
    {
      id: "fertility",
      title: "Fertility Assessment",
      description:
        fertilityScore >= 80
          ? "Overall soil fertility is good with adequate macro-nutrient reserves for the current season."
          : "Soil fertility is moderate. A balanced fertilizer program will improve yield potential.",
      status: statusFromScore(fertilityScore),
      category: "Fertility",
    },
    {
      id: "salinity",
      title: "Salinity Risk",
      description:
        salinity <= 1.5
          ? `Salinity at ${salinity.toFixed(1)} dS/m presents low risk. Suitable for most crop varieties.`
          : `Salinity at ${salinity.toFixed(1)} dS/m indicates moderate risk. Consider salt-tolerant varieties.`,
      status: statusFromScore(salinityScore),
      category: "Salinity",
    },
    {
      id: "organic-matter",
      title: "Organic Matter Evaluation",
      description:
        organic >= 3
          ? `Organic matter at ${organic.toFixed(1)}% supports excellent soil structure and water retention.`
          : organic >= 1.5
            ? `Organic matter at ${organic.toFixed(1)}% is moderate. Green manuring or compost can improve levels.`
            : `Organic matter at ${organic.toFixed(1)}% is low. Add FYM or vermicompost before next sowing.`,
      status: statusFromScore(organicScore),
      category: "Organic",
    },
  ];
};

export const generateAIRecommendations = (analysis: IntegrationAnalysis): AIRecommendation[] => {
  const pH = getAvg(analysis, "pH") ?? 7;
  const moisture = getAvg(analysis, "moisture") ?? 50;
  const nitrogen = getAvg(analysis, "nitrogen") ?? 250;
  const phosphorus = getAvg(analysis, "phosphorus") ?? 25;
  const organic = getAvg(analysis, "organic_matter") ?? 2;
  const salinity = getAvg(analysis, "salinity") ?? 1;

  const recs: AIRecommendation[] = [];

  if (moisture < 45) {
    recs.push({
      id: "irrigation-rec",
      title: "Irrigation Advisory",
      message:
        "Soil moisture is below optimal range. Irrigation is recommended within the next 24 hours.",
      priority: "high",
      category: "Water Management",
    });
  }

  if (nitrogen < 220) {
    recs.push({
      id: "nitrogen-rec",
      title: "Nitrogen Application",
      message: "Nitrogen levels are slightly low. Apply 25–30 kg/ha nitrogen fertilizer.",
      priority: "high",
      category: "Fertilizer",
    });
  }

  if (pH >= 6.5 && pH <= 7.5) {
    recs.push({
      id: "ph-rec",
      title: "pH Suitability",
      message: "pH level is suitable for rice and wheat cultivation.",
      priority: "low",
      category: "Crop Planning",
    });
  }

  if (phosphorus < 25) {
    recs.push({
      id: "phosphorus-rec",
      title: "Phosphorus Boost",
      message: "Apply 20–25 kg/ha DAP during basal application for improved root development.",
      priority: "medium",
      category: "Fertilizer",
    });
  }

  if (organic < 2.5) {
    recs.push({
      id: "organic-rec",
      title: "Organic Matter Enhancement",
      message: "Incorporate 5–8 tons/ha farmyard manure to improve soil structure and microbial activity.",
      priority: "medium",
      category: "Soil Health",
    });
  }

  if (salinity > 1.5) {
    recs.push({
      id: "salinity-rec",
      title: "Salinity Management",
      message: "Implement leaching irrigation and consider gypsum application to manage soil salinity.",
      priority: "high",
      category: "Salinity",
    });
  }

  recs.push({
    id: "monitor-rec",
    title: "Continuous Monitoring",
    message: "Schedule next sensor reading in 7 days to track nutrient trends and moisture patterns.",
    priority: "low",
    category: "Monitoring",
  });

  return recs;
};

export const calculateSoilHealthScore = (analysis: IntegrationAnalysis): number => {
  const insights = generateAIInsights(analysis);
  const statusScores: Record<HealthStatus, number> = {
    excellent: 95,
    good: 80,
    moderate: 65,
    poor: 45,
    critical: 25,
  };
  const insightAvg =
    insights.reduce((sum, i) => sum + statusScores[i.status], 0) / insights.length;
  return Math.round((insightAvg + analysis.qualityScore + analysis.dataCompleteness) / 3);
};

export const getCropSuggestions = (analysis: IntegrationAnalysis): string[] => {
  const pH = getAvg(analysis, "pH") ?? 7;
  const moisture = getAvg(analysis, "moisture") ?? 50;
  const salinity = getAvg(analysis, "salinity") ?? 1;

  const crops: string[] = [];
  if (pH >= 6.0 && pH <= 7.5 && salinity < 2) {
    crops.push("Rice", "Wheat", "Maize");
  }
  if (pH >= 6.5 && pH <= 8.0) {
    crops.push("Cotton", "Sugarcane");
  }
  if (moisture >= 35 && moisture <= 55) {
    crops.push("Pulses", "Groundnut");
  }
  if (salinity > 1.5) {
    crops.push("Barley (salt-tolerant)", "Mustard");
  }
  return crops.length ? crops : ["Rice", "Wheat", "Vegetables"];
};

export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  good: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  poor: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};
