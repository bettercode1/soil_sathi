/**
 * Sensor Data Collector Component
 * UI for collecting sensor data and displaying real-time readings
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Play, 
  Square, 
  Wifi, 
  Battery, 
  MapPin, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Radio,
  Signal,
  Zap,
  Gauge,
  TrendingUp,
  Settings,
  BarChart3,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorTranslations } from "@/constants/sensorTranslations";
import type { 
  SensorDevice, 
  SensorReading, 
  SensorDataCollection 
} from "@/types/sensor-data";
import { 
  generateMockDevices, 
  simulateSensorCollection,
  analyzeSensorData 
} from "@/utils/sensorSimulator";

interface SensorDataCollectorProps {
  onDataCollected: (collection: SensorDataCollection) => void;
  onAnalysisReady?: (analysis: ReturnType<typeof analyzeSensorData>) => void;
}

export const SensorDataCollector: React.FC<SensorDataCollectorProps> = ({
  onDataCollected,
  onAnalysisReady,
}) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [collection, setCollection] = useState<SensorDataCollection | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30); // seconds
  const [depthLevels, setDepthLevels] = useState<number[]>([0, 15, 30]);

  // Initialize mock devices
  useEffect(() => {
    const mockDevices = generateMockDevices(7);
    setDevices(mockDevices);
  }, []);

  const handleStartCollection = useCallback(async () => {
    if (devices.filter(d => d.status === "active").length === 0) {
      toast({
        title: t(sensorTranslations.noActiveSensors),
        description: t(sensorTranslations.ensureActiveSensor),
        variant: "destructive",
      });
      return;
    }

    setIsCollecting(true);
    setReadings([]);
    setProgress(0);
    setCollection(null);

    const activeDevices = devices.filter(d => d.status === "active");
    
    try {
      const collected = await simulateSensorCollection(
        activeDevices,
        duration,
        2, // 2 seconds interval
        depthLevels,
        (reading) => {
          setReadings((prev) => [...prev, reading]);
          setProgress((prev) => {
            const newProgress = prev + (100 / (duration / 2));
            return Math.min(newProgress, 100);
          });
        }
      );

      setCollection(collected);
      setIsCollecting(false);
      
      // Analyze the collected data
      const analysis = analyzeSensorData(collected);
      if (onAnalysisReady) {
        onAnalysisReady(analysis);
      }
      
      // Notify parent component
      onDataCollected(collected);

      toast({
        title: t(sensorTranslations.dataCollectionComplete),
        description: t(sensorTranslations.collectedReadingsSuccess).replace("{count}", String(collected.readings.length)),
      });
    } catch (error) {
      console.error("Sensor collection error:", error);
      setIsCollecting(false);
      toast({
        title: t(sensorTranslations.collectionError),
        description: t(sensorTranslations.failedToCollect),
        variant: "destructive",
      });
    }
  }, [devices, duration, depthLevels, onDataCollected, onAnalysisReady, toast]);

  const handleStopCollection = () => {
    setIsCollecting(false);
    toast({
      title: t(sensorTranslations.collectionStopped),
      description: t(sensorTranslations.collectionStoppedDesc),
    });
  };

  const formatSensorName = (name: string) => {
    // Expected format: "SensorType Sensor N" e.g., "PH Sensor 1"
    const parts = name.split(' ');
    // Handle cases where name might be just "PH" or "PH Sensor"
    // We want to translate the type and keep numbers
    
    // Extract numbers/identifiers
    const identifier = parts.filter(p => !isNaN(Number(p))).join(' ');
    
    // Extract type (approximate)
    // Simplified mapping based on known types
    let typeKey = "";
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes("ph")) typeKey = "sensorNamePH";
    else if (lowerName.includes("moisture")) typeKey = "sensorNameMoisture";
    else if (lowerName.includes("temperature")) typeKey = "sensorNameTemperature";
    else if (lowerName.includes("nitrogen")) typeKey = "sensorNameNitrogen";
    else if (lowerName.includes("phosphorus")) typeKey = "sensorNamePhosphorus";
    else if (lowerName.includes("potassium")) typeKey = "sensorNamePotassium";
    else if (lowerName.includes("organic")) typeKey = "sensorNameOrganicMatter";
    
    if (typeKey && (sensorTranslations as any)[typeKey]) {
      const translatedName = t((sensorTranslations as any)[typeKey]);
      return identifier ? `${translatedName} ${identifier}` : translatedName;
    }

    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "calibrating":
        return "bg-amber-500";
      case "low_battery":
        return "bg-orange-500";
      case "error":
        return "bg-rose-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-white" />;
      case "calibrating":
        return <Loader2 className="h-5 w-5 text-white animate-spin" />;
      case "low_battery":
        return <Battery className="h-5 w-5 text-white" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-white" />;
      default:
        return <Activity className="h-5 w-5 text-white" />;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level < 20) return "text-rose-500";
    if (level < 50) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Sensor Devices Status */}
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <Wifi className="h-6 w-6 text-emerald-600" />
                {t(sensorTranslations.connectedSensors)}
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                {devices.filter(d => d.status === "active").length} {t(sensorTranslations.activeSensorsReady)}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 self-start sm:self-center">
              <Signal className="h-3.5 w-3.5 mr-1.5" />
              {t(sensorTranslations.systemOnline)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="group relative flex flex-col p-4 sm:p-5 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${getStatusColor(device.status)}`}>
                    {getStatusIcon(device.status)}
                    {device.status === "active" && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full flex items-center justify-center -translate-y-1/3 translate-x-1/3 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge 
                      variant="outline"
                      className={`
                        ${device.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                          device.status === "calibrating" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          device.status === "low_battery" ? "bg-orange-50 text-orange-700 border-orange-100" :
                          "bg-slate-50 text-slate-600 border-slate-100"}
                        capitalize font-semibold text-[10px] px-2 py-0
                      `}
                    >
                      {device.status === "active" ? t(sensorTranslations.active) : 
                       device.status === "calibrating" ? t(sensorTranslations.calibratingStatus) || t(sensorTranslations.calibrating) :
                       device.status === "low_battery" ? t(sensorTranslations.lowBatteryStatus) || t(sensorTranslations.lowBattery) :
                       device.status.replace('_', ' ')}
                    </Badge>
                    {device.firmwareVersion && (
                      <span className="text-[10px] text-slate-400 font-mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded">
                        {device.firmwareVersion}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 truncate text-lg group-hover:text-emerald-700 transition-colors">
                      {formatSensorName(device.name)}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-slate-50 rounded-md">
                        <Activity className="h-3 w-3 text-slate-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{device.type}</span>
                    </div>

                    {device.batteryLevel !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Battery className={`h-4 w-4 ${getBatteryColor(device.batteryLevel)}`} />
                        <span className={`text-xs font-bold ${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover decorative element */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-emerald-500 transition-all duration-300 group-hover:w-1/2 rounded-t-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collection Controls */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <span>{t(sensorTranslations.dataCollectionSettings)}</span>
          </CardTitle>
          <CardDescription className="text-base flex items-center gap-2 mt-2">
            <Gauge className="h-4 w-4 text-blue-500" />
            {t(sensorTranslations.configureCollection)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                {t(sensorTranslations.duration)}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={isCollecting}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed font-semibold"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  sec
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                {t(sensorTranslations.depthLevels)}
              </label>
              <input
                type="text"
                value={depthLevels.join(", ")}
                onChange={(e) => {
                  const values = e.target.value.split(",").map(v => Number(v.trim())).filter(v => !isNaN(v));
                  setDepthLevels(values);
                }}
                disabled={isCollecting}
                placeholder="0, 15, 30"
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed font-semibold"
              />
            </div>
            <div className="flex items-end">
              {isCollecting ? (
                <Button 
                  onClick={handleStopCollection} 
                  variant="destructive" 
                  className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  {t(sensorTranslations.stopCollection)}
                </Button>
              ) : (
                <Button 
                  onClick={handleStartCollection} 
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  <Zap className="h-4 w-4 mr-1" />
                  {t(sensorTranslations.startCollection)}
                </Button>
              )}
            </div>
          </div>

          {isCollecting && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="font-bold text-slate-700">{t(sensorTranslations.collectionProgress)}</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-blue-100" />
              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>{t(sensorTranslations.readingSensorValues)}</span>
                <Badge variant="outline" className="ml-auto bg-white">
                  {readings.length} {t(sensorTranslations.readingsCollected)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Readings */}
      {readings.length > 0 && (
        <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-white shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600 animate-pulse" />
              </div>
              <span>{t(sensorTranslations.realTimeReadings)}</span>
              <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-700 border-purple-200">
                {readings.length} {t(sensorTranslations.readingsCollected)}
              </Badge>
            </CardTitle>
            <CardDescription className="text-base flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              {readings.length} {t(sensorTranslations.readingsCollected)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {readings.slice(-10).reverse().map((reading, index) => (
                <div
                  key={`${reading.sensorId}-${reading.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 border-2 border-purple-100 rounded-lg bg-white hover:border-purple-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-bold bg-purple-50 text-purple-700 border-purple-200">
                        {reading.sensorType}
                      </Badge>
                      <span className="text-lg font-bold text-slate-800">
                        {reading.value}
                      </span>
                      <span className="text-sm text-slate-600 font-medium">
                        {reading.unit}
                      </span>
                    </div>
                    {reading.depth !== undefined && (
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        <MapPin className="h-3 w-3 mr-1" />
                        {reading.depth}cm
                      </Badge>
                    )}
                    {reading.quality && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          reading.quality === "good" ? "bg-green-50 text-green-700 border-green-200" :
                          reading.quality === "fair" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {reading.quality}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(reading.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Summary */}
      {collection && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <span>{t(sensorTranslations.collectionSummary)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  <div className="text-3xl font-bold text-emerald-700">{collection.readings.length}</div>
                </div>
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.totalReadings)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  <div className="text-3xl font-bold text-blue-700">{collection.deviceInfo.length}</div>
                </div>
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.sensorsUsed)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div className="text-lg font-bold text-purple-700">
                    {new Date(collection.startTime).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.startTime)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <div className="text-xs font-bold text-red-700">
                    {collection.location.latitude.toFixed(4)}, {collection.location.longitude.toFixed(4)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.location)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
