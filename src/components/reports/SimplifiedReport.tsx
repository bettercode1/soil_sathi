import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Sprout, FlaskConical, Leaf, Activity, ArrowRight, Gauge, Mountain, Wifi, Badge } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorTranslations } from "@/constants/sensorTranslations";
import { commonTranslations } from "@/constants/allTranslations";
import { SoilAnalysis } from "@/types/soil-analysis";

interface SimplifiedReportProps {
  analysis: SoilAnalysis;
  onKnowMore: () => void;
  dataSource?: "sensor" | "upload" | "manual";
}

const SimplifiedReport: React.FC<SimplifiedReportProps> = ({ analysis, onKnowMore, dataSource }) => {
  const { t } = useLanguage();
  // Helper to find nutrient value
  const getNutrientValue = (name: string) => {
    // Check if analysis or nutrientAnalysis is undefined/null
    if (!analysis || !analysis.nutrientAnalysis) {
      console.warn("SimplifiedReport: analysis or nutrientAnalysis is missing");
      return "N/A";
    }

    const nitrogenLabel = t(commonTranslations.nitrogen).toLowerCase();
    const phosphorusLabel = t(commonTranslations.phosphorus).toLowerCase();
    const potassiumLabel = t(commonTranslations.potassium).toLowerCase();
    const organicLabel = t(commonTranslations.organicMatter).toLowerCase();
    const phLabel = t(commonTranslations.phLevel).toLowerCase();

    const nutrient = analysis.nutrientAnalysis.find(n => {
      // Safety check for n and n.parameter
      if (!n || !n.parameter) return false;
      
      const param = n.parameter.toLowerCase();
      const search = name.toLowerCase();

      // Robust matching logic using translated labels
      if (search === "nitrogen") {
        return param.includes("nitrogen") || param.includes("n") || param.includes(nitrogenLabel);
      }
      if (search === "phosphorus") {
        return param.includes("phosphorus") || param.includes("p") || param.includes(phosphorusLabel);
      }
      if (search === "potassium") {
        return param.includes("potassium") || param.includes("k") || param.includes(potassiumLabel);
      }
      if (search === "organic") {
        return param.includes("organic") || param.includes("oc") || param.includes("om") || param.includes(organicLabel);
      }
      if (search === "ph") {
        return param.includes("ph") || param.includes(phLabel);
      }
      
      return param.includes(search);
    });

    return nutrient ? nutrient.value : "N/A";
  };

  const metrics = [
    {
      label: t(commonTranslations.phLevel),
      value: getNutrientValue("ph"),
      icon: FlaskConical,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      label: t(commonTranslations.nitrogen),
      value: getNutrientValue("nitrogen"),
      icon: Leaf,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: t(commonTranslations.phosphorus),
      value: getNutrientValue("phosphorus"),
      icon: Sprout,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      label: t(commonTranslations.potassium),
      value: getNutrientValue("potassium"),
      icon: Activity, // Potassium regulates metabolic activities
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: t(commonTranslations.organicMatter),
      value: getNutrientValue("organic"),
      icon: Mountain, // Representing soil/earth
      color: "text-amber-800",
      bg: "bg-amber-100"
    },
    {
      label: t(commonTranslations.soilQuality),
      value: analysis.soilQuality.rating,
      icon: Gauge,
      color: "text-slate-700",
      bg: "bg-slate-100"
    }
  ];

  return (
    <Card className="w-full overflow-hidden border-2 border-emerald-100 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-2 bg-gradient-to-b from-emerald-50/50 to-transparent">
        <div className="flex items-center justify-center gap-3 mb-2">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
            {t(commonTranslations.yourSoilAnalysis)}
          </CardTitle>
          {dataSource === "sensor" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg border-2 border-emerald-300">
              <Wifi className="h-4 w-4 text-emerald-700" />
              <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                {t(sensorTranslations.sensorBasedDataCollection)}
              </span>
            </div>
          )}
        </div>
        <CardDescription className="text-base sm:text-lg text-slate-600 font-medium">
          {t(commonTranslations.aiInsightsDescription)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${metric.bg}`}
            >
              <div className={`p-3 rounded-full bg-white shadow-sm mb-3 ${metric.color}`}>
                <metric.icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-slate-500 mb-1">{metric.label}</span>
              <span className="text-lg font-bold text-slate-800 text-center leading-tight">
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Summary Box */}
        <div className="bg-emerald-50/80 rounded-2xl p-6 border border-emerald-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex p-3 bg-emerald-100 rounded-full shrink-0">
              <Leaf className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900 mb-2">{t(commonTranslations.soilHealthSummary)}</h3>
              <p className="text-slate-700 leading-relaxed text-base">
                {analysis.soilQuality.description || analysis.overview.split('.')[0] + '.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center pb-8 pt-0">
        <Button 
          onClick={onKnowMore}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg group"
        >
          {t(commonTranslations.knowMore)}
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimplifiedReport;
