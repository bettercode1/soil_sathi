
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Leaf, 
  Map, 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  Bug, 
  Cloud, 
  TrendingUp, 
  DollarSign, 
  Droplets, 
  Calculator, 
  AlertTriangle, 
  MessageCircle, 
  Users, 
  Wifi,
  ArrowUpRight,
  Sprout,
  Sun,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { homePageTranslations } from "@/constants/translations";
import { commonTranslations, sensorTranslations, indexTranslations } from "@/constants/allTranslations";

const Index = () => {
  const { language, t } = useLanguage();
  const translations = homePageTranslations[language];
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const BentoCard = ({ 
    title, 
    description, 
    icon: Icon, 
    linkTo, 
    color = "bg-white", 
    size = "normal", 
    image = null,
    delay = "0s",
    highlight = false
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    linkTo: string; 
    color?: string; 
    size?: "normal" | "large" | "wide";
    image?: string | null;
    delay?: string;
    highlight?: boolean;
  }) => {
    const isLarge = size === "large";
    const isWide = size === "wide";
    
    return (
      <Link 
        to={linkTo}
        className={`
          group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:shadow-2xl
          ${isLarge ? "md:col-span-2 md:row-span-2 min-h-[300px]" : ""}
          ${isWide ? "md:col-span-2 min-h-[160px]" : "min-h-[180px]"}
          ${color}
          border border-slate-100/50
        `}
        onMouseEnter={() => setHoveredCard(title)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{ animationDelay: delay }}
      >
        <div className={`
          absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100
          ${highlight ? "from-emerald-500/10 to-emerald-500/5" : "from-slate-100 to-slate-50"}
        `} />
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`
              p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
              ${highlight ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}
            `}>
              <Icon className={`${isLarge ? "h-8 w-8" : "h-6 w-6"}`} strokeWidth={1.5} />
            </div>
            <ArrowUpRight className={`
              h-5 w-5 transition-all duration-300 opacity-0 -translate-x-2 translate-y-2
              group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0
              ${highlight ? "text-emerald-600" : "text-slate-400"}
            `} />
          </div>

          <div>
            <h3 className={`font-bold text-slate-800 mb-1 leading-tight ${isLarge ? "text-2xl" : "text-lg"}`}>
              {title}
            </h3>
            <p className={`text-slate-500 font-medium leading-relaxed ${isLarge ? "text-base line-clamp-3" : "text-sm line-clamp-2"}`}>
              {description}
            </p>
          </div>
        </div>

        {/* Decorative background elements */}
        <Icon className={`
          absolute -right-8 -bottom-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12
          ${isLarge ? "h-64 w-64" : "h-32 w-32"}
        `} />
      </Link>
    );
  };

  return (
    <Layout>
      <HeroSection />

      {/* Main Dashboard Grid */}
      <section className="bg-slate-50/50 py-12 sm:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1">
                {t(commonTranslations.newAIPoweredFeatures)}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                {t(indexTranslations.smartFarmingTools)}
              </h2>
              <p className="text-slate-500 max-w-lg">
                {t(indexTranslations.smartFarmingDescription)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
            {/* Core Feature - Large */}
            <BentoCard
              title={translations.feature1Title}
              description={translations.feature1Description}
              icon={FileText}
              linkTo="/soil-analyzer"
              size="large"
              color="bg-white"
              highlight={true}
              delay="0.1s"
            />

            {/* Sensor Data - Wide */}
            <BentoCard
              title={t(sensorTranslations.sensorBasedDataCollection)}
              description={t(sensorTranslations.connectSensorsDescription)}
              icon={Wifi}
              linkTo="/sensor-data"
              size="wide"
              color="bg-emerald-900 !text-white"
              highlight={true}
              delay="0.2s"
            />
             {/* Override styles for the dark card manually since prop passing for text color is limited in simple component */}
             <style>{`
               a[href="/sensor-data"] h3, a[href="/sensor-data"] p { color: white !important; opacity: 0.9; }
               a[href="/sensor-data"] div.bg-slate-100 { background-color: rgba(255,255,255,0.1) !important; color: white !important; }
             `}</style>

            <BentoCard
              title={t(commonTranslations.cropDiseaseIdentifier)}
              description={t(commonTranslations.identifyDiseasesAndPests)}
              icon={Bug}
              linkTo="/crop-disease"
              delay="0.3s"
            />

            <BentoCard
              title={translations.feature2Title}
              description={translations.feature2Description}
              icon={Leaf}
              linkTo="/recommendations"
              delay="0.4s"
            />

            <BentoCard
              title={t(commonTranslations.weatherAlertsTitle)}
              description={t(commonTranslations.getRealTimeWeatherAlerts)}
              icon={Cloud}
              linkTo="/weather-alerts"
              delay="0.5s"
            />

            <BentoCard
              title={t(commonTranslations.marketPricesTitle)}
              description={t(commonTranslations.realTimeMarketPrices)}
              icon={DollarSign}
              linkTo="/market-prices"
              delay="0.6s"
            />
            
            <BentoCard
              title={t(commonTranslations.soilHealthPredictionTitle)}
              description={t(commonTranslations.predictFutureSoilHealth)}
              icon={Activity}
              linkTo="/soil-health-prediction"
              delay="0.7s"
            />

            <BentoCard
              title={translations.feature4Title} // Soil Health Monitoring
              description={translations.feature4Description}
              icon={BarChart3}
              linkTo="/soil-health"
              delay="0.75s"
            />

            <BentoCard
              title={translations.feature5Title} // Organic Farming
              description={translations.feature5Description}
              icon={Leaf}
              linkTo="/organic-farming"
              delay="0.8s"
            />

            <BentoCard
              title={t(commonTranslations.cropGrowthMonitorTitle)}
              description={t(commonTranslations.trackCropGrowth)}
              icon={TrendingUp}
              linkTo="/crop-growth"
              delay="0.85s"
            />

            <BentoCard
              title={t(commonTranslations.irrigationSchedulerTitle)}
              description={t(commonTranslations.aiPoweredIrrigation)}
              icon={Droplets}
              linkTo="/irrigation-scheduler"
              delay="0.9s"
            />

            <BentoCard
              title={t(commonTranslations.farmingCalendarTitle)}
              description={t(commonTranslations.smartFarmingCalendar)}
              icon={Calendar}
              linkTo="/farming-calendar"
              delay="0.95s"
            />

            <BentoCard
              title={t(commonTranslations.fertilizerCostCalculatorTitle)}
              description={t(commonTranslations.calculateOptimizeFertilizer)}
              icon={Calculator}
              linkTo="/fertilizer-cost"
              delay="1.0s"
            />

            <BentoCard
              title={translations.feature3Title} // Regional Insights
              description={translations.feature3Description}
              icon={Map}
              linkTo="/regions"
              delay="1.05s"
            />

            <BentoCard
              title={t(commonTranslations.expertConsultationTitle)}
              description={t(commonTranslations.bookVideoConsultations)}
              icon={Users}
              linkTo="/expert-consultation"
              delay="1.1s"
            />

             <BentoCard
              title={t(commonTranslations.farmerCommunityTitle)}
              description={t(commonTranslations.connectWithFarmersShare)}
              icon={Users}
              linkTo="/farmer-community"
              delay="0.8s"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Visual & Minimal */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 skew-x-12 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{translations.howItWorksTitle}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                step: "01", 
                title: translations.step1Title, 
                desc: translations.step1Description, 
                icon: FileText,
                gradient: "from-emerald-500 to-emerald-600" 
              },
              { 
                step: "02", 
                title: translations.step2Title, 
                desc: translations.step2Description, 
                icon: Activity,
                gradient: "from-amber-500 to-amber-600"
              },
              { 
                step: "03", 
                title: translations.step3Title, 
                desc: translations.step3Description, 
                icon: Sprout,
                gradient: "from-blue-500 to-blue-600"
              }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute top-8 left-1/2 w-full h-[2px] bg-slate-100 -z-10 hidden md:block" 
                     style={{ display: idx === 2 ? 'none' : 'block' }} />
                
                <div className="flex flex-col items-center text-center">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
                    bg-gradient-to-br ${item.gradient}
                  `}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <span className="text-4xl font-black text-slate-100 absolute top-0 -z-20 -translate-y-4 select-none group-hover:text-slate-200 transition-colors">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-emerald-600">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{translations.ctaTitle}</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto font-light">
            {translations.ctaDescription}
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-700 hover:bg-emerald-50 h-14 px-8 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            asChild
          >
             <Link to="/soil-analyzer">
               {translations.startAnalyzing} <ArrowUpRight className="ml-2 w-5 h-5" />
             </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
