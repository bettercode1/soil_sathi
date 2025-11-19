
import React from "react";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import { Button } from "@/components/ui/button";
import { FileText, Leaf, Map, BarChart3, Calendar, ChevronRight, Bug, Cloud, TrendingUp, DollarSign, Droplets, Calculator, AlertTriangle, MessageCircle, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { homePageTranslations } from "@/constants/translations";
import { commonTranslations } from "@/constants/allTranslations";

const Index = () => {
  const { language, t } = useLanguage();
  const translations = homePageTranslations[language];

  return (
    <Layout>
      <HeroSection />

      {/* Features Section */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh-nature opacity-5" />
        <div className="container mx-auto px-2 relative z-10">
          <div className="mb-8 text-center animate-on-scroll">
            <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl md:text-4xl expressive-heading">
              {translations.featuresTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-[17px]">
              {translations.featuresDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <FeatureCard
              title={translations.feature1Title}
              description={translations.feature1Description}
              icon={FileText}
              linkTo="/soil-analyzer"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={translations.feature2Title}
              description={translations.feature2Description}
              icon={Leaf}
              linkTo="/recommendations"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={translations.feature3Title}
              description={translations.feature3Description}
              icon={Map}
              linkTo="/regions"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={translations.feature4Title}
              description={translations.feature4Description}
              icon={BarChart3}
              linkTo="/soil-health"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={translations.feature5Title}
              description={translations.feature5Description}
              icon={Leaf}
              linkTo="/organic-farming"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={translations.feature6Title}
              description={translations.feature6Description}
              icon={Calendar}
              linkTo="/alerts"
              buttonLabel={translations.featureButton}
            />
          </div>
        </div>
      </section>

      {/* New AI Features Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-5" />
        <div className="container mx-auto px-2 relative z-10">
          <div className="mb-8 text-center animate-on-scroll">
            <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl md:text-4xl expressive-heading">
              {t(commonTranslations.newAIPoweredFeatures)}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-[17px]">
              {t(commonTranslations.discoverLatestAITools)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              title={t(commonTranslations.cropDiseaseIdentifier)}
              description={t(commonTranslations.identifyDiseasesAndPests)}
              icon={Bug}
              linkTo="/crop-disease"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.weatherAlertsTitle)}
              description={t(commonTranslations.getRealTimeWeatherAlerts)}
              icon={Cloud}
              linkTo="/weather-alerts"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.cropGrowthMonitorTitle)}
              description={t(commonTranslations.trackCropGrowth)}
              icon={TrendingUp}
              linkTo="/crop-growth"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.marketPricesTitle)}
              description={t(commonTranslations.realTimeMarketPrices)}
              icon={DollarSign}
              linkTo="/market-prices"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.irrigationSchedulerTitle)}
              description={t(commonTranslations.aiPoweredIrrigation)}
              icon={Droplets}
              linkTo="/irrigation-scheduler"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.farmingCalendarTitle)}
              description={t(commonTranslations.smartFarmingCalendar)}
              icon={Calendar}
              linkTo="/farming-calendar"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.fertilizerCostCalculatorTitle)}
              description={t(commonTranslations.calculateOptimizeFertilizer)}
              icon={Calculator}
              linkTo="/fertilizer-cost"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.soilHealthPredictionTitle)}
              description={t(commonTranslations.predictFutureSoilHealth)}
              icon={AlertTriangle}
              linkTo="/soil-health-prediction"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.farmerCommunityTitle)}
              description={t(commonTranslations.connectWithFarmersShare)}
              icon={MessageCircle}
              linkTo="/farmer-community"
              buttonLabel={translations.featureButton}
            />
            <FeatureCard
              title={t(commonTranslations.expertConsultationTitle)}
              description={t(commonTranslations.bookVideoConsultations)}
              icon={Users}
              linkTo="/expert-consultation"
              buttonLabel={translations.featureButton}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh-earth opacity-5" />
        <div className="container mx-auto px-2 relative z-10">
          <div className="mb-8 text-center animate-on-scroll">
            <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl md:text-4xl expressive-heading">{translations.howItWorksTitle}</h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-[17px]">
              {translations.howItWorksDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center glass-card p-6 rounded-2xl card-hover animate-on-scroll">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-lg font-bold text-white shadow-lg pulse-glow sm:h-20 sm:w-20 sm:text-xl">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">{translations.step1Title}</h3>
              <p className="text-muted-foreground">
                {translations.step1Description}
              </p>
            </div>
            <div className="flex flex-col items-center text-center glass-card p-6 rounded-2xl card-hover animate-on-scroll" style={{ animationDelay: "0.2s" }}>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg pulse-glow text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">{translations.step2Title}</h3>
              <p className="text-muted-foreground">
                {translations.step2Description}
              </p>
            </div>
            <div className="flex flex-col items-center text-center glass-card p-6 rounded-2xl card-hover animate-on-scroll" style={{ animationDelay: "0.4s" }}>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg pulse-glow text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">{translations.step3Title}</h3>
              <p className="text-muted-foreground">
                {translations.step3Description}
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" className="w-full gap-2 py-4 text-base sm:w-auto sm:py-5 sm:text-lg">
              {translations.getStarted} <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh-nature opacity-5" />
        <div className="container mx-auto px-2 relative z-10">
          <div className="mx-auto mb-8 max-w-3xl text-center animate-on-scroll">
            <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl md:text-4xl expressive-heading">{translations.benefitsTitle}</h2>
            <p className="text-base text-muted-foreground sm:text-[17px]">
              {translations.benefitsDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/50 glass-card p-6 card-hover animate-on-scroll">
              <h3 className="font-bold text-lg mb-2">{translations.benefit1Title}</h3>
              <p className="text-muted-foreground text-base">
                {translations.benefit1Description}
              </p>
            </div>
            <div className="p-6 border border-border/50 rounded-2xl glass-card card-hover animate-on-scroll" style={{ animationDelay: "0.1s" }}>
              <h3 className="font-bold text-lg mb-2">{translations.benefit2Title}</h3>
              <p className="text-muted-foreground text-base">
                {translations.benefit2Description}
              </p>
            </div>
            <div className="p-6 border border-border/50 rounded-2xl glass-card card-hover animate-on-scroll" style={{ animationDelay: "0.2s" }}>
              <h3 className="font-bold text-lg mb-2">{translations.benefit3Title}</h3>
              <p className="text-muted-foreground text-base">
                {translations.benefit3Description}
              </p>
            </div>
            <div className="p-6 border border-border/50 rounded-2xl glass-card card-hover animate-on-scroll" style={{ animationDelay: "0.3s" }}>
              <h3 className="font-bold text-lg mb-2">{translations.benefit4Title}</h3>
              <p className="text-muted-foreground text-base">
                {translations.benefit4Description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 text-white sm:py-16 overflow-hidden">
        <div className="absolute inset-0 soil-gradient" />
        <div className="absolute inset-0 gradient-mesh-earth opacity-40" />
        <div className="container mx-auto px-2 text-center relative z-10">
          <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl md:text-4xl expressive-heading high-contrast-text">{translations.ctaTitle}</h2>
          <p className="mx-auto mb-6 max-w-2xl text-base opacity-95 sm:text-[17px] high-contrast-text">
            {translations.ctaDescription}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="w-full gap-2 py-4 text-base sm:w-auto sm:py-5 sm:text-lg btn-modern pulse-glow"
          >
            {translations.startAnalyzing} <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
