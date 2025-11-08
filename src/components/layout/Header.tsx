
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Leaf, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const Header = () => {
  const isMobile = useIsMobile();
  const { language, setLanguage, t, getLanguageName } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simple translations for the header
  const translations = {
    en: {
      home: "Home",
      soilAnalyzer: "Soil Analyzer",
      recommendations: "Recommendations",
      soilHealth: "Soil Health",
      organicFarming: "Organic Farming",
      yourSoilAdvisor: "Your Soil Advisor"
    },
    hi: {
      home: "होम",
      soilAnalyzer: "मिट्टी विश्लेषक",
      recommendations: "सिफारिशें",
      soilHealth: "मिट्टी स्वास्थ्य",
      organicFarming: "जैविक खेती",
      yourSoilAdvisor: "आपका मिट्टी सलाहकार"
    },
    pa: {
      home: "ਹੋਮ",
      soilAnalyzer: "ਮਿੱਟੀ ਵਿਸ਼ਲੇਸ਼ਕ",
      recommendations: "ਸਿਫਾਰਸ਼ਾਂ",
      soilHealth: "ਮਿੱਟੀ ਦੀ ਸਿਹਤ",
      organicFarming: "ਜੈਵਿਕ ਖੇਤੀ",
      yourSoilAdvisor: "ਤੁਹਾਡਾ ਮਿੱਟੀ ਸਲਾਹਕਾਰ"
    },
    ta: {
      home: "முகப்பு",
      soilAnalyzer: "மண் பகுப்பாய்வி",
      recommendations: "பரிந்துரைகள்",
      soilHealth: "மண் ஆரோக்கியம்",
      organicFarming: "இயற்கை விவசாயம்",
      yourSoilAdvisor: "உங்கள் மண் ஆலோசகர்"
    },
    te: {
      home: "హోమ్",
      soilAnalyzer: "నేల విశ్లేషకుడు",
      recommendations: "సిఫార్సులు",
      soilHealth: "నేల ఆరోగ్యం",
      organicFarming: "సేంద్రీయ వ్యవసాయం",
      yourSoilAdvisor: "మీ మట్టి సలహాదారు"
    },
    bn: {
      home: "হোম",
      soilAnalyzer: "মাটি বিশ্লেষক",
      recommendations: "সুপারিশগুলি",
      soilHealth: "মাটির স্বাস্থ্য",
      organicFarming: "জৈব চাষ",
      yourSoilAdvisor: "আপনার মাটির উপদেষ্টা"
    },
    mr: {
      home: "मुख्यपृष्ठ",
      soilAnalyzer: "माती विश्लेषक",
      recommendations: "शिफारसी",
      soilHealth: "मातीचे आरोग्य",
      organicFarming: "सेंद्रिय शेती",
      yourSoilAdvisor: "तुमचा माती सल्लागार"
    }
  };

  const NavigationLinks = () => (
    <nav className="flex gap-6 items-center">
      <Link to="/" className="text-foreground hover:text-primary transition-colors">
        {t({ en: translations.en.home, hi: translations.hi.home, pa: translations.pa.home, 
             ta: translations.ta.home, te: translations.te.home, bn: translations.bn.home, mr: translations.mr.home })}
      </Link>
      <Link to="/soil-analyzer" className="text-foreground hover:text-primary transition-colors">
        {t({ en: translations.en.soilAnalyzer, hi: translations.hi.soilAnalyzer, pa: translations.pa.soilAnalyzer, 
             ta: translations.ta.soilAnalyzer, te: translations.te.soilAnalyzer, bn: translations.bn.soilAnalyzer, mr: translations.mr.soilAnalyzer })}
      </Link>
      <Link to="/recommendations" className="text-foreground hover:text-primary transition-colors">
        {t({ en: translations.en.recommendations, hi: translations.hi.recommendations, pa: translations.pa.recommendations, 
             ta: translations.ta.recommendations, te: translations.te.recommendations, bn: translations.bn.recommendations, mr: translations.mr.recommendations })}
      </Link>
      <Link to="/soil-health" className="text-foreground hover:text-primary transition-colors">
        {t({ en: translations.en.soilHealth, hi: translations.hi.soilHealth, pa: translations.pa.soilHealth, 
             ta: translations.ta.soilHealth, te: translations.te.soilHealth, bn: translations.bn.soilHealth, mr: translations.mr.soilHealth })}
      </Link>
      <Link to="/organic-farming" className="text-foreground hover:text-primary transition-colors">
        {t({ en: translations.en.organicFarming, hi: translations.hi.organicFarming, pa: translations.pa.organicFarming, 
             ta: translations.ta.organicFarming, te: translations.te.organicFarming, bn: translations.bn.organicFarming, mr: translations.mr.organicFarming })}
      </Link>
    </nav>
  );

  // Simple language selector
  const LanguageSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Globe className="w-4 h-4 mr-1" />
          {getLanguageName(language)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("mr")}>
          मराठी (Marathi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("hi")}>
          हिंदी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("pa")}>
          ਪੰਜਾਬੀ (Punjabi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ta")}>
          தமிழ் (Tamil)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("te")}>
          తెలుగు (Telugu)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("bn")}>
          বাংলা (Bengali)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b transition-all duration-300",
        "supports-[backdrop-filter]:backdrop-blur-xl bg-background/40 border-border/20",
        "shadow-none",
        isScrolled && "bg-background/70 border-border/40 shadow-sm"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:py-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-3">
            <Leaf className="h-10 w-10 text-plant-dark" />
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-1">
                SoilSathi <span className="text-base font-normal text-secondary">(सॉइल साथी)</span>
              </h1>
            </div>
          </Link>
          <img
            src="/lovable-uploads/b7bbcec3-ea93-4139-9de1-934572a3cd1f.png"
            alt="Bettercode"
            className="h-7 w-auto"
          />
        </div>

        {isMobile ? (
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>SoilSathi (सॉइल साथी)</SheetTitle>
                  <SheetDescription>
                    {t({ 
                      en: translations.en.yourSoilAdvisor, 
                      hi: translations.hi.yourSoilAdvisor,
                      pa: translations.pa.yourSoilAdvisor,
                      ta: translations.ta.yourSoilAdvisor,
                      te: translations.te.yourSoilAdvisor,
                      bn: translations.bn.yourSoilAdvisor,
                      mr: translations.mr.yourSoilAdvisor
                    })}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Link to="/" className="px-2 py-3 hover:bg-accent rounded-md transition-colors">
                    {t({ 
                      en: translations.en.home, 
                      hi: translations.hi.home,
                      pa: translations.pa.home,
                      ta: translations.ta.home,
                      te: translations.te.home,
                      bn: translations.bn.home,
                      mr: translations.mr.home
                    })}
                  </Link>
                  <Link to="/soil-analyzer" className="px-2 py-3 hover:bg-accent rounded-md transition-colors">
                    {t({ 
                      en: translations.en.soilAnalyzer, 
                      hi: translations.hi.soilAnalyzer,
                      pa: translations.pa.soilAnalyzer,
                      ta: translations.ta.soilAnalyzer,
                      te: translations.te.soilAnalyzer,
                      bn: translations.bn.soilAnalyzer,
                      mr: translations.mr.soilAnalyzer
                    })}
                  </Link>
                  <Link to="/recommendations" className="px-2 py-3 hover:bg-accent rounded-md transition-colors">
                    {t({ 
                      en: translations.en.recommendations, 
                      hi: translations.hi.recommendations,
                      pa: translations.pa.recommendations,
                      ta: translations.ta.recommendations,
                      te: translations.te.recommendations,
                      bn: translations.bn.recommendations,
                      mr: translations.mr.recommendations
                    })}
                  </Link>
                  <Link to="/soil-health" className="px-2 py-3 hover:bg-accent rounded-md transition-colors">
                    {t({ 
                      en: translations.en.soilHealth, 
                      hi: translations.hi.soilHealth,
                      pa: translations.pa.soilHealth,
                      ta: translations.ta.soilHealth,
                      te: translations.te.soilHealth,
                      bn: translations.bn.soilHealth,
                      mr: translations.mr.soilHealth
                    })}
                  </Link>
                  <Link to="/organic-farming" className="px-2 py-3 hover:bg-accent rounded-md transition-colors">
                    {t({ 
                      en: translations.en.organicFarming, 
                      hi: translations.hi.organicFarming,
                      pa: translations.pa.organicFarming,
                      ta: translations.ta.organicFarming,
                      te: translations.te.organicFarming,
                      bn: translations.bn.organicFarming,
                      mr: translations.mr.organicFarming
                    })}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <NavigationLinks />
            <LanguageSelector />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
