
import React, { useMemo, useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Camera, Upload, Download, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilAnalyzerTranslations } from "@/constants/allTranslations";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Leaf } from "lucide-react";
import BettercodeLogo from "@/assets/bettercode-logo.png";
import { buildApiUrl, parseJsonResponse, parseErrorResponse } from "@/lib/api";
import soilAnalyzerHero from "@/assets/soil-analyzer-hero.jpg";
import NutrientChart from "@/components/reports/NutrientChart";
import NutrientProgressBar from "@/components/reports/NutrientProgressBar";
import SoilQualityGauge from "@/components/reports/SoilQualityGauge";
import NutrientComparisonChart from "@/components/reports/NutrientComparisonChart";
import SoilHealthTrend from "@/components/reports/SoilHealthTrend";

type SoilAnalysis = {
  language: string;
  overview: string;
  soilQuality: {
    rating: string;
    score: number;
    description: string;
  };
  nutrientAnalysis: Array<{
    parameter: string;
    value: string;
    status: string;
    impact: string;
    recommendation: string;
  }>;
  fertilizerRecommendations: {
    chemical: Array<{
      name: string;
      quantity: string;
      timing: string;
      application: string;
      notes: string;
    }>;
    organic: Array<{
      name: string;
      quantity: string;
      timing: string;
      application: string;
      notes: string;
    }>;
  };
  improvementPlan: Array<{
    action: string;
    benefit: string;
    priority: string;
  }>;
  warnings: string[];
  nextSteps: string[];
  sectionTitles: {
    overview: string;
    soilQuality: string;
    nutrientAnalysis: string;
    chemicalPlan: string;
    organicPlan: string;
    improvementPlan: string;
    warnings: string;
    nextSteps: string;
  };
  analysisTimestamp: string;
};

type SoilQualityTheme = {
  background: string;
  border: string;
  labelText: string;
  scoreText: string;
  ratingText: string;
};

const getSoilQualityTheme = (score: number | null): SoilQualityTheme => {
  if (score === null) {
    return {
      background: "bg-slate-100/70",
      border: "border-slate-200",
      labelText: "text-slate-500",
      scoreText: "text-slate-700",
      ratingText: "text-slate-600",
    };
  }

  if (score >= 80) {
    return {
      background: "bg-emerald-50",
      border: "border-emerald-300",
      labelText: "text-emerald-500/70",
      scoreText: "text-emerald-600",
      ratingText: "text-emerald-500",
    };
  }

  if (score >= 60) {
    return {
      background: "bg-amber-50",
      border: "border-amber-300",
      labelText: "text-amber-500/70",
      scoreText: "text-amber-600",
      ratingText: "text-amber-500",
    };
  }

  return {
    background: "bg-rose-50",
    border: "border-rose-300",
    labelText: "text-rose-500/70",
    scoreText: "text-rose-600",
    ratingText: "text-rose-500",
  };
};

