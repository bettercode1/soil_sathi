import { motion } from "framer-motion";
import {
  Activity,
  CloudRain,
  Droplets,
  FlaskConical,
  Gauge,
  Leaf,
  Thermometer,
  TreePine,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import type { IntegrationStep } from "@/types/sensor-integration";

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Droplets,
  Thermometer,
  Leaf,
  FlaskConical,
  Zap,
  TreePine,
  Gauge,
  Waves,
  CloudRain,
};

export const getSensorIcon = (iconName: string): LucideIcon =>
  ICON_MAP[iconName] ?? Activity;

const STEP_LABEL_KEYS: Record<IntegrationStep, keyof typeof si> = {
  "company-selection": "stepSelectCompany",
  "sensor-listing": "stepViewSensors",
  "live-collection": "stepCollectData",
  "data-processing": "stepProcess",
  "ai-analysis": "stepAiAnalysis",
  recommendations: "stepRecommendations",
  "final-report": "stepReport",
};

export const INTEGRATION_STEP_ORDER: IntegrationStep[] = [
  "company-selection",
  "sensor-listing",
  "live-collection",
  "data-processing",
  "ai-analysis",
  "recommendations",
  "final-report",
];

export const stepIndex = (step: IntegrationStep): number =>
  INTEGRATION_STEP_ORDER.findIndex((s) => s === step);

interface FlowStepperProps {
  currentStep: IntegrationStep;
}

export const FlowStepper = ({ currentStep }: FlowStepperProps) => {
  const { t } = useLanguage();
  const currentIdx = stepIndex(currentStep);

  return (
    <div className="w-full overflow-x-auto scrollbar-none pb-2">
      <div className="flex items-center min-w-max gap-1 md:gap-0 px-1">
        {INTEGRATION_STEP_ORDER.map((stepKey, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const labelKey = STEP_LABEL_KEYS[stepKey];
          return (
            <div key={stepKey} className="flex items-center">
              <div className="flex flex-col items-center gap-1 min-w-[72px] md:min-w-[90px]">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isComplete ? "#2e7d32" : isCurrent ? "#4caf50" : "#e2e8f0",
                  }}
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    isComplete || isCurrent ? "text-white" : "text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : idx + 1}
                </motion.div>
                <span
                  className={`text-[10px] md:text-xs text-center font-medium leading-tight ${
                    isCurrent ? "text-emerald-700" : isComplete ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {t(si[labelKey])}
                </span>
              </div>
              {idx < INTEGRATION_STEP_ORDER.length - 1 && (
                <div
                  className={`h-0.5 w-6 md:w-12 mx-0.5 mb-5 rounded ${
                    idx < currentIdx ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};
