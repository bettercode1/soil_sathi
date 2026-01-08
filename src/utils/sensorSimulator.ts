/**
 * Sensor Data Simulator
 * Simulates real-time sensor data collection for development and testing
 */

import type { 
  SensorReading, 
  SensorDevice, 
  SensorDataCollection,
  SensorType,
  SensorStatus 
} from "@/types/sensor-data";

/**
 * Generate realistic sensor readings based on sensor type
 */
export const generateSensorReading = (
  sensorType: SensorType,
  depth?: number,
  baseValue?: number
): Omit<SensorReading, "sensorId" | "timestamp"> => {
  const now = new Date();
  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  
  // Base realistic values for Indian soil conditions
  const baseValues: Record<SensorType, { value: number; unit: string; range: [number, number] }> = {
    pH: { value: 7.0, unit: "pH", range: [6.0, 8.5] },
    moisture: { value: 45, unit: "%", range: [20, 80] },
    temperature: { value: isDaytime ? 28 : 22, unit: "°C", range: [15, 40] },
    nitrogen: { value: 250, unit: "kg/ha", range: [100, 400] },
    phosphorus: { value: 20, unit: "kg/ha", range: [10, 50] },
    potassium: { value: 200, unit: "kg/ha", range: [100, 350] },
    organic_matter: { value: 1.2, unit: "%", range: [0.5, 3.0] },
    ec: { value: 0.8, unit: "dS/m", range: [0.3, 2.0] },
    salinity: { value: 1.5, unit: "dS/m", range: [0.5, 4.0] },
    humidity: { value: 65, unit: "%", range: [40, 90] },
  };

  const config = baseValues[sensorType];
  const targetValue = baseValue ?? config.value;
  
  // Add realistic variation (±5-10% for most sensors, ±0.2 for pH)
  let variation: number;
  if (sensorType === "pH") {
    variation = (Math.random() - 0.5) * 0.4; // ±0.2
  } else {
    variation = (Math.random() - 0.5) * (targetValue * 0.1); // ±5%
  }
  
  // Add depth-based variation (deeper = slightly different values)
  let depthVariation = 0;
  if (depth) {
    depthVariation = (depth / 100) * (Math.random() - 0.5) * 0.05; // ±2.5% per 100cm
  }
  
  const finalValue = Math.max(
    config.range[0],
    Math.min(config.range[1], targetValue + variation + depthVariation)
  );

  // Round based on sensor type
  const roundedValue = sensorType === "pH" 
    ? Math.round(finalValue * 10) / 10 
    : sensorType === "organic_matter" || sensorType === "ec" || sensorType === "salinity"
    ? Math.round(finalValue * 100) / 100
    : Math.round(finalValue);

  // Determine quality based on value stability
  const quality: "good" | "fair" | "poor" = 
    Math.abs(variation) < (targetValue * 0.02) ? "good" :
    Math.abs(variation) < (targetValue * 0.05) ? "fair" : "poor";

  return {
    sensorType,
    value: roundedValue,
    unit: config.unit,
    depth,
    quality,
    metadata: {
      temperature: isDaytime ? 28 + (Math.random() - 0.5) * 4 : 22 + (Math.random() - 0.5) * 2,
      humidity: 60 + (Math.random() - 0.5) * 20,
      batteryLevel: 85 + Math.random() * 15,
    },
  };
};

/**
 * Generate mock sensor devices
 */
