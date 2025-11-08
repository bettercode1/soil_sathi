
import React, { useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Leaf, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { recommendationsTranslations, soilAnalyzerTranslations } from "@/constants/allTranslations";

type LanguageCode = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";
type LocalizedString = Record<LanguageCode, string>;

type SelectOption = {
  id: string;
  label: LocalizedString;
  aiLabel: string;
};

type AiRecommendationEntry = {
  name: string;
  quantity: string;
  frequency: string;
  details: string;
  notes?: string;
};

type AiRecommendationPlan = {
  primary: AiRecommendationEntry[];
  secondary: AiRecommendationEntry[];
};

type AiRecommendations = {
  language: string;
  summary?: string;
  chemical: AiRecommendationPlan;
  organic: AiRecommendationPlan;
  tips: string[];
};

const localized = (
  en: string,
  hi: string,
  pa: string,
  ta: string,
  te: string,
  bn: string,
  mr: string
): LocalizedString => ({
  en,
  hi,
  pa,
  ta,
  te,
  bn,
  mr,
});

const soilTypes: SelectOption[] = [
  { id: "black", label: localized("Black Soil (Regur)", "काली मिट्टी (रेगर)", "ਕਾਲੀ ਮਿੱਟੀ (ਰੇਗਰ)", "கருப்பு மண் (ரேகூர்)", "నల్ల మట్టి (రేగూర్)", "কালো মাটি (রেগুর)", "काळी माती (रेगर)"), aiLabel: "Black clay soil (Regur)" },
  { id: "red", label: localized("Red Soil", "लाल मिट्टी", "ਲਾਲ ਮਿੱਟੀ", "சிகப்பு மண்", "ఎర్ర మట్టి", "লাল মাটি", "लाल माती"), aiLabel: "Red loamy soil" },
  { id: "alluvial", label: localized("Alluvial Soil", "जलोढ़ मिट्टी", "ਗਾਦ ਵਾਲੀ ਮਿੱਟੀ", "அல்லுவியல் மண்", "అల్లూవియల్ మట్టి", "পলিমাটি", "जलोढ माती"), aiLabel: "Alluvial soil" },
  { id: "laterite", label: localized("Laterite Soil", "लेटराइट मिट्टी", "ਲੇਟਰਾਈਟ ਮਿੱਟੀ", "லேடரைட் மண்", "లేటరైట్ మట్టి", "ল্যাটেরাইট মাটি", "लेटराइट माती"), aiLabel: "Laterite soil" },
  { id: "sandy", label: localized("Sandy Soil", "रेतीली मिट्टी", "ਰੇਤਲੀ ਮਿੱਟੀ", "மணற்பான மண்", "ఇసుక మట్టి", "বালুকামাটি", "वालुकामय माती"), aiLabel: "Sandy soil" },
  { id: "clayloam", label: localized("Clay Loam", "दोमट मिट्टी", "ਦੋਮਟ ਮਿੱਟੀ", "களிமண் லோம்", "క్లే లోమ్ మట్టి", "দোঁআশ মাটি", "दोमट माती"), aiLabel: "Clay loam" },
];

const regions: SelectOption[] = [
  { id: "north", label: localized("North India", "उत्तरी भारत", "ਉੱਤਰੀ ਭਾਰਤ", "வட இந்தியா", "ఉత్తర భారతదేశం", "উত্তর ভারত", "उत्तर भारत"), aiLabel: "North India" },
  { id: "south", label: localized("South India", "दक्षिण भारत", "ਦੱਖਣੀ ਭਾਰਤ", "தென் இந்தியா", "దక్షిణ భారతదేశం", "দক্ষিণ ভারত", "दक्षिण भारत"), aiLabel: "South India" },
  { id: "east", label: localized("East India", "पूर्वी भारत", "ਪੂਰਬੀ ਭਾਰਤ", "கிழக்கு இந்தியா", "తూర్పు భారతదేశం", "পূর্ব ভারত", "पूर्व भारत"), aiLabel: "East India" },
  { id: "west", label: localized("West India", "पश्चिमी भारत", "ਪੱਛਮੀ ਭਾਰਤ", "மேற்கு இந்தியா", "పడమర భారతదేశం", "পশ্চিম ভারত", "पश्चिम भारत"), aiLabel: "West India" },
  { id: "central", label: localized("Central India", "मध्य भारत", "ਮੱਧ ਭਾਰਤ", "மத்திய இந்தியா", "మధ్య భారతదేశం", "মধ্য ভারত", "मध्य भारत"), aiLabel: "Central India" },
  { id: "northeast", label: localized("North East India", "उत्तर पूर्व भारत", "ਉੱਤਰੀ-ਪੂਰਬੀ ਭਾਰਤ", "வடகிழக்கு இந்தியா", "ఈశాన్య భారతదేశం", "উত্তর-পূর্ব ভারত", "ईशान्य भारत"), aiLabel: "North East India" },
];

const cropOptions: SelectOption[] = [
  { id: "wheat", label: localized("Wheat", "गेहूं", "ਗੰਦਮ", "கோதுமை", "గోధుమ", "গম", "गहू"), aiLabel: "Wheat" },
  { id: "rice", label: localized("Rice", "चावल", "ਚਾਵਲ", "அரிசி", "బియ్యం", "চাল", "तांदूळ"), aiLabel: "Rice" },
  { id: "cotton", label: localized("Cotton", "कपास", "ਕਪਾਹ", "பருத்தி", "పత్తి", "কাপাস", "कापूस"), aiLabel: "Cotton" },
  { id: "maize", label: localized("Maize", "मक्का", "ਮੱਕੀ", "மக்காச்சோளம்", "మొక్కజొన్న", "ভুট্টা", "मका"), aiLabel: "Maize (corn)" },
  { id: "sugarcane", label: localized("Sugarcane", "गन्ना", "ਗੰਨਾ", "கரும்பு", "చెరకు", "আখ", "ऊस"), aiLabel: "Sugarcane" },
  { id: "potato", label: localized("Potato", "आलू", "ਆਲੂ", "உருளைக்கிழங்கு", "ఆలుగడ్డ", "আলু", "बटाटा"), aiLabel: "Potato" },
  { id: "tomato", label: localized("Tomato", "टमाटर", "ਟਮਾਟਰ", "தக்காளி", "టమాట", "টমেটো", "टोमॅटो"), aiLabel: "Tomato" },
  { id: "onion", label: localized("Onion", "प्याज", "ਪਿਆਜ਼", "வெங்காயம்", "ఉల్లిపాయ", "পিঁয়াজ", "कांदा"), aiLabel: "Onion" },
  { id: "mustard", label: localized("Mustard", "सरसों", "ਸਰੋਂ", "கடுகு", "ఆవాలు", "সরিষা", "मोहरी"), aiLabel: "Mustard" },
  { id: "soybean", label: localized("Soybean", "सोयाबीन", "ਸੋਯਾਬੀਨ", "சோயா பீன்", "సోయాబీన్", "সয়াবিন", "सोयाबीन"), aiLabel: "Soybean" },
];

const cropStages: SelectOption[] = [
  { id: "pre-sowing", label: localized("Pre-sowing / Land Preparation", "बुवाई से पहले / भूमि तैयारी", "ਬੀਜ ਬੋਣ ਤੋਂ ਪਹਿਲਾਂ / ਜ਼ਮੀਨ ਤਿਆਰੀ", "விதைப்பு முன் / நிலத் தயாரிப்பு", "విత్తనానికి ముందు / నేల సిద్ధం", "বপনের আগে / জমি প্রস্তুতি", "पेरणीपूर्व / जमीन तयारी"), aiLabel: "Pre-sowing and land preparation" },
  { id: "sowing", label: localized("Sowing / Planting", "बुवाई / रोपाई", "ਬੀਜ ਬੋਣਾ / ਰੋਪਾਈ", "விதைப்பு / நடவு", "విత్తకం / నాటుడు", "বপন / রোপণ", "पेरणी / लागवड"), aiLabel: "Sowing or planting stage" },
  { id: "vegetative", label: localized("Vegetative Growth", "वनस्पतिक वृद्धि", "ਵਨਸਪਤੀ ਵਾਧਾ", "தாவர வளர்ச்சி", "వృక్ష వికాసం", "সবুজ বৃদ্ধি", "वनस्पती वाढ"), aiLabel: "Vegetative growth stage" },
  { id: "flowering", label: localized("Flowering Stage", "फूल आने का चरण", "ਫੁੱਲ ਆਉਣ ਦਾ ਪੜਾਅ", "மலர்ச்சி நிலை", "పుష్పించే దశ", "ফুল ফোটার পর্যায়", "फुलोऱ्याचा टप्पा"), aiLabel: "Flowering stage" },
  { id: "fruiting", label: localized("Fruiting Stage", "फल बनने का चरण", "ਫਲ ਬਣਨ ਦਾ ਪੜਾਅ", "கனி அமைக்கும் நிலை", "ఫల దశ", "ফল ধরার পর্যায়", "फळधारणा टप्पा"), aiLabel: "Fruiting or pod-filling stage" },
  { id: "maturity", label: localized("Maturity Stage", "परिपक्वता चरण", "ਪਕਕਣ ਦਾ ਪੜਾਅ", "முழு வளர்ச்சி நிலை", "పక్వ దశ", "পরিপক্বতা পর্যায়", "परिपक्वतेचा टप्पा"), aiLabel: "Maturity or pre-harvest stage" },
];

type AiRequestOption = {
  id: string;
  label: string;
};

const convertOptionForRequest = (option: SelectOption | undefined): AiRequestOption | undefined =>
  option ? { id: option.id, label: option.aiLabel } : undefined;

const Recommendations = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [selectedSoil, setSelectedSoil] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AiRecommendations | null>(null);

  const selectedSoilOption = useMemo(() => soilTypes.find((soil) => soil.id === selectedSoil), [selectedSoil]);
  const selectedRegionOption = useMemo(() => regions.find((region) => region.id === selectedRegion), [selectedRegion]);
  const selectedCropOption = useMemo(() => cropOptions.find((crop) => crop.id === selectedCrop), [selectedCrop]);
  const selectedStageOption = useMemo(() => cropStages.find((stage) => stage.id === selectedStage), [selectedStage]);

  const handleGetRecommendations = async () => {
    if (!selectedSoil || !selectedRegion || !selectedCrop || !selectedStage) {
      toast({
        title: t(recommendationsTranslations.missingInfoTitle),
        description: t(recommendationsTranslations.missingInfoDescription),
        variant: "destructive",
      });
      return;
    }

    const soilForRequest = convertOptionForRequest(selectedSoilOption);
    const regionForRequest = convertOptionForRequest(selectedRegionOption);
    const cropForRequest = convertOptionForRequest(selectedCropOption);
    const stageForRequest = convertOptionForRequest(selectedStageOption);

    if (!soilForRequest || !regionForRequest || !cropForRequest || !stageForRequest) {
      toast({
        title: t(recommendationsTranslations.missingInfoTitle),
        description: t(recommendationsTranslations.missingInfoDescription),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRecommendations(null);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          soilType: soilForRequest,
          region: regionForRequest,
          crop: cropForRequest,
          growthStage: stageForRequest,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.details || errorBody?.error || "Unknown server error");
      }

      const data = (await response.json()) as AiRecommendations;
      setRecommendations(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch recommendations from Gemini.";
      toast({
        title: t(soilAnalyzerTranslations.analysisErrorTitle),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="relative isolate overflow-hidden py-16 md:py-20">
        <img
          src="https://images.pexels.com/photos/34617460/pexels-photo-34617460.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/65" aria-hidden="true" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t(recommendationsTranslations.title)}
            </h1>
            <p className="text-white/90 mb-6">
              {t(recommendationsTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{t(recommendationsTranslations.customRecommendations)}</CardTitle>
                <CardDescription>
                  {t(recommendationsTranslations.selectDetails)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.soilType)}
                    </label>
                    <Select value={selectedSoil} onValueChange={setSelectedSoil}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(recommendationsTranslations.soilTypePlaceholder)} />
                      </SelectTrigger>
                      <SelectContent>
                        {soilTypes.map((soil) => (
                          <SelectItem key={soil.id} value={soil.id}>
                            {t(soil.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.region)}
                    </label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(recommendationsTranslations.regionPlaceholder)} />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {t(region.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.crop)}
                    </label>
                    <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(recommendationsTranslations.cropPlaceholder)} />
                      </SelectTrigger>
                      <SelectContent>
                        {cropOptions.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {t(crop.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.cropStage)}
                    </label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(recommendationsTranslations.stagePlaceholder)} />
                      </SelectTrigger>
                      <SelectContent>
                        {cropStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {t(stage.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGetRecommendations}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading-dots">{t(recommendationsTranslations.generatingRecommendations)}</span>
                  ) : (
                    t(recommendationsTranslations.getRecommendations)
                  )}
                </Button>
              </CardContent>
            </Card>

            {recommendations && (
              <div className="mt-12 animate-grow">
                <h2 className="text-2xl font-bold mb-6">{t(recommendationsTranslations.yourRecommendations)}</h2>

                {recommendations.summary && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>{t(recommendationsTranslations.summaryHeading)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{recommendations.summary}</p>
                    </CardContent>
                  </Card>
                )}

                <Tabs defaultValue="chemical">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="chemical">{t(recommendationsTranslations.chemicalFertilizers)}</TabsTrigger>
                    <TabsTrigger value="organic">{t(recommendationsTranslations.organicAlternatives)}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chemical">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>{t(recommendationsTranslations.chemicalCardTitle)}</span>
                        </CardTitle>
                        <CardDescription>
                          {t(recommendationsTranslations.chemicalCardDescription)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">{t(recommendationsTranslations.primaryNutrients)}</h3>
                            <div className="space-y-4">
                              {recommendations.chemical.primary.map((fertilizer, index) => (
                                <div key={index} className="bg-muted p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">{t(recommendationsTranslations.frequencyLabel)}:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{t(recommendationsTranslations.detailsLabel)}:</span> {fertilizer.details}
                                  </p>
                                  {fertilizer.notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      <span className="font-medium">{t(recommendationsTranslations.notesLabel)}:</span> {fertilizer.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-3">{t(recommendationsTranslations.secondaryNutrients)}</h3>
                            <div className="space-y-4">
                              {recommendations.chemical.secondary.map((fertilizer, index) => (
                                <div key={index} className="bg-muted p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">{t(recommendationsTranslations.frequencyLabel)}:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{t(recommendationsTranslations.detailsLabel)}:</span> {fertilizer.details}
                                  </p>
                                  {fertilizer.notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      <span className="font-medium">{t(recommendationsTranslations.notesLabel)}:</span> {fertilizer.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="organic">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Leaf className="h-5 w-5" />
                          <span>{t(recommendationsTranslations.organicAlternatives)}</span>
                        </CardTitle>
                        <CardDescription>
                          {t(recommendationsTranslations.organicCardDescription)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">{t(recommendationsTranslations.primaryOrganicInputs)}</h3>
                            <div className="space-y-4">
                              {recommendations.organic.primary.map((fertilizer, index) => (
                                <div key={index} className="bg-accent p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">{t(recommendationsTranslations.frequencyLabel)}:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{t(recommendationsTranslations.detailsLabel)}:</span> {fertilizer.details}
                                  </p>
                                  {fertilizer.notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      <span className="font-medium">{t(recommendationsTranslations.notesLabel)}:</span> {fertilizer.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-3">{t(recommendationsTranslations.biofertilizers)}</h3>
                            <div className="space-y-4">
                              {recommendations.organic.secondary.map((fertilizer, index) => (
                                <div key={index} className="bg-accent p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">{t(recommendationsTranslations.frequencyLabel)}:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{t(recommendationsTranslations.detailsLabel)}:</span> {fertilizer.details}
                                  </p>
                                  {fertilizer.notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      <span className="font-medium">{t(recommendationsTranslations.notesLabel)}:</span> {fertilizer.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      <span>{t(recommendationsTranslations.additionalTips)}</span>
                    </CardTitle>
                    <CardDescription>
                      {t(recommendationsTranslations.tipsCardDescription)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span>{tip}</span>
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

export default Recommendations;