const SoilAnalyzer = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [manualValues, setManualValues] = useState({
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organic: "",
  });
  const [analysis, setAnalysis] = useState<SoilAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: t(soilAnalyzerTranslations.imageUploadSuccessTitle),
        description: t(soilAnalyzerTranslations.imageUploadSuccessMessage),
      });
    }
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualValues((prev) => ({ ...prev, [name]: value }));
  };

  const filteredManualValues = useMemo(() => {
    const entries = Object.entries(manualValues).filter(([_, value]) => value !== "");
    return Object.fromEntries(entries);
  }, [manualValues]);

  const soilQualityScore = useMemo(() => {
    if (!analysis) {
      return null;
    }
    const parsed = Number(analysis.soilQuality.score);
    return Number.isFinite(parsed) ? parsed : null;
  }, [analysis?.soilQuality.score]);

  const soilQualityTheme = useMemo(
    () => getSoilQualityTheme(soilQualityScore),
    [soilQualityScore]
  );

  // Parse nutrient data for charts
  const nutrientChartData = useMemo(() => {
    if (!analysis) return [];
    
    return analysis.nutrientAnalysis.map((item) => {
      // Extract numeric value from string (e.g., "6.5" from "pH: 6.5" or "280 kg/ha")
      const valueMatch = item.value.match(/(\d+\.?\d*)/);
      const numericValue = valueMatch ? parseFloat(valueMatch[1]) : 0;
      
      // Define optimal ranges based on parameter type
      let optimalMin = 0;
      let optimalMax = 100;
      let optimalCenter = 50;
      
      const paramLower = item.parameter.toLowerCase();
      if (paramLower.includes("ph")) {
        optimalMin = 6.0;
        optimalMax = 7.5;
        optimalCenter = 6.75;
      } else if (paramLower.includes("nitrogen") || paramLower.includes("n")) {
        optimalMin = 200;
        optimalMax = 400;
        optimalCenter = 300;
      } else if (paramLower.includes("phosphorus") || paramLower.includes("p")) {
        optimalMin = 20;
        optimalMax = 50;
        optimalCenter = 35;
      } else if (paramLower.includes("potassium") || paramLower.includes("k")) {
        optimalMin = 150;
        optimalMax = 300;
        optimalCenter = 225;
      } else if (paramLower.includes("organic")) {
        optimalMin = 1.5;
        optimalMax = 3.0;
        optimalCenter = 2.25;
      }
      
      return {
        parameter: item.parameter,
        value: numericValue,
        status: item.status,
        optimalMin,
        optimalMax,
        optimalCenter,
      };
    });
  }, [analysis]);

  // Prepare data for comparison chart
  const nutrientComparisonData = useMemo(() => {
    return nutrientChartData.map((item) => ({
      parameter: item.parameter,
      current: item.value,
      optimal: item.optimalCenter,
    }));
  }, [nutrientChartData]);

  const requestAnalysis = async (
    payload: Record<string, unknown>,
    retryAttempt: number = 0,
    maxRetries: number = 3
  ) => {
    setApiError(null);
    setIsAnalyzing(true);
    setAnalysis(null);
    
    const requestUrl = buildApiUrl("/api/analyze-soil");
    const requestBody = {
      language,
      ...payload,
    };
    
    console.log("[SoilAnalyzer] 🚀 Starting analysis request...");
    console.log("[SoilAnalyzer] URL:", requestUrl);
    console.log("[SoilAnalyzer] Method: POST");
    console.log("[SoilAnalyzer] Body keys:", Object.keys(requestBody));
    if (retryAttempt > 0) {
      console.log(`[SoilAnalyzer] 🔄 Retry attempt ${retryAttempt} of ${maxRetries}`);
    }
    
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("[SoilAnalyzer] ✅ Response received");
      console.log("[SoilAnalyzer] Status:", response.status);
      console.log("[SoilAnalyzer] Status text:", response.statusText);
      console.log("[SoilAnalyzer] Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Parse error response to get details
        const errorData = await parseErrorResponse(response);
        const errorMessage = errorData.details || errorData.error || `Server responded with ${response.status}`;
        
        const isServiceOverloaded = 
          response.status === 503 || 
          errorData.status === "UNAVAILABLE" ||
          errorData.code === 503 ||
          errorMessage.toLowerCase().includes("overloaded") ||
          errorMessage.toLowerCase().includes("unavailable");

        const isQuotaExceeded = 
          response.status === 429 ||
          errorData.code === 429 ||
          errorMessage.toLowerCase().includes("quota") ||
          errorMessage.toLowerCase().includes("rate limit") ||
          errorMessage.toLowerCase().includes("exceeded");

        // Extract retry-after time from error message if available (for 429 errors)
        let retryAfterMs: number | null = null;
        if (isQuotaExceeded) {
          const retryAfterMatch = errorMessage.match(/retry in ([\d.]+)s/i);
          if (retryAfterMatch) {
            const retryAfterSeconds = parseFloat(retryAfterMatch[1]);
            retryAfterMs = Math.ceil(retryAfterSeconds * 1000);
            // Cap at 60 seconds to avoid very long waits
            retryAfterMs = Math.min(retryAfterMs, 60000);
          }
        }

        // Retry logic for 503 and 429 errors
        const isRetryable = (isServiceOverloaded || isQuotaExceeded) && retryAttempt < maxRetries;
        
        if (isRetryable) {
          // Use extracted retry-after time for 429, or exponential backoff for 503
          const delayMs = isQuotaExceeded && retryAfterMs 
            ? retryAfterMs 
            : Math.min(2000 * Math.pow(2, retryAttempt), 10000); // Exponential backoff: 2s, 4s, 8s (max 10s)
          
          console.log(`[SoilAnalyzer] ⏳ ${isQuotaExceeded ? 'Quota exceeded' : 'Service overloaded'}, retrying in ${delayMs}ms...`);
          
          // Show retry message to user
          toast({
            title: isQuotaExceeded 
              ? t(soilAnalyzerTranslations.quotaExceededTitle)
              : t(soilAnalyzerTranslations.serviceOverloadedTitle),
            description: isQuotaExceeded
              ? t(soilAnalyzerTranslations.quotaExceededMessage)
              : t(soilAnalyzerTranslations.retryingMessage)
                  .replace("{attempt}", String(retryAttempt + 1))
                  .replace("{max}", String(maxRetries)),
            variant: "default",
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));

          // Retry the request
          return requestAnalysis(payload, retryAttempt + 1, maxRetries);
        }

        // If no more retries or not a retryable error, throw error
        throw new Error(errorMessage);
      }

      const result = await parseJsonResponse<SoilAnalysis>(response);
      console.log("[SoilAnalyzer] ✅ Analysis result received");
      console.log("[SoilAnalyzer] Result keys:", Object.keys(result));
      setAnalysis(result);
      toast({
        title: t(soilAnalyzerTranslations.analysisReadyTitle),
        description: t(soilAnalyzerTranslations.analysisReadyDescription),
      });
    } catch (error) {
      console.error("[SoilAnalyzer] ❌ Analysis failed");
      console.error("[SoilAnalyzer] Error type:", typeof error);
      console.error("[SoilAnalyzer] Error:", error);
      if (error instanceof Error) {
        console.error("[SoilAnalyzer] Error message:", error.message);
        console.error("[SoilAnalyzer] Error stack:", error.stack);
      }
      
      // Check if it's a service overloaded or quota exceeded error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isServiceOverloaded = 
        errorMessage.toLowerCase().includes("overloaded") ||
        errorMessage.toLowerCase().includes("unavailable") ||
        errorMessage.includes("503");
      
      const isQuotaExceeded = 
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("exceeded") ||
        errorMessage.toLowerCase().includes("429");

      let displayMessage: string;
      let displayTitle: string;

      if (isQuotaExceeded && retryAttempt >= maxRetries) {
        // All retries exhausted for quota
        displayTitle = t(soilAnalyzerTranslations.quotaExceededTitle);
        displayMessage = t(soilAnalyzerTranslations.quotaExceededFinalMessage);
      } else if (isServiceOverloaded && retryAttempt >= maxRetries) {
        // All retries exhausted for service overload
        displayTitle = t(soilAnalyzerTranslations.serviceOverloadedTitle);
        displayMessage = t(soilAnalyzerTranslations.serviceOverloadedMessage);
      } else {
        // Other errors
        displayTitle = t(soilAnalyzerTranslations.analysisErrorTitle);
        displayMessage = errorMessage || t(soilAnalyzerTranslations.analysisErrorFallback);
      }

      setApiError(displayMessage);
      toast({
        title: displayTitle,
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      console.log("[SoilAnalyzer] Analysis request completed");
    }
  };

  const handleAnalyzeImage = () => {
    console.log("[SoilAnalyzer] 🖼️ handleAnalyzeImage called");
    console.log("[SoilAnalyzer] Has uploaded image:", !!uploadedImage);
    console.log("[SoilAnalyzer] Manual values:", filteredManualValues);
    
    if (!uploadedImage) {
      console.log("[SoilAnalyzer] ⚠️ No image uploaded, showing error toast");
      toast({
        title: t(soilAnalyzerTranslations.noImageTitle),
        description: t(soilAnalyzerTranslations.noImageDescription),
        variant: "destructive",
      });
      return;
    }

    console.log("[SoilAnalyzer] ✅ Starting analysis with image...");
    requestAnalysis({
      manualValues: filteredManualValues,
      reportImage: {
        data: uploadedImage,
      },
    });
  };

  const handleAnalyzeManual = () => {
    console.log("[SoilAnalyzer] 📝 handleAnalyzeManual called");
    console.log("[SoilAnalyzer] Manual values:", manualValues);
    
    const { ph, nitrogen, phosphorus, potassium } = manualValues;
    
    if (!ph || !nitrogen || !phosphorus || !potassium) {
      console.log("[SoilAnalyzer] ⚠️ Missing values, showing error toast");
      console.log("[SoilAnalyzer] Missing:", {
        ph: !ph,
        nitrogen: !nitrogen,
        phosphorus: !phosphorus,
        potassium: !potassium,
      });
      toast({
        title: t(soilAnalyzerTranslations.missingValuesTitle),
        description: t(soilAnalyzerTranslations.missingValuesDescription),
        variant: "destructive",
      });
      return;
    }

    console.log("[SoilAnalyzer] ✅ Starting manual analysis...");
    requestAnalysis({
      manualValues: filteredManualValues,
    });
  };

  const handleClearAnalysis = () => {
    setAnalysis(null);
    setApiError(null);
  };

  const handleDownloadReport = async () => {
    if (!analysis || !reportRef.current) {
      return;
    }

    let clonedReport: HTMLElement | null = null;
    try {
      setIsDownloading(true);
      const sourceElement = reportRef.current;
      clonedReport = sourceElement.cloneNode(true) as HTMLElement;

      clonedReport.style.width = "794px"; // ~210mm at 96dpi
      clonedReport.style.margin = "0 auto";
      clonedReport.style.background = "#ffffff";
      clonedReport.style.padding = "32px";
      clonedReport.style.boxSizing = "border-box";
      clonedReport.style.maxWidth = "unset";
      clonedReport.classList.add("pdf-report");

      clonedReport.querySelectorAll("[data-pdf-block]").forEach((element) => {
        const block = element as HTMLElement;
        block.style.breakInside = "avoid";
        block.style.pageBreakInside = "avoid";
        block.style.webkitColumnBreakInside = "avoid";
        block.style.marginBottom = block.style.marginBottom || "12px";
      });

      document.body.appendChild(clonedReport);

      const pdf = new jsPDF("p", "mm", "a4");
      const margins = { top: 16, right: 14, bottom: 18, left: 14 };
      const usableWidth = pdf.internal.pageSize.getWidth() - margins.left - margins.right;
      const usableHeight = pdf.internal.pageSize.getHeight() - margins.top - margins.bottom;

      const exportNodes = Array.from(
        clonedReport.querySelectorAll<HTMLElement>("[data-pdf-export]")
      );
      const nodesToRender =
        exportNodes.length > 0 ? exportNodes : Array.from(clonedReport.children) as HTMLElement[];

      let yOffset = 0;

      for (const section of nodesToRender) {
        section.style.width = "100%";
        section.style.maxWidth = "100%";
        section.style.margin = "0 auto 16px";

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        let renderWidth = usableWidth;
        let renderHeight = (canvas.height * usableWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/png");

        if (renderHeight > usableHeight) {
          const scaleFactor = usableHeight / renderHeight;
          renderHeight = usableHeight;
          renderWidth *= scaleFactor;
        }

        if (yOffset + renderHeight > usableHeight && yOffset !== 0) {
          pdf.addPage();
          yOffset = 0;
        }

        pdf.addImage(
          imgData,
          "PNG",
          margins.left + (usableWidth - renderWidth) / 2,
          margins.top + yOffset,
          renderWidth,
          renderHeight,
          undefined,
          "FAST"
        );

        yOffset += renderHeight + 8;
      }

      pdf.save(`soil-analysis-${language}-${Date.now()}.pdf`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t(soilAnalyzerTranslations.downloadErrorFallback);
      toast({
        title: t(soilAnalyzerTranslations.downloadErrorTitle),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      if (clonedReport) {
        document.body.removeChild(clonedReport);
      }
    }
  };

  return (
    <Layout>
      <section className="relative isolate overflow-hidden py-12 sm:py-16 animate-fade-in">
        <img
          src={soilAnalyzerHero}
          alt="Agronomist checking soil sample data in the field"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/70" aria-hidden="true" />
        <div className="container relative mx-auto px-2">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold mb-4">
              {t(soilAnalyzerTranslations.title)}
            </h1>
            <p className="text-white/90 mb-6 text-base sm:text-[17px]">
              {t(soilAnalyzerTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-2">
          <div className="w-full max-w-7xl mx-auto">
            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="upload">{t(soilAnalyzerTranslations.uploadTab)}</TabsTrigger>
                <TabsTrigger value="manual">{t(soilAnalyzerTranslations.manualTab)}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="animate-fade-in-up">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">{t(soilAnalyzerTranslations.uploadTitle)}</CardTitle>
                    <CardDescription className="text-base">
                      {t(soilAnalyzerTranslations.uploadDescription)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 mb-6">
                      {uploadedImage ? (
                        <div className="w-full">
                          <img 
                            src={uploadedImage} 
                            alt="Uploaded soil test report" 
                            className="max-h-[300px] mx-auto mb-4"
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            <p>{t(soilAnalyzerTranslations.imagePreviewCaption)}</p>
                            <Button 
                              variant="ghost" 
                              className="mt-2"
                              onClick={() => setUploadedImage(null)}
                            >
                              {t(soilAnalyzerTranslations.removeImage)}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mb-4">
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t(soilAnalyzerTranslations.uploadHelperText)}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Camera className="h-4 w-4" />
                                <span>{t(soilAnalyzerTranslations.takePhoto)}</span>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                              </label>
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <FileUp className="h-4 w-4" />
                                <span>{t(soilAnalyzerTranslations.uploadFile)}</span>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                              </label>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={handleAnalyzeImage}
                      disabled={!uploadedImage || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <span className="loading-dots">{t(soilAnalyzerTranslations.analyzing)}</span>
                      ) : (
                        <>
                          {t(soilAnalyzerTranslations.analyzeReport)}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="manual">
                <Card>
                  <CardHeader>
                    <CardTitle>{t(soilAnalyzerTranslations.manualTitle)}</CardTitle>
                    <CardDescription>
                      {t(soilAnalyzerTranslations.manualDescription)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="ph" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.soilPH)}
                        </label>
                        <Input
                          id="ph"
                          name="ph"
                          type="number"
                          step="0.1"
                          min="0"
                          max="14"
                          placeholder="e.g. 6.5"
                          value={manualValues.ph}
                          onChange={handleManualInputChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Value typically between 0-14
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="nitrogen" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.nitrogen)}
                        </label>
                        <Input
                          id="nitrogen"
                          name="nitrogen"
                          type="number"
                          placeholder="e.g. 280"
                          value={manualValues.nitrogen}
                          onChange={handleManualInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phosphorus" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.phosphorus)}
                        </label>
                        <Input
                          id="phosphorus"
                          name="phosphorus"
                          type="number"
                          placeholder="e.g. 45"
                          value={manualValues.phosphorus}
                          onChange={handleManualInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="potassium" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.potassium)}
                        </label>
                        <Input
                          id="potassium"
                          name="potassium"
                          type="number"
                          placeholder="e.g. 190"
                          value={manualValues.potassium}
                          onChange={handleManualInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="organic" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.organicMatter)}
                        </label>
                        <Input
                          id="organic"
                          name="organic"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 2.1"
                          value={manualValues.organic}
                          onChange={handleManualInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={handleAnalyzeManual}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <span className="loading-dots">{t(soilAnalyzerTranslations.analyzing)}</span>
                      ) : (
                        t(soilAnalyzerTranslations.analyzeData)
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-12 border-t border-border pt-8 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 w-full">
                <div>
                  <h2 className="text-2xl font-bold">{t(soilAnalyzerTranslations.yourAnalysis)}</h2>
                  <p className="text-muted-foreground mt-1">
                    {t(soilAnalyzerTranslations.analysisHelper)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClearAnalysis}
                    disabled={!analysis && !apiError}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t(soilAnalyzerTranslations.clearAnalysis)}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDownloadReport}
                    disabled={!analysis || isDownloading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading
                      ? t(soilAnalyzerTranslations.downloading)
                      : t(soilAnalyzerTranslations.downloadReport)}
                  </Button>
                </div>
              </div>

              {!analysis && !apiError && (
                <p className="text-muted-foreground text-center py-12">
                  {t(soilAnalyzerTranslations.analysisPlaceholder)}
                </p>
              )}

              {apiError && (
                <Card className="border-destructive/60 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      {t(soilAnalyzerTranslations.analysisErrorTitle)}
                    </CardTitle>
                    <CardDescription>{apiError}</CardDescription>
                  </CardHeader>
                </Card>
              )}

              {analysis && (
                <div
                  ref={reportRef}
                  className="bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none w-full"
                >
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 text-white px-6 sm:px-8 lg:px-10 py-6 sm:py-8"
                    data-pdf-export
                  >
                    <div className="flex flex-col gap-6 md:grid md:grid-cols-[auto,auto,1fr] md:items-center md:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 shadow-inner backdrop-blur">
                          <Leaf className="h-7 w-7 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-white flex items-baseline gap-2 tracking-tight">
                            SoilSathi
                            <span className="text-lg font-medium text-amber-200">(सॉइल साथी)</span>
                          </p>
                          <p className="text-base text-white/85 font-medium tracking-wide uppercase">
                            Soil Wellness Report
                          </p>
                        </div>
                      </div>

                      <div className="flex items-end justify-end">
                        <img
                          src={BettercodeLogo}
                          alt="Bettercode logo"
                          className="h-8 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-sm font-medium text-white/85 md:text-right uppercase tracking-wide">
                        <p>{t(soilAnalyzerTranslations.languageLabel)}: {analysis.language.toUpperCase()}</p>
                        <p>{t(soilAnalyzerTranslations.generatedOn)}: {analysis.analysisTimestamp.split("T")[0]}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8 w-full">
                    {/* Overview Section */}
                    <section className="pb-6 border-b border-slate-200 w-full">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">
                        {analysis.sectionTitles.overview}
                      </h2>
                      <p className="text-base leading-relaxed text-slate-700 w-full">
                        {analysis.overview}
                      </p>
                    </section>

                    {/* Soil Quality Section with Charts - Better Space Utilization */}
                    <section className="space-y-6 w-full" data-pdf-export>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">
                        {analysis.sectionTitles.soilQuality}
                      </h2>
                      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 w-full">
                        {/* Left: Gauge Chart */}
                        <div className="lg:col-span-1">
                          <div className="report-section h-full">
                            <SoilQualityGauge 
                              score={soilQualityScore || 0} 
                              rating={analysis.soilQuality.rating}
                            />
                          </div>
                        </div>
                        
                        {/* Center: Score Card */}
                        <div className="lg:col-span-1">
                          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 h-full flex flex-col justify-center">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-4">
                              {t(soilAnalyzerTranslations.soilQualityScore)}
                            </h3>
                            <div
                              className={`rounded-xl border-2 ${soilQualityTheme.border} ${soilQualityTheme.background} p-6 mb-4 flex flex-col items-center justify-center text-center`}
                            >
                              <p className={`text-5xl font-bold ${soilQualityTheme.scoreText}`}>
                                {soilQualityScore !== null ? soilQualityScore.toFixed(1) : "—"}
                              </p>
                              <p
                                className={`mt-3 text-base font-semibold uppercase tracking-wide ${soilQualityTheme.ratingText}`}
                              >
                                {analysis.soilQuality.rating}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right: Trend Chart */}
                        <div className="lg:col-span-1">
                          <div className="report-section h-full">
                            <SoilHealthTrend currentScore={soilQualityScore || 0} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Quality Description */}
                      <div className="mt-4 p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                        <p className="text-sm leading-relaxed text-slate-700">
                          {analysis.soilQuality.description}
                        </p>
                      </div>
                    </section>

                    {/* Nutrient Analysis Section with Multiple Charts */}
                    <section className="space-y-6 pt-6 border-t border-slate-200 w-full" data-pdf-export>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6 w-full">
                        <h2 className="text-xl font-bold text-slate-900">
                          {analysis.sectionTitles.nutrientAnalysis}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {t(soilAnalyzerTranslations.nutrientHeadline)}
                        </p>
                      </div>
                      
                      {/* Charts Grid - Better Space Utilization */}
                      {nutrientChartData.length > 0 && (
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mb-6 w-full">
                          {/* Left: Bar Chart */}
                          <div className="report-section">
                            <NutrientChart data={nutrientChartData} />
                          </div>
                          
                          {/* Right: Comparison Radar Chart */}
                          {nutrientComparisonData.length > 0 && (
                            <div className="report-section">
                              <NutrientComparisonChart data={nutrientComparisonData} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nutrient Progress Bars - Compact Grid Layout */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6 w-full">
                        {analysis.nutrientAnalysis.map((item, index) => {
                          const chartItem = nutrientChartData[index];
                          if (!chartItem) return null;
                          
                          const statusLower = item.status.toLowerCase();
                          let statusIcon = <Minus className="h-4 w-4" />;
                          let statusColor = "text-slate-600";
                          
                          if (statusLower.includes("low") || statusLower.includes("deficient")) {
                            statusIcon = <TrendingDown className="h-4 w-4" />;
                            statusColor = "text-red-600";
                          } else if (statusLower.includes("high") || statusLower.includes("excess")) {
                            statusIcon = <TrendingUp className="h-4 w-4" />;
                            statusColor = "text-amber-600";
                          } else if (statusLower.includes("optimal") || statusLower.includes("good")) {
                            statusIcon = <TrendingUp className="h-4 w-4" />;
                            statusColor = "text-green-600";
                          }
                          
                          return (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                              data-pdf-block
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-slate-900">
                                    {item.parameter}
                                  </h4>
                                  <span className={statusColor}>
                                    {statusIcon}
                                  </span>
                                </div>
                                <span className={`text-sm font-bold ${statusColor} px-2 py-1 rounded-lg bg-opacity-10`}>
                                  {item.status}
                                </span>
                              </div>
                              
                              <NutrientProgressBar
                                label=""
                                value={chartItem.value}
                                status={item.status}
                                optimalMin={chartItem.optimalMin}
                                optimalMax={chartItem.optimalMax}
                                unit={item.value.includes("kg/ha") ? " kg/ha" : item.value.includes("%") ? "%" : ""}
                              />
                              
                              <div className="pt-3 border-t border-slate-100 space-y-2">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  <span className="font-semibold text-slate-800">Impact: </span>
                                  {item.impact}
                                </p>
                                <p className="text-xs text-primary font-medium leading-relaxed">
                                  <span className="font-semibold">Recommendation: </span>
                                  {item.recommendation}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-4 pt-6 border-t border-slate-200 w-full" data-pdf-export>
                      <header className="mb-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          {analysis.sectionTitles.chemicalPlan}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {t(soilAnalyzerTranslations.chemicalPlanDescription)}
                        </p>
                      </header>
                      <div className="space-y-3">
                        {analysis.fertilizerRecommendations.chemical.map((entry, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-2 shadow-sm"
                            data-pdf-block
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h4 className="text-lg font-semibold text-primary">
                                {entry.name}
                              </h4>
                              <span className="text-sm font-semibold text-primary/80">
                                {entry.quantity}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">
                                {t(soilAnalyzerTranslations.timingLabel)}:
                              </span>{" "}
                              {entry.timing}
                            </p>
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">
                                {t(soilAnalyzerTranslations.applicationLabel)}:
                              </span>{" "}
                              {entry.application}
                            </p>
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">
                                {t(soilAnalyzerTranslations.notesLabel)}:
                              </span>{" "}
                              {entry.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4 pt-6 border-t border-slate-200 w-full" data-pdf-export>
                      <header className="mb-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          {analysis.sectionTitles.organicPlan}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {t(soilAnalyzerTranslations.organicPlanDescription)}
                        </p>
                      </header>
                      <div className="space-y-3">
                        {analysis.fertilizerRecommendations.organic.map((entry, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-2 shadow-sm"
                            data-pdf-block
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h4 className="text-lg font-semibold text-emerald-800">
                                {entry.name}
                              </h4>
                              <span className="text-sm font-semibold text-emerald-700">
                                {entry.quantity}
                              </span>
                            </div>
                            <p className="text-sm text-emerald-800/80">
                              <span className="font-semibold text-emerald-900">
                                {t(soilAnalyzerTranslations.timingLabel)}:
                              </span>{" "}
                              {entry.timing}
                            </p>
                            <p className="text-sm text-emerald-800/80">
                              <span className="font-semibold text-emerald-900">
                                {t(soilAnalyzerTranslations.applicationLabel)}:
                              </span>{" "}
                              {entry.application}
                            </p>
                            <p className="text-sm text-emerald-800/80">
                              <span className="font-semibold text-emerald-900">
                                {t(soilAnalyzerTranslations.notesLabel)}:
                              </span>{" "}
                              {entry.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4 pt-6 border-t border-slate-200 w-full" data-pdf-export>
                      <header className="mb-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          {analysis.sectionTitles.improvementPlan}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {t(soilAnalyzerTranslations.improvementHeadline)}
                        </p>
                      </header>
                      <div className="space-y-3">
                        {analysis.improvementPlan.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            data-pdf-block
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h4 className="text-lg font-semibold text-slate-900">
                                {item.action}
                              </h4>
                              <span className="text-sm font-semibold text-primary px-3 py-1 rounded-full bg-primary/10">
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">{item.benefit}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-slate-200 w-full" data-pdf-export>
                      <div
                        className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 space-y-3 shadow-sm"
                        data-pdf-block
                      >
                        <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/40 text-amber-900 font-bold">
                            !
                          </span>
                          {analysis.sectionTitles.warnings}
                        </h3>
                        <ul className="space-y-2 text-sm text-amber-900/80 list-disc list-inside pl-2">
                          {analysis.warnings.map((warning, index) => (
                            <li key={index} className="leading-relaxed">{warning}</li>
                          ))}
                        </ul>
                      </div>

                      <div
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-3 shadow-sm"
                        data-pdf-block
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-3">
                          {analysis.sectionTitles.nextSteps}
                        </h3>
                        <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside pl-2">
                          {analysis.nextSteps.map((step, index) => (
                            <li key={index} className="leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    </section>
                  </div>

                  <div className="bg-slate-900 text-white px-4 sm:px-6 lg:px-8 xl:px-10 py-6 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
                    <p className="font-medium">SoilSathi</p>
                    <p className="text-white/70 text-xs md:text-sm">
                      Data-powered farming guidance for healthier soil and sustainable yields.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SoilAnalyzer;
