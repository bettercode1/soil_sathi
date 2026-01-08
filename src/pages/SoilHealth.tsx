import React from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilAnalyzerTranslations, soilHealthTranslations, commonTranslations } from "@/constants/allTranslations";
import { Timer, Plus, ArrowUpRight, ArrowDownRight, Minus, FlaskConical, Leaf, Sprout } from "lucide-react";
import soilHealthHero from "@/assets/soil-health-hero.jpg";

type LanguageCode = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";
type LocalizedString = Record<LanguageCode, string>;
type NutrientStatusKey = "veryLow" | "low" | "optimal" | "high";

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

const statusLabels: Record<NutrientStatusKey, LocalizedString> = {
  veryLow: localized("Very Low", "बहुत कम", "ਬਹੁਤ ਘੱਟ", "மிகக் குறைவு", "చాలా తక్కువ", "খুব কম", "अतिशय कमी"),
  low: localized("Low", "कम", "ਘੱਟ", "குறைவு", "తక్కువ", "কম", "कमी"),
  optimal: localized("Optimal", "उत्तम", "ਉਤਕ੍ਰਿਸ਼ਟ", "சிறந்த", "సరైన", "সর্বোত্তম", "उत्तम"),
  high: localized("High", "अधिक", "ਵੱਧ", "அதிகம்", "అధిక", "উচ্চ", "जास्त"),
};

const unitLabels = {
  kgPerHectare: localized("kg/hectare", "किग्रा/हेक्टेयर", "ਕਿਲੋ/ਹੈਕਟੇਅਰ", "கிலோ/ஹெக்டேர்", "కిలో/హెక్టారు", "কেজি/হেক্টর", "किलो/हेक्टर"),
  kgPerHa: localized("kg/ha", "किग्रा/हे.", "ਕਿਲੋ/ਹੈ.", "கிலோ/ஹெ.", "కిలో/హె.", "কেজি/হা", "किलो/हे."),
};

const tableHeaderLabels = {
  date: localized("Date", "तारीख़", "ਤਾਰੀਖ਼", "தேதி", "తేదీ", "তারিখ", "दिनांक"),
};

const toastMessages = {
  comingSoonTitle: localized("Coming soon!", "जल्द आ रहा है!", "ਜਲਦੀ ही आ ਰਿਹਾ ਹੈ!", "விரைவில் வருகிறது!", "త్వరలో రాబోతోంది!", "শীঘ্রই আসছে!", "लवकरच येत आहे!"),
  comingSoonDescription: localized(
    "This feature will allow you to add new soil test readings.",
    "यह सुविधा आपको नई मिट्टी परीक्षण रीडिंग जोड़ने देगी।",
    "ਇਹ ਵਿਸ਼ੇਸ਼ਤਾ ਤੁਹਾਨੂੰ ਨਵੀਆਂ ਮਿੱਟੀ ਟੈਸਟ ਰੀਡਿੰਗ ਸ਼ਾਮਲ ਕਰਨ ਦੇਵੇਗੀ।",
    "இந்த வசதி புதிய மண் பரிசோதனை பதிவுகளைச் சேர்க்க உங்களுக்கு உதவும்.",
    "ఈ ఫీచర్ మీకు కొత్త నేల పరీక్ష రీడింగ్‌లు జోడించే అవకాశం ఇస్తుంది.",
    "এই ফিচারটি আপনাকে নতুন মাটি পরীক্ষা রিডিং যোগ করতে দেবে।",
    "ही सुविधा तुम्हाला नवीन माती परीक्षण नोंदी जोडण्यास मदत करेल."
  ),
  reminderTitle: localized("Reminder set!", "अनुस्मारक सेट हो गया!", "ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਹੋ ਗਿਆ!", "நினைவூட்டல் அமைக்கப்பட்டது!", "గుర్తు పెట్టాం!", "রিমাইন্ডার সেট হয়েছে!", "आठवण जतन केली!"),
  reminderDescription: localized(
    "We'll remind you to test your soil again in 3 months.",
    "हम आपको 3 महीने में फिर से मिट्टी परीक्षण करने की याद दिलाएंगे।",
    "ਅਸੀਂ ਤੁਹਾਨੂੰ 3 ਮਹੀਨੇ ਵਿੱਚ ਮੁੜ ਮਿੱਟੀ ਟੈਸਟ ਕਰਨ ਦੀ ਯਾਦ ਦਵਾਂਗੇ।",
    "மூன்று மாதங்களில் மீண்டும் மண் பரிசோதனை செய்ய நாம் நினைவூட்டுவோம்.",
    "మేము మిమ్మల్ని 3 నెలల తర్వాత మళ్లీ నేల పరీక్ష చేయమని గుర్తుచేస్తాము.",
    "আমরা আপনাকে ৩ মাস পরে আবার মাটি পরীক্ষা করার কথা মনে করিয়ে দেব।",
    "आम्ही तुम्हाला ३ महिन्यांनी पुन्हा माती चाचणी करण्याची आठवण करून देऊ."
  ),
};

