import type { SensorType, SensorDataCollection } from "./sensor-data";

export type IntegrationStep =
  | "company-selection"
  | "sensor-listing"
  | "live-collection"
  | "data-processing"
  | "ai-analysis"
  | "recommendations"
  | "final-report";

export interface SensorCompany {
  id: string;
  name: string;
  headquarters: string;
  description: string;
  logoColor: string;
  logoInitials: string;
  supportedSensorCount: number;
  sensors: CompanySensor[];
  region?: "national" | "northeast";
  state?: string;
  partnerType?: string;
}

export interface CompanySensor {
  id: string;
  companyId: string;
  name: string;
  type: SensorType;
  typeLabel: string;
  measurementRange: string;
  unit: string;
  accuracy: string;
  status: "online" | "offline";
  imageIcon: string;
  firmwareVersion: string;
}

export interface LiveDeviceInfo {
  sensorId: string;
  deviceName: string;
  batteryLevel: number;
  signalStrength: number;
  firmwareVersion: string;
  lastSyncTime: string;
}

export type HealthStatus = "excellent" | "good" | "moderate" | "poor" | "critical";

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  status: HealthStatus;
  category: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export interface SoilHealthReportData {
  farmerName: string;
  farmLocation: string;
  companyName: string;
  sensorDetails: CompanySensor;
  collection: SensorDataCollection;
  analysis: IntegrationAnalysis;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  soilHealthScore: number;
  cropSuggestions: string[];
  generatedAt: string;
}

export interface IntegrationAnalysis {
  averageValues: Record<string, { value: number; unit: string; count: number }>;
  minValues: Record<string, number>;
  maxValues: Record<string, number>;
  trends: Record<string, "increasing" | "decreasing" | "stable">;
  qualityScore: number;
  dataCompleteness: number;
}

export interface IntegrationFlowContext {
  step: IntegrationStep;
  company: SensorCompany | null;
  sensor: CompanySensor | null;
  collection: SensorDataCollection | null;
  analysis: IntegrationAnalysis | null;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
}