export const generateMockDevices = (count: number = 5): SensorDevice[] => {
  const sensorTypes: SensorType[] = [
    "pH",
    "moisture",
    "temperature",
    "nitrogen",
    "phosphorus",
    "potassium",
    "organic_matter",
  ];

  const statuses: SensorStatus[] = ["active", "active", "active", "calibrating", "low_battery"];

  return Array.from({ length: Math.min(count, sensorTypes.length) }, (_, i) => ({
    id: `sensor-${i + 1}`,
    name: `${sensorTypes[i]} Sensor ${i + 1}`,
    type: sensorTypes[i],
    status: statuses[i % statuses.length] as SensorStatus,
    lastReading: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    batteryLevel: 70 + Math.random() * 30,
    firmwareVersion: `v1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
    calibrationDate: new Date(Date.now() - Math.random() * 90 * 24 * 3600000).toISOString(),
  }));
};

/**
 * Simulate real-time sensor data collection
 */
export const simulateSensorCollection = async (
  sensors: SensorDevice[],
  duration: number = 30, // seconds
  interval: number = 2, // seconds between readings
  depthLevels: number[] = [0, 15, 30], // cm
  onReading: (reading: SensorReading) => void
): Promise<SensorDataCollection> => {
  const sessionId = `session-${Date.now()}`;
  const startTime = new Date().toISOString();
  const readings: SensorReading[] = [];
  
  // Get current location (or use default)
  const location = await getCurrentLocation();

  const collectionInterval = setInterval(() => {
    sensors.forEach((sensor) => {
      if (sensor.status === "active") {
        depthLevels.forEach((depth) => {
          const readingData = generateSensorReading(sensor.type, depth);
          const reading: SensorReading = {
            ...readingData,
            sensorId: sensor.id,
            timestamp: new Date().toISOString(),
            location: {
              latitude: location.latitude + (Math.random() - 0.5) * 0.0001,
              longitude: location.longitude + (Math.random() - 0.5) * 0.0001,
            },
          };
          
          readings.push(reading);
          onReading(reading);
        });
      }
    });
  }, interval * 1000);

  // Stop after duration
  await new Promise((resolve) => setTimeout(resolve, duration * 1000));
  clearInterval(collectionInterval);

  return {
    sessionId,
    startTime,
    endTime: new Date().toISOString(),
    location,
    readings,
    deviceInfo: sensors,
  };
};

/**
 * Get current location (with fallback)
 */
const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve) => {
    const defaultLocation = {
      latitude: 19.0760,
      longitude: 72.8777,
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Fallback to default location on error
          resolve(defaultLocation);
        },
        { timeout: 5000 } // Add 5 second timeout
      );
    } else {
      // Fallback to default location if no geolocation
      resolve(defaultLocation);
    }
  });
};

/**
 * Analyze collected sensor data
 */
export const analyzeSensorData = (collection: SensorDataCollection) => {
  const readingsByType = new Map<SensorType, SensorReading[]>();
  
  collection.readings.forEach((reading) => {
    if (!readingsByType.has(reading.sensorType)) {
      readingsByType.set(reading.sensorType, []);
    }
    readingsByType.get(reading.sensorType)!.push(reading);
  });

  const analysis: Record<string, any> = {
    averageValues: {},
    minValues: {},
    maxValues: {},
    trends: {},
    recommendations: [],
    qualityScore: 0,
    dataCompleteness: 0,
  };

  let totalQuality = 0;
  let qualityCount = 0;

  readingsByType.forEach((readings, sensorType) => {
    const values = readings.map((r) => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Determine trend (simplified - compare first half vs second half)
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg * 1.05 ? "increasing" :
                  secondAvg < firstAvg * 0.95 ? "decreasing" : "stable";

    analysis.averageValues[sensorType] = {
      value: Math.round(avg * 100) / 100,
      unit: readings[0].unit,
      count: readings.length,
    };
    analysis.minValues[sensorType] = min;
    analysis.maxValues[sensorType] = max;
    analysis.trends[sensorType] = trend;

    // Calculate quality
    readings.forEach((r) => {
      if (r.quality) {
        totalQuality += r.quality === "good" ? 100 : r.quality === "fair" ? 70 : 40;
        qualityCount++;
      }
    });
  });

  analysis.qualityScore = qualityCount > 0 ? Math.round(totalQuality / qualityCount) : 0;
  analysis.dataCompleteness = Math.round(
    (readingsByType.size / collection.deviceInfo.length) * 100
  );

  // Generate recommendations based on data
  if (analysis.averageValues.pH) {
    const pH = analysis.averageValues.pH.value;
    if (pH < 6.5) {
      analysis.recommendations.push("Soil pH is slightly acidic. Consider adding lime to raise pH.");
    } else if (pH > 7.5) {
      analysis.recommendations.push("Soil pH is slightly alkaline. Consider adding organic matter to lower pH.");
    }
  }

  if (analysis.averageValues.moisture) {
    const moisture = analysis.averageValues.moisture.value;
    if (moisture < 30) {
      analysis.recommendations.push("Soil moisture is low. Irrigation recommended.");
    } else if (moisture > 70) {
      analysis.recommendations.push("Soil moisture is high. Ensure proper drainage.");
    }
  }

  return analysis;
};
