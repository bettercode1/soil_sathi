import React, { useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  BarChart3,
  Radio,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { commonTranslations } from "@/constants/siteTranslations";
import { sensorTranslations, sensorAnalysisTranslations } from "@/constants/allTranslations";
import { SensorDataCollector } from "@/components/sensors/SensorDataCollector";
import { SensorDataVisualization } from "@/components/sensors/SensorDataVisualization";
import type { SensorDataCollection } from "@/types/sensor-data";
import { useNavigate } from "react-router-dom";
// sensorHero import was unused in the fragment, but present in imports. Leaving it out if unused or keeping it if I suspect usage. 
// It was imported as 'sensorHero' at line 239 but I don't see it used in the JSX I saw.
// I'll skip it to keep it clean, unless I see a use. I didn't see it used.

import SimplifiedReport from "@/components/reports/SimplifiedReport";
import DetailedReport from "@/components/reports/DetailedReport";
import type { SoilAnalysis } from "@/types/soil-analysis";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/components/ui/use-toast";

const SensorData = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sensorCollection, setSensorCollection] = useState<SensorDataCollection | null>(null);
  const [sensorAnalysis, setSensorAnalysis] = useState<any>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleViewAnalysis = () => {
    setShowFullReport(true);
  };

  const handleClearAnalysis = () => {
    setShowFullReport(false);
  };

  const handleDownloadReport = async () => {
      if (!simplifiedAnalysis || !reportRef.current) {
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

        pdf.save(`sensor-analysis-${Date.now()}.pdf`);
      } catch (error) {
        console.error("PDF generation failed", error);
        toast({
            title: t(commonTranslations.downloadFailed),
            description: t(commonTranslations.couldNotGeneratePDF),
            variant: "destructive"
        });
      } finally {
        setIsDownloading(false);
        if (clonedReport) {
          document.body.removeChild(clonedReport);
        }
      }
    };

  // Generate a full analysis object from sensor data for the report
  const getSimplifiedAnalysis = (): SoilAnalysis | null => {
    if (!sensorCollection) return null;

    const manualValues = convertSensorDataToManualValues(sensorCollection);
    
    // Check key metrics to determine quality
    const ph = parseFloat(manualValues.ph || "7");
    const organic = parseFloat(manualValues.organic || "1");
    let qualityRating = "qualityGood"; // Default to Good key
    let qualityScore = 85;

    // Simple logic for quality
    if (ph < 5.5 || ph > 8.0 || organic < 0.5) {
      qualityRating = "qualityPoor"; // Poor key
      qualityScore = 45;
    } else if (ph < 6.0 || ph > 7.5 || organic < 0.8) {
      qualityRating = "qualityAverage"; // Medium key
      qualityScore = 65;
    }

    // Determine description based on language
    const description = 
      t(sensorAnalysisTranslations.basedOnReadingsPrefix) + " " + 
      t(sensorAnalysisTranslations[qualityRating]) + ". " + 
      (ph < 6.5 ? t(sensorAnalysisTranslations.soilSlightlyAcidic) : ph > 7.5 ? t(sensorAnalysisTranslations.soilSlightlyAlkaline) : t(sensorAnalysisTranslations.phOptimal)) + " " +
      (organic < 1 ? t(sensorAnalysisTranslations.organicLow) : t(sensorAnalysisTranslations.organicAdequate));

    return {
      language: "en", // Keeping internal lang tag en for now as keys govern display
      overview: description,
      soilQuality: {
        rating: t(sensorAnalysisTranslations[qualityRating]),
        score: qualityScore,
        description: description
      },
      nutrientAnalysis: [
        {
          parameter: t(commonTranslations.phLevel),
          value: manualValues.ph || "7.0",
          status: ph >= 6.5 && ph <= 7.5 ? t(sensorAnalysisTranslations.optimal) : t(sensorAnalysisTranslations.check),
          impact: t(sensorAnalysisTranslations.optimalNutrientUptake),
          recommendation: ph < 6.5 ? t(sensorAnalysisTranslations.applyLime) : ph > 7.5 ? t(sensorAnalysisTranslations.applySulfur) : t(sensorAnalysisTranslations.maintainCurrent)
        },
        {
          parameter: t(commonTranslations.nitrogen),
          value: `${manualValues.nitrogen || "0"} ${t(commonTranslations.kgPerHa)}`,
          status: t(sensorAnalysisTranslations.normal),
          impact: t(sensorAnalysisTranslations.goodLeafGrowth),
          recommendation: t(sensorAnalysisTranslations.monitorRegularly)
        },
        {
          parameter: t(commonTranslations.phosphorus),
          value: `${manualValues.phosphorus || "0"} ${t(commonTranslations.kgPerHa)}`,
          status: t(sensorAnalysisTranslations.normal),
          impact: t(sensorAnalysisTranslations.essentialRootDev),
          recommendation: t(sensorAnalysisTranslations.adequateLevels)
        },
        {
          parameter: t(commonTranslations.potassium),
          value: `${manualValues.potassium || "0"} ${t(commonTranslations.kgPerHa)}`,
          status: t(sensorAnalysisTranslations.normal),
          impact: t(sensorAnalysisTranslations.importantHealth),
          recommendation: t(sensorAnalysisTranslations.maintainLevels)
        },
        {
          parameter: t(commonTranslations.organicMatter),
          value: `${manualValues.organic || "0"}${t(commonTranslations.percent)}`,
          status: organic > 0.75 ? t(sensorAnalysisTranslations.good) : t(sensorAnalysisTranslations.low),
          impact: t(sensorAnalysisTranslations.affectsStructure),
          recommendation: organic > 0.75 ? t(sensorAnalysisTranslations.maintainLevels) : t(sensorAnalysisTranslations.addCompost)
        }
      ],
      fertilizerRecommendations: { 
        chemical: [
            { name: t(sensorAnalysisTranslations.urea), quantity: `100 ${t(commonTranslations.kgPerHa)}`, timing: t(sensorAnalysisTranslations.topDressing), application: t(sensorAnalysisTranslations.broadcast), notes: t(sensorAnalysisTranslations.splitApplication) },
            { name: t(sensorAnalysisTranslations.dap), quantity: `50 ${t(commonTranslations.kgPerHa)}`, timing: t(sensorAnalysisTranslations.basal), application: t(sensorAnalysisTranslations.soilIncorporation), notes: t(sensorAnalysisTranslations.applyBeforeSowing) }
        ], 
        organic: [
            { name: t(sensorAnalysisTranslations.fym), quantity: `10 ${t(commonTranslations.tonsPerHa)}`, timing: t(sensorAnalysisTranslations.preSowing), application: t(sensorAnalysisTranslations.spreadEvenly), notes: t(sensorAnalysisTranslations.mixWell) },
            { name: t(sensorAnalysisTranslations.vermicompost), quantity: `2 ${t(commonTranslations.tonsPerHa)}`, timing: t(sensorAnalysisTranslations.earlyGrowth), application: t(sensorAnalysisTranslations.rootZone), notes: t(sensorAnalysisTranslations.keepMoist) }
        ] 
      },
      improvementPlan: [
          { action: t(sensorAnalysisTranslations.cropRotationAction), benefit: t(sensorAnalysisTranslations.cropRotationBenefit), priority: t(commonTranslations.priorityHigh) },
          { action: t(sensorAnalysisTranslations.greenManuringAction), benefit: t(sensorAnalysisTranslations.greenManuringBenefit), priority: t(commonTranslations.priorityMedium) }
      ],
      warnings: [
          t(sensorAnalysisTranslations.warningCalibrate),
          t(sensorAnalysisTranslations.warningMoisture)
      ],
      nextSteps: [
          t(sensorAnalysisTranslations.nextStepReview),
          t(sensorAnalysisTranslations.nextStepSchedule),
          t(sensorAnalysisTranslations.nextStepMonitor)
      ],
      sectionTitles: {
          overview: t(commonTranslations.overview), soilQuality: t(commonTranslations.soilQuality), nutrientAnalysis: t(commonTranslations.nutrientAnalysis), chemicalPlan: t(commonTranslations.chemicalPlan),
          organicPlan: t(commonTranslations.organicPlan), improvementPlan: t(commonTranslations.improvementPlan), warnings: t(commonTranslations.warnings), nextSteps: t(commonTranslations.nextSteps)
      },
      analysisTimestamp: new Date().toISOString()
    };
  };

  const simplifiedAnalysis = getSimplifiedAnalysis();

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/50 pb-12">
        {/* Dashboard Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100/50 rounded-lg">
                <Wifi className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  {t(sensorTranslations.sensorDataTab)}
                </h1>
                <p className="text-xs text-slate-500 font-medium">{t(commonTranslations.realtimeMonitoring)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                 <Radio className="h-3 w-3 mr-1 animate-pulse" />
                 {t(sensorTranslations.systemOnline)}
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <SensorDataCollector
              onDataCollected={(collection) => {
                setSensorCollection(collection);
              }}
              onAnalysisReady={(analysis) => {
                setSensorAnalysis(analysis);
              }}
            />
            
            {sensorCollection && simplifiedAnalysis && !showFullReport && (
              <div className="animate-fade-in-up">
                 <SimplifiedReport 
                    analysis={simplifiedAnalysis}
                    onKnowMore={handleViewAnalysis}
                    dataSource="sensor"
                  />
              </div>
            )}

            {showFullReport && simplifiedAnalysis && (
                <DetailedReport
                    analysis={simplifiedAnalysis}
                    onDownload={handleDownloadReport}
                    onClear={handleClearAnalysis}
                    reportRef={reportRef}
                    isDownloading={isDownloading}
                    dataSource="sensor"
                    sensorCollection={sensorCollection}
                />
            )}

            {sensorCollection && !simplifiedAnalysis && (
               <Card className="border-none shadow-lg overflow-hidden animate-fade-in-up">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-400" />
                        {t(sensorAnalysisTranslations.analysisReadyTitle)}
                      </h3>
                      <p className="text-slate-300 mt-1 max-w-xl">
                        {t(sensorAnalysisTranslations.analysisReadyDesc)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                       <Button
                        onClick={handleViewAnalysis}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-bold"
                        size="lg"
                      >
                        {t(sensorAnalysisTranslations.viewFullAnalysis)}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                 </div>
                 
                 <div className="p-6 bg-white">
                    <SensorDataVisualization
                      collection={sensorCollection}
                      analysis={sensorAnalysis}
                    />
                 </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

// Helper function to convert sensor data to manual values format
const convertSensorDataToManualValues = (collection: SensorDataCollection): Record<string, string> => {
  const manualValues: Record<string, string> = {};
  
  // Group readings by sensor type and calculate averages
  const readingsByType = new Map<string, number[]>();
  
  collection.readings.forEach(reading => {
    if (!readingsByType.has(reading.sensorType)) {
      readingsByType.set(reading.sensorType, []);
    }
    readingsByType.get(reading.sensorType)!.push(reading.value);
  });

  // Convert to manual values format
  readingsByType.forEach((readings, sensorType) => {
    const average = readings.reduce((a, b) => a + b, 0) / readings.length;
    
    switch (sensorType.toLowerCase()) {
      case "ph":
      case "ph_level":
        manualValues.ph = average.toFixed(2);
        break;
      case "nitrogen":
      case "n":
        manualValues.nitrogen = average.toFixed(0);
        break;
      case "phosphorus":
      case "p":
        manualValues.phosphorus = average.toFixed(0);
        break;
      case "potassium":
      case "k":
        manualValues.potassium = average.toFixed(0);
        break;
      case "organic_matter":
      case "organic":
      case "oc":
      case "om":
        manualValues.organic = average.toFixed(2);
        break;
      case "moisture":
        manualValues.moisture = average.toFixed(1);
        break;
    }
  });

  return manualValues;
};


export default SensorData;
