/**
 * Sensor Data Types for Soil Analysis
 * Defines the structure for sensor-based soil data collection
 */

export type SensorType = 
  | "pH" 
  | "moisture" 
  | "temperature" 
  | "nitrogen" 
  | "phosphorus" 
  | "potassium" 
  | "organic_matter"
  | "ec" // Electrical Conductivity
  | "salinity"
  | "humidity";

export type SensorStatus = "active" | "inactive" | "calibrating" | "error" | "low_battery";

export interface SensorDevice {
  id: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lastReading?: string; // ISO timestamp
  batteryLevel?: number; // 0-100
  firmwareVersion?: string;
  calibrationDate?: string;
}

export interface SensorReading {
  sensorId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: string; // ISO timestamp
  location?: {
    latitude: number;
    longitude: number;
  };
  depth?: number; // Depth in cm (for soil sensors)
  quality?: "good" | "fair" | "poor"; // Data quality indicator
  metadata?: {
    temperature?: number; // Ambient temperature during reading
    humidity?: number; // Ambient humidity during reading
    batteryLevel?: number;
  };
}

export interface SensorDataCollection {
  sessionId: string;
  startTime: string;
  endTime?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  readings: SensorReading[];
  deviceInfo: SensorDevice[];
  notes?: string;
}

export interface SensorDataAnalysis {
  averageValues: Record<SensorType, {
    value: number;
    unit: string;
    count: number;
  }>;
  minValues: Record<SensorType, number>;
  maxValues: Record<SensorType, number>;
  trends: Record<SensorType, "increasing" | "decreasing" | "stable">;
  recommendations: string[];
  qualityScore: number; // 0-100
  dataCompleteness: number; // 0-100
}

export interface SensorIntegrationConfig {
  autoCollection: boolean;
  collectionInterval: number; // seconds
  depthLevels: number[]; // cm depths to measure
  requiredSensors: SensorType[];
  optionalSensors: SensorType[];
}
