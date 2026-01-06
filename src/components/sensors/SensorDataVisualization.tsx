/**
 * Sensor Data Visualization Component
 * Displays sensor readings in charts and graphs with ratings and interactive elements
 */

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Droplets,
  Thermometer,
  Leaf,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Star,
  BarChart3,
  Gauge,
  Award,
  Sparkles,
  Zap
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorTranslations } from "@/constants/sensorTranslations";
import type { SensorDataCollection, SensorReading } from "@/types/sensor-data";
import { analyzeSensorData } from "@/utils/sensorSimulator";

interface SensorDataVisualizationProps {
  collection: SensorDataCollection;
  analysis?: ReturnType<typeof analyzeSensorData>;
}

export const SensorDataVisualization: React.FC<SensorDataVisualizationProps> = ({
  collection,
  analysis: providedAnalysis,
}) => {
  const { t } = useLanguage();
  const analysis = providedAnalysis || analyzeSensorData(collection);

  // Calculate overall rating (0-10 scale)
  const overallRating = useMemo(() => {
    const qualityScore = analysis.qualityScore || 0;
    const completeness = analysis.dataCompleteness || 0;
    return Math.round((qualityScore + completeness) / 20); // 0-10 scale
  }, [analysis]);

  // Determine if rating is good (thumbs up) or needs attention (thumbs down)
  const isGoodRating = overallRating >= 7;

  const getTrendIcon = (trend: "increasing" | "decreasing" | "stable") => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "moisture":
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case "temperature":
        return <Thermometer className="h-5 w-5 text-red-500" />;
      case "ph":
        return <Activity className="h-5 w-5 text-purple-500" />;
      default:
        return <Leaf className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = (value: number, type: string) => {
    switch (type.toLowerCase()) {
      case "ph":
        if (value >= 6.5 && value <= 7.5) return "text-green-600";
        if (value >= 6.0 && value <= 8.0) return "text-yellow-600";
        return "text-red-600";
      case "moisture":
        if (value >= 40 && value <= 60) return "text-green-600";
        if (value >= 30 && value <= 70) return "text-yellow-600";
        return "text-red-600";
      case "temperature":
        if (value >= 20 && value <= 30) return "text-green-600";
        if (value >= 15 && value <= 35) return "text-yellow-600";
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating Card with Thumbs Up/Down */}
      <Card className="border-2 border-gradient-to-r from-emerald-200 to-blue-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className={`p-3 rounded-xl ${isGoodRating ? 'bg-emerald-100' : 'bg-yellow-100'}`}>
              {isGoodRating ? (
                <ThumbsUp className="h-7 w-7 text-emerald-600" />
              ) : (
                <ThumbsDown className="h-7 w-7 text-yellow-600" />
              )}
            </div>
            <span>{t(sensorTranslations.overallRating)}</span>
            <Badge 
              variant="outline" 
              className={`ml-auto text-lg px-4 py-1 ${
                isGoodRating 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-yellow-50 text-yellow-700 border-yellow-300'
              }`}
            >
              {overallRating}/10
            </Badge>
          </CardTitle>
          <CardDescription className="text-base flex items-center gap-2 mt-2">
            <Award className="h-4 w-4 text-emerald-500" />
            {isGoodRating 
              ? t(sensorTranslations.excellentDataQuality)
              : t(sensorTranslations.dataQualityNeedsAttention)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            {/* Rating Display */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallRating / 10)}`}
                    className={`transition-all duration-1000 ${
                      isGoodRating ? 'text-emerald-500' : 'text-yellow-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-4xl font-bold ${isGoodRating ? 'text-emerald-600' : 'text-yellow-600'}`}>
                    {overallRating}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">{t(sensorTranslations.outOf10)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(overallRating / 2)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 flex-1 max-w-md">
              <div className="p-4 bg-white rounded-xl border-2 border-emerald-100 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-5 w-5 text-emerald-600" />
                  <div className="text-2xl font-bold text-emerald-700">{analysis.qualityScore}%</div>
                </div>
                <div className="text-xs font-semibold text-slate-600">{t(sensorTranslations.dataQuality)}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {analysis.qualityScore >= 80 ? t(sensorTranslations.excellent) :
                   analysis.qualityScore >= 60 ? t(sensorTranslations.good) :
                   analysis.qualityScore >= 40 ? t(sensorTranslations.fair) : t(sensorTranslations.poor)}
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-blue-100 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-700">{analysis.dataCompleteness}%</div>
                </div>
                <div className="text-xs font-semibold text-slate-600">{t(sensorTranslations.dataCompleteness)}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {collection.readings.length} {t(sensorTranslations.readings)}
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-purple-100 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-700">
                    {collection.endTime && collection.startTime
                      ? Math.round(
                          (new Date(collection.endTime).getTime() -
                            new Date(collection.startTime).getTime()) /
                            1000
                        )
                      : 0}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600">{t(sensorTranslations.collectionDuration)}</div>
                <div className="text-xs text-slate-500 mt-1">{t(sensorTranslations.totalTime)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-orange-100 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-700">{collection.deviceInfo.length}</div>
                </div>
                <div className="text-xs font-semibold text-slate-600">{t(sensorTranslations.sensorsUsed)}</div>
                <div className="text-xs text-slate-500 mt-1">{t(sensorTranslations.activeDevices)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <span>{t(sensorTranslations.sensorDataAnalysis)}</span>
          </CardTitle>
          <CardDescription className="text-base flex items-center gap-2 mt-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            {t(sensorTranslations.comprehensiveAnalysis)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-5 w-5 text-emerald-600" />
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.dataQuality)}</div>
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-1">{analysis.qualityScore}%</div>
              <div className="text-xs text-slate-500">
                {analysis.qualityScore >= 80 ? t(sensorTranslations.excellent) :
                 analysis.qualityScore >= 60 ? t(sensorTranslations.good) :
                 analysis.qualityScore >= 40 ? t(sensorTranslations.fair) : t(sensorTranslations.poor)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.dataCompleteness)}</div>
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-1">{analysis.dataCompleteness}%</div>
                <div className="text-xs text-slate-500">
                {collection.readings.length} {t(sensorTranslations.readings)} {t(sensorTranslations.from)} {collection.deviceInfo.length} {t(sensorTranslations.sensors)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <div className="text-sm font-semibold text-slate-600">{t(sensorTranslations.collectionDuration)}</div>
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {collection.endTime && collection.startTime
                  ? Math.round(
                      (new Date(collection.endTime).getTime() -
                        new Date(collection.startTime).getTime()) /
                        1000
                    )
                  : 0}
                <span className="text-lg">s</span>
              </div>
              <div className="text-xs text-slate-500">{t(sensorTranslations.totalTime)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Readings Summary with Ratings */}
      <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
            <span>{t(sensorTranslations.sensorReadingsSummary)}</span>
          </CardTitle>
          <CardDescription className="text-base flex items-center gap-2 mt-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            {t(sensorTranslations.averageValuesTrends)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis.averageValues).map(([type, data]: [string, any]) => {
              const trend = analysis.trends[type as keyof typeof analysis.trends];
              const min = analysis.minValues[type as keyof typeof analysis.minValues];
              const max = analysis.maxValues[type as keyof typeof analysis.maxValues];
              
              // Calculate rating for this sensor (0-10)
              const sensorRating = useMemo(() => {
                if (type === "ph") {
                  const ph = data.value;
                  if (ph >= 6.5 && ph <= 7.5) return 10;
                  if (ph >= 6.0 && ph <= 8.0) return 7;
                  return 4;
                }
                if (type === "moisture") {
                  const moisture = data.value;
                  if (moisture >= 40 && moisture <= 60) return 10;
                  if (moisture >= 30 && moisture <= 70) return 7;
                  return 4;
                }
                return 8; // Default good rating
              }, [type, data.value]);

              const isGoodSensor = sensorRating >= 7;
              
              return (
                <div
                  key={type}
                  className="group p-5 bg-white border-2 rounded-xl hover:border-emerald-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-blue-50/0 group-hover:from-emerald-50/50 group-hover:to-blue-50/50 transition-all duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(data.value, type).replace('text-', 'bg-').replace('-600', '-100')}`}>
                          {getSensorIcon(type)}
                        </div>
                        <div>
                          <span className="font-bold text-base capitalize text-slate-800">{type.replace("_", " ")}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {isGoodSensor ? (
                              <ThumbsUp className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className={`text-xs font-bold ${isGoodSensor ? 'text-emerald-600' : 'text-yellow-600'}`}>
                              {sensorRating}/10
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(trend)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            trend === "increasing" ? "bg-green-50 text-green-700 border-green-200" :
                            trend === "decreasing" ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {trend === "increasing" ? t(sensorTranslations.increasing) :
                           trend === "decreasing" ? t(sensorTranslations.decreasing) : t(sensorTranslations.stable)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className={`text-4xl font-bold mb-2 ${getStatusColor(data.value, type)}`}>
                      {data.value}
                    </div>
                    <div className="text-sm font-semibold text-slate-600 mb-3">{data.unit}</div>
                    
                    {/* Range Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Min: {min?.toFixed(2)}</span>
                        <span>Max: {max?.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isGoodSensor ? 'bg-emerald-500' : 'bg-yellow-500'} transition-all duration-500`}
                          style={{ width: `${(data.value - min) / (max - min) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="bg-slate-50">
                        {data.count} {t(sensorTranslations.readings)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.round(sensorRating / 2)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <span>{t(sensorTranslations.recommendations)}</span>
            </CardTitle>
            <CardDescription className="text-base flex items-center gap-2 mt-2">
              <Award className="h-4 w-4 text-blue-500" />
              {t(sensorTranslations.basedOnSensorData)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-blue-100 hover:border-blue-300 transition-all"
                >
                  <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700 flex-1">{rec}</span>
                  <ThumbsUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Depth Analysis */}
      {collection.readings.some(r => r.depth !== undefined) && (
        <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50/50 to-white shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <span>{t(sensorTranslations.depthAnalysis)}</span>
            </CardTitle>
            <CardDescription className="text-base flex items-center gap-2 mt-2">
              <Activity className="h-4 w-4 text-orange-500" />
              {t(sensorTranslations.readingsAtDepths)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from(
                new Set(collection.readings.map(r => r.depth).filter(d => d !== undefined))
              ).sort((a, b) => (a || 0) - (b || 0)).map((depth) => {
                const depthReadings = collection.readings.filter(r => r.depth === depth);
                const readingsByType = new Map<string, number[]>();
                
                depthReadings.forEach(r => {
                  if (!readingsByType.has(r.sensorType)) {
                    readingsByType.set(r.sensorType, []);
                  }
                  readingsByType.get(r.sensorType)!.push(r.value);
                });

                return (
                  <div key={depth} className="p-5 bg-white border-2 border-orange-100 rounded-xl hover:border-orange-300 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="font-bold text-lg text-slate-800">{t(sensorTranslations.depth)}: {depth} cm</div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {depthReadings.length} {t(sensorTranslations.readings)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from(readingsByType.entries()).map(([type, values]) => {
                        const avg = values.reduce((a, b) => a + b, 0) / values.length;
                        const reading = depthReadings.find(r => r.sensorType === type);
                        const isGood = (type === "ph" && avg >= 6.5 && avg <= 7.5) ||
                                      (type === "moisture" && avg >= 40 && avg <= 60);
                        return (
                          <div key={type} className="p-3 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 hover:border-orange-300 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              {getSensorIcon(type)}
                              <div className="text-xs font-semibold text-slate-600 capitalize">
                                {type.replace("_", " ")}
                              </div>
                              {isGood ? (
                                <ThumbsUp className="h-3 w-3 text-emerald-600 ml-auto" />
                              ) : (
                                <ThumbsDown className="h-3 w-3 text-yellow-600 ml-auto" />
                              )}
                            </div>
                            <div className={`text-2xl font-bold ${getStatusColor(avg, type)}`}>
                              {avg.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{reading?.unit}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
