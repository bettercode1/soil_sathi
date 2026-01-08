type Language = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";
type TranslationSet = Record<Language, string>;

// Importing TranslationSet type if available, otherwise defining it loosely or assuming strict inference.
// Assuming TranslationSet is Record<string, string> or similar.

export const newCommonTranslations: Record<string, any> = {
  // General
  downloadFailed: {
    en: "Download Failed",
    hi: "डाउनलोड विफल",
    mr: "डाउनलोड अयशस्वी"
  },
  couldNotGeneratePDF: {
    en: "Could not generate PDF report",
    hi: "PDF रिपोर्ट उत्पन्न नहीं की जा सकी",
    mr: "PDF अहवाल तयार करता आला नाही"
  },
  realtimeMonitoring: {
    en: "Real-time Monitoring",
    hi: "वास्तविक समय निगरानी",
    mr: "रिअल-टाइम देखरेख"
  },
  
  // Units
  kgPerHa: {
    en: "kg/ha",
    hi: "किग्रा/हेक्टेयर",
    mr: "किग्रॅ/हेक्टर"
  },
  tonsPerHa: {
    en: "tons/ha",
    hi: "टन/हेक्टेयर",
    mr: "टन/हेक्टर"
  },
  percent: {
    en: "%",
    hi: "%",
    mr: "%"
  },

  // Priority
  priorityHigh: {
    en: "High Priority",
    hi: "उच्च प्राथमिकता",
    mr: "उच्च प्राधान्य"
  },
  priorityMedium: {
    en: "Medium Priority",
    hi: "मध्यम प्राथमिकता",
    mr: "मध्यम प्राधान्य"
  },

  // Section Headers
  overview: {
    en: "Overview",
    hi: "अवलोकन",
    mr: "आढावा"
  },
  soilQuality: {
    en: "Soil Quality",
    hi: "मिट्टी की गुणवत्ता",
    mr: "मातीची गुणवत्ता"
  },
  nutrientAnalysis: {
    en: "Nutrient Analysis",
    hi: "पोषक तत्व विश्लेषण",
    mr: "पोषक द्रव्य विश्लेषण"
  },
  chemicalPlan: {
    en: "Chemical Fertilizer Plan",
    hi: "रासायनिक उर्वरक योजना",
    mr: "रासायनिक खत योजना"
  },
  organicPlan: {
    en: "Organic Fertilizer Plan",
    hi: "जैविक उर्वरक योजना",
    mr: "सेंद्रिय खत योजना"
  },
  improvementPlan: {
    en: "Soil Improvement Plan",
    hi: "मिट्टी सुधार योजना",
    mr: "माती सुधार योजना"
  },
  warnings: {
    en: "Warnings",
    hi: "चेतावनियां",
    mr: "इशारे"
  },
  nextSteps: {
    en: "Next Steps",
    hi: "अगले कदम",
    mr: "पुढील पावले"
  },

  // Placeholders
  selectSoilType: {
    en: "Select Soil Type",
    hi: "मिट्टी का प्रकार चुनें",
    mr: "मातीचा प्रकार निवडा"
  },
  selectRegion: {
    en: "Select Region",
    hi: "क्षेत्र चुनें",
    mr: "प्रदेश निवडा"
  },
  selectCrop: {
    en: "Select Crop",
    hi: "फसल चुनें",
    mr: "पीक निवडा"
  },
  selectStage: {
    en: "Select Stage",
    hi: "चरण चुनें",
    mr: "टप्पा निवडा"
  },

  // Needs for Recommendations (that might not be in soilAnalyzer)
  // Soil Types
  alluvial: { en: "Alluvial", hi: "जलोढ़", mr: "गाळाची" },
  blackRegur: { en: "Black (Regur)", hi: "काली (रेगुर)", mr: "काळी (रेगुर)" },
  red: { en: "Red", hi: "लाल", mr: "लाल" },
  laterite: { en: "Laterite", hi: "लेटराइट", mr: "जांभा" },
  desert: { en: "Desert", hi: "रेगिस्तानी", mr: "वाळवंटी" },
  mountain: { en: "Mountain", hi: "पर्वतीय", mr: "डोंगराळ" },
  clayey: { en: "Clayey", hi: "चिकनी", mr: "चिकण" },
  sandy: { en: "Sandy", hi: "रेतीली", mr: "रेताड" },
  loamy: { en: "Loamy", hi: "दोमट", mr: "पोयटा" },

  // Regions
  punjab: { en: "Punjab", hi: "पंजाब", mr: "पंजाब" },
  haryana: { en: "Haryana", hi: "हरियाणा", mr: "हरियाणा" },
  uttarPradesh: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश" },
  bihar: { en: "Bihar", hi: "बिहार", mr: "बिहार" },
  westBengal: { en: "West Bengal", hi: "पश्चिम बंगाल", mr: "पश्चिम बंगाल" },
  maharashtra: { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र" },
  karnataka: { en: "Karnataka", hi: "कर्नाटक", mr: "कर्नाटक" },
  tamilNadu: { en: "Tamil Nadu", hi: "तमिलनाडु", mr: "तामिळनाडू" },
  andhraPradesh: { en: "Andhra Pradesh", hi: "आंध्र प्रदेश", mr: "आंध्र प्रदेश" },
  telangana: { en: "Telangana", hi: "तेलंगाना", mr: "तेलंगणा" },
  kerala: { en: "Kerala", hi: "केरल", mr: "केरळ" },
  gujarat: { en: "Gujarat", hi: "गुजरात", mr: "गुजरात" },
  rajasthan: { en: "Rajasthan", hi: "राजस्थान", mr: "राजस्थान" },
  madhyaPradesh: { en: "Madhya Pradesh", hi: "मध्य प्रदेश", mr: "मध्य प्रदेश" },

  // Farming Goals
  maximumYield: { en: "Maximum Yield", hi: "अधिकतम उपज", mr: "जास्तीत जास्त उत्पन्न" },
  costReduction: { en: "Cost Reduction", hi: "लागत में कमी", mr: "खर्च कपात" },
  organicTransition: { en: "Organic Transition", hi: "जैविक संक्रमण", mr: "सेंद्रिय संक्रमण" },
  soilHealthImprovement: { en: "Soil Health Improvement", hi: "मिट्टी स्वास्थ्य सुधार", mr: "माती आरोग्य सुधारणा" },

  // Challenges
  lowCropYield: { en: "Low crop yield", hi: "कम फसल उपज", mr: "कमी पीक उत्पन्न" },
  soilNutrientDeficiency: { en: "Soil nutrient deficiency", hi: "मिट्टी पोषक तत्व की कमी", mr: "माती पोषक तत्वांची कमतरता" },
  pestDiseaseIssues: { en: "Pest/disease issues", hi: "कीट/रोग समस्याएं", mr: "किड/रोग समस्या" },
  waterScarcity: { en: "Water scarcity", hi: "जल की कमी", mr: "पाणी टंचाई" },
  poorSoilDrainage: { en: "Poor soil drainage", hi: "खराब मिट्टी जल निकासी", mr: "खराब पाण्याचा निचरा" },
  soilSalinity: { en: "Soil salinity", hi: "मिट्टी की लवणता", mr: "माती क्षारता" },

  // Crop Stages
  sowing: { en: "Sowing", hi: "बुवाई", mr: "पेरणी" },
  vegetative: { en: "Vegetative", hi: "वानस्पतिक", mr: "वाढ" },
  flowering: { en: "Flowering", hi: "फूल आना", mr: "फुलोरा" },
  fruiting: { en: "Fruiting", hi: "फल आना", mr: "फळधारणा" },
  harvest: { en: "Harvest", hi: "कटाई", mr: "काढणी" },

  // Irrigation (some overlap with soilAnalyzer but good to be safe)
  floodFurrow: { en: "Flood/Furrow", hi: "बाढ़/कुंड", mr: "पूर/सरी" },
  dripIrrigation: { en: "Drip Irrigation", hi: "ड्रिप सिंचाई", mr: "ठिबक सिंचन" },
  sprinkler: { en: "Sprinkler", hi: "स्प्रिंकलर", mr: "तुषार सिंचन" },
  rainfed: { en: "Rainfed", hi: "वर्षा आधारित", mr: "पावसावर अवलंबून" },
  
  // Additional crops not in soilAnalyzer? 
  // soilAnalyzer had wheat, rice, etc. Assuming these are needed if Recommendations.tsx references them via commonTranslations.
  soybean: { en: "Soybean", hi: "सोयाबीन", mr: "सोयाबीन" },
  mango: { en: "Mango", hi: "आम", mr: "आंबा" },
  banana: { en: "Banana", hi: "केला", mr: "केळी" },
  groundnut: { en: "Groundnut", hi: "मूंगफली", mr: "भुईमूग" },
  mustard: { en: "Mustard", hi: "सरसों", mr: "मोहरी" },
  chickpea: { en: "Chickpea", hi: "चना", mr: "हरभरा" },
  pulses: { en: "Pulses", hi: "दालें", mr: "डाळी" },

  newAIPoweredFeatures: {
      en: "New AI-Powered Features",
      hi: "नई AI-संचालित सुविधाएं",
      mr: "नवीन AI-संचालित वैशिष्ट्ये"
  }
};
