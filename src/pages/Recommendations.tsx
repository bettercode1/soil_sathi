
import React, { useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Leaf,
  Info,
  Droplets,
  Ruler,
  Target,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { recommendationsTranslations, soilAnalyzerTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import fertilizerHero from "@/assets/fertilizer-hero.jpg";

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

type FarmSizeUnit = "acre" | "hectare";

type FarmSizePayload = {
  value: number;
  unit: FarmSizeUnit;
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
  { id: "onion", label: localized("Onion", "प्याज", "ਪਿਆਜ਼", "வெங்காயம்", "ఉల్లిపాయ", "পিঁযాజ", "कांदा"), aiLabel: "Onion" },
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

const irrigationOptions: SelectOption[] = [
  { id: "rainfed", label: localized("Rainfed (no regular irrigation)", "वर्षा आधारित (नियमित सिंचाई नहीं)", "ਬਰਸਾਤ ਤੇ ਨਿਰਭਰ (ਨਿਯਮਿਤ ਸਿੰਚਾਈ ਨਹੀਂ)", "மழை சார்ந்தது (வழக்கமான பாசனம் இல்லை)", "వర్షాధారిత (నియమిత నీటిపారుదల లేదు)", "বৃষ্টিনির্ভর (নিয়মিত সেচ নেই)", "पावसावर अवलंबून (नियमित सिंचन नाही)"), aiLabel: "Rainfed cultivation without regular irrigation" },
  { id: "canal", label: localized("Canal / Surface Irrigation", "नहर / सतही सिंचाई", "ਕੈਨਾਲ / ਸਤਹੀ ਸਿੰਚਾਈ", "கால்வாய் / மேல்நிலை பாசனம்", "కాలువ / ఉపరితల నీటిపారుదల", "খাল / পৃষ্ঠ সেচ", "कालवा / पृष्ठ सिंचन"), aiLabel: "Canal or surface irrigation" },
  { id: "borewell", label: localized("Tube well / Borewell", "ट्यूबवेल / बोरवेल", "ਟਿਊਬਵੈੱਲ / ਬੋਰਵੈੱਲ", "குழாய் கிணறு / போர்வெல்", "ట్యూబ్‌వెల్ / బోర్‌వెల్", "টিউবওয়েল / বোরওয়েল", "ट्यूबवेल / बोअरवेल"), aiLabel: "Tube well or borewell irrigation" },
  { id: "drip", label: localized("Drip Irrigation", "ड्रिप सिंचाई", "ਡ੍ਰਿਪ ਸਿੰਚਾਈ", "துளி பாசனம்", "డ్రిప్ నీటిపారుదల", "ড্রিপ সেচ", "ठिबक सिंचन"), aiLabel: "Drip irrigation system" },
  { id: "sprinkler", label: localized("Sprinkler / Rain-gun", "स्प्रिंकलर / रेन्-गन", "ਸਪ੍ਰਿੰਕਲਰ / ਰੇਨ-ਗਨ", "ஸ்பிரிங்கள் / மழைக்குண்", "స్ప్రింక్లర్ / రైన్-గన్", "স্প্রিঙ্কলার / রেইন-গান", "स्प्रिंकलर / रेन-गन"), aiLabel: "Sprinkler or rain-gun irrigation" },
];

const farmingGoals: SelectOption[] = [
  { id: "yield", label: localized("Increase yield and productivity", "उपज और उत्पादकता बढ़ाना", "ਪੈਦਾਵਾਰ ਅਤੇ ਉਤਪਾਦਕਤਾ ਵਧਾਉਣਾ", "உற்பத்தி மற்றும் கிடைக்கும் அளவை உயர்த்துவது", "ఉత్పత్తి మరియు దిగుబడిని పెంచడం", "ফসল ফলন ও উৎপাদনশীলতা বাড়ানো", "उत्पन्न आणि उत्पादकता वाढवणे"), aiLabel: "Increase crop yield and productivity" },
  { id: "cost", label: localized("Reduce fertilizer cost", "उर्वरक लागत कम करना", "ਖਾਦ ਦੀ ਲਾਗਤ ਘਟਾਉਣਾ", "உரச் செலவை குறைப்பது", "ఎరువుల ఖర్చును తగ్గించడం", "সারের খরচ কমানো", "खताचा खर्च कमी करणे"), aiLabel: "Reduce fertilizer and input costs" },
  { id: "soil-health", label: localized("Improve soil health long-term", "मिट्टी के स्वास्थ्य में दीर्घकालिक सुधार", "ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਵਿੱਚ ਲੰਬੇ ਸਮੇਂ ਲਈ ਸੁਧਾਰ", "மண்ணின் நீண்டகால ஆரோக்கியத்தை மேம்படுத்துதல்", "నేల ఆరోగ్యాన్ని దీర్ఘకాలంగా మెరుగుపరచడం", "মাটির দীর্ঘমেয়াদি স্বাস্থ্য উন্নত করা", "मातीचे दीर्घकालीन आरोग्य सुधारणे"), aiLabel: "Improve long-term soil health" },
  { id: "organic-shift", label: localized("Shift towards organic practices", "जैविक प्रथाओं की ओर शिफ्ट होना", "ਜੈਵਿਕ ਅਭਿਆਸਾਂ ਵੱਲ ਮੋੜਨਾ", "இயற்கை முறைகளுக்கு மாறுவது", "సేంద్రీయ పద్ధతుల వైపు మారడం", "জৈব চাষের দিকে ঝোঁকা", "सेंद्रिय पद्धतींकडे वळणे"), aiLabel: "Transition towards organic or natural farming practices" },
  { id: "pest-disease", label: localized("Manage pest or disease pressure", "कीट या रोग दबाव प्रबंधित करना", "ਕੀੜੇ ਜਾਂ ਰੋਗ ਦਾ ਦਬਾਅ ਸੰਭਾਲਣਾ", "பூச்சி அல்லது நோய் அழுத்தத்தை கட்டுப்படுத்துதல்", "పురుగు లేదా రోగ ఒత్తిడిని నియంత్రించడం", "পোকা বা রোগের চাপ নিয়ন্ত্রণ করা", "किड/रोग नियंत्रण करणे"), aiLabel: "Manage pest or disease pressure effectively" },
];

const challengeOptions: SelectOption[] = [
  { id: "drought", label: localized("Frequent drought or dry spells", "बार-बार सूखा या शुष्क मौसम", "ਵਾਰ-ਵਾਰ ਸੁੱਕਾ ਜਾਂ ਸੁੱਕੇ ਦਿਨ", "அடிக்கடி வறட்சி அல்லது வறண்ட காலங்கள்", "తరచూ కరువు లేదా ఎండల దశలు", "ঘন ঘন খরা বা শুকনো সময়", "वारंवार दुष्काळ किंवा कोरडे काळ"), aiLabel: "Frequent drought stress or dry spells" },
  { id: "waterlogging", label: localized("Waterlogging after rain or irrigation", "बारिश या सिंचाई के बाद जलभराव", "ਬਰਸਾਤ ਜਾਂ ਸਿੰਚਾਈ ਤੋਂ ਬਾਅਦ ਪਾਣੀ ਖੜ੍ਹਾ ਹੋਣਾ", "மழை அல்லது பாசனத்திற்கு பின் நீர் தேக்கம்", "వర్షం లేదా నీటిపారుదల తర్వాత నీరు నిల్వ అవ్వడం", "বৃষ্টি বা সেচের পর জল জমে থাকা", "पावस किंवा सिंचनानंतर पाणी साचणे"), aiLabel: "Waterlogging issues after rain or irrigation" },
  { id: "nutrient", label: localized("Visible nutrient deficiency symptoms", "दिखाई देने वाले पोषक तत्व की कमी के लक्षण", "ਨਜ਼ਰ ਆਉਣ ਵਾਲੇ ਪੋਸ਼ਕ ਤੱਤਾਂ ਦੀ ਘਾਟ ਦੇ ਲੱਛਣ", "காணக்கூடிய ஊட்டச்சத்து பற்றாக்குறை அறிகுறிகள்", "కనిపించే పోషక లోప సంకేతాలు", "দৃশ্যমান পুষ্টির ঘাটতির লক্ষণ", "दृश्यमान पोषक कमतरतेची लक्षणे"), aiLabel: "Visible nutrient deficiency symptoms" },
  { id: "salinity", label: localized("Soil salinity or alkalinity issues", "मिट्टी में लवणता या क्षारीयता की समस्या", "ਮਿੱਟੀ ਵਿੱਚ ਲੂਣਦਾਰਤਾ ਜਾਂ ਖਾਰਾਪਣ ਦੀ ਸਮੱਸਿਆ", "மண்ணில் உப்பு அல்லது காரத் தன்மை சிக்கல்", "మట్టిలో ఉప్పుదనం లేదా క్షారత సమస్యలు", "মাটিতে লবণাক্ততা বা ক্ষারত্ব সমস্যা", "मातीतील क्षारता किंवा अल्कधर्मी समस्या"), aiLabel: "Soil salinity or alkalinity challenges" },
  { id: "pest-disease", label: localized("Recurring pest or disease attacks", "बार-बार कीट या रोग के हमले", "ਵਾਰ-ਵਾਰ ਕੀੜੇ ਜਾਂ ਰੋਗ ਦੇ ਹਮਲੇ", "மீண்டும் மீண்டும் பூச்சி அல்லது நோய் தாக்குதல்", "పునరావృతమయ్యే పురుగు లేదా రోగ దాడులు", "পুনরাবৃত্ত পোকা বা রোগ আক্রমণ", "पुन्हा पुन्हा होणारे किड किंवा रोग हल्ले"), aiLabel: "Recurring pest or disease attacks" },
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
  const [farmSizeValue, setFarmSizeValue] = useState("");
  const [farmSizeUnit, setFarmSizeUnit] = useState<FarmSizeUnit>("acre");
  const [selectedIrrigation, setSelectedIrrigation] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const selectedSoilOption = useMemo(() => soilTypes.find((soil) => soil.id === selectedSoil), [selectedSoil]);
  const selectedRegionOption = useMemo(() => regions.find((region) => region.id === selectedRegion), [selectedRegion]);
  const selectedCropOption = useMemo(() => cropOptions.find((crop) => crop.id === selectedCrop), [selectedCrop]);
  const selectedStageOption = useMemo(() => cropStages.find((stage) => stage.id === selectedStage), [selectedStage]);
  const selectedIrrigationOption = useMemo(
    () => irrigationOptions.find((method) => method.id === selectedIrrigation),
    [selectedIrrigation]
  );
  const selectedGoalOption = useMemo(() => farmingGoals.find((goal) => goal.id === selectedGoal), [selectedGoal]);
  const selectedChallengeOptions = useMemo(
    () => challengeOptions.filter((challenge) => selectedChallenges.includes(challenge.id)),
    [selectedChallenges]
  );

  const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;

  const convertOptionsArrayForRequest = (options: SelectOption[]) =>
    options
      .map((option) => convertOptionForRequest(option))
      .filter(isDefined);

  const getFarmSizePayload = (): FarmSizePayload | undefined | "invalid" => {
    if (!farmSizeValue.trim()) {
      return undefined;
    }
    const parsedFarmSize = Number.parseFloat(farmSizeValue);
    if (!Number.isFinite(parsedFarmSize) || parsedFarmSize <= 0) {
      return "invalid";
    }
    return {
      value: parsedFarmSize,
      unit: farmSizeUnit,
    };
  };

  const toggleChallenge = (id: string) => {
    setSelectedChallenges((previous) =>
      previous.includes(id) ? previous.filter((challengeId) => challengeId !== id) : [...previous, id]
    );
  };

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

    const farmSizePayload = getFarmSizePayload();
    if (farmSizePayload === "invalid") {
      toast({
        title: t(recommendationsTranslations.invalidFarmSizeTitle),
        description: t(recommendationsTranslations.invalidFarmSizeDescription),
        variant: "destructive",
      });
      return;
    }

    const challengesForRequest = convertOptionsArrayForRequest(selectedChallengeOptions);
    const trimmedNotes = notes.trim();

    setIsLoading(true);
    setRecommendations(null);

    try {
      const response = await fetch(buildApiUrl("/api/recommendations"), {
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
          farmSize: farmSizePayload,
          irrigation: convertOptionForRequest(selectedIrrigationOption),
          farmingGoal: convertOptionForRequest(selectedGoalOption),
          challenges: challengesForRequest.length ? challengesForRequest : undefined,
          notes: trimmedNotes || undefined,
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

      const data = await parseJsonResponse<AiRecommendations>(response);
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
          src={fertilizerHero}
          alt="Tractor spraying fertilizer on farmland"
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
              <CardContent className="space-y-10">
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Ruler className="h-5 w-5 text-primary" />
                      <span>{t(recommendationsTranslations.fieldProfileHeading)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground md:max-w-xl">
                      {t(recommendationsTranslations.fieldProfileDescription)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      <label className="text-sm font-medium flex items-center gap-2">
                        {t(recommendationsTranslations.farmSize)}
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          value={farmSizeValue}
                          onChange={(event) => setFarmSizeValue(event.target.value)}
                          placeholder={t(recommendationsTranslations.farmSizePlaceholder)}
                          className="sm:max-w-[180px]"
                        />
                        <Select value={farmSizeUnit} onValueChange={(value: FarmSizeUnit) => setFarmSizeUnit(value)}>
                          <SelectTrigger className="sm:max-w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acre">{t(recommendationsTranslations.farmSizeUnitAcre)}</SelectItem>
                            <SelectItem value="hectare">{t(recommendationsTranslations.farmSizeUnitHectare)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(recommendationsTranslations.farmSizeHelper)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-primary" />
                        <span>{t(recommendationsTranslations.irrigation)}</span>
                      </label>
                      <Select value={selectedIrrigation} onValueChange={setSelectedIrrigation}>
                        <SelectTrigger>
                          <SelectValue placeholder={t(recommendationsTranslations.irrigationPlaceholder)} />
                        </SelectTrigger>
                        <SelectContent>
                          {irrigationOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {t(option.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span>{t(recommendationsTranslations.cultivationFocusHeading)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground md:max-w-xl">
                      {t(recommendationsTranslations.cultivationFocusDescription)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span>{t(recommendationsTranslations.farmingGoal)}</span>
                      </label>
                      <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                        <SelectTrigger>
                          <SelectValue placeholder={t(recommendationsTranslations.farmingGoalPlaceholder)} />
                        </SelectTrigger>
                        <SelectContent>
                          {farmingGoals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {t(goal.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Info className="h-5 w-5 text-primary" />
                      <span>{t(recommendationsTranslations.additionalContextHeading)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground md:max-w-xl">
                      {t(recommendationsTranslations.additionalContextDescription)}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t(recommendationsTranslations.challengesLabel)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(recommendationsTranslations.challengesHelper)}
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {challengeOptions.map((challenge) => {
                          const isChecked = selectedChallenges.includes(challenge.id);
                          return (
                            <label
                              key={challenge.id}
                              className={`flex items-start gap-3 rounded-md border p-3 transition ${
                                isChecked ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/40"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  setSelectedChallenges((previous) => {
                                    if (checked === true) {
                                      return previous.includes(challenge.id)
                                        ? previous
                                        : [...previous, challenge.id];
                                    }
                                    return previous.filter((id) => id !== challenge.id);
                                  });
                                }}
                              />
                              <span className="text-sm leading-tight">{t(challenge.label)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t(recommendationsTranslations.additionalNotes)}
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder={t(recommendationsTranslations.notesPlaceholder)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t(recommendationsTranslations.notesHelper)}
                      </p>
                    </div>
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
