import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, 
  FlaskConical, 
  Sprout, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Droplets,
  Sun,
  Wind,
  Info,
  Wifi,
  Activity
} from "lucide-react";
import { SoilAnalysis } from "@/types/soil-analysis";
import BettercodeLogo from "@/assets/bettercode-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorTranslations, commonTranslations, recommendationsTranslations } from "@/constants/allTranslations";
import { sensorAnalysisTranslations } from "@/constants/sensorAnalysisTranslations";

interface DetailedReportProps {
  analysis: SoilAnalysis;
  onDownload: () => void;
  onClear: () => void;
  reportRef: React.RefObject<HTMLDivElement>;
  isDownloading: boolean;
  dataSource?: "sensor" | "upload" | "manual";
  sensorCollection?: any; // Optional sensor collection data for reference
}

interface NutrientCardProps {
  item: {
    parameter: string;
    value: string;
    status: string;
    recommendation: string;
  };
  index: number;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

const NutrientCard: React.FC<NutrientCardProps> = ({ item, index, getStatusIcon, getStatusColor }) => {
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);
  const statusColor = getStatusColor(item.status);
  
  // Parse value to separate first and second samples
  // Handles formats like: "7.83 (1st sample), 7.60 (2nd sample)" or "7.83, 7.60"
  const parseSamples = (value: string) => {
    const parts = value.split(',').map(part => part.trim());
    const firstSample = parts[0] || value;
    const secondSample = parts.length > 1 ? parts[1] : null;
    return { firstSample, secondSample };
  };

  const { firstSample, secondSample } = parseSamples(item.value);

