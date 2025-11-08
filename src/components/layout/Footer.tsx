
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-muted py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-plant-dark" />
              <h2 className="text-lg font-bold text-primary">SoilSathi (सॉइल साथी)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t({
                en: "AI-powered soil advisor helping farmers make smarter decisions about fertilizers and soil health.",
                hi: "AI-संचालित मिट्टी सलाहकार जो किसानों को उर्वरकों और मिट्टी के स्वास्थ्य के बारे में स्मार्ट निर्णय लेने में मदद करता है।",
                pa: "AI-ਸੰਚਾਲਿਤ ਮਿੱਟੀ ਸਲਾਹਕਾਰ ਜੋ ਕਿਸਾਨਾਂ ਨੂੰ ਖਾਦਾਂ ਅਤੇ ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਬਾਰੇ ਸਮਾਰਟ ਫੈਸਲੇ ਲੈਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।",
                ta: "உரங்கள் மற்றும் மண் ஆரோக்கியம் பற்றிய சிறந்த முடிவுகளை எடுக்க விவசாயிகளுக்கு உதவும் AI-இயக்கப்படும் மண் ஆலோசகர்.",
                te: "ఎరువులు మరియు నేల ఆరోగ్యం గురించి స్మార్ట్ నిర్ణయాలు తీసుకోవడానికి రైతులకు సహాయపడే AI-పవర్డ్ నేల సలహాదారు.",
                bn: "AI-চালিত মাটি উপদেষ্টা যা কৃষকদের সার এবং মাটির স্বাস্থ্য সম্পর্কে স্মার্ট সিদ্ধান্ত নিতে সাহায্য করে।",
                mr: "AI-संचलित माती सल्लागार जो शेतकऱ्यांना खते आणि मातीच्या आरोग्याबाबत स्मार्ट निर्णय घेण्यास मदत करतो."
              })}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3 text-foreground">
                {t({
                  en: "Features",
                  hi: "सुविधाएँ",
                  pa: "ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
                  ta: "அம்சங்கள்",
                  te: "ఫీచర్లు",
                  bn: "বৈশিষ্ট্য",
                  mr: "वैशिष्ट्ये"
                })}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/soil-analyzer" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "Soil Report Analyzer",
                      hi: "मिट्टी रिपोर्ट विश्लेषक",
                      pa: "ਮਿੱਟੀ ਰਿਪੋਰਟ ਵਿਸ਼ਲੇਸ਼ਕ",
                      ta: "மண் அறிக்கை பகுப்பாய்வி",
                      te: "నేల నివేదిక విశ్లేషకుడు",
                      bn: "মাটি রিপোর্ট বিশ্লেষক",
                      mr: "माती अहवाल विश्लेषक"
                    })}
                  </Link>
                </li>
                <li>
                  <Link to="/recommendations" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "Fertilizer Recommendations",
                      hi: "उर्वरक सिफारिशें",
                      pa: "ਖਾਦ ਸਿਫਾਰਸ਼ਾਂ",
                      ta: "உர பரிந்துரைகள்",
                      te: "ఎరువుల సిఫార్సులు",
                      bn: "সার সুপারিশ",
                      mr: "खत शिफारसी"
                    })}
                  </Link>
                </li>
                <li>
                  <Link to="/soil-health" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "Soil Health Monitoring",
                      hi: "मिट्टी स्वास्थ्य निगरानी",
                      pa: "ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਨਿਗਰਾਨੀ",
                      ta: "மண் ஆரோக்கிய கண்காணிப்பு",
                      te: "నేల ఆరోగ్య పర్యవేక్షణ",
                      bn: "মাটির স্বাস্থ্য পর্যবেক্ষণ",
                      mr: "मातीच्या आरोग्याचे निरीक्षण"
                    })}
                  </Link>
                </li>
                <li>
                  <Link to="/organic-farming" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "Organic Farming Advice",
                      hi: "जैविक खेती सलाह",
                      pa: "ਜੈਵਿਕ ਖੇਤੀ ਸਲਾਹ",
                      ta: "இயற்கை விவசாய ஆலோசனை",
                      te: "సేంద్రీయ వ్యవసాయ సలహా",
                      bn: "জৈব কৃষি পরামর্শ",
                      mr: "सेंद्रिय शेती सल्ला"
                    })}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-foreground">
                {t({
                  en: "Resources",
                  hi: "संसाधन",
                  pa: "ਸਰੋਤ",
                  ta: "வளங்கள்",
                  te: "వనరులు",
                  bn: "সংস্থান",
                  mr: "साधने"
                })}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/education" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "Soil Education",
                      hi: "मिट्टी शिक्षा",
                      pa: "ਮਿੱਟੀ ਸਿੱਖਿਆ",
                      ta: "மண் கல்வி",
                      te: "నేల విద్య",
                      bn: "মাটি শিক্ষা",
                      mr: "माती शिक्षण"
                    })}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "FAQ",
                      hi: "अक्सर पूछे जाने वाले प्रश्न",
                      pa: "ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ",
                      ta: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
                      te: "తరచుగా అడిగే ప్రశ్నలు",
                      bn: "সাধারণ প্রশ্ন",
                      mr: "वारंवार विचारले जाणारे प्रश्न"
                    })}
                  </Link>
                </li>
                <li>
                  <Link to="/regions" className="text-muted-foreground hover:text-primary transition-colors">
                    {t({
                      en: "Regional Insights",
                      hi: "क्षेत्रीय अंतर्दृष्टि",
                      pa: "ਖੇਤਰੀ ਜਾਣਕਾਰੀ",
                      ta: "பிராந்திய நுண்ணறிவுகள்",
                      te: "ప్రాంతీయ అంతర్దృష్టులు",
                      bn: "আঞ্চলিক অন্তর্দৃষ্টি",
                      mr: "प्रादेशिक माहिती"
                    })}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-foreground">
                {t({
                  en: "Contact",
                  hi: "संपर्क",
                  pa: "ਸੰਪਰਕ",
                  ta: "தொடர்பு",
                  te: "సంప్రదించండి",
                  bn: "যোগাযোগ",
                  mr: "संपर्क"
                })}
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">
                  support@soilsathi.in
                </li>
                <li className="text-muted-foreground">
                  {t({
                    en: "Toll Free",
                    hi: "टोल फ्री",
                    pa: "ਟੋਲ ਫ੍ਰੀ",
                    ta: "கட்டணமில்லா எண்",
                    te: "టోల్ ఫ్రీ",
                    bn: "টোল ফ্রি",
                    mr: "टोल फ्री"
                  })}: 1800-XXX-XXXX
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-6 text-sm text-center text-muted-foreground">
          © {new Date().getFullYear()} SoilSathi. {t({
            en: "All rights reserved.",
            hi: "सर्वाधिकार सुरक्षित।",
            pa: "ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।",
            ta: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
            te: "అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.",
            bn: "সর্বস্বত্ব সংরক্ষিত।",
            mr: "सर्व हक्क राखीव."
          })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
