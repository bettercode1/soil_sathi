import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cropGrowthTranslations, commonTranslations } from "@/constants/allTranslations";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { GrowthTimeline } from "@/components/shared/GrowthTimeline";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveGrowthMonitoringEntry } from "@/services/firebase/reportService";
import { useFirebaseStorage } from "@/hooks/useFirebaseStorage";
import { fileToBase64, compressImage } from "@/utils/imageUtils";
import { TrendingUp, Loader2, Calendar, Sprout, Leaf, Activity, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { GrowthMonitoringEntry } from "@/types/firebase";
import { PageHero } from "@/components/shared/PageHero";

type GrowthAnalysis = {
  language: string;
  growthStage: string;
  growthStageConfidence: number;
  healthScore: number;
  observations: string[];
  aiAnalysis: string;
  yieldPrediction?: {
    estimatedYield: number;
    unit: string;
    confidence: number;
    factors: string[];
  };
};

const CropGrowthMonitor = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { uploadFileResumable } = useFirebaseStorage();

  const [cropName, setCropName] = useState("");
  const [cropType, setCropType] = useState("");
  const [region, setRegion] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GrowthAnalysis | null>(null);
  const [entries, setEntries] = useState<GrowthMonitoringEntry[]>([]);

  const handleImageSelect = async (file: File, preview: string) => {
    try {
      const compressedFile = await compressImage(file, 1920, 1920, 0.8);
      setImageFile(compressedFile);
      setSelectedImage(preview);
      setAnalysis(null);
    } catch (err) {
      toast({
        title: t(commonTranslations.errorAnalyzing),
        description: err instanceof Error ? err.message : t(commonTranslations.errorAnalyzing),
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !cropName.trim()) {
      toast({
        title: t(commonTranslations.missingInformation),
        description: t(commonTranslations.provideCropNameAndImage),
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type;

      const previousStage = entries.length > 0 ? entries[entries.length - 1].growthStage : undefined;

      const response = await fetch(buildApiUrl("/api/analyze-growth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cropName: cropName.trim(),
          cropType: cropType.trim() || undefined,
          region: region.trim() || undefined,
          imageData: base64Data,
          imageMimeType: mimeType,
          previousGrowthStage: previousStage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<GrowthAnalysis>(response);
      setAnalysis(result);

      // Upload image and save entry
      const timestamp = Date.now();
      const imagePath = `crop-growth/${timestamp}-${imageFile.name}`;
      const imageUrl = await uploadFileResumable(imageFile, imagePath);

      const entry: Omit<GrowthMonitoringEntry, "id" | "createdAt"> = {
        language: result.language as any,
        cropName: cropName.trim(),
        cropType: cropType.trim() || "Unknown",
        region: region.trim() || "Unknown",
        photoDate: new Date(),
        growthStage: result.growthStage,
        growthStageConfidence: result.growthStageConfidence,
        healthScore: result.healthScore,
        observations: result.observations,
        aiAnalysis: result.aiAnalysis,
        yieldPrediction: result.yieldPrediction,
        imageUrl,
        imageStoragePath: imagePath,
      };

      const entryId = await saveGrowthMonitoringEntry(entry);
      const newEntry = { ...entry, id: entryId, createdAt: new Date() };
      setEntries([...entries, newEntry]);

      toast({
        title: t(commonTranslations.analysisComplete),
        description: `${t(cropGrowthTranslations.growthStage)}: ${result.growthStage}`,
      });
    } catch (error) {
      toast({
        title: t(commonTranslations.errorAnalyzing),
        description: error instanceof Error ? error.message : t(commonTranslations.errorAnalyzing),
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100", icon: TrendingUp };
    if (score >= 60) return { label: "Good", color: "text-emerald-600", bg: "bg-emerald-100", icon: Activity };
    if (score >= 40) return { label: "Average", color: "text-yellow-600", bg: "bg-yellow-100", icon: Minus };
    return { label: "Poor", color: "text-red-600", bg: "bg-red-100", icon: ArrowDownRight };
  };

  return (
    <Layout>
      <PageHero
        title={t(cropGrowthTranslations.title)}
        subtitle={t(cropGrowthTranslations.subtitle)}
        icon={Sprout}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                  {t(cropGrowthTranslations.uploadPhoto)}
                </CardTitle>
                <CardDescription>
                  {language === "en" 
                    ? "Upload weekly photos to track crop growth and health" 
                    : "फसल वृद्धि और स्वास्थ्य को ट्रैक करने के लिए साप्ताहिक फोटो अपलोड करें"}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t(commonTranslations.region)}</label>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={t(commonTranslations.regionPlaceholder)}
                  />
                </div>

                <ImageUploader
                  onImageSelect={handleImageSelect}
                  onImageRemove={() => {
                    setSelectedImage(null);
                    setImageFile(null);
                  }}
                  currentImage={selectedImage}
                  maxSizeMB={5}
                />

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !imageFile || !cropName.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t(commonTranslations.analyzing)}
                    </>
                  ) : (
                    <>
                      <Sprout className="mr-2 h-5 w-5" />
                      {t(cropGrowthTranslations.analyze)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Simplified Visual Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Health Score Card */}
                  <Card className={`border-none shadow-md ${getHealthStatus(analysis.healthScore).bg}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Crop Health</h3>
                      <div className={`p-4 rounded-full bg-white shadow-sm mb-2`}>
                        {React.createElement(getHealthStatus(analysis.healthScore).icon, { 
                          className: `h-8 w-8 ${getHealthStatus(analysis.healthScore).color}` 
                        })}
                      </div>
                      <span className={`text-4xl font-bold ${getHealthStatus(analysis.healthScore).color}`}>
                        {analysis.healthScore}/100
                      </span>
                      <span className="text-sm font-medium text-slate-600 mt-1">
                        {getHealthStatus(analysis.healthScore).label}
                      </span>
                    </CardContent>
                  </Card>

                  {/* Growth Stage Card */}
                  <Card className="border-blue-100 bg-blue-50/50 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">{t(cropGrowthTranslations.growthStage)}</h3>
                      <Badge className="text-lg py-1 px-4 bg-blue-600 hover:bg-blue-700 mb-2">
                        {analysis.growthStage}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        Confidence: {analysis.growthStageConfidence.toFixed(0)}%
                      </span>
                    </CardContent>
                  </Card>

                  {/* Yield Prediction Card */}
                  {analysis.yieldPrediction && (
                    <Card className="border-amber-100 bg-amber-50/50 shadow-md">
                      <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">{t(cropGrowthTranslations.yieldPrediction)}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-amber-700">
                            {analysis.yieldPrediction.estimatedYield}
                          </span>
                          <span className="text-sm font-medium text-amber-600">
                            {analysis.yieldPrediction.unit}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-2">Estimated Yield</span>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Detailed Analysis Text */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      Detailed Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-emerald-500" />
                        {t(cropGrowthTranslations.observations)}
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysis.observations.map((obs, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                            <span className="text-emerald-500 font-bold">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <h3 className="font-semibold text-slate-800 mb-2">AI Assessment</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{analysis.aiAnalysis}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {entries.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">{t(cropGrowthTranslations.timeline)}</h2>
                  <Badge variant="outline" className="text-sm">
                    {entries.length} Entries
                  </Badge>
                </div>
                
                <GrowthTimeline
                  entries={entries.map((entry) => ({
                    id: entry.id || "",
                    date: entry.photoDate,
                    imageUrl: entry.imageUrl,
                    growthStage: {
                      stage: entry.growthStage,
                      confidence: entry.growthStageConfidence,
                      healthScore: entry.healthScore,
                    },
                    observations: entry.observations,
                    aiAnalysis: entry.aiAnalysis,
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CropGrowthMonitor;
