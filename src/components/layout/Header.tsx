
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Menu,
  Leaf,
  Home,
  Microscope,
  ListChecks,
  HeartPulse,
  Sprout,
  LifeBuoy,
  Wifi,
  Bug,
  Cloud,
  TrendingUp,
  DollarSign,
  Droplets,
  Calendar,
  Calculator,
  AlertTriangle,
  MessageCircle,
  Users,
  Map,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import {
  cropDiseaseTranslations,
  weatherAlertsTranslations,
  cropGrowthTranslations,
  marketPricesTranslations,
  irrigationSchedulerTranslations,
  farmingCalendarTranslations,
  fertilizerCostTranslations,
  commonTranslations,
  indexTranslations,
  regionsTranslations,
} from "@/constants/allTranslations";
import { cn } from "@/lib/utils";
import { LoginModal } from "@/components/auth/LoginModal";
import betterCodeLogo from "@/assets/bettercode-logo.png";
import type { TranslationSet } from "@/constants/languages";

const Header = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Simple translations for the header
  const translations = {
    en: {
      home: "Home",
      soilAnalyzer: "Soil Analyzer",
      sensorData: "Sensor Data",
      recommendations: "Recommendations",
      soilHealth: "Soil Health",
      organicFarming: "Organic Farming",
      helpDesk: "Help Desk",
      yourSoilAdvisor: "Your Soil Advisor"
    },
    hi: {
      home: "होम",
      soilAnalyzer: "मिट्टी विश्लेषक",
      sensorData: "सेंसर डेटा",
      recommendations: "सिफारिशें",
      soilHealth: "मिट्टी स्वास्थ्य",
      organicFarming: "जैविक खेती",
      helpDesk: "सहायता डेस्क",
      yourSoilAdvisor: "आपका मिट्टी सलाहकार"
    },
    pa: {
      home: "ਹੋਮ",
      soilAnalyzer: "ਮਿੱਟੀ ਵਿਸ਼ਲੇਸ਼ਕ",
      sensorData: "ਸੈਂਸਰ ਡੇਟਾ",
      recommendations: "ਸਿਫਾਰਸ਼ਾਂ",
      soilHealth: "ਮਿੱਟੀ ਦੀ ਸਿਹਤ",
      organicFarming: "ਜੈਵਿਕ ਖੇਤੀ",
      helpDesk: "ਸਹਾਇਤਾ ਡੈਸਕ",
      yourSoilAdvisor: "ਤੁਹਾਡਾ ਮਿੱਟੀ ਸਲਾਹਕਾਰ"
    },
    ta: {
      home: "முகப்பு",
      soilAnalyzer: "மண் பகுப்பாய்வி",
      sensorData: "சென்சார் தரவு",
      recommendations: "பரிந்துரைகள்",
      soilHealth: "மண் ஆரோக்கியம்",
      organicFarming: "இயற்கை விவசாயம்",
      helpDesk: "உதவி மையம்",
      yourSoilAdvisor: "உங்கள் மண் ஆலோசகர்"
    },
    te: {
      home: "హోమ్",
      soilAnalyzer: "నేల విశ్లేషకుడు",
      sensorData: "సెన్సర్ డేటా",
      recommendations: "సిఫార్సులు",
      soilHealth: "నేల ఆరోగ్యం",
      organicFarming: "సేంద్రీయ వ్యవసాయం",
      helpDesk: "సహాయ డెస్క్",
      yourSoilAdvisor: "మీ మట్టి సలహాదారు"
    },
    bn: {
      home: "হোম",
      soilAnalyzer: "মাটি বিশ্লেষক",
      sensorData: "সেন্সর ডেটা",
      recommendations: "সুপারিশগুলি",
      soilHealth: "মাটির স্বাস্থ্য",
      organicFarming: "জৈব চাষ",
      helpDesk: "সহায়তা ডেস্ক",
      yourSoilAdvisor: "আপনার মাটির উপদেষ্টা"
    },
    mr: {
      home: "मुख्यपृष्ठ",
      soilAnalyzer: "माती विश्लेषक",
      sensorData: "सेंसर डेटा",
      recommendations: "शिफारसी",
      soilHealth: "मातीचे आरोग्य",
      organicFarming: "सेंद्रिय शेती",
      helpDesk: "सहाय्यता डेस्क",
      yourSoilAdvisor: "तुमचा माती सल्लागार"
    },
    as: {
      home: "ঘৰ",
      soilAnalyzer: "মাটি বিশ্লেষক",
      sensorData: "ছেন্চৰ তথ্য",
      recommendations: "পৰামৰ্শ",
      soilHealth: "মাটিৰ স্বাস্থ্য",
      organicFarming: "জৈৱিক খেতি",
      helpDesk: "সহায় ডেছ্ক",
      yourSoilAdvisor: "আপোনাৰ মাটি পৰামৰ্শদাতা"
    },
    mni: {
      home: "য়ুম",
      soilAnalyzer: "মাটি বিশ্লেষক",
      sensorData: "ছেন্সর ডাটা",
      recommendations: "পরামর্শ",
      soilHealth: "মাটির স্বাস্থ্য",
      organicFarming: "জৈবিক খেতি",
      helpDesk: "সহায় ডেস্ক",
      yourSoilAdvisor: "আপনার মাটি পরামর্শদাতা"
    },
    lus: {
      home: "In",
      soilAnalyzer: "Lei analysis",
      sensorData: "Sensor data",
      recommendations: "Rawtna",
      soilHealth: "Lei hriselna",
      organicFarming: "Organic lo neih",
      helpDesk: "Tanpui desk",
      yourSoilAdvisor: "I lei advisor"
    },
    ne: {
      home: "गृह",
      soilAnalyzer: "माटो विश्लेषक",
      sensorData: "सेन्सर डाटा",
      recommendations: "सिफारिसहरू",
      soilHealth: "माटोको स्वास्थ्य",
      organicFarming: "जैविक खेती",
      helpDesk: "सहायता डेस्क",
      yourSoilAdvisor: "तपाईंको माटो सल्लाहकार"
    },
    kha: {
      home: "Iing",
      soilAnalyzer: "Klei analysis",
      sensorData: "Sensor data",
      recommendations: "Ki jingpyrkhat",
      soilHealth: "Ka jinglong khlieh ka khei",
      organicFarming: "Organic farming",
      helpDesk: "Ka jingïarap",
      yourSoilAdvisor: "U nongai jingtip khei"
    },
    brx: {
      home: "घर",
      soilAnalyzer: "माटि बिज्लेखनाय",
      sensorData: "सेन्सर डाटा",
      recommendations: "सलाह",
      soilHealth: "माटि नि सेरफार",
      organicFarming: "जैविक खेती",
      helpDesk: "मदद डेस्क",
      yourSoilAdvisor: "नोंथांनि माटि सलाहगिरि"
    }
  };

  type NavKey = keyof typeof translations.en;

  const navItems: Array<{ key: NavKey; href: string; icon: LucideIcon }> = [
    { key: "home", href: "/", icon: Home },
    { key: "soilAnalyzer", href: "/soil-analyzer", icon: Microscope },
    { key: "sensorData", href: "/sensor-data", icon: Wifi },
    { key: "recommendations", href: "/recommendations", icon: ListChecks },
    { key: "soilHealth", href: "/soil-health", icon: HeartPulse },
    { key: "organicFarming", href: "/organic-farming", icon: Sprout },
    { key: "helpDesk", href: "/farmer-help-desk", icon: LifeBuoy },
  ];

  const newFeatureItems: Array<{ label: TranslationSet; href: string; icon: LucideIcon }> = [
    { label: cropDiseaseTranslations.title, href: "/crop-disease", icon: Bug },
    { label: weatherAlertsTranslations.title, href: "/weather-alerts", icon: Cloud },
    { label: cropGrowthTranslations.title, href: "/crop-growth", icon: TrendingUp },
    { label: marketPricesTranslations.title, href: "/market-prices", icon: DollarSign },
    { label: irrigationSchedulerTranslations.title, href: "/irrigation-scheduler", icon: Droplets },
    { label: farmingCalendarTranslations.title, href: "/farming-calendar", icon: Calendar },
    { label: fertilizerCostTranslations.title, href: "/fertilizer-cost", icon: Calculator },
    { label: regionsTranslations.title, href: "/regions", icon: Map },
    { label: indexTranslations.soilHealthPredictionTitle, href: "/soil-health-prediction", icon: AlertTriangle },
    { label: indexTranslations.farmerCommunityTitle, href: "/farmer-community", icon: MessageCircle },
    { label: indexTranslations.expertConsultationTitle, href: "/expert-consultation", icon: Users },
  ];

  const getLabel = (key: NavKey) =>
    t({
      en: translations.en[key],
      hi: translations.hi[key],
      pa: translations.pa[key],
      ta: translations.ta[key],
      te: translations.te[key],
      bn: translations.bn[key],
      mr: translations.mr[key],
      as: translations.as[key],
      mni: translations.mni[key],
      lus: translations.lus[key],
      ne: translations.ne[key],
      kha: translations.kha[key],
      brx: translations.brx[key],
    });

  const NavigationLinks = () => (
    <nav className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-none py-1">
      {navItems.map(({ key, href, icon: Icon }) => (
        <Link
          key={key}
          to={href}
          className="group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-foreground/80 transition-all hover:bg-primary/10 hover:text-primary shrink-0"
        >
          <Icon className="h-4 w-4" />
          <span className="whitespace-nowrap">{getLabel(key)}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        isScrolled 
          ? "border-border/50 derived-bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" 
          : "border-transparent bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between px-1 md:px-2">
        {/* Logo Section */}
        <div className="flex items-center gap-2 shrink-0 -ml-1 md:-ml-2">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={betterCodeLogo} 
              alt="Better Code Logo" 
              className="h-5 md:h-6 w-auto object-contain"
            />
            <div className="h-5 w-[1px] bg-border/40 mx-1" />
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">SoilSathi</h1>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0 justify-end ml-2">
          <NavigationLinks />
          <div className="flex items-center gap-2 pl-2 border-l shrink-0">
            <LanguageSelector />
            <LoginModal />
          </div>
        </div>

        {/* Mobile/Tablet Navigation */}
        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSelector />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <img 
                    src={betterCodeLogo} 
                    alt="Better Code Logo" 
                    className="h-6 w-auto object-contain"
                  />
                  <div className="h-4 w-[1px] bg-border/40" />
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    <span className="text-xl font-black tracking-tight">SoilSathi</span>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  {t({
                    en: translations.en.yourSoilAdvisor,
                    hi: translations.hi.yourSoilAdvisor,
                    pa: translations.pa.yourSoilAdvisor,
                    ta: translations.ta.yourSoilAdvisor,
                    te: translations.te.yourSoilAdvisor,
                    bn: translations.bn.yourSoilAdvisor,
                    mr: translations.mr.yourSoilAdvisor,
                    as: translations.as.yourSoilAdvisor,
                    mni: translations.mni.yourSoilAdvisor,
                    lus: translations.lus.yourSoilAdvisor,
                    ne: translations.ne.yourSoilAdvisor,
                    kha: translations.kha.yourSoilAdvisor,
                    brx: translations.brx.yourSoilAdvisor,
                  })}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                {navItems.map(({ key, href, icon: Icon }) => (
                  <Link
                    key={key}
                    to={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {getLabel(key)}
                  </Link>
                ))}
                
                <div className="my-4 border-t" />
                
                <div className="px-3 py-2">
                  <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    {t(commonTranslations.newFeatures)}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {newFeatureItems.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        to={href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {t(label)}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <LoginModal />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
