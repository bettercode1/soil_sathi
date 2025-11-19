import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { irrigationSchedulerTranslations, commonTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveIrrigationSchedule } from "@/services/firebase/reportService";
import { Droplets, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/shared/PageHero";
import IrrigationScheduleChart from "@/components/reports/IrrigationScheduleChart";

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
                <CardTitle>{t(commonTranslations.cropFarmInfo)}</CardTitle>
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
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder={t(commonTranslations.regionPlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.farmSize)} *</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={farmSizeValue}
                        onChange={(e) => setFarmSizeValue(e.target.value)}
                        placeholder={t(commonTranslations.farmSize)}
                        className="flex-1"
                      />
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t(commonTranslations.generating)}
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      {t(irrigationSchedulerTranslations.generateSchedule)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {scheduleData && (
              <div className="space-y-6">
                {/* Visual Schedule Chart */}
                <IrrigationScheduleChart schedule={scheduleData.schedule} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t(irrigationSchedulerTranslations.schedule)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scheduleData.schedule.slice(0, 14).map((item, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">
                                {format(new Date(item.date), "MMM dd, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">{item.method}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{item.duration} min</p>
                              <p className="text-sm text-muted-foreground">
                                {item.amount} {item.amount > 1000 ? "L" : "mm"}
                              </p>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {scheduleData.weatherAdjustments && scheduleData.weatherAdjustments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Weather-Based Adjustments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scheduleData.weatherAdjustments.map((adj, idx) => (
                          <div key={idx} className="border rounded-lg p-4 bg-amber-50">
                            <p className="font-semibold mb-1">
                              {format(new Date(adj.date), "MMM dd, yyyy")}
                            </p>
                            <p className="text-sm mb-1">
                              <span className="font-medium">Original:</span> {adj.originalSchedule}
                            </p>
                            <p className="text-sm mb-1">
                              <span className="font-medium">Adjusted:</span> {adj.adjustedSchedule}
                            </p>
                            <p className="text-sm text-muted-foreground">{adj.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>{t(irrigationSchedulerTranslations.optimizationTips)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {scheduleData.waterUsageOptimization.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
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

