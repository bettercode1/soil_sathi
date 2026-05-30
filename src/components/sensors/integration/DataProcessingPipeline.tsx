import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Database,
  ShieldCheck,
  Sparkles,
  Brain,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { pageVariants } from "./shared";

const PIPELINE_STAGE_KEYS = [
  { id: "device", labelKey: "pipeDevice" as const, descKey: "pipeDeviceDesc" as const, icon: Radio },
  { id: "collection", labelKey: "pipeCollection" as const, descKey: "pipeCollectionDesc" as const, icon: Database },
  { id: "validation", labelKey: "pipeValidation" as const, descKey: "pipeValidationDesc" as const, icon: ShieldCheck },
  { id: "cleaning", labelKey: "pipeCleaning" as const, descKey: "pipeCleaningDesc" as const, icon: Sparkles },
  { id: "ai", labelKey: "pipeAi" as const, descKey: "pipeAiDesc" as const, icon: Brain },
  { id: "recommendations", labelKey: "pipeRecommendations" as const, descKey: "pipeRecommendationsDesc" as const, icon: Sparkles },
  { id: "report", labelKey: "pipeReport" as const, descKey: "pipeReportDesc" as const, icon: FileText },
];

interface DataProcessingPipelineProps {
  onComplete: () => void;
}

export const DataProcessingPipeline = ({ onComplete }: DataProcessingPipelineProps) => {
  const { t } = useLanguage();
  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = useMemo(
    () =>
      PIPELINE_STAGE_KEYS.map((s) => ({
        ...s,
        label: t(si[s.labelKey]),
        description: t(si[s.descKey]),
      })),
    [t],
  );

  useEffect(() => {
    const stageDuration = 1200;
    const totalStages = stages.length;

    const stageTimer = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= totalStages - 1) {
          clearInterval(stageTimer);
          setTimeout(onComplete, 800);
          return prev;
        }
        return prev + 1;
      });
    }, stageDuration);

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 100 / (totalStages * (stageDuration / 100))));
    }, 100);

    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
    };
  }, [onComplete, stages.length]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t(si.processingTitle)}</h2>
        <p className="text-slate-600 text-sm">{t(si.processingDesc)}</p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-800">{t(si.pipelineProgress)}</span>
            <span className="text-sm font-bold text-emerald-700">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {stages.map((stage, idx) => {
            const isActive = idx === activeStage;
            const isComplete = idx < activeStage;
            const isPending = idx > activeStage;
            const StageIcon = stage.icon as LucideIcon;

            return (
              <motion.div key={stage.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card
                  className={`border transition-all duration-300 ${
                    isActive
                      ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100"
                      : isComplete
                        ? "border-emerald-200 bg-white"
                        : "border-slate-200 bg-slate-50/50 opacity-60"
                  }`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isComplete ? "bg-emerald-600 text-white" : isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <StageIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isActive ? "text-emerald-800" : "text-slate-700"}`}>{stage.label}</p>
                      <p className="text-xs text-slate-500">{stage.description}</p>
                    </div>
                    {isActive && (
                      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <span className="text-xs font-medium text-emerald-600">{t(si.processing)}</span>
                      </motion.div>
                    )}
                    {isPending && <span className="text-xs text-slate-400">{t(si.pending)}</span>}
                  </CardContent>
                </Card>
                {idx < stages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className={`w-0.5 h-4 ${isComplete ? "bg-emerald-400" : "bg-slate-200"}`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {progress >= 99 && (
        <div className="flex justify-center">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onComplete}>
            {t(si.viewAiAnalysis)}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};
