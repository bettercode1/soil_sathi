import { motion } from "framer-motion";
import { ArrowLeft, Wifi, WifiOff, Plug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { translateSensorType } from "@/utils/sensorLanguageHelpers";
import type { SensorCompany, CompanySensor } from "@/types/sensor-integration";
import { getSensorIcon, pageVariants } from "./shared";

interface SensorListingProps {
  company: SensorCompany;
  onBack: () => void;
  onConnect: (sensor: CompanySensor) => void;
}

export const SensorListing = ({ company, onBack, onConnect }: SensorListingProps) => {
  const { t } = useLanguage();
  const onlineCount = company.sensors.filter((s) => s.status === "online").length;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="shrink-0 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: company.logoColor }}
            >
              {company.logoInitials}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">{company.name}</h2>
              <p className="text-sm text-slate-500">
                {company.sensors.length} {t(si.sensorsAvailable)} · {onlineCount} {t(si.online).toLowerCase()}
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200">
          <Wifi className="h-3 w-3 mr-1" />
          {t(si.integrationReady)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {company.sensors.map((sensor, idx) => {
          const Icon = getSensorIcon(sensor.imageIcon);
          const isOnline = sensor.status === "online";

          return (
            <motion.div
              key={sensor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Card className="h-full border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden bg-white">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <Icon className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">{sensor.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        isOnline
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
                          : "bg-slate-100 text-slate-500 border-slate-200 shrink-0"
                      }
                    >
                      {isOnline ? (
                        <>
                          <Wifi className="h-3 w-3 mr-1" /> {t(si.online)}
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 mr-1" /> {t(si.offline)}
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t(si.type)}</span>
                      <span className="font-medium text-slate-700">{translateSensorType(sensor.type, t)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t(si.range)}</span>
                      <span className="font-medium text-slate-700">{sensor.measurementRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t(si.unit)}</span>
                      <span className="font-medium text-slate-700">{sensor.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t(si.accuracy)}</span>
                      <span className="font-medium text-slate-700">{sensor.accuracy}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                    disabled={!isOnline}
                    onClick={() => onConnect(sensor)}
                  >
                    <Plug className="h-4 w-4 mr-1" />
                    {t(si.connectSensor)}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
