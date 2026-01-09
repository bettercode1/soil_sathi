import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  CropDiseaseReport,
  GrowthMonitoringEntry,
  IrrigationSchedule,
  MarketPriceAlert,
  WeatherAlert,
  FarmingCalendarTask,
  FertilizerCostCalculation,
  SoilHealthPrediction,
  ExpertConsultation,
} from "@/types/firebase";

const CROP_DISEASE_COLLECTION = "cropDiseaseReports";
const GROWTH_MONITORING_COLLECTION = "growthMonitoringEntries";
const IRRIGATION_SCHEDULE_COLLECTION = "irrigationSchedules";
const MARKET_PRICE_ALERTS_COLLECTION = "marketPriceAlerts";
const WEATHER_ALERTS_COLLECTION = "weatherAlerts";
const FARMING_CALENDAR_COLLECTION = "farmingCalendarTasks";
const FERTILIZER_COST_COLLECTION = "fertilizerCostCalculations";
const SOIL_HEALTH_PREDICTION_COLLECTION = "soilHealthPredictions";
const EXPERT_CONSULTATION_COLLECTION = "expertConsultations";

// Crop Disease Reports
export const saveCropDiseaseReport = async (
  report: Omit<CropDiseaseReport, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, CROP_DISEASE_COLLECTION), {
      ...report,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving crop disease report:", error);
    throw new Error(
      `Failed to save crop disease report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getCropDiseaseReports = async (
  userId?: string,
  limitCount: number = 50
): Promise<CropDiseaseReport[]> => {
  try {
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }

    const q = query(collection(db, CROP_DISEASE_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as CropDiseaseReport)
    );
  } catch (error) {
    console.error("Error getting crop disease reports:", error);
    throw new Error(
      `Failed to get crop disease reports: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Growth Monitoring
export const saveGrowthMonitoringEntry = async (
  entry: Omit<GrowthMonitoringEntry, "id" | "createdAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, GROWTH_MONITORING_COLLECTION),
      {
        ...entry,
        createdAt: Timestamp.now(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Error saving growth monitoring entry:", error);
    throw new Error(
      `Failed to save growth monitoring entry: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getGrowthMonitoringEntries = async (
  userId?: string,
  cropName?: string,
  limitCount: number = 50
): Promise<GrowthMonitoringEntry[]> => {
  try {
    const constraints: any[] = [orderBy("photoDate", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }
    if (cropName) {
      constraints.unshift(where("cropName", "==", cropName));
    }

    const q = query(collection(db, GROWTH_MONITORING_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as GrowthMonitoringEntry)
    );
  } catch (error) {
    console.error("Error getting growth monitoring entries:", error);
    throw new Error(
      `Failed to get growth monitoring entries: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Irrigation Schedules
export const saveIrrigationSchedule = async (
  schedule: Omit<IrrigationSchedule, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, IRRIGATION_SCHEDULE_COLLECTION), {
      ...schedule,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving irrigation schedule:", error);
    throw new Error(
      `Failed to save irrigation schedule: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getIrrigationSchedules = async (
  userId?: string,
  limitCount: number = 50
): Promise<IrrigationSchedule[]> => {
  try {
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }

    const q = query(collection(db, IRRIGATION_SCHEDULE_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as IrrigationSchedule)
    );
  } catch (error) {
    console.error("Error getting irrigation schedules:", error);
    throw new Error(
      `Failed to get irrigation schedules: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Market Price Alerts
export const saveMarketPriceAlert = async (
  alert: Omit<MarketPriceAlert, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, MARKET_PRICE_ALERTS_COLLECTION), {
      ...alert,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving market price alert:", error);
    throw new Error(
      `Failed to save market price alert: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getMarketPriceAlerts = async (
  userId?: string,
  cropName?: string,
  limitCount: number = 50
): Promise<MarketPriceAlert[]> => {
  try {
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }
    if (cropName) {
      constraints.unshift(where("cropName", "==", cropName));
    }

    const q = query(collection(db, MARKET_PRICE_ALERTS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as MarketPriceAlert)
    );
  } catch (error) {
    console.error("Error getting market price alerts:", error);
    throw new Error(
      `Failed to get market price alerts: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Weather Alerts
export const saveWeatherAlert = async (
  alert: Omit<WeatherAlert, "id" | "createdAt">
): Promise<string> => {
  try {
    // Remove undefined fields - Firebase doesn't accept undefined values
    const cleanedAlert = { ...alert };
    if (cleanedAlert.location === undefined) {
      delete cleanedAlert.location;
    }
    // Remove other undefined fields if any
    Object.keys(cleanedAlert).forEach(key => {
      if (cleanedAlert[key as keyof typeof cleanedAlert] === undefined) {
        delete cleanedAlert[key as keyof typeof cleanedAlert];
      }
    });
    
    const docRef = await addDoc(collection(db, WEATHER_ALERTS_COLLECTION), {
      ...cleanedAlert,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving weather alert:", error);
    throw new Error(
      `Failed to save weather alert: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getWeatherAlerts = async (
  userId?: string,
  region?: string,
  limitCount: number = 50
): Promise<WeatherAlert[]> => {
  try {
    const constraints: any[] = [orderBy("effectiveDate", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }
    if (region) {
      constraints.unshift(where("region", "==", region));
    }

    const q = query(collection(db, WEATHER_ALERTS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as WeatherAlert)
    );
  } catch (error) {
    console.error("Error getting weather alerts:", error);
    throw new Error(
      `Failed to get weather alerts: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Farming Calendar Tasks
export const saveFarmingCalendarTask = async (
  task: Omit<FarmingCalendarTask, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, FARMING_CALENDAR_COLLECTION), {
      ...task,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving farming calendar task:", error);
    throw new Error(
      `Failed to save farming calendar task: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getFarmingCalendarTasks = async (
  userId?: string,
  status?: FarmingCalendarTask["status"],
  limitCount: number = 100
): Promise<FarmingCalendarTask[]> => {
  try {
    const constraints: any[] = [orderBy("scheduledDate", "asc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }
    if (status) {
      constraints.unshift(where("status", "==", status));
    }

    const q = query(collection(db, FARMING_CALENDAR_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as FarmingCalendarTask)
    );
  } catch (error) {
    console.error("Error getting farming calendar tasks:", error);
    throw new Error(
      `Failed to get farming calendar tasks: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const updateFarmingCalendarTask = async (
  taskId: string,
  updates: Partial<Omit<FarmingCalendarTask, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, FARMING_CALENDAR_COLLECTION, taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating farming calendar task:", error);
    throw new Error(
      `Failed to update farming calendar task: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Fertilizer Cost Calculations
export const saveFertilizerCostCalculation = async (
  calculation: Omit<FertilizerCostCalculation, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, FERTILIZER_COST_COLLECTION), {
      ...calculation,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving fertilizer cost calculation:", error);
    throw new Error(
      `Failed to save fertilizer cost calculation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getFertilizerCostCalculations = async (
  userId?: string,
  limitCount: number = 50
): Promise<FertilizerCostCalculation[]> => {
  try {
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }

    const q = query(collection(db, FERTILIZER_COST_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as FertilizerCostCalculation)
    );
  } catch (error) {
    console.error("Error getting fertilizer cost calculations:", error);
    throw new Error(
      `Failed to get fertilizer cost calculations: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Soil Health Predictions
export const saveSoilHealthPrediction = async (
  prediction: Omit<SoilHealthPrediction, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, SOIL_HEALTH_PREDICTION_COLLECTION), {
      ...prediction,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving soil health prediction:", error);
    throw new Error(
      `Failed to save soil health prediction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getSoilHealthPredictions = async (
  userId?: string,
  region?: string,
  limitCount: number = 10
): Promise<SoilHealthPrediction[]> => {
  try {
    const constraints: any[] = [orderBy("createdAt", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }
    if (region) {
      constraints.unshift(where("region", "==", region));
    }

    const q = query(collection(db, SOIL_HEALTH_PREDICTION_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SoilHealthPrediction)
    );
  } catch (error) {
    console.error("Error getting soil health predictions:", error);
    throw new Error(
      `Failed to get soil health predictions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Expert Consultations
export const saveExpertConsultation = async (
  consultation: Omit<ExpertConsultation, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, EXPERT_CONSULTATION_COLLECTION), {
      ...consultation,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving expert consultation:", error);
    throw new Error(
      `Failed to save expert consultation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getExpertConsultations = async (
  userId?: string,
  status?: ExpertConsultation["status"],
  limitCount: number = 50
): Promise<ExpertConsultation[]> => {
  try {
    const constraints: any[] = [orderBy("scheduledDate", "desc"), limit(limitCount)];
    if (userId) {
      constraints.unshift(where("userId", "==", userId));
    }
    if (status) {
      constraints.unshift(where("status", "==", status));
    }

    const q = query(collection(db, EXPERT_CONSULTATION_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ExpertConsultation)
    );
  } catch (error) {
    console.error("Error getting expert consultations:", error);
    throw new Error(
      `Failed to get expert consultations: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const updateExpertConsultation = async (
  consultationId: string,
  updates: Partial<Omit<ExpertConsultation, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, EXPERT_CONSULTATION_COLLECTION, consultationId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating expert consultation:", error);
    throw new Error(
      `Failed to update expert consultation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

