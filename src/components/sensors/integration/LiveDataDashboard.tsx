import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Battery,
  Signal,
  Cpu,
  Clock,
  Play,
  Square,
  Loader2,
  Gauge,
  CloudRain,
  Droplets,
  Leaf,
  Thermometer,
  TreePine,
  Waves,
  Zap,
  Activity,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SensorCompany, CompanySensor } from "@/types/sensor-integration";
import type { SensorDataCollection, SensorReading, SensorDevice, SensorType } from "@/types/sensor-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { translateSensorType } from "@/utils/sensorLanguageHelpers";
import { mapLanguageToLocale } from "@/constants/languages";
import { getDemoFarmLocation } from "@/utils/useLocalizedSensorIntegration";
import { generateSensorReading } from "@/utils/sensorSimulator";
import { getSensorIcon, pageVariants } from "./shared";
import { LiveSensorCharts } from "./LiveSensorCharts";
import { FieldLocationMap } from "./FieldLocationMap";

interface LiveDataDashboardProps {
  company: SensorCompany;
  sensor: CompanySensor;
  onBack: () => void;
  onComplete: (collection: SensorDataCollection) => void;
}

const COLLECTION_DURATION = 15;
const READING_INTERVAL = 2;

const ALL_SENSOR_TYPES: SensorType[] = [
  "pH",
  "moisture",
  "temperature",
  "nitrogen",
  "phosphorus",
  "potassium",
  "organic_matter",
  "ec",
  "salinity",
  "humidity",
];

const TYPE_ICONS: Record<string, LucideIcon> = {
  pH: Activity,
  moisture: Droplets,
  temperature: Thermometer,
  nitrogen: Leaf,
  phosphorus: FlaskConical,
  potassium: Zap,
  organic_matter: TreePine,
  ec: Gauge,
  salinity: Waves,
  humidity: CloudRain,
};

export const LiveDataDashboard = ({
  company,
  sensor,
  onBack,
  onComplete,
}: LiveDataDashboardProps) => {
  const { t, language } = useLanguage();
  const [isCollecting, setIsCollecting] = useState(false);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [progress, setProgress] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [signalStrength, setSignalStrength] = useState(92);
  const [lastSync, setLastSync] = useState(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readingsRef = useRef<SensorReading[]>([]);
  const startTimeRef = useRef<string>("");
  const completedRef = useRef(false);

  const location = { latitude: 19.076, longitude: 72.8777, address: getDemoFarmLocation(t) };

  const latestValues = ALL_SENSOR_TYPES.map((type) => {
    const typeReadings = readings.filter((r) => r.sensorType === type);
    const latest = typeReadings[typeReadings.length - 1];
    return { type, reading: latest };
  }).filter((v) => v.reading);

  const qualityScore =
    readings.length > 0
      ? Math.round(
          readings.reduce(
            (sum, r) => sum + (r.quality === "good" ? 95 : r.quality === "fair" ? 75 : 50),
            0
          ) / readings.length
        )
      : 0;

  const finishCollection = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setIsCollecting(false);

    const device: SensorDevice = {
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      status: "active",
      batteryLevel,
      firmwareVersion: sensor.firmwareVersion,
      lastReading: lastSync,
    };

    onComplete({
      sessionId: `session-${Date.now()}`,
      startTime: startTimeRef.current || new Date().toISOString(),
      endTime: new Date().toISOString(),
      location,
      readings: readingsRef.current,
      deviceInfo: [device],
      notes: `Demo collection via ${company.name} - ${sensor.name}`,
    });
  }, [sensor, company, batteryLevel, lastSync, onComplete]);

  const addReading = useCallback(() => {
    const newReadings: SensorReading[] = ALL_SENSOR_TYPES.map((type) => {
      const data = generateSensorReading(type);
      return {
        ...data,
        sensorId: sensor.id,
        timestamp: new Date().toISOString(),
        location: { latitude: location.latitude, longitude: location.longitude },
      };
    });

    readingsRef.current = [...readingsRef.current, ...newReadings];
    setReadings([...readingsRef.current]);
    setLastSync(new Date().toISOString());
    setBatteryLevel((b) => Math.max(60, b - Math.random() * 0.3));
    setSignalStrength(75 + Math.random() * 25);
  }, [sensor]);

  const startCollection = useCallback(() => {
    completedRef.current = false;
    readingsRef.current = [];
    setReadings([]);
    setProgress(0);
    startTimeRef.current = new Date().toISOString();
    setIsCollecting(true);
    addReading();

    intervalRef.current = setInterval(addReading, READING_INTERVAL * 1000);

    let elapsed = 0;
    progressRef.current = setInterval(() => {
      elapsed += 1;
      setProgress(Math.min(100, (elapsed / COLLECTION_DURATION) * 100));
      if (elapsed >= COLLECTION_DURATION) {
        finishCollection();
      }
    }, 1000);
  }, [addReading, finishCollection]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const Icon = getSensorIcon(sensor.imageIcon);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            {company.name}
          </Badge>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Icon className="h-6 w-6 text-emerald-600" />
            {t(si.liveDashboard)}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{sensor.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={isCollecting}>
            {t(si.back)}
          </Button>
          {!isCollecting ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={startCollection}>
              <Play className="h-4 w-4 mr-1" />
              {t(si.startCollection)}
            </Button>
          ) : (
            <Button variant="destructive" onClick={finishCollection}>
              <Square className="h-4 w-4 mr-1" />
              {t(si.stopAndProcess)}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t(si.sensorId), value: sensor.id.slice(0, 14), icon: Cpu },
          { label: t(si.device), value: sensor.name.split(" ")[0], icon: Icon },
          { label: t(si.battery), value: `${batteryLevel.toFixed(0)}%`, icon: Battery },
          { label: t(si.signal), value: `${signalStrength.toFixed(0)}%`, icon: Signal },
          { label: t(si.firmware), value: sensor.firmwareVersion, icon: Cpu },
          {
            label: t(si.lastSync),
            value: new Date(lastSync).toLocaleTimeString(mapLanguageToLocale(language)),
            icon: Clock,
          },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
              <p className="font-semibold text-sm text-slate-800 truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isCollecting && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(si.collectingLive)}
              </span>
              <span className="text-sm font-bold text-emerald-700">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {latestValues.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {latestValues.map(({ type, reading }) => {
            if (!reading) return null;
            const TypeIcon = TYPE_ICONS[type] ?? Activity;
            return (
              <motion.div
                key={type}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.5, repeat: isCollecting ? Infinity : 0, repeatDelay: 2 }}
              >
                <Card className="border-slate-200 hover:border-emerald-200 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-slate-500 capitalize">
                        {translateSensorType(type, t)}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {reading.value}
                      <span className="text-xs font-normal text-slate-500 ml-1">{reading.unit}</span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {readings.length > 0 && (
        <>
          <LiveSensorCharts readings={readings} activeTypes={ALL_SENSOR_TYPES} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <FieldLocationMap
                latitude={location.latitude}
                longitude={location.longitude}
                address={location.address}
              />
            </div>
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-emerald-600" />
                  {t(si.dataQualityScore)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#2e7d32"
                      strokeWidth="10"
                      strokeDasharray={`${(qualityScore / 100) * 327} 327`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-emerald-700">{qualityScore || "—"}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4 text-center">
                  {qualityScore >= 85 ? t(si.excellentQuality) : qualityScore >= 70 ? t(si.goodQuality) : t(si.collectingBaseline)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{readings.length} {t(si.readingsCaptured)}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
};
