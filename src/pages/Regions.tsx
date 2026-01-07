import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { PageHero } from "@/components/shared/PageHero";
import { Map, Search, Sprout, Cloud, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { regionsTranslations } from "@/constants/allTranslations";

const Regions = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const regions = [
    {
      id: "maharashtra",
      name: { 
        en: "Maharashtra", 
        mr: "महाराष्ट्र", 
        hi: "महाराष्ट्र",
        pa: "ਮਹਾਰਾਸ਼ਟਰ",
        ta: "மகாராஷ்டிரா",
        te: "మహారాష్ట్ర",
        bn: "মহারাষ্ট্র"
      },
      soilType: { 
        en: "Black Soil (Regur)", 
        mr: "काळी मृदा (रेगूर)", 
        hi: "काली मिट्टी",
        pa: "ਕਾਲੀ ਮਿੱਟੀ",
        ta: "கரிசல் மண்",
        te: "నల్ల రేగడి నేల",
        bn: "কৃষ্ণ মৃত্তিকা"
      },
      mainCrops: ["Cotton", "Sugarcane", "Soybean", "Onion"],
      weather: "Semi-arid to Tropical",
      insight: {
        en: "Excellent for cotton and sugarcane due to high moisture retention of black soil.",
        mr: "काळी माती ओलावा टिकवून ठेवत असल्याने कापूस आणि उसासाठी उत्तम.",
        hi: "काली मिट्टी की उच्च नमी धारण क्षमता के कारण कपास और गन्ने के लिए उत्कृष्ट।"
      }
    },
    {
      id: "punjab",
      name: { 
        en: "Punjab", 
        pa: "ਪੰਜਾਬ", 
        hi: "पंजाब",
        mr: "पंजाब",
        ta: "பஞ்சாப்",
        te: "పంజాబ్",
        bn: "পাঞ্জাব"
      },
      soilType: { 
        en: "Alluvial Soil", 
        hi: "जलोढ़ मिट्टी", 
        pa: "ਜਲੋੜ ਮਿੱਟੀ",
        mr: "गाळाची मृदा",
        ta: "வண்டல் மண்",
        te: "ఒండ్రు నేల",
        bn: "পলি মাটি"
      },
      mainCrops: ["Wheat", "Rice", "Maize", "Mustard"],
      weather: "Sub-tropical",
      insight: {
        en: "Highly fertile soil ideal for wheat-rice rotation with intensive irrigation.",
        pa: "ਬਹੁਤ ਉਪਜਾਊ ਮਿੱਟੀ ਜੋ ਕਣਕ-ਝੋਨੇ ਦੇ ਚੱਕਰ ਲਈ ਬਹੁਤ ਵਧੀਆ ਹੈ।",
        hi: "अत्यधिक उपजाऊ मिट्टी जो गहन सिंचाई के साथ गेहूं-चावल के रोटेशन के लिए आदर्श है।"
      }
    },
    {
      id: "tamilnadu",
      name: { 
        en: "Tamil Nadu", 
        ta: "தமிழ்நாடு", 
        hi: "तमिलनाडु",
        mr: "तमिळनाडू",
        pa: "ਤਮਿਲਨਾਡੂ",
        te: "తమిళనాడు",
        bn: "তামিলনাড়ু"
      },
      soilType: { 
        en: "Red Soil", 
        ta: "செம்மண்", 
        hi: "लाल मिट्टी",
        mr: "तांबडी मृदा",
        pa: "ਲਾਲ ਮਿੱਟੀ",
        te: "ఎర్ర నేల",
        bn: "লাল মাটি"
      },
      mainCrops: ["Rice", "Coconut", "Groundnut", "Turmeric"],
      weather: "Tropical",
      insight: {
        en: "Good drainage makes it suitable for groundnuts and plantation crops.",
        ta: "நல்ல வடிகால் வசதி இருப்பதால் கடலை மற்றும் தோட்டப் பயிர்களுக்கு ஏற்றது.",
        hi: "अच्छी जल निकासी इसे मूंगफली और वृक्षारोपण फसलों के लिए उपयुक्त बनाती है।"
      }
    }
  ];

  const filteredRegions = regions.filter(r => 
    r.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.name[language as keyof typeof r.name] || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <PageHero
        title={t(regionsTranslations.title)}
        subtitle={t(regionsTranslations.subtitle)}
        icon={Map}
      />

      <section className="py-12 bg-slate-50 min-h-[60vh]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="relative mb-12 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search your region..."
              className="pl-10 h-12 bg-white border-slate-200 focus:border-emerald-500 rounded-xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRegions.map((region) => (
              <Card key={region.id} className="border-none shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group bg-white">
                <div className="h-2 bg-emerald-500 w-full group-hover:h-3 transition-all" />
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    {region.name[language as keyof typeof region.name] || region.name.en}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-emerald-600 font-semibold text-base mt-1">
                    <Sprout className="h-4 w-4" />
                    {region.soilType[language as keyof typeof region.soilType] || region.soilType.en}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Common Crops</p>
                    <div className="flex flex-wrap gap-2">
                      {region.mainCrops.map(crop => (
                        <Badge key={crop} variant="secondary" className="bg-slate-100 text-slate-700 border-none px-3 py-1 text-xs">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Cloud className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{region.weather}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 group-hover:bg-emerald-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-emerald-800 leading-relaxed font-medium italic">
                        "{region.insight[language as keyof typeof region.insight] || region.insight.en}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRegions.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white inline-block p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-slate-500 font-medium">No regions found matching your search.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Regions;
