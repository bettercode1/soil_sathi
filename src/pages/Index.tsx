
import React from "react";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import { Button } from "@/components/ui/button";
import { FileText, Leaf, Map, BarChart3, Calendar, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { homePageTranslations } from "@/constants/translations";

const Index = () => {
  const { language } = useLanguage();
  const translations = homePageTranslations[language];

  return (
    <Layout>
      <HeroSection />

      {/* Features Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {translations.featuresTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {translations.featuresDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* How It Works Section */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{translations.howItWorksTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {translations.howItWorksDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">{translations.step1Title}</h3>
              <p className="text-muted-foreground">
                {translations.step1Description}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">{translations.step2Title}</h3>
              <p className="text-muted-foreground">
                {translations.step2Description}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">{translations.step3Title}</h3>
              <p className="text-muted-foreground">
                {translations.step3Description}
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button size="lg" className="gap-2 py-6 text-lg">
              {translations.getStarted} <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{translations.benefitsTitle}</h2>
            <p className="text-muted-foreground">
              {translations.benefitsDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 border border-border rounded-lg bg-card shadow-sm">
              <h3 className="font-semibold text-xl mb-2">{translations.benefit1Title}</h3>
              <p className="text-muted-foreground">
                {translations.benefit1Description}
              </p>
            </div>
            <div className="p-5 border border-border rounded-lg bg-card shadow-sm">
              <h3 className="font-semibold text-xl mb-2">{translations.benefit2Title}</h3>
              <p className="text-muted-foreground">
                {translations.benefit2Description}
              </p>
            </div>
            <div className="p-5 border border-border rounded-lg bg-card shadow-sm">
              <h3 className="font-semibold text-xl mb-2">{translations.benefit3Title}</h3>
              <p className="text-muted-foreground">
                {translations.benefit3Description}
              </p>
            </div>
            <div className="p-5 border border-border rounded-lg bg-card shadow-sm">
              <h3 className="font-semibold text-xl mb-2">{translations.benefit4Title}</h3>
              <p className="text-muted-foreground">
                {translations.benefit4Description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 soil-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{translations.ctaTitle}</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto opacity-90">
            {translations.ctaDescription}
          </p>
          <Button size="lg" variant="secondary" className="gap-2 py-6 text-lg">
            {translations.startAnalyzing} <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
