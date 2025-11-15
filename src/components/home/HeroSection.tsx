
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, FlaskConical, Sprout, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/Images/Hero Section.png";

const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Soil testing equipment on farmland"
          className="h-full w-full scale-105 object-cover opacity-55 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-neutral-950/80 to-emerald-950/70 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-12 md:grid-cols-[1.05fr,0.95fr] md:items-center">
          <div className="max-w-2xl text-center md:text-left">
            <span className="mb-5 inline-flex items-center rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200 ring-1 ring-inset ring-emerald-400/40 md:px-4 md:text-sm">
              {t({
                en: "Precision soil insights",
                hi: "सटीक मिट्टी अंतर्दृष्टि",
                pa: "ਸਹੀ ਮਿੱਟੀ ਦੀ ਜਾਣਕਾਰੀ",
                ta: "துல்லிய மண் தகவல்கள்",
                te: "ఖచ్చితమైన నేల అంతర్దృష్టులు",
                bn: "সুনির্দিষ্ট মাটি অন্তর্দৃষ্টি",
                mr: "अचूक माती अंतर्दृष्टी"
              })}
            </span>

            <h1 className="mb-5 text-3xl font-bold leading-tight sm:text-[2.5rem] md:text-5xl">
            {t({
              en: "Smart Soil Helper for Farmers",
              hi: "किसानों के लिए स्मार्ट मिट्टी सहायक",
              pa: "ਕਿਸਾਨਾਂ ਲਈ ਸਮਾਰਟ ਮਿੱਟੀ ਸਹਾਇਕ",
              ta: "விவசாயிகளுக்கான ஸ்மார்ட் மண் உதவியாளர்",
              te: "రైతులకు స్మార్ట్ నేల సహాయకుడు",
              bn: "কৃষকদের জন্য স্মার্ট মাটি সহায়ক",
              mr: "शेतकऱ्यांसाठी स्मार्ट माती सहाय्यक"
            })}
          </h1>

          <p className="mb-8 text-base text-slate-200/80 md:text-lg">
            {t({
              en: "Upload your soil report or just tell us about your soil. We'll help you grow better crops with the right fertilizers.",
              hi: "अपनी मिट्टी की रिपोर्ट अपलोड करें या बस हमें अपनी मिट्टी के बारे में बताएं। हम आपको सही उर्वरकों के साथ बेहतर फसल उगाने में मदद करेंगे।",
              pa: "ਆਪਣੀ ਮਿੱਟੀ ਦੀ ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ ਜਾਂ ਬੱਸ ਸਾਨੂੰ ਆਪਣੀ ਮਿੱਟੀ ਬਾਰੇ ਦੱਸੋ। ਅਸੀਂ ਤੁਹਾਨੂੰ ਸਹੀ ਖਾਦਾਂ ਨਾਲ ਬਿਹਤਰ ਫਸਲਾਂ ਉਗਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗੇ।",
              ta: "உங்கள் மண் அறிக்கையை பதிவேற்றவும் அல்லது உங்கள் மண் பற்றி எங்களுக்கு தெரிவிக்கவும். சரியான உரங்களுடன் சிறந்த பயிர்களை வளர்க்க உங்களுக்கு உதவுவோம்.",
              te: "మీ నేల నివేదికను అప్‌లోడ్ చేయండి లేదా మీ నేల గురించి మాకు చెప్పండి. సరైన ఎరువులతో మంచి పంటలను పెంచడానికి మేము మీకు సహాయం చేస్తాము.",
              bn: "আপনার মাটির রিপোর্ট আপলোড করুন বা আপনার মাটি সম্পর্কে আমাদের বলুন। আমরা সঠিক সারের সাহায্যে আপনাকে আরও ভালো ফসল উৎপাদনে সাহায্য করব।",
              mr: "तुमच्या मातीचा अहवाल अपलोड करा किंवा फक्त आम्हाला तुमच्या मातीबद्दल सांगा. आम्ही तुम्हाला योग्य खतांसह चांगली पिके वाढवण्यास मदत करू."
            })}
          </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <Button
                asChild
                size="lg"
                className="w-full gap-2 py-4 text-base shadow-lg shadow-emerald-500/30 sm:w-auto sm:py-5 sm:text-lg"
              >
                <Link to="/soil-analyzer">
                  <FlaskConical className="h-6 w-6 mr-2" />
                  {t({
                    en: "Check Your Soil",
                    hi: "अपनी मिट्टी जांचें",
                    pa: "ਆਪਣੀ ਮਿੱਟੀ ਚੈੱਕ ਕਰੋ",
                    ta: "உங்கள் மண்ணை சரிபார்க்கவும்",
                    te: "మీ నేలను తనిఖీ చేయండి",
                    bn: "আপনার মাটি পরীক্ষা করুন",
                    mr: "तुमच्या मातीची तपासणी करा"
                  })}
                  <ChevronRight className="ml-1 h-6 w-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-emerald-400/40 bg-white/[0.03] text-white hover:bg-emerald-400/20 hover:border-emerald-400/60 hover:text-white py-4 text-base sm:w-auto sm:py-5 sm:text-lg"
              >
                <a
                  href="https://sparkly-alpaca-b9997d.netlify.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2"
                >
                  <span>Krushi Mitra</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border border-white/25 bg-white/5 py-4 text-base text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto sm:py-5 sm:text-lg"
              >
                <Link to="/recommendations">
                  <Sprout className="mr-2 h-6 w-6 text-emerald-200" />
                  {t({
                    en: "Grow Better Crops",
                    hi: "बेहतर फसल उगाएं",
                    pa: "ਬਿਹਤਰ ਫਸਲਾਂ ਉਗਾਓ",
                    ta: "சிறந்த பயிர்களை வளர்க்கவும்",
                    te: "మెరుగైన పంటలను పెంచండి",
                    bn: "ভালো ফসল ফলান",
                    mr: "चांगली पिके वाढवा"
                  })}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_24px_60px_-35px_rgba(16,185,129,0.65)] sm:max-w-sm md:max-w-xl md:rounded-[2.5rem] md:shadow-[0_40px_80px_-40px_rgba(16,185,129,0.65)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <img
                src={heroImage}
                alt="Soil testing equipment"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -left-16 top-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 right-6 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
    </section>
  );
};

export default HeroSection;