const mockSoilHistoryData = [
  {
    date: "Jan 2023",
    ph: 6.2,
    nitrogen: 240,
    phosphorus: 35,
    potassium: 180,
    organic: 1.8
  },
  {
    date: "Apr 2023",
    ph: 6.5,
    nitrogen: 260,
    phosphorus: 38,
    potassium: 195,
    organic: 2.1
  },
  {
    date: "Oct 2023",
    ph: 6.7,
    nitrogen: 280,
    phosphorus: 42,
    potassium: 210,
    organic: 2.5
  },
  {
    date: "Jan 2024",
    ph: 6.8,
    nitrogen: 285,
    phosphorus: 45,
    potassium: 215,
    organic: 2.6
  },
];

const nutrientStandardLevels = {
  ph: {
    low: 5.5,
    optimal: 6.5,
    high: 7.5
  },
  nitrogen: {
    low: 140,
    optimal: 280,
    high: 400
  },
  phosphorus: {
    low: 20,
    optimal: 40,
    high: 60
  },
  potassium: {
    low: 150,
    optimal: 250,
    high: 350
  },
  organic: {
    low: 1.0,
    optimal: 3.0,
    high: 5.0
  }
};

const getNutrientStatus = (value: number, nutrient: keyof typeof nutrientStandardLevels): NutrientStatusKey => {
  const levels = nutrientStandardLevels[nutrient];
  if (value < levels.low) {
    return "veryLow";
  } else if (value < levels.optimal) {
    return "low";
  } else if (value <= levels.high) {
    return "optimal";
  } else {
    return "high";
  }
};

const getStatusColor = (status: NutrientStatusKey) => {
  switch (status) {
    case "veryLow":
      return "text-red-600 bg-red-50 border-red-100";
    case "low":
      return "text-yellow-600 bg-yellow-50 border-yellow-100";
    case "optimal":
      return "text-emerald-600 bg-emerald-50 border-emerald-100";
    case "high":
      return "text-blue-600 bg-blue-50 border-blue-100";
    default:
      return "text-slate-600 bg-slate-50 border-slate-100";
  }
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
  if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
};

