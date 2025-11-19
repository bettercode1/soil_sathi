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
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  SoilAnalysisReport,
  SoilHealthHistory,
  Language,
} from "@/types/firebase";

const SOIL_ANALYSIS_COLLECTION = "soilAnalysisReports";
const SOIL_HEALTH_COLLECTION = "soilHealthHistory";

/**
 * Save soil analysis report to Firestore
 */
export const saveSoilAnalysisReport = async (
  report: Omit<SoilAnalysisReport, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const reportData: Omit<SoilAnalysisReport, "id"> = {
      ...report,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(
      collection(db, SOIL_ANALYSIS_COLLECTION),
      reportData
    );
    return docRef.id;
  } catch (error) {
    console.error("Error saving soil analysis report:", error);
    throw new Error(
      `Failed to save soil analysis report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get soil analysis report by ID
 */
export const getSoilAnalysisReport = async (
  reportId: string
): Promise<SoilAnalysisReport | null> => {
  try {
    const docRef = doc(db, SOIL_ANALYSIS_COLLECTION, reportId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SoilAnalysisReport;
    }
    return null;
  } catch (error) {
    console.error("Error getting soil analysis report:", error);
    throw new Error(
      `Failed to get soil analysis report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get soil analysis reports by user ID
 */
export const getSoilAnalysisReportsByUser = async (
  userId: string,
  limitCount: number = 50
): Promise<SoilAnalysisReport[]> => {
  try {
    const q = query(
      collection(db, SOIL_ANALYSIS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SoilAnalysisReport)
    );
  } catch (error) {
    console.error("Error getting soil analysis reports:", error);
    throw new Error(
      `Failed to get soil analysis reports: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get soil analysis reports by date range
 */
export const getSoilAnalysisReportsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  limitCount: number = 50
): Promise<SoilAnalysisReport[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      collection(db, SOIL_ANALYSIS_COLLECTION),
      where("userId", "==", userId),
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SoilAnalysisReport)
    );
  } catch (error) {
    console.error("Error getting soil analysis reports by date range:", error);
    throw new Error(
      `Failed to get soil analysis reports: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Update soil analysis report
 */
export const updateSoilAnalysisReport = async (
  reportId: string,
  updates: Partial<Omit<SoilAnalysisReport, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, SOIL_ANALYSIS_COLLECTION, reportId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating soil analysis report:", error);
    throw new Error(
      `Failed to update soil analysis report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get or create soil health history
 */
export const getSoilHealthHistory = async (
  userId: string,
  region: string
): Promise<SoilHealthHistory | null> => {
  try {
    const q = query(
      collection(db, SOIL_HEALTH_COLLECTION),
      where("userId", "==", userId),
      where("region", "==", region),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SoilHealthHistory;
    }
    return null;
  } catch (error) {
    console.error("Error getting soil health history:", error);
    throw new Error(
      `Failed to get soil health history: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Create or update soil health history
 */
export const saveSoilHealthHistory = async (
  history: Omit<SoilHealthHistory, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    // Check if history exists
    const existingHistory = await getSoilHealthHistory(
      history.userId || "anonymous",
      history.region
    );

    const now = Timestamp.now();

    if (existingHistory) {
      // Update existing history
      const docRef = doc(db, SOIL_HEALTH_COLLECTION, existingHistory.id!);
      await updateDoc(docRef, {
        ...history,
        updatedAt: now,
      });
      return existingHistory.id!;
    } else {
      // Create new history
      const historyData: Omit<SoilHealthHistory, "id"> = {
        ...history,
        createdAt: now,
        updatedAt: now,
      };
      const docRef = await addDoc(
        collection(db, SOIL_HEALTH_COLLECTION),
        historyData
      );
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving soil health history:", error);
    throw new Error(
      `Failed to save soil health history: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Add record to soil health history
 */
export const addSoilHealthRecord = async (
  userId: string,
  region: string,
  record: SoilHealthHistory["records"][0]
): Promise<void> => {
  try {
    let history = await getSoilHealthHistory(userId, region);

    if (!history) {
      // Create new history
      const historyId = await saveSoilHealthHistory({
        userId,
        region,
        language: "en",
        records: [record],
        trends: {
          soilQualityTrend: "stable",
          lastAnalysisDate: Timestamp.fromDate(
            record.date instanceof Date ? record.date : record.date.toDate()
          ),
        },
      });
      history = await getSoilHealthHistory(userId, region);
    }

    if (history) {
      const updatedRecords = [...history.records, record];
      const lastRecord = updatedRecords[updatedRecords.length - 1];
      const lastAnalysisDate = Timestamp.fromDate(
        lastRecord.date instanceof Date ? lastRecord.date : lastRecord.date.toDate()
      );

      await updateDoc(doc(db, SOIL_HEALTH_COLLECTION, history.id!), {
        records: updatedRecords,
        "trends.lastAnalysisDate": lastAnalysisDate,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error("Error adding soil health record:", error);
    throw new Error(
      `Failed to add soil health record: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

