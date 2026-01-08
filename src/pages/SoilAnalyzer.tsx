import React, { useState, useRef, useMemo, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Camera, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilAnalyzerTranslations } from "@/constants/allTranslations";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { buildApiUrl, parseJsonResponse, parseErrorResponse } from "@/lib/api";
import soilAnalyzerHero from "@/assets/soil-analyzer-hero.jpg";
import SimplifiedReport from "@/components/reports/SimplifiedReport";
import DetailedReport from "@/components/reports/DetailedReport";
import { SoilAnalysis } from "@/types/soil-analysis";
import { useLocation } from "react-router-dom";

const SoilAnalyzer = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
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
  const [showFullReport, setShowFullReport] = useState(false);
  const [dataSource, setDataSource] = useState<"sensor" | "upload" | "manual">("manual");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state?.manualValues) {
      setManualValues(prev => ({
        ...prev,
        ...location.state.manualValues
      }));
      setActiveTab("manual");
      setDataSource("sensor");
      toast({
        title: t(soilAnalyzerTranslations.sensorDataLoadedTitle) || "Sensor Data Loaded",
        description: t(soilAnalyzerTranslations.sensorDataLoadedDesc) || "Form populated with readings from your sensors.",
      });

      if (location.state.autoAnalyze) {
        requestAnalysis({
          manualValues: location.state.manualValues
        });
        setShowFullReport(true);
      }
    }
  }, [location.state, t]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setDataSource("upload"); // Mark data source as upload
        setActiveTab("upload");
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
    
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

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
      setAnalysis(result);
      setShowFullReport(false);
      toast({
        title: t(soilAnalyzerTranslations.analysisReadyTitle),
        description: t(soilAnalyzerTranslations.analysisReadyDescription),
      });
    } catch (error) {
      console.error("[SoilAnalyzer] Error:", error);
      
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
    }
  };

  const handleAnalyzeImage = () => {
    if (!uploadedImage) {
      toast({
        title: t(soilAnalyzerTranslations.noImageTitle),
        description: t(soilAnalyzerTranslations.noImageDescription),
        variant: "destructive",
      });
      return;
    }

    requestAnalysis({
      manualValues: filteredManualValues,
      reportImage: {
        data: uploadedImage,
      },
    });
  };

  const handleAnalyzeManual = () => {
    const { ph, nitrogen, phosphorus, potassium } = manualValues;
    
    if (!ph || !nitrogen || !phosphorus || !potassium) {
      toast({
        title: t(soilAnalyzerTranslations.missingValuesTitle),
        description: t(soilAnalyzerTranslations.missingValuesDescription),
        variant: "destructive",
      });
      return;
    }

    requestAnalysis({
      manualValues: filteredManualValues,
    });
  };

  const handleClearAnalysis = () => {
    setAnalysis(null);
    setApiError(null);
    setShowFullReport(false);
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
        (block.style as any).webkitColumnBreakInside = "avoid";
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                          placeholder={t(soilAnalyzerTranslations.phPlaceholder)}
                          value={manualValues.ph}
                          onChange={handleManualInputChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t(soilAnalyzerTranslations.phHelperText)}
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
                          placeholder={t(soilAnalyzerTranslations.nitrogenPlaceholder)}
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
                          placeholder={t(soilAnalyzerTranslations.phosphorusPlaceholder)}
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
                          placeholder={t(soilAnalyzerTranslations.potassiumPlaceholder)}
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
                          placeholder={t(soilAnalyzerTranslations.organicPlaceholder)}
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
              {/* Error State */}
              {apiError && (
                <Card className="border-destructive/60 bg-destructive/5 mb-6">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      {t(soilAnalyzerTranslations.analysisErrorTitle)}
                    </CardTitle>
                    <CardDescription>{apiError}</CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* No Analysis State */}
              {!analysis && !apiError && !isAnalyzing && (
                 <p className="text-muted-foreground text-center py-12">
                  {t(soilAnalyzerTranslations.analysisPlaceholder)}
                </p>
              )}

              {/* Analysis Present */}
              {analysis && (
                !showFullReport ? (
                  <div className="animate-fade-in-up w-full">
                    <SimplifiedReport 
                      analysis={analysis} 
                      onKnowMore={() => setShowFullReport(true)}
                      dataSource={dataSource}
                    />
                    <div className="mt-4 flex justify-center">
                      <Button variant="ghost" size="sm" onClick={handleClearAnalysis} className="text-muted-foreground hover:text-destructive">
                        {t(soilAnalyzerTranslations.clearAnalysis)}
                      </Button>
                      </div>
                      </div>
                ) : (
                  <DetailedReport 
                    analysis={analysis}
                    onDownload={handleDownloadReport}
                    onClear={handleClearAnalysis}
                    reportRef={reportRef}
                    isDownloading={isDownloading}
                    dataSource={dataSource}
                  />
                )
                          )}
                        </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SoilAnalyzer;