const SoilHealth = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Latest soil data is the most recent entry
  const latestSoilData = mockSoilHistoryData[mockSoilHistoryData.length - 1];
  const previousSoilData = mockSoilHistoryData[mockSoilHistoryData.length - 2];

  const handleAddNewReading = () => {
    toast({
      title: t(toastMessages.comingSoonTitle),
      description: t(toastMessages.comingSoonDescription)
    });
  };

  const handleSetReminder = () => {
    toast({
      title: t(toastMessages.reminderTitle),
      description: t(toastMessages.reminderDescription)
    });
  };

  const kgPerHectareLabel = t(unitLabels.kgPerHectare);
  const kgPerHaLabel = t(unitLabels.kgPerHa);

  const NutrientCard = ({ 
    title, 
    value, 
    unit, 
    status, 
    trend, 
    icon: Icon 
  }: { 
    title: string, 
    value: string | number, 
    unit?: string, 
    status: NutrientStatusKey,
    trend: React.ReactNode,
    icon: any 
  }) => (
    <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${getStatusColor(status)}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-full shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <span className="text-xs font-bold px-2 py-1 bg-white rounded-full shadow-sm border border-current opacity-80">
          {t(statusLabels[status])}
        </span>
      </div>
      <div className="flex items-end gap-2 mt-3">
        <span className="text-3xl font-bold">{value}</span>
        {unit && <span className="text-sm font-medium mb-1 opacity-80">{unit}</span>}
      </div>
      <div className="flex items-center gap-1 mt-2 text-sm font-medium opacity-80 bg-white/50 w-fit px-2 py-1 rounded">
        {trend}
        <span>{t(commonTranslations.vsLastTest)}</span>
      </div>
    </div>
  );

  return (
    <Layout>
      <section className="relative isolate overflow-hidden py-12 sm:py-16 animate-fade-in">
        <img
          src={soilHealthHero}
          alt="Farmer surveying healthy crop rows during sunrise"
          className="absolute inset-0 h-full w-full object-cover object-center md:object-top"
        />
        <div className="absolute inset-0 bg-slate-900/70" aria-hidden="true" />
        <div className="container relative mx-auto px-2">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold mb-4">
              {t(soilHealthTranslations.title)}
            </h1>
            <p className="text-white/90 mb-6 text-base sm:text-[17px]">
              {t(soilHealthTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-2">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{t(soilHealthTranslations.soilHealthOverview)}</h2>
                <p className="text-slate-500">{t(soilHealthTranslations.currentStatus)}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddNewReading} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t(soilHealthTranslations.addNewTest)}
                </Button>
                <Button variant="outline" onClick={handleSetReminder}>
                  <Timer className="h-4 w-4 mr-2" />
                  {t(soilHealthTranslations.setReminder)}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-fade-in-up">
              <NutrientCard 
                title={t(soilAnalyzerTranslations.soilPH)} 
                value={latestSoilData.ph}
                status={getNutrientStatus(latestSoilData.ph, "ph")}
                trend={getTrendIcon(latestSoilData.ph, previousSoilData.ph)}
                icon={FlaskConical}
              />
              <NutrientCard 
                title={t(soilAnalyzerTranslations.nitrogen)} 
                value={latestSoilData.nitrogen}
                unit={kgPerHaLabel}
                status={getNutrientStatus(latestSoilData.nitrogen, "nitrogen")}
                trend={getTrendIcon(latestSoilData.nitrogen, previousSoilData.nitrogen)}
                icon={Leaf}
              />
              <NutrientCard 
                title={t(soilAnalyzerTranslations.phosphorus)} 
                value={latestSoilData.phosphorus}
                unit={kgPerHaLabel}
                status={getNutrientStatus(latestSoilData.phosphorus, "phosphorus")}
                trend={getTrendIcon(latestSoilData.phosphorus, previousSoilData.phosphorus)}
                icon={Sprout}
              />
              <NutrientCard 
                title={t(soilAnalyzerTranslations.potassium)} 
                value={latestSoilData.potassium}
                unit={kgPerHaLabel}
                status={getNutrientStatus(latestSoilData.potassium, "potassium")}
                trend={getTrendIcon(latestSoilData.potassium, previousSoilData.potassium)}
                icon={Sprout}
              />
              <NutrientCard 
                title={t(soilAnalyzerTranslations.organicMatter)} 
                value={latestSoilData.organic}
                unit="%"
                status={getNutrientStatus(latestSoilData.organic, "organic")}
                trend={getTrendIcon(latestSoilData.organic, previousSoilData.organic)}
                icon={Leaf}
              />
            </div>

            <Card className="rounded-xl shadow-sm border border-slate-200">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xl">{t(soilHealthTranslations.testHistory)}</CardTitle>
                <CardDescription>
                  {t(soilHealthTranslations.completeRecord)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
                          <th className="py-4 px-6">{t(tableHeaderLabels.date)}</th>
                          <th className="py-4 px-6">{t(soilAnalyzerTranslations.soilPH)}</th>
                          <th className="py-4 px-6">{t(soilAnalyzerTranslations.nitrogen)}</th>
                          <th className="py-4 px-6">{t(soilAnalyzerTranslations.phosphorus)}</th>
                          <th className="py-4 px-6">{t(soilAnalyzerTranslations.potassium)}</th>
                          <th className="py-4 px-6">{t(soilAnalyzerTranslations.organicMatter)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mockSoilHistoryData.slice().reverse().map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-900">{item.date}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(getNutrientStatus(item.ph, "ph")).split(' ')[1].replace('50', '100')} ${getStatusColor(getNutrientStatus(item.ph, "ph")).split(' ')[0]}`}>
                              {item.ph}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600">{item.nitrogen} {kgPerHaLabel}</td>
                          <td className="py-4 px-6 text-slate-600">{item.phosphorus} {kgPerHaLabel}</td>
                          <td className="py-4 px-6 text-slate-600">{item.potassium} {kgPerHaLabel}</td>
                          <td className="py-4 px-6 text-slate-600">{item.organic}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SoilHealth;
