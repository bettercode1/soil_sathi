import React, { useState, useRef, useMemo, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUp, Camera, Upload, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilAnalyzerTranslations } from "@/constants/allTranslations";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  buildApiUrl,
  parseJsonResponse,
  parseErrorResponse,
  type ApiErrorPayload,
  type ApiErrorType,
} from "@/lib/api";
import soilAnalyzerHero from "@/assets/soil-analyzer-hero.jpg";
import SimplifiedReport from "@/components/reports/SimplifiedReport";
import DetailedReport from "@/components/reports/DetailedReport";
import { SoilAnalysis } from "@/types/soil-analysis";
import { useLocation } from "react-router-dom";

const ALLOWED_REPORT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const SoilAnalyzer = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null);
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
  const lastAnalysisPayloadRef = useRef<Record<string, unknown> | null>(null);
  const skipLanguageReanalysisRef = useRef(true);

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

  const clearUploadedFile = () => {
    setUploadedImage(null);
    setUploadedFileName(null);
    setUploadedMimeType(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_REPORT_TYPES.includes(mimeType as (typeof ALLOWED_REPORT_TYPES)[number])) {
      toast({
        title: t(soilAnalyzerTranslations.unsupportedFileTitle),
        description: t(soilAnalyzerTranslations.unsupportedFileDesc),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const maxBytes = mimeType === "application/pdf" ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: t(soilAnalyzerTranslations.fileTooLargeTitle),
        description:
          mimeType === "application/pdf"
            ? t(soilAnalyzerTranslations.fileTooLargePdf)
            : t(soilAnalyzerTranslations.fileTooLargeImage),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setUploadedFileName(file.name);
      setUploadedMimeType(mimeType);
      setDataSource("upload");
      setActiveTab("upload");
    };
    reader.readAsDataURL(file);
    toast({
      title: t(soilAnalyzerTranslations.imageUploadSuccessTitle),
      description: t(soilAnalyzerTranslations.imageUploadSuccessMessage),
    });
    e.target.value = "";
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualValues((prev) => ({ ...prev, [name]: value }));
  };

  const filteredManualValues = useMemo(() => {
    const entries = Object.entries(manualValues).filter(([_, value]) => value !== "");
    return Object.fromEntries(entries);
  }, [manualValues]);

  const getErrorCopy = (
    kind: ApiErrorType,
    retryAttempt: number,
    maxRetries: number,
    retryAfterSeconds?: number,
  ): { title: string; message: string; retryable: boolean } => {
    switch (kind) {
      case "server_rate_limit":
        return {
          title: t(soilAnalyzerTranslations.serverRateLimitTitle),
          message: retryAfterSeconds
            ? `${t(soilAnalyzerTranslations.serverRateLimitMessage)} (${retryAfterSeconds}s)`
            : t(soilAnalyzerTranslations.serverRateLimitFinalMessage),
          retryable: false,
        };
      case "gemini_quota":
        return {
          title: t(soilAnalyzerTranslations.geminiQuotaTitle),
          message:
            retryAttempt < maxRetries
              ? t(soilAnalyzerTranslations.geminiQuotaRetryMessage)
              : t(soilAnalyzerTranslations.geminiQuotaFinalMessage),
          retryable: retryAttempt < maxRetries,
        };
      case "service_unavailable":
        return {
          title: t(soilAnalyzerTranslations.serviceOverloadedTitle),
          message:
            retryAttempt < maxRetries
              ? t(soilAnalyzerTranslations.retryingMessage)
                  .replace("{attempt}", String(retryAttempt + 1))
                  .replace("{max}", String(maxRetries))
              : t(soilAnalyzerTranslations.serviceOverloadedMessage),
          retryable: retryAttempt < maxRetries,
        };
      case "missing_api_key":
        return {
          title: t(soilAnalyzerTranslations.missingApiKeyTitle),
          message: t(soilAnalyzerTranslations.missingApiKeyMessage),
          retryable: false,
        };
      case "permission_denied":
        return {
          title: t(soilAnalyzerTranslations.analysisErrorTitle),
          message: t(soilAnalyzerTranslations.geminiQuotaFinalMessage),
          retryable: false,
        };
      case "timeout":
        return {
          title: t(soilAnalyzerTranslations.analysisErrorTitle),
          message: t(soilAnalyzerTranslations.serviceOverloadedMessage),
          retryable: retryAttempt < maxRetries,
        };
      default:
        return {
          title: t(soilAnalyzerTranslations.analysisErrorTitle),
          message: t(soilAnalyzerTranslations.analysisErrorFallback),
          retryable: false,
        };
    }
  };

  const requestAnalysis = async (
    payload: Record<string, unknown>,
    retryAttempt: number = 0,
    maxRetries: number = 3
  ) => {
    lastAnalysisPayloadRef.current = payload;
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
        const errorData: ApiErrorPayload = await parseErrorResponse(response);
        const errorKind = errorData.errorType ?? "generic";
        const copy = getErrorCopy(
          errorKind,
          retryAttempt,
          maxRetries,
          errorData.retryAfterSeconds,
        );

        if (copy.retryable) {
          const delayMs =
            errorKind === "gemini_quota" && errorData.retryAfterSeconds
              ? Math.min(errorData.retryAfterSeconds * 1000, 60_000)
              : Math.min(2000 * Math.pow(2, retryAttempt), 10_000);

          toast({
            title: copy.title,
            description: copy.message,
            variant: "default",
          });

          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return requestAnalysis(payload, retryAttempt + 1, maxRetries);
        }

        const errorMessage =
          [errorData.error, errorData.details].filter(Boolean).join(" — ") ||
          copy.message;
        throw Object.assign(new Error(errorMessage), {
          errorKind,
          displayTitle: copy.title,
          displayMessage: copy.message,
        });
      }

      const result = await parseJsonResponse<SoilAnalysis>(response);
      setAnalysis(result);
      setShowFullReport(false);
      if (result.isDemo) {
        toast({
          title: t(soilAnalyzerTranslations.demoReportTitle),
          description:
            result.demoNotice ?? t(soilAnalyzerTranslations.demoReportDescription),
          variant: "destructive",
        });
      } else {
        toast({
          title: t(soilAnalyzerTranslations.analysisReadyTitle),
          description: t(soilAnalyzerTranslations.analysisReadyDescription),
        });
      }
    } catch (error) {
      console.error("[SoilAnalyzer] Error:", error);

      const enriched = error as Error & {
        errorKind?: ApiErrorType;
        displayTitle?: string;
        displayMessage?: string;
      };

      const errorKind = enriched.errorKind ?? "generic";
      const fallbackCopy = getErrorCopy(errorKind, retryAttempt, maxRetries);
      const displayTitle = enriched.displayTitle ?? fallbackCopy.title;
      const displayMessage =
        enriched.displayMessage ??
        ((error instanceof Error ? error.message : String(error)) ||
          fallbackCopy.message);

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
        mimeType: uploadedMimeType ?? undefined,
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
    lastAnalysisPayloadRef.current = null;
  };

  useEffect(() => {
    if (skipLanguageReanalysisRef.current) {
      skipLanguageReanalysisRef.current = false;
      return;
    }
    if (!lastAnalysisPayloadRef.current) {
      return;
    }

    toast({
      title: t(soilAnalyzerTranslations.languageReanalyzingTitle),
      description: t(soilAnalyzerTranslations.languageReanalyzingDesc),
    });
    void requestAnalysis(lastAnalysisPayloadRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when language changes
  }, [language]);

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
                          {uploadedMimeType === "application/pdf" ? (
                            <div className="flex flex-col items-center justify-center py-8 mb-4 bg-muted/40 rounded-lg">
                              <FileText className="h-16 w-16 text-primary mb-3" />
                              <p className="font-medium text-foreground">{uploadedFileName}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t(soilAnalyzerTranslations.pdfReadyCaption)}
                              </p>
                            </div>
                          ) : (
                            <img
                              src={uploadedImage}
                              alt="Uploaded soil test report"
                              className="max-h-[300px] mx-auto mb-4"
                            />
                          )}
                          <div className="text-center text-sm text-muted-foreground">
                            <p>{t(soilAnalyzerTranslations.imagePreviewCaption)}</p>
                            <Button
                              variant="ghost"
                              className="mt-2"
                              onClick={clearUploadedFile}
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
                            {t(soilAnalyzerTranslations.uploadHelperText)}{" "}
                            {t(soilAnalyzerTranslations.uploadFormatsHint)}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Camera className="h-4 w-4" />
                                <span>{t(soilAnalyzerTranslations.takePhoto)}</span>
                                <Input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
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
                                  accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
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
                    {analysis.isDemo && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>{t(soilAnalyzerTranslations.demoReportTitle)}</AlertTitle>
                        <AlertDescription>
                          {analysis.demoNotice ??
                            t(soilAnalyzerTranslations.demoReportDescription)}
                        </AlertDescription>
                      </Alert>
                    )}
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
