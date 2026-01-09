import React, { useState } from "react";
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
import { AlertTriangle, Leaf, FlaskConical, Shield, Save, Loader2, Bug, Search, Activity, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import type { CropDiseaseReport } from "@/types/firebase";
import { PageHero } from "@/components/shared/PageHero";

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
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type;

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
      const timestamp = Date.now();
      const imagePath = `crop-disease/${timestamp}-${imageFile.name}`;
      const imageUrl = await uploadFileResumable(imageFile, imagePath);

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
        return "bg-red-500 text-white border-red-600";
      case "high":
        return "bg-orange-500 text-white border-orange-600";
      case "medium":
        return "bg-yellow-500 text-white border-yellow-600";
      case "low":
        return "bg-emerald-500 text-white border-emerald-600";
      default:
        return "bg-slate-500 text-white border-slate-600";
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
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-500" />
                  {t(cropDiseaseTranslations.uploadImage)}
                </CardTitle>
                <CardDescription>
                  {t(cropDiseaseTranslations.subtitle)}
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t(cropDiseaseTranslations.analyzing)}
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      {t(cropDiseaseTranslations.analyze)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-emerald-500" />
                    {t(cropDiseaseTranslations.analysisResultsHeading)}
                  </h2>
                  <Button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t(cropDiseaseTranslations.saving)}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t(cropDiseaseTranslations.saveReport)}
                      </>
                    )}
                  </Button>
                </div>

                {/* Simplified Result Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Diagnosis Card */}
                  <Card className="border-l-4 border-l-emerald-500 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-slate-500 font-medium">{t(cropDiseaseTranslations.diagnosis)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="text-3xl font-bold text-slate-800 mb-2">{analysis.diseaseName}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-sm">
                          {analysis.diseaseType.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                          {analysis.confidence.toFixed(0)}% {t(cropDiseaseTranslations.confidenceSuffix)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Severity Card */}
                  <Card className={`border-l-4 shadow-md ${analysis.severity === 'critical' ? 'border-l-red-500 bg-red-50/50' : analysis.severity === 'high' ? 'border-l-orange-500 bg-orange-50/50' : analysis.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50/50' : 'border-l-emerald-500 bg-emerald-50/50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-slate-500 font-medium">{t(cropDiseaseTranslations.severityLevel)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className={`h-8 w-8 ${analysis.severity === 'critical' ? 'text-red-500' : analysis.severity === 'high' ? 'text-orange-500' : analysis.severity === 'medium' ? 'text-yellow-500' : 'text-emerald-500'}`} />
                        <span className={`text-3xl font-bold capitalize ${analysis.severity === 'critical' ? 'text-red-700' : analysis.severity === 'high' ? 'text-orange-700' : analysis.severity === 'medium' ? 'text-yellow-700' : 'text-emerald-700'}`}>
                          {analysis.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Immediate attention {analysis.severity === 'critical' || analysis.severity === 'high' ? 'required' : 'recommended'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Info Card */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      {t(cropDiseaseTranslations.aboutCondition)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">{t(cropDiseaseTranslations.description)}</h4>
                      <p className="text-slate-600 leading-relaxed">{analysis.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">{t(cropDiseaseTranslations.symptoms)}</h4>
                        <ul className="space-y-1">
                          {analysis.symptoms.map((symptom, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="text-amber-500 mt-1">•</span>
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">{t(cropDiseaseTranslations.causes)}</h4>
                        <ul className="space-y-1">
                          {analysis.causes.map((cause, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="text-blue-500 mt-1">•</span>
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Treatments */}
                <Tabs defaultValue="organic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="organic" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
                      <Leaf className="mr-2 h-4 w-4" />
                      {t(cropDiseaseTranslations.organicTreatments)}
                    </TabsTrigger>
                    <TabsTrigger value="chemical" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                      <FlaskConical className="mr-2 h-4 w-4" />
                      {t(cropDiseaseTranslations.chemicalTreatments)}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="organic" className="space-y-4">
                    {analysis.treatments.organic.map((treatment, idx) => (
                      <Card key={idx} className="border-l-4 border-l-emerald-400">
                        <CardHeader>
                          <CardTitle className="text-lg text-emerald-800">{treatment.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">{t(cropDiseaseTranslations.method)}</span>
                              <p className="text-slate-600">{treatment.method}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">{t(cropDiseaseTranslations.timing)}</span>
                              <p className="text-slate-600">{treatment.timing}</p>
                            </div>
                          </div>
                          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-800 border border-emerald-100 mt-2">
                            <span className="font-bold mr-1">{t(cropDiseaseTranslations.notes)}:</span>
                            {treatment.notes}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="chemical" className="space-y-4">
                    {analysis.treatments.chemical.map((treatment, idx) => (
                      <Card key={idx} className="border-l-4 border-l-blue-400">
                        <CardHeader>
                          <CardTitle className="text-lg text-blue-800">{treatment.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">{t(cropDiseaseTranslations.method)}</span>
                              <p className="text-slate-600">{treatment.method}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">{t(cropDiseaseTranslations.timing)}</span>
                              <p className="text-slate-600">{treatment.timing}</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg text-blue-800 border border-blue-100 mt-2">
                            <span className="font-bold mr-1">{t(cropDiseaseTranslations.notes)}:</span>
                            {treatment.notes}
                          </div>
                          {treatment.safetyWarnings && treatment.safetyWarnings.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="font-bold text-amber-600 mb-2 flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                {t(cropDiseaseTranslations.safetyWarnings)}
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-amber-700 bg-amber-50 p-3 rounded border border-amber-100">
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
                <Card className="border border-indigo-100 bg-indigo-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-700">
                      <Shield className="h-5 w-5" />
                      {t(cropDiseaseTranslations.preventionTips)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.preventionTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm text-slate-700 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                          {tip}
                        </li>
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
