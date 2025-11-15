
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
import {
  Menu,
  Leaf,
  Globe,
  Home,
  Microscope,
  ListChecks,
  HeartPulse,
  Sprout,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import BettercodeLogo from "@/assets/bettercode-logo.png";

const Header = () => {
  const isMobile = useIsMobile();
  const { language, setLanguage, t, getLanguageName } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    const handleResize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
    };

    handleScroll();
    handleResize();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Simple translations for the header
  const translations = {
    en: {
      home: "Home",
      soilAnalyzer: "Soil Analyzer",
      recommendations: "Recommendations",
      soilHealth: "Soil Health",
      organicFarming: "Organic Farming",
      helpDesk: "Help Desk",
      yourSoilAdvisor: "Your Soil Advisor"
    },
    hi: {
      home: "होम",
      soilAnalyzer: "मिट्टी विश्लेषक",
      recommendations: "सिफारिशें",
      soilHealth: "मिट्टी स्वास्थ्य",
      organicFarming: "जैविक खेती",
      helpDesk: "सहायता डेस्क",
      yourSoilAdvisor: "आपका मिट्टी सलाहकार"
    },
    pa: {
      home: "ਹੋਮ",
      soilAnalyzer: "ਮਿੱਟੀ ਵਿਸ਼ਲੇਸ਼ਕ",
      recommendations: "ਸਿਫਾਰਸ਼ਾਂ",
      soilHealth: "ਮਿੱਟੀ ਦੀ ਸਿਹਤ",
      organicFarming: "ਜੈਵਿਕ ਖੇਤੀ",
      helpDesk: "ਸਹਾਇਤਾ ਡੈਸਕ",
      yourSoilAdvisor: "ਤੁਹਾਡਾ ਮਿੱਟੀ ਸਲਾਹਕਾਰ"
    },
    ta: {
      home: "முகப்பு",
      soilAnalyzer: "மண் பகுப்பாய்வி",
      recommendations: "பரிந்துரைகள்",
      soilHealth: "மண் ஆரோக்கியம்",
      organicFarming: "இயற்கை விவசாயம்",
      helpDesk: "உதவி மையம்",
      yourSoilAdvisor: "உங்கள் மண் ஆலோசகர்"
    },
    te: {
      home: "హోమ్",
      soilAnalyzer: "నేల విశ్లేషకుడు",
      recommendations: "సిఫార్సులు",
      soilHealth: "నేల ఆరోగ్యం",
      organicFarming: "సేంద్రీయ వ్యవసాయం",
      helpDesk: "సహాయ డెస్క్",
      yourSoilAdvisor: "మీ మట్టి సలహాదారు"
    },
    bn: {
      home: "হোম",
      soilAnalyzer: "মাটি বিশ্লেষক",
      recommendations: "সুপারিশগুলি",
      soilHealth: "মাটির স্বাস্থ্য",
      organicFarming: "জৈব চাষ",
      helpDesk: "সহায়তা ডেস্ক",
      yourSoilAdvisor: "আপনার মাটির উপদেষ্টা"
    },
    mr: {
      home: "मुख्यपृष्ठ",
      soilAnalyzer: "माती विश्लेषक",
      recommendations: "शिफारसी",
      soilHealth: "मातीचे आरोग्य",
      organicFarming: "सेंद्रिय शेती",
      helpDesk: "सहाय्यता डेस्क",
      yourSoilAdvisor: "तुमचा माती सल्लागार"
    }
  };

  type NavKey = keyof typeof translations.en;

  const navItems: Array<{ key: NavKey; href: string; icon: LucideIcon }> = [
    { key: "home", href: "/", icon: Home },
    { key: "soilAnalyzer", href: "/soil-analyzer", icon: Microscope },
    { key: "recommendations", href: "/recommendations", icon: ListChecks },
    { key: "soilHealth", href: "/soil-health", icon: HeartPulse },
    { key: "organicFarming", href: "/organic-farming", icon: Sprout },
    { key: "helpDesk", href: "/farmer-help-desk", icon: LifeBuoy },
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
    });

  const NavigationLinks = () => (
    <nav className="flex min-w-0 flex-1 items-center justify-start gap-x-2 gap-y-2 overflow-x-auto whitespace-nowrap pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-x-2.5 lg:gap-x-4 xl:gap-x-6">
      {navItems.map(({ key, href, icon: Icon }) => (
        <Link
          key={key}
          to={href}
          className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-foreground/90 transition-colors hover:text-primary md:text-sm lg:text-[0.95rem] md:gap-1.5 lg:gap-2 shrink-0"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground md:h-4 md:w-4" aria-hidden="true" />
          <span>{getLabel(key)}</span>
        </Link>
      ))}
    </nav>
  );

  // Simple language selector
  const LanguageSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs md:text-sm shrink-0">
          <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 mr-0.5 md:mr-1" />
          <span>{getLanguageName(language)}</span>
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
      <div className="container mx-auto flex items-center justify-between gap-x-4 gap-y-3 px-4 py-3 md:gap-x-6 lg:py-4 overflow-hidden">
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0 min-w-0">
          <Link to="/" className="flex items-center gap-1.5 md:gap-2">
            <Leaf className="h-5 w-5 md:h-6 md:w-6 text-plant-dark shrink-0" />
            <div>
              <h1 className="text-base font-semibold text-primary md:text-lg lg:text-xl whitespace-nowrap">SoilSathi</h1>
            </div>
          </Link>
          <img
            src={BettercodeLogo}
            alt="Bettercode"
            className="h-4 w-auto md:h-5 lg:h-6 shrink-0"
          />
        </div>

        {(isMobile || isTablet) ? (
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSelector />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
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
                <div className="flex flex-col gap-2 py-4">
                  {navItems.map(({ key, href, icon: Icon }) => (
                    <Link
                      key={key}
                      to={href}
                      className="flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-base font-medium text-foreground">{getLabel(key)}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-end gap-4 min-[1100px]:gap-6">
            <NavigationLinks />
            <LanguageSelector />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
