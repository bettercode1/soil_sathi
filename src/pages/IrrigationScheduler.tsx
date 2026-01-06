import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { irrigationSchedulerTranslations, commonTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveIrrigationSchedule } from "@/services/firebase/reportService";
import { Droplets, Calendar as CalendarIcon, Loader2, Sprout, MapPin, Ruler, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { PageHero } from "@/components/shared/PageHero";

type IrrigationScheduleItem = {
  date: string;
  duration: number;
  amount: number;
  method: string;
  notes: string;
};

type IrrigationScheduleResponse = {
  language: string;
  schedule: IrrigationScheduleItem[];
  weatherAdjustments?: Array<{
    date: string;
    originalSchedule: string;
    adjustedSchedule: string;
    reason: string;
  }>;
  waterUsageOptimization: string[];
};

const IrrigationScheduler = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [cropName, setCropName] = useState("");
  const [cropType, setCropType] = useState("");
  const [region, setRegion] = useState("");
  const [farmSizeValue, setFarmSizeValue] = useState("");
  const [farmSizeUnit, setFarmSizeUnit] = useState<"acre" | "hectare">("acre");
  const [irrigationMethod, setIrrigationMethod] = useState("");
  const [soilMoisture, setSoilMoisture] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<IrrigationScheduleResponse | null>(null);

  const irrigationMethods = [
    { value: "Drip Irrigation", label: t(commonTranslations.dripIrrigation) },
    { value: "Sprinkler", label: t(commonTranslations.sprinkler) },
    { value: "Surface/Canal", label: t(commonTranslations.surfaceCanal) },
    { value: "Borewell/Tube Well", label: t(commonTranslations.borewellTubeWell) },
    { value: "Rainfed", label: t(commonTranslations.rainfed) },
  ];

  const handleGenerateSchedule = async () => {
    if (!cropName.trim() || !region.trim() || !farmSizeValue.trim()) {
      toast({
        title: t(commonTranslations.missingInformation),
        description: t(commonTranslations.fillAllRequiredFields),
        variant: "destructive",
      });
      return;
    }

    const farmSizeNum = parseFloat(farmSizeValue);
    if (isNaN(farmSizeNum) || farmSizeNum <= 0) {
      toast({
        title: t(commonTranslations.invalidFarmSize),
        description: t(commonTranslations.enterValidFarmSize),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setScheduleData(null);

    try {
      const response = await fetch(buildApiUrl("/api/irrigation-schedule"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cropName: cropName.trim(),
          cropType: cropType.trim() || undefined,
          region: region.trim(),
          farmSize: {
            value: farmSizeNum,
            unit: farmSizeUnit,
          },
          irrigationMethod: irrigationMethod || undefined,
          soilMoisture: soilMoisture ? parseFloat(soilMoisture) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<IrrigationScheduleResponse>(response);
      setScheduleData(result);

      // Save to Firebase
      try {
        await saveIrrigationSchedule({
          language: result.language as any,
          cropName: cropName.trim(),
          cropType: cropType.trim() || "Unknown",
          region: region.trim(),
          farmSize: {
            value: farmSizeNum,
            unit: farmSizeUnit,
          },
          irrigationMethod: irrigationMethod || "Not specified",
          soilMoisture: soilMoisture ? parseFloat(soilMoisture) : undefined,
          schedule: result.schedule.map((item) => ({
            date: new Date(item.date),
            duration: item.duration,
            amount: item.amount,
            method: item.method,
            notes: item.notes,
            completed: false,
          })),
          weatherAdjustments: result.weatherAdjustments?.map((adj) => ({
            date: new Date(adj.date),
            originalSchedule: adj.originalSchedule,
            adjustedSchedule: adj.adjustedSchedule,
            reason: adj.reason,
          })) || [],
          waterUsageOptimization: result.waterUsageOptimization,
        });
      } catch (err) {
        console.error("Failed to save schedule:", err);
      }

      toast({
        title: t(commonTranslations.scheduleGenerated),
        description: t(commonTranslations.irrigationScheduleCreated),
      });
    } catch (error) {
      toast({
        title: t(commonTranslations.errorGeneratingSchedule),
        description: error instanceof Error ? error.message : t(commonTranslations.errorGeneratingSchedule),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHero
        title={t(irrigationSchedulerTranslations.title)}
        subtitle={t(irrigationSchedulerTranslations.subtitle)}
        icon={Droplets}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-emerald-500" />
                  {t(commonTranslations.cropFarmInfo)}
                </CardTitle>
                <CardDescription>
                  {t(irrigationSchedulerTranslations.subtitle)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.cropName)} *</label>
                    <Input
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder={t(commonTranslations.cropNamePlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.cropType)}</label>
                    <Input
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      placeholder={t(commonTranslations.cropTypePlaceholder)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.region)} *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder={t(commonTranslations.regionPlaceholder)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.farmSize)} *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="number"
                          value={farmSizeValue}
                          onChange={(e) => setFarmSizeValue(e.target.value)}
                          placeholder={t(commonTranslations.farmSize)}
                          className="pl-9"
                        />
                      </div>
                      <Select value={farmSizeUnit} onValueChange={(v: "acre" | "hectare") => setFarmSizeUnit(v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acre">{t(commonTranslations.acre)}</SelectItem>
                          <SelectItem value="hectare">{t(commonTranslations.hectare)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(irrigationSchedulerTranslations.irrigationMethod)}
                    </label>
                    <Select value={irrigationMethod} onValueChange={setIrrigationMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(commonTranslations.selectMethod)} />
                      </SelectTrigger>
                      <SelectContent>
                        {irrigationMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(irrigationSchedulerTranslations.soilMoisture)}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={soilMoisture}
                      onChange={(e) => setSoilMoisture(e.target.value)}
                      placeholder="0-100"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateSchedule}
                  disabled={isLoading || !cropName.trim() || !region.trim() || !farmSizeValue.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t(commonTranslations.generating)}
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-5 w-5" />
                      {t(irrigationSchedulerTranslations.generateSchedule)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {scheduleData && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Visual Schedule Timeline */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-slate-800">{t(irrigationSchedulerTranslations.schedule)}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scheduleData.schedule.slice(0, 9).map((item, idx) => (
                      <Card key={idx} className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${idx === 0 ? 'border-l-emerald-500 bg-emerald-50/50' : 'border-l-blue-400 bg-white'}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {format(new Date(item.date), "MMM dd")}
                            </span>
                            {idx === 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                Next
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Droplets className="h-5 w-5 text-blue-500" />
                            <span className="text-xl font-bold text-slate-800">{item.amount} {item.amount > 1000 ? "L" : "mm"}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>{item.duration} min</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{item.method}</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                              {item.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {scheduleData.weatherAdjustments && scheduleData.weatherAdjustments.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Weather-Based Adjustments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scheduleData.weatherAdjustments.map((adj, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-amber-900">
                                {format(new Date(adj.date), "MMMM dd, yyyy")}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase">Original Plan</span>
                                <span className="font-medium text-slate-700 decoration-slate-400 line-through decoration-1">{adj.originalSchedule}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-emerald-600 uppercase font-bold">New Plan</span>
                                <span className="font-bold text-emerald-700">{adj.adjustedSchedule}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded">
                              Reason: {adj.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      {t(irrigationSchedulerTranslations.optimizationTips)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scheduleData.waterUsageOptimization.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default IrrigationScheduler;
