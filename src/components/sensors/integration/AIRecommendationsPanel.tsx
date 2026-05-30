import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Info, CheckCircle2, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { translatePriority } from "@/utils/useLocalizedSensorIntegration";
import type { AIRecommendation } from "@/types/sensor-integration";
import { pageVariants } from "./shared";

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[];
  onContinue: () => void;
}

const PRIORITY_STYLES = {
  high: { badge: "bg-red-100 text-red-800 border-red-200", border: "border-l-red-500", icon: AlertTriangle },
  medium: { badge: "bg-amber-100 text-amber-800 border-amber-200", border: "border-l-amber-500", icon: Info },
  low: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", border: "border-l-emerald-500", icon: CheckCircle2 },
};

export const AIRecommendationsPanel = ({ recommendations, onContinue }: AIRecommendationsPanelProps) => {
  const { t } = useLanguage();

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="mb-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <Lightbulb className="h-3 w-3 mr-1" />
            {t(si.aiRecommendations)}
          </Badge>
          <h2 className="text-2xl font-bold text-slate-800">{t(si.actionableInsights)}</h2>
          <p className="text-sm text-slate-500 mt-1">{t(si.recSubtitle)}</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onContinue}>
          {t(si.generateReport)}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, idx) => {
          const style = PRIORITY_STYLES[rec.priority];
          const Icon = style.icon;

          return (
            <motion.div key={rec.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className={`border-slate-200 border-l-4 ${style.border} hover:shadow-md transition-shadow`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-slate-800">{rec.title}</h3>
                        <Badge variant="outline" className={`text-[10px] capitalize ${style.badge}`}>
                          {translatePriority(t, rec.priority)}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mb-2">
                        {rec.category}
                      </Badge>
                      <p className="text-sm text-slate-600 leading-relaxed">{rec.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
