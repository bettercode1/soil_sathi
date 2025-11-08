
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, PlusCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilHealthTranslations, soilAnalyzerTranslations } from "@/constants/allTranslations";

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

const chartTabLabels = {
  npk: localized("NPK Levels", "NPK स्तर", "NPK ਪੱਧਰ", "NPK நிலைகள்", "NPK స్థాయిలు", "NPK স্তর", "NPK स्तर"),
  phOrganic: localized("pH & Organic Matter", "pH और जैविक पदार्थ", "pH ਅਤੇ ਜੈਵਿਕ ਪਦਾਰਥ", "pH மற்றும் இயற்கை பொருள்", "pH మరియు సేంద్రీయ పదార్థం", "pH ও জৈব পদার্থ", "pH आणि सेंद्रिय पदार्थ"),
};

const chartTitleLabels = {
  phLevel: localized("pH Level", "pH स्तर", "pH ਪੱਧਰ", "pH நிலை", "pH స్థాయి", "pH স্তর", "pH स्तर"),
};

const tableHeaderLabels = {
  date: localized("Date", "तारीख़", "ਤਾਰੀਖ਼", "தேதி", "తేదీ", "তারিখ", "दिनांक"),
};

const toastMessages = {
  comingSoonTitle: localized("Coming soon!", "जल्द आ रहा है!", "ਜਲਦੀ ਹੀ ਆ ਰਿਹਾ ਹੈ!", "விரைவில் வருகிறது!", "త్వరలో రాబోతోంది!", "শীঘ্রই আসছে!", "लवकरच येत आहे!"),
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
      return "text-red-600";
    case "low":
      return "text-yellow-600";
    case "optimal":
      return "text-green-600";
    case "high":
      return "text-blue-600";
    default:
      return "text-foreground";
  }
};

const SoilHealth = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Latest soil data is the most recent entry
  const latestSoilData = mockSoilHistoryData[mockSoilHistoryData.length - 1];

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

  const legendLabels = {
    nitrogen: t(soilAnalyzerTranslations.nitrogen),
    phosphorus: t(soilAnalyzerTranslations.phosphorus),
    potassium: t(soilAnalyzerTranslations.potassium),
    ph: t(chartTitleLabels.phLevel),
    organic: t(soilAnalyzerTranslations.organicMatter),
  };

  const kgPerHectareLabel = t(unitLabels.kgPerHectare);
  const kgPerHaLabel = t(unitLabels.kgPerHa);

  return (
    <Layout>
      <section className="relative isolate overflow-hidden py-16 md:py-20">
        <img
          src="https://images.pexels.com/photos/5231047/pexels-photo-5231047.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center md:object-top"
        />
        <div className="absolute inset-0 bg-slate-900/70" aria-hidden="true" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t(soilHealthTranslations.title)}
            </h1>
            <p className="text-white/90 mb-6">
              {t(soilHealthTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t(soilHealthTranslations.soilHealthOverview)}</CardTitle>
                  <CardDescription>
                    {t(soilHealthTranslations.currentStatus)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">{t(soilAnalyzerTranslations.soilPH)}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.ph}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.ph, "ph"))} text-sm font-medium`}>
                          {t(statusLabels[getNutrientStatus(latestSoilData.ph, "ph")])}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">{t(soilAnalyzerTranslations.nitrogen)}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.nitrogen}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.nitrogen, "nitrogen"))} text-sm font-medium`}>
                          {t(statusLabels[getNutrientStatus(latestSoilData.nitrogen, "nitrogen")])}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{kgPerHectareLabel}</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">{t(soilAnalyzerTranslations.phosphorus)}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.phosphorus}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.phosphorus, "phosphorus"))} text-sm font-medium`}>
                          {t(statusLabels[getNutrientStatus(latestSoilData.phosphorus, "phosphorus")])}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{kgPerHectareLabel}</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">{t(soilAnalyzerTranslations.potassium)}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.potassium}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.potassium, "potassium"))} text-sm font-medium`}>
                          {t(statusLabels[getNutrientStatus(latestSoilData.potassium, "potassium")])}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{kgPerHectareLabel}</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">{t(soilAnalyzerTranslations.organicMatter)}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.organic}%</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.organic, "organic"))} text-sm font-medium`}>
                          {t(statusLabels[getNutrientStatus(latestSoilData.organic, "organic")])}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t(soilHealthTranslations.actions)}</CardTitle>
                  <CardDescription>
                    {t(soilHealthTranslations.manageData)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={handleAddNewReading} className="w-full flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>{t(soilHealthTranslations.addNewTest)}</span>
                    </Button>
                    
                    <Button variant="outline" onClick={handleSetReminder} className="w-full flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t(soilHealthTranslations.setReminder)}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t(soilHealthTranslations.nutrientTrends)}</CardTitle>
                <CardDescription>
                  {t(soilHealthTranslations.trackChanges)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="npk">
                  <TabsList className="mb-6">
                    <TabsTrigger value="npk">{t(chartTabLabels.npk)}</TabsTrigger>
                    <TabsTrigger value="ph">{t(chartTabLabels.phOrganic)}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="npk">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={mockSoilHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="nitrogen" stroke="#4CAF50" name={legendLabels.nitrogen} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="phosphorus" stroke="#2196F3" name={legendLabels.phosphorus} />
                        <Line type="monotone" dataKey="potassium" stroke="#FF9800" name={legendLabels.potassium} />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="ph">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-center font-medium mb-4">{t(chartTitleLabels.phLevel)}</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={mockSoilHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[5, 8]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="ph" stroke="#9C27B0" name={legendLabels.ph} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h3 className="text-center font-medium mb-4">{t(soilAnalyzerTranslations.organicMatter)}</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={mockSoilHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="organic" fill="#8B4513" name={legendLabels.organic} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t(soilHealthTranslations.testHistory)}</CardTitle>
                <CardDescription>
                  {t(soilHealthTranslations.completeRecord)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                          <th className="text-left py-3 px-4">{t(tableHeaderLabels.date)}</th>
                          <th className="text-left py-3 px-4">{t(soilAnalyzerTranslations.soilPH)}</th>
                          <th className="text-left py-3 px-4">{t(soilAnalyzerTranslations.nitrogen)}</th>
                          <th className="text-left py-3 px-4">{t(soilAnalyzerTranslations.phosphorus)}</th>
                          <th className="text-left py-3 px-4">{t(soilAnalyzerTranslations.potassium)}</th>
                          <th className="text-left py-3 px-4">{t(soilAnalyzerTranslations.organicMatter)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSoilHistoryData.slice().reverse().map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{item.date}</td>
                          <td className="py-3 px-4">{item.ph}</td>
                            <td className="py-3 px-4">{item.nitrogen} {kgPerHaLabel}</td>
                            <td className="py-3 px-4">{item.phosphorus} {kgPerHaLabel}</td>
                            <td className="py-3 px-4">{item.potassium} {kgPerHaLabel}</td>
                          <td className="py-3 px-4">{item.organic}%</td>
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
