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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "calibrating":
        return "bg-yellow-500";
      case "low_battery":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-white" />;
      case "calibrating":
        return <Loader2 className="h-4 w-4 text-white animate-spin" />;
      case "low_battery":
        return <Battery className="h-4 w-4 text-white" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-white" />;
      default:
        return <Activity className="h-4 w-4 text-white" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sensor Devices Status */}
      <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wifi className="h-6 w-6 text-emerald-600" />
            </div>
            <span>{t(sensorTranslations.connectedSensors)}</span>
            <Badge variant="outline" className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200">
              <Signal className="h-3 w-3 mr-1" />
              {devices.filter(d => d.status === "active").length} {t(sensorTranslations.activeSensorsReady)}
            </Badge>
          </CardTitle>
          <CardDescription className="text-base flex items-center gap-2 mt-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            {devices.filter(d => d.status === "active").length} {t(sensorTranslations.activeSensorsReady)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="group relative flex items-center justify-between p-4 border-2 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-emerald-50/30 hover:to-white"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${getStatusColor(device.status)}`}>
                    {getStatusIcon(device.status)}
                    {device.status === "active" && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-slate-800 truncate">{device.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        {device.type}
                      </Badge>
                      {device.batteryLevel && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Battery className={`h-3 w-3 ${device.batteryLevel < 20 ? 'text-red-500' : device.batteryLevel < 50 ? 'text-yellow-500' : 'text-green-500'}`} />
                          <span className="font-semibold">{device.batteryLevel.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-3">
                  <Badge 
                    variant={device.status === "active" ? "default" : "secondary"}
                    className={`${device.status === "active" ? "bg-emerald-500 text-white" : ""} font-semibold`}
                  >
                    {device.status === "active" ? (
                      <div className="flex items-center gap-1">
                        <Radio className="h-3 w-3" />
                        {t(sensorTranslations.active)}
                      </div>
                    ) : (
                      device.status
                    )}
                  </Badge>
                  {device.firmwareVersion && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      {device.firmwareVersion}
                    </div>
                  )}
                </div>
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