  return (
    <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow relative">
      <div className="flex">
        <div className={`w-16 flex items-center justify-center ${statusColor}`}>
          {getStatusIcon(item.status)}
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-lg text-slate-800">{item.parameter}</h4>
          </div>
          
          <div className="mb-3">
            <div className="text-2xl font-bold text-slate-700">
              {firstSample}
            </div>
            {secondSample && (
              <div className="text-lg font-semibold text-slate-600 mt-1">
                {secondSample}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            <div className="text-sm flex items-center gap-1">
              <span className="font-semibold text-slate-500">{t(commonTranslations.status)}: </span>
              <span className={`font-bold ${statusColor.replace('bg-', 'text-')}`}>
                {item.status}
              </span>
            </div>
            
            {item.recommendation && (
              <div 
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-full hover:bg-slate-100 p-0"
                >
                  <Info className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                  <span className="sr-only">View recommendation details</span>
                </Button>
                
                {showTooltip && (
                  <div className="absolute z-50 bottom-full left-0 mb-2 w-80 p-4 bg-white border border-slate-200 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Info className="h-4 w-4 text-emerald-600" />
                        {t(commonTranslations.recommendation)}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.recommendation}
                      </p>
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const AnimatedRating = ({ score }: { score: number }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState(0);
  
  useEffect(() => {
    const finalScore = Number.isFinite(score) ? score : 0;
    
    // Normalize to 0-10 scale
    let target = finalScore;
    if (finalScore > 10) {
      target = finalScore / 10;
    } else if (finalScore > 0 && finalScore <= 1) {
      target = finalScore * 10;
    }
    
    // Clamp to 0-10
    target = Math.min(Math.max(target, 0), 10);
    
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const current = start + (target - start) * easeOut;
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Color logic based on 0-10 scale
  const getColor = (val: number) => {
    if (val >= 8) return 'text-emerald-500';
    if (val >= 6) return 'text-green-500';
    if (val >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const colorClass = getColor(value);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 10) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          {/* Progress Circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${colorClass} transition-all duration-300`}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex flex-col items-center justify-center z-10">
          <span className={`text-2xl font-bold ${colorClass}`}>
            {value.toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase">
            {t(sensorTranslations.outOf10)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DetailedReport: React.FC<DetailedReportProps> = ({ 
  analysis, 
  onDownload, 
  onClear, 
  reportRef, 
  isDownloading,
  dataSource,
  sensorCollection
}) => {
  const { t } = useLanguage();

  const soilQualityScore = useMemo(() => {
    const parsed = Number(analysis.soilQuality.score);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [analysis.soilQuality.score]);

  const isGoodQuality = useMemo(() => {
    const rating = analysis.soilQuality.rating.toLowerCase();
    const score = Number(analysis.soilQuality.score);
    
    // Check against translated values
    const goodLabel = t(sensorAnalysisTranslations.qualityGood).toLowerCase();
    const averageLabel = t(sensorAnalysisTranslations.qualityAverage).toLowerCase();
    const poorLabel = t(sensorAnalysisTranslations.qualityPoor).toLowerCase();
    const optimalLabel = t(sensorAnalysisTranslations.optimal).toLowerCase();
    const normalLabel = t(sensorAnalysisTranslations.normal).toLowerCase();

    if (rating.includes(goodLabel) || rating.includes(optimalLabel) || rating.includes(normalLabel) || 
        rating.includes("good") || rating.includes("excellent") || rating.includes("optimal")) {
      return true;
    }
    
    // Fallback to score
    return Number.isFinite(score) && score >= 60;
  }, [analysis.soilQuality, t]);

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    const optimalLabel = t(sensorAnalysisTranslations.optimal).toLowerCase();
    const goodLabel = t(sensorAnalysisTranslations.good).toLowerCase();
    const normalLabel = t(sensorAnalysisTranslations.normal).toLowerCase();

    if (s.includes(optimalLabel) || s.includes(goodLabel) || s.includes(normalLabel) || 
        s.includes("optimal") || s.includes("good") || s.includes("adequate") || s.includes("medium") || s.includes("high")) {
      return <ThumbsUp className="h-6 w-6 text-white" fill="currentColor" />;
    }
    return <ThumbsDown className="h-6 w-6 text-white" fill="currentColor" />;
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    const optimalLabel = t(sensorAnalysisTranslations.optimal).toLowerCase();
    const goodLabel = t(sensorAnalysisTranslations.good).toLowerCase();
    const normalLabel = t(sensorAnalysisTranslations.normal).toLowerCase();
    const lowLabel = t(sensorAnalysisTranslations.low).toLowerCase();
    const checkLabel = t(sensorAnalysisTranslations.check).toLowerCase();

    if (s.includes(optimalLabel) || s.includes(goodLabel) || s.includes("optimal") || s.includes("good") || s.includes("adequate")) return "bg-green-500";
    if (s.includes(normalLabel) || s.includes("medium")) return "bg-yellow-500";
    if (s.includes(lowLabel) || s.includes(checkLabel) || s.includes("low") || s.includes("deficient")) return "bg-red-500";
    return "bg-orange-500";
  };

  return (
    <div className="animate-fade-in-up space-y-8 w-full max-w-7xl mx-auto">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">{t(commonTranslations.detailedSoilAnalysis)}</h2>
            {dataSource === "sensor" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg border-2 border-emerald-300">
                <Wifi className="h-4 w-4 text-emerald-700" />
                <span className="font-bold text-emerald-700 text-sm">
                  {t(sensorTranslations.sensorBasedDataCollection)}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t(commonTranslations.reportGeneratedOn)} {analysis.analysisTimestamp.split("T")[0]}
            {sensorCollection && sensorCollection.readings && (
              <span className="ml-2 text-emerald-600 font-semibold">
                • {sensorCollection.readings.length} {t(sensorTranslations.readings)} {t(sensorTranslations.from)} {sensorCollection.deviceInfo?.length || 0} {t(sensorTranslations.sensors)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t(commonTranslations.clear)}
          </Button>
          <Button onClick={onDownload} disabled={isDownloading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Download className="h-4 w-4" />
            {isDownloading ? t(commonTranslations.downloading) : t(commonTranslations.downloadPDF)}
          </Button>
        </div>
      </div>

      {/* Main Report Container */}
      <div ref={reportRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8" data-pdf-export>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                {dataSource === "sensor" ? (
                  <Wifi className="h-8 w-8 text-white" />
                ) : (
                  <Leaf className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-white mb-1">{t(commonTranslations.soilSathiAnalysis)}</h1>
                  {dataSource === "sensor" && (
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      <Activity className="h-3 w-3 mr-1" />
                      {t(sensorTranslations.sensorDataTab)}
                    </Badge>
                  )}
                </div>
                <p className="text-emerald-50 opacity-90">
                  {dataSource === "sensor" 
                    ? t(sensorTranslations.comprehensiveAnalysis)
                    : t(commonTranslations.advancedAIReport)}
                </p>
                {sensorCollection && sensorCollection.startTime && (
                  <p className="text-emerald-50/80 text-sm mt-1 flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    {t(sensorTranslations.collectionSummary)}: {new Date(sensorCollection.startTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <img src={BettercodeLogo} alt="Logo" className="h-8 w-auto brightness-0 invert opacity-90" />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          {/* Sensor Data Source Info */}
          {dataSource === "sensor" && sensorCollection && (
            <section className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6" data-pdf-export>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Wifi className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">
                  {t(sensorTranslations.sensorBasedDataCollection)}
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-sm text-slate-600 mb-1">{t(sensorTranslations.totalReadings)}</div>
                  <div className="text-2xl font-bold text-emerald-700">{sensorCollection.readings?.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-sm text-slate-600 mb-1">{t(sensorTranslations.sensorsUsed)}</div>
                  <div className="text-2xl font-bold text-emerald-700">{sensorCollection.deviceInfo?.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-sm text-slate-600 mb-1">{t(sensorTranslations.startTime)}</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {sensorCollection.startTime ? new Date(sensorCollection.startTime).toLocaleString() : "N/A"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 italic">
                {t(sensorTranslations.comprehensiveAnalysis)} - {t(sensorTranslations.sensorReadingsSummary)}
              </p>
            </section>
          )}

          {/* Executive Summary & Quality */}
          <section className="grid md:grid-cols-2 gap-8" data-pdf-export>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-emerald-600" />
                {t(commonTranslations.soilHealthSummary)}
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                {analysis.overview}
              </p>
            </div>

            <div className={`rounded-2xl p-6 border flex flex-col items-center justify-center text-center ${
              isGoodQuality ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
            }`}>
              <h3 className="text-xl font-bold text-slate-800 mb-4">{t(commonTranslations.overallQuality)}</h3>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
                {/* Thumbs Rating */}
                <div className="flex flex-col items-center">
                  <div className={`p-4 rounded-full mb-3 shadow-sm ${
                    isGoodQuality ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    {isGoodQuality ? (
                      <ThumbsUp className="h-8 w-8 text-white" fill="currentColor" />
                    ) : (
                      <ThumbsDown className="h-8 w-8 text-white" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-xl font-bold text-slate-800">
                    {analysis.soilQuality.rating}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block h-16 w-px bg-slate-200/80"></div>

                {/* Animated Gauge Rating */}
                <div className="flex flex-col items-center">
                  <AnimatedRating score={soilQualityScore} />
                </div>
              </div>
              
              <p className="text-slate-600 mt-6 text-sm">{analysis.soilQuality.description}</p>
            </div>
          </section>

          {/* Simplified Nutrient Analysis */}
          <section data-pdf-export>
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Sprout className="h-6 w-6 text-emerald-600" />
              {t(commonTranslations.nutrientAnalysis)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.nutrientAnalysis.map((item, index) => (
                <NutrientCard
                  key={index}
                  item={item}
                  index={index}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </section>

          {/* Recommendations Tabs */}
          <section data-pdf-export>
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              {t(sensorTranslations.recommendations)}
            </h3>

            <Tabs defaultValue="chemical" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
                <TabsTrigger value="chemical">{t(commonTranslations.chemicalPlan)}</TabsTrigger>
                <TabsTrigger value="organic">{t(commonTranslations.organicPlan)}</TabsTrigger>
              </TabsList>

              <TabsContent value="chemical" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.fertilizerRecommendations.chemical.map((rec, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-100 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FlaskConical className="h-24 w-24 text-blue-600" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-bold text-blue-900 text-lg mb-1">{rec.name}</h4>
                        <div className="inline-block bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm mb-3">
                          {rec.quantity}
                        </div>
                        <div className="space-y-1 text-sm text-blue-800/80">
                          <p><span className="font-semibold">{t(recommendationsTranslations.timing)}:</span> {rec.timing}</p>
                          <p><span className="font-semibold">{t(recommendationsTranslations.applicationMethod)}:</span> {rec.application}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="organic" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.fertilizerRecommendations.organic.map((rec, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-100 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Leaf className="h-24 w-24 text-green-600" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-bold text-green-900 text-lg mb-1">{rec.name}</h4>
                        <div className="inline-block bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm mb-3">
                          {rec.quantity}
                        </div>
                        <div className="space-y-1 text-sm text-green-800/80">
                          <p><span className="font-semibold">{t(recommendationsTranslations.timing)}:</span> {rec.timing}</p>
                          <p><span className="font-semibold">{t(recommendationsTranslations.applicationMethod)}:</span> {rec.application}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Action Plan & Warnings */}
          <section className="grid md:grid-cols-2 gap-8" data-pdf-export>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-emerald-600" />
                {t(commonTranslations.actionPlan)}
              </h3>
              <div className="space-y-3">
                {analysis.improvementPlan.map((plan, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="bg-emerald-100 p-2 rounded-full shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{plan.action}</h4>
                      <p className="text-sm text-slate-600">{plan.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t(commonTranslations.warningsAlerts)}
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <ul className="space-y-4">
                  {analysis.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-900 text-sm font-medium">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center text-slate-500 text-sm">
          <p>{t(commonTranslations.generatedBySoilSathi)}</p>
        </div>
      </div>
    </div>
  );
};

export default DetailedReport;
