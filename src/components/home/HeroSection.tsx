
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-accent to-background">
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
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
          
          <p className="text-lg mb-8 text-muted-foreground">
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
          
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="gap-2 text-lg py-6">
              <Link to="/soil-analyzer">
                <img src="/placeholder.svg" alt="Soil" className="w-6 h-6 mr-2" />
                {t({
                  en: "Check Your Soil",
                  hi: "अपनी मिट्टी जांचें",
                  pa: "ਆਪਣੀ ਮਿੱਟੀ ਚੈੱਕ ਕਰੋ",
                  ta: "உங்கள் மண்ணை சரிபார்க்கவும்",
                  te: "మీ నేలను తనిఖీ చేయండి",
                  bn: "আপনার মাটি পরীক্ষা করুন",
                  mr: "तुमच्या मातीची तपासणी करा"
                })}
                <ChevronRight className="h-6 w-6 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg py-6">
              <Link to="/recommendations">
                <img src="/placeholder.svg" alt="Crops" className="w-6 h-6 mr-2" />
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
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 top-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-soil-light/20 blur-3xl"></div>
      <div className="absolute left-1/4 bottom-1/4 w-48 h-48 rounded-full bg-plant-light/30 blur-3xl"></div>
    </div>
  );
};

export default HeroSection;
