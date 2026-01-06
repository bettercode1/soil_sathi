import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { fertilizerCostTranslations, commonTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveFertilizerCostCalculation } from "@/services/firebase/reportService";
import { Calculator, Plus, Trash2, Loader2, TrendingDown, IndianRupee, Wallet, CheckCircle2, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/utils/currencyUtils";
import { PageHero } from "@/components/shared/PageHero";

type Fertilizer = {
  name: string;
  type: "chemical" | "organic";
  quantity: number;
  unit: string;
  pricePerUnit: number;
};

type CostCalculationResponse = {
  language: string;
  totalCost: number;
  optimizedCost: number;
  savings: number;
  recommendations: string[];
};

const FertilizerCostCalculator = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [cropName, setCropName] = useState("");
  const [cropType, setCropType] = useState("");
  const [region, setRegion] = useState("");
  const [farmSizeValue, setFarmSizeValue] = useState("");
  const [farmSizeUnit, setFarmSizeUnit] = useState<"acre" | "hectare">("acre");
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([
    { name: "", type: "chemical", quantity: 0, unit: "kg", pricePerUnit: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [calculation, setCalculation] = useState<CostCalculationResponse | null>(null);

  const addFertilizer = () => {
    setFertilizers([
      ...fertilizers,
      { name: "", type: "chemical", quantity: 0, unit: "kg", pricePerUnit: 0 },
    ]);
  };

  const removeFertilizer = (index: number) => {
    setFertilizers(fertilizers.filter((_, i) => i !== index));
  };

  const updateFertilizer = (index: number, field: keyof Fertilizer, value: string | number) => {
    const updated = [...fertilizers];
    updated[index] = { ...updated[index], [field]: value };
    setFertilizers(updated);
  };

  const handleCalculate = async () => {
    if (!cropName.trim() || !region.trim() || !farmSizeValue.trim()) {
      toast({
        title: t(commonTranslations.missingInformation),
        description: t(commonTranslations.fillAllRequiredFields),
        variant: "destructive",
      });
      return;
    }

    const validFertilizers = fertilizers.filter(
      (f) => f.name.trim() && f.quantity > 0 && f.pricePerUnit > 0
    );

    if (validFertilizers.length === 0) {
      toast({
        title: t(commonTranslations.noFertilizers),
        description: t(commonTranslations.addFertilizerWithDetails),
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
    setCalculation(null);

    try {
      const response = await fetch(buildApiUrl("/api/fertilizer-cost"), {
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
          fertilizers: validFertilizers.map((f) => ({
            name: f.name.trim(),
            type: f.type,
            quantity: f.quantity,
            unit: f.unit,
            pricePerUnit: f.pricePerUnit,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<CostCalculationResponse>(response);
      setCalculation(result);

      // Save to Firebase
      try {
        await saveFertilizerCostCalculation({
          language: result.language as any,
          cropName: cropName.trim(),
          cropType: cropType.trim() || "Unknown",
          region: region.trim(),
          farmSize: {
            value: farmSizeNum,
            unit: farmSizeUnit,
          },
          fertilizers: validFertilizers.map((f) => ({
            name: f.name.trim(),
            type: f.type,
            quantity: f.quantity,
            unit: f.unit,
            pricePerUnit: f.pricePerUnit,
            totalCost: f.quantity * f.pricePerUnit,
          })),
          totalCost: result.totalCost,
          optimizedCost: result.optimizedCost,
          savings: result.savings,
          recommendations: result.recommendations,
        });
      } catch (err) {
        console.error("Failed to save calculation:", err);
      }

      toast({
        title: t(commonTranslations.calculationComplete),
        description: `${t(commonTranslations.potentialSavings)}: ${formatCurrency(result.savings)}`,
      });
    } catch (error) {
      toast({
        title: "Error calculating",
        description: error instanceof Error ? error.message : "Failed to calculate costs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHero
        title={t(fertilizerCostTranslations.title)}
        subtitle={t(fertilizerCostTranslations.subtitle)}
        icon={Calculator}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>{t(commonTranslations.cropFarmInfo)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Crop Name *</label>
                    <Input
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder="e.g., Tomato, Wheat"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Region *</label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g., Maharashtra"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Farm Size *</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={farmSizeValue}
                        onChange={(e) => setFarmSizeValue(e.target.value)}
                        placeholder="Size"
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
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t(commonTranslations.fertilizers)}</CardTitle>
                  <Button onClick={addFertilizer} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {t(fertilizerCostTranslations.addFertilizer)}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fertilizers.map((fertilizer, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Fertilizer {index + 1}</span>
                      {fertilizers.length > 1 && (
                        <Button
                          onClick={() => removeFertilizer(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          value={fertilizer.name}
                          onChange={(e) => updateFertilizer(index, "name", e.target.value)}
                          placeholder="e.g., Urea, DAP"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={fertilizer.type}
                          onValueChange={(v: "chemical" | "organic") => updateFertilizer(index, "type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chemical">Chemical</SelectItem>
                            <SelectItem value="organic">Organic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity *</label>
                        <Input
                          type="number"
                          min="0"
                          value={fertilizer.quantity || ""}
                          onChange={(e) => updateFertilizer(index, "quantity", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Unit</label>
                        <Select
                          value={fertilizer.unit}
                          onValueChange={(v) => updateFertilizer(index, "unit", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="quintal">Quintal</SelectItem>
                            <SelectItem value="bag">Bag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          {t(commonTranslations.pricePerUnit)} <span className="text-emerald-600">(₹)</span> *
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            value={fertilizer.pricePerUnit || ""}
                            onChange={(e) => updateFertilizer(index, "pricePerUnit", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              onClick={handleCalculate}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t(commonTranslations.calculating)}
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-5 w-5" />
                  {t(fertilizerCostTranslations.calculate)}
                </>
              )}
            </Button>

            {calculation && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Visual Cost Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Cost */}
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium text-slate-500 mb-2">Total Current Cost</span>
                      <span className="text-3xl font-bold text-slate-800">{formatCurrency(calculation.totalCost)}</span>
                      <span className="text-xs text-slate-400 mt-1">Based on inputs</span>
                    </CardContent>
                  </Card>

                  {/* Savings */}
                  <Card className="bg-emerald-50 border-emerald-100 shadow-md transform md:-translate-y-2">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="p-3 bg-emerald-100 rounded-full mb-2">
                        <Wallet className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-emerald-700 mb-1">{t(commonTranslations.potentialSavings)}</span>
                      <span className="text-4xl font-extrabold text-emerald-600">{formatCurrency(calculation.savings)}</span>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2 font-medium bg-white px-2 py-1 rounded-full">
                        <ArrowDown className="h-3 w-3" />
                        Save Money
                      </div>
                    </CardContent>
                  </Card>

                  {/* Optimized Cost */}
                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium text-blue-600 mb-2">Optimized Cost</span>
                      <span className="text-3xl font-bold text-blue-700">{formatCurrency(calculation.optimizedCost)}</span>
                      <span className="text-xs text-blue-500 mt-1">Recommended Plan</span>
                    </CardContent>
                  </Card>
                </div>

                {calculation.recommendations.length > 0 && (
                  <Card className="border border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {t(fertilizerCostTranslations.recommendations)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {calculation.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-slate-700">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold mt-0.5">
                              {idx + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FertilizerCostCalculator;
