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
import { TrendingUp, Loader2, Calendar } from "lucide-react";
import type { GrowthMonitoringEntry } from "@/types/firebase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHero } from "@/components/shared/PageHero";
import HealthScoreGauge from "@/components/reports/HealthScoreGauge";

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

  const chartData = entries.map((entry, index) => ({
    date: entry.photoDate instanceof Date 
      ? entry.photoDate.toLocaleDateString() 
      : new Date(entry.photoDate).toLocaleDateString(),
    healthScore: entry.healthScore,
    index: index + 1,
  }));

  return (
    <Layout>
      <PageHero
        title={t(cropGrowthTranslations.title)}
        subtitle={t(cropGrowthTranslations.subtitle)}
        icon={TrendingUp}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t(cropGrowthTranslations.uploadPhoto)}</CardTitle>
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t(commonTranslations.analyzing)}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {t(cropGrowthTranslations.analyze)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <div className="space-y-6">
                {/* Visual Health Score Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HealthScoreGauge 
                    score={analysis.healthScore} 
                    title="Crop Health Score"
                  />
                  <Card className="border border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle>{t(commonTranslations.analysisResults)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {t(cropGrowthTranslations.growthStage)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-lg">
                            {analysis.growthStage}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {analysis.growthStageConfidence.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {analysis.yieldPrediction && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {t(cropGrowthTranslations.yieldPrediction)}
                          </p>
                          <p className="text-lg font-semibold">
                            {analysis.yieldPrediction.estimatedYield} {analysis.yieldPrediction.unit}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analysis */}
                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>Detailed Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">{t(cropGrowthTranslations.observations)}</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {analysis.observations.map((obs, idx) => (
                          <li key={idx}>{obs}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">AI Analysis</h3>
                      <p className="text-sm text-muted-foreground">{analysis.aiAnalysis}</p>
                    </div>

                    {analysis.yieldPrediction && (
                      <div>
                        <h3 className="font-semibold mb-2">Yield Factors</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {analysis.yieldPrediction.factors.map((factor, idx) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {entries.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Health Score Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="healthScore" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div>
                  <h2 className="text-2xl font-bold mb-4">{t(cropGrowthTranslations.timeline)}</h2>
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
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CropGrowthMonitor;

