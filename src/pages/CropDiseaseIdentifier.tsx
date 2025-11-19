import React, { useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cropDiseaseTranslations, commonTranslations } from "@/constants/allTranslations";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveCropDiseaseReport } from "@/services/firebase/reportService";
import { useFirebaseStorage } from "@/hooks/useFirebaseStorage";
import { fileToBase64, compressImage } from "@/utils/imageUtils";
import { AlertTriangle, Leaf, FlaskConical, Shield, Save, Loader2, Bug } from "lucide-react";
import type { CropDiseaseReport } from "@/types/firebase";
import { PageHero } from "@/components/shared/PageHero";
import DiseaseSeverityGauge from "@/components/reports/DiseaseSeverityGauge";
import TreatmentComparisonChart from "@/components/reports/TreatmentComparisonChart";

type DiseaseAnalysis = {
  language: string;
  diseaseName: string;
  diseaseType: "disease" | "pest" | "nutrient_deficiency" | "other";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: {
    organic: Array<{
      name: string;
      method: string;
      timing: string;
      notes: string;
    }>;
    chemical: Array<{
      name: string;
      method: string;
      timing: string;
      notes: string;
      safetyWarnings?: string[];
    }>;
  };
  preventionTips: string[];
};

const CropDiseaseIdentifier = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { uploadFileResumable } = useFirebaseStorage();

  const [cropName, setCropName] = useState("");
  const [cropType, setCropType] = useState("");
  const [region, setRegion] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DiseaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageSelect = async (file: File, preview: string) => {
    try {
      // Compress image before storing
      const compressedFile = await compressImage(file, 1920, 1920, 0.8);
      setImageFile(compressedFile);
      setSelectedImage(preview);
      setAnalysis(null);
      setError(null);
    } catch (err) {
      toast({
        title: t(cropDiseaseTranslations.errorAnalyzing),
        description: err instanceof Error ? err.message : t(commonTranslations.failedToProcessImage),
        variant: "destructive",
      });
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImageFile(null);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile || !cropName.trim()) {
      toast({
        title: t(cropDiseaseTranslations.noImageSelected),
        description: !cropName.trim()
          ? t(commonTranslations.pleaseEnterCropName)
          : t(cropDiseaseTranslations.noImageSelected),
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      // Convert image to base64
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type;

      // Call API
      const response = await fetch(buildApiUrl("/api/identify-disease"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          cropName: cropName.trim(),
          cropType: cropType.trim() || undefined,
          region: region.trim() || undefined,
          imageData: base64Data,
          imageMimeType: mimeType,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorPayload = await parseJsonResponse<{
            error?: string;
            details?: string;
          }>(response.clone());
          errorMessage = errorPayload.details || errorPayload.error || errorMessage;
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message) {
            errorMessage = parseError.message;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await parseJsonResponse<DiseaseAnalysis>(response);
      setAnalysis(result);

      toast({
        title: "Analysis Complete",
        description: `Identified: ${result.diseaseName}`,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t(cropDiseaseTranslations.errorAnalyzing);
      setError(message);
      toast({
        title: t(cropDiseaseTranslations.errorAnalyzing),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!analysis || !imageFile) {
      return;
    }

    setIsSaving(true);
    try {
      // Upload image to Firebase Storage
      const timestamp = Date.now();
      const imagePath = `crop-disease/${timestamp}-${imageFile.name}`;
      const imageUrl = await uploadFileResumable(imageFile, imagePath);

      // Save report to Firestore
      const report: Omit<CropDiseaseReport, "id" | "createdAt" | "updatedAt"> = {
        language: analysis.language as any,
        cropName: cropName.trim(),
        cropType: cropType.trim() || undefined,
        region: region.trim() || undefined,
        diseaseName: analysis.diseaseName,
        diseaseType: analysis.diseaseType,
        severity: analysis.severity,
        confidence: analysis.confidence,
        description: analysis.description,
        symptoms: analysis.symptoms,
        causes: analysis.causes,
        treatments: analysis.treatments,
        preventionTips: analysis.preventionTips,
        imageUrl,
        imageStoragePath: imagePath,
      };

      await saveCropDiseaseReport(report);

      toast({
        title: t(cropDiseaseTranslations.reportSaved),
        description: "Report has been saved to your history",
      });
    } catch (err) {
      toast({
        title: "Error saving report",
        description: err instanceof Error ? err.message : "Failed to save report",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-emerald-500";
      default:
        return "bg-slate-500";
    }
  };

  const getSeverityLabel = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <Layout>
      <PageHero
        title={t(cropDiseaseTranslations.title)}
        subtitle={t(cropDiseaseTranslations.subtitle)}
        icon={Bug}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Input Form */}
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-500" />
                  {t(cropDiseaseTranslations.uploadImage)}
                </CardTitle>
                <CardDescription>
                  {language === "en" 
                    ? "Provide crop information and upload an image for analysis" 
                    : "विश्लेषण के लिए फसल की जानकारी प्रदान करें और एक छवि अपलोड करें"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(cropDiseaseTranslations.cropName)} *
                    </label>
                    <Input
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder={t(cropDiseaseTranslations.cropNamePlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(cropDiseaseTranslations.cropType)}
                    </label>
                    <Input
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      placeholder={t(commonTranslations.cropTypePlaceholder)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t(cropDiseaseTranslations.region)}
                  </label>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={t(commonTranslations.regionPlaceholder)}
                  />
                </div>

                <ImageUploader
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  currentImage={selectedImage}
                  maxSizeMB={5}
                  label={t(cropDiseaseTranslations.uploadImage)}
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
                      {t(cropDiseaseTranslations.analyzing)}
                    </>
                  ) : (
                    t(cropDiseaseTranslations.analyze)
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Analysis Results</h2>
                  <Button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    variant="outline"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t(cropDiseaseTranslations.saveReport)}
                      </>
                    )}
                  </Button>
                </div>

                {/* Visual Charts Section - Quick Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Disease Severity Gauge */}
                  <DiseaseSeverityGauge
                    severity={analysis.severity}
                    confidence={analysis.confidence}
                    diseaseName={analysis.diseaseName}
                  />
                  
                  {/* Treatment Comparison Chart */}
                  <TreatmentComparisonChart
                    organic={analysis.treatments.organic}
                    chemical={analysis.treatments.chemical}
                  />
                </div>

                {/* Disease Info Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">
                          {analysis.diseaseName}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            className={getSeverityColor(analysis.severity)}
                          >
                            {getSeverityLabel(analysis.severity)}
                          </Badge>
                          <Badge variant="outline">
                            {analysis.confidence.toFixed(0)}% {t(cropDiseaseTranslations.confidence)}
                          </Badge>
                          <Badge variant="secondary">
                            {analysis.diseaseType.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">
                        {t(cropDiseaseTranslations.description)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {analysis.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">
                        {t(cropDiseaseTranslations.symptoms)}
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {analysis.symptoms.map((symptom, idx) => (
                          <li key={idx}>{symptom}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">
                        {t(cropDiseaseTranslations.causes)}
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {analysis.causes.map((cause, idx) => (
                          <li key={idx}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Treatments */}
                <Tabs defaultValue="organic">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="organic">
                      <Leaf className="mr-2 h-4 w-4" />
                      {t(cropDiseaseTranslations.organicTreatments)}
                    </TabsTrigger>
                    <TabsTrigger value="chemical">
                      <FlaskConical className="mr-2 h-4 w-4" />
                      {t(cropDiseaseTranslations.chemicalTreatments)}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="organic" className="space-y-4">
                    {analysis.treatments.organic.map((treatment, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-lg">{treatment.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">{t(cropDiseaseTranslations.method)}:</span>{" "}
                            {treatment.method}
                          </p>
                          <p>
                            <span className="font-medium">{t(cropDiseaseTranslations.timing)}:</span>{" "}
                            {treatment.timing}
                          </p>
                          <p>
                            <span className="font-medium">{t(cropDiseaseTranslations.notes)}:</span>{" "}
                            {treatment.notes}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="chemical" className="space-y-4">
                    {analysis.treatments.chemical.map((treatment, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-lg">{treatment.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">{t(cropDiseaseTranslations.method)}:</span>{" "}
                            {treatment.method}
                          </p>
                          <p>
                            <span className="font-medium">{t(cropDiseaseTranslations.timing)}:</span>{" "}
                            {treatment.timing}
                          </p>
                          <p>
                            <span className="font-medium">{t(cropDiseaseTranslations.notes)}:</span>{" "}
                            {treatment.notes}
                          </p>
                          {treatment.safetyWarnings && treatment.safetyWarnings.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="font-medium text-amber-600 mb-1 flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                {t(cropDiseaseTranslations.safetyWarnings)}
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-amber-700">
                                {treatment.safetyWarnings.map((warning, wIdx) => (
                                  <li key={wIdx}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>

                {/* Prevention Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {t(cropDiseaseTranslations.preventionTips)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {analysis.preventionTips.map((tip, idx) => (
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

export default CropDiseaseIdentifier;

