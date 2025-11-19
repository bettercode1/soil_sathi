import type { Timestamp } from "firebase/firestore";

export type Language = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";

// Soil Analysis Report
export interface SoilAnalysisReport {
  id?: string;
  userId?: string;
  language: Language;
  overview: string;
  soilQuality: {
    rating: string;
    score: number;
    description: string;
  };
  nutrientAnalysis: Array<{
    parameter: string;
    value: string;
    status: string;
    impact: string;
    recommendation: string;
  }>;
  fertilizerRecommendations: {
    chemical: Array<{
      name: string;
      quantity: string;
      timing: string;
      application: string;
      notes: string;
    }>;
    organic: Array<{
      name: string;
      quantity: string;
      timing: string;
      application: string;
      notes: string;
    }>;
  };
  improvementPlan: Array<{
    action: string;
    benefit: string;
    priority: string;
  }>;
  warnings: string[];
  nextSteps: string[];
  manualValues?: Record<string, string | number>;
  reportImageUrl?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Crop Disease Report
export interface CropDiseaseReport {
  id?: string;
  userId?: string;
  language: Language;
  cropName: string;
  cropType?: string;
  region?: string;
  diseaseName: string;
  diseaseType: "disease" | "pest" | "nutrient_deficiency" | "other";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-100
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: {
    organic: Array<{
      name: string;
      method: string;
      timing: string;
      notes: string;
    }>;
    chemical: Array<{
      name: string;
      method: string;
      timing: string;
      notes: string;
      safetyWarnings?: string[];
    }>;
  };
  preventionTips: string[];
  imageUrl: string;
  imageStoragePath?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Growth Monitoring Entry
export interface GrowthMonitoringEntry {
  id?: string;
  userId?: string;
  language: Language;
  cropName: string;
  cropType: string;
  region: string;
  farmSize?: {
    value: number;
    unit: "acre" | "hectare";
  };
  photoDate: Timestamp | Date;
  growthStage: string;
  growthStageConfidence: number; // 0-100
  healthScore: number; // 0-100
  observations: string[];
  aiAnalysis: string;
  imageUrl: string;
  imageStoragePath?: string;
  yieldPrediction?: {
    estimatedYield: number;
    unit: string;
    confidence: number;
    factors: string[];
  };
  createdAt: Timestamp | Date;
}

// Irrigation Schedule
export interface IrrigationSchedule {
  id?: string;
  userId?: string;
  language: Language;
  cropName: string;
  cropType: string;
  region: string;
  farmSize: {
    value: number;
    unit: "acre" | "hectare";
  };
  irrigationMethod: string;
  soilMoisture?: number; // 0-100
  schedule: Array<{
    date: Timestamp | Date;
    duration: number; // minutes
    amount: number; // liters or mm
    method: string;
    notes?: string;
    completed?: boolean;
  }>;
  weatherAdjustments: Array<{
    date: Timestamp | Date;
    originalSchedule: string;
    adjustedSchedule: string;
    reason: string;
  }>;
  waterUsageOptimization: string[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Market Price Alert
export interface MarketPriceAlert {
  id?: string;
  userId?: string;
  language: Language;
  cropName: string;
  cropType: string;
  region: string;
  marketName?: string;
  currentPrice: {
    value: number;
    unit: string; // per kg, per quintal, etc.
    date: Timestamp | Date;
  };
  priceHistory: Array<{
    date: Timestamp | Date;
    price: number;
    unit: string;
  }>;
  pricePrediction: {
    predictedPrice: number;
    unit: string;
    dateRange: {
      start: Timestamp | Date;
      end: Timestamp | Date;
    };
    confidence: number;
    factors: string[];
  };
  bestTimeToSell?: {
    recommendedDate: Timestamp | Date;
    expectedPrice: number;
    reason: string;
  };
  regionalComparison?: Array<{
    marketName: string;
    price: number;
    unit: string;
    distance?: number; // km
  }>;
  alertThreshold?: {
    type: "increase" | "decrease" | "both";
    percentage: number;
    enabled: boolean;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Soil Health History
export interface SoilHealthHistory {
  id?: string;
  userId?: string;
  language: Language;
  region: string;
  farmLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  records: Array<{
    date: Timestamp | Date;
    soilQualityScore: number;
    ph?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    organicMatter?: number;
    notes?: string;
    reportId?: string; // Reference to SoilAnalysisReport
  }>;
  trends: {
    soilQualityTrend: "improving" | "stable" | "declining";
    lastAnalysisDate: Timestamp | Date;
    nextRecommendedAnalysis?: Timestamp | Date;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Weather Alert
export interface WeatherAlert {
  id?: string;
  userId?: string;
  language: Language;
  region: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  alertType: "irrigation" | "spraying" | "harvest" | "sowing" | "fertilizer" | "general";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  recommendations: string[];
  weatherData: {
    temperature: number;
    humidity: number;
    precipitation?: number;
    windSpeed?: number;
    condition: string;
    forecast?: string;
  };
  effectiveDate: Timestamp | Date;
  expiresAt?: Timestamp | Date;
  acknowledged?: boolean;
  createdAt: Timestamp | Date;
}

// Farming Calendar Task
export interface FarmingCalendarTask {
  id?: string;
  userId?: string;
  language: Language;
  cropName: string;
  cropType: string;
  region: string;
  taskType: "sowing" | "irrigation" | "fertilizer" | "pest_control" | "harvest" | "soil_test" | "other";
  title: string;
  description: string;
  scheduledDate: Timestamp | Date;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedDate?: Timestamp | Date;
  notes?: string;
  aiGenerated: boolean;
  relatedReportId?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Fertilizer Cost Calculation
export interface FertilizerCostCalculation {
  id?: string;
  userId?: string;
  language: Language;
  cropName: string;
  cropType: string;
  region: string;
  farmSize: {
    value: number;
    unit: "acre" | "hectare";
  };
  fertilizers: Array<{
    name: string;
    type: "chemical" | "organic";
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalCost: number;
    supplier?: string;
    purchaseDate?: Timestamp | Date;
  }>;
  totalCost: number;
  optimizedCost?: number;
  savings?: number;
  recommendations: string[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Soil Health Prediction
export interface SoilHealthPrediction {
  id?: string;
  userId?: string;
  language: Language;
  region: string;
  currentSoilHealth: {
    score: number;
    date: Timestamp | Date;
  };
  predictions: Array<{
    date: Timestamp | Date;
    predictedScore: number;
    confidence: number;
    factors: string[];
  }>;
  riskAlerts: Array<{
    type: "degradation" | "nutrient_deficiency" | "salinity" | "erosion" | "other";
    severity: "low" | "medium" | "high";
    predictedDate: Timestamp | Date;
    description: string;
    recommendations: string[];
  }>;
  interventionRecommendations: Array<{
    action: string;
    priority: "low" | "medium" | "high";
    recommendedDate: Timestamp | Date;
    expectedImpact: string;
    cost?: number;
  }>;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Expert Consultation
export interface ExpertConsultation {
  id?: string;
  userId?: string;
  language: Language;
  expertId?: string;
  expertName?: string;
  consultationType: "video" | "voice" | "chat";
  topic: string;
  preScreeningQuestions?: Array<{
    question: string;
    answer: string;
  }>;
  scheduledDate: Timestamp | Date;
  duration?: number; // minutes
  status: "pending" | "scheduled" | "completed" | "cancelled";
  completedDate?: Timestamp | Date;
  sessionRecordingUrl?: string;
  aiSummary?: string;
  notes?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

