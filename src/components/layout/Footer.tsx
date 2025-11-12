
import { ChevronRight, Facebook, Leaf, Linkedin, Mail, Phone, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-[#1f1b2f] text-slate-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-500 opacity-60" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1.55fr)]">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <Leaf className="h-8 w-8 text-emerald-400" />
              <div>
                <h2 className="text-2xl font-semibold text-white">SoilSathi</h2>
                <p className="text-[11px] uppercase tracking-[0.32em] text-emerald-300/80">Smart Soil Companion</p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              {t({
                en: "AI-powered soil advisor helping farmers make smarter decisions about fertilizers and soil health.",
                hi: "AI-संचालित मिट्टी सलाहकार जो किसानों को उर्वरकों और मिट्टी के स्वास्थ्य के बारे में स्मार्ट निर्णय लेने में मदद करता है।",
                pa: "AI-ਸੰਚਾਲਿਤ ਮਿੱਟੀ ਸਲਾਹਕਾਰ ਜੋ ਕਿਸਾਨਾਂ ਨੂੰ ਖਾਦਾਂ ਅਤੇ ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਬਾਰੇ ਸਮਾਰਟ ਫੈਸਲੇ ਲੈਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।",
                ta: "உரங்கள் மற்றும் மண் ஆரோக்கியம் பற்றிய சிறந்த முடிவுகளை எடுக்க விவசாயிகளுக்கு உதவும் AI-இயக்கப்படும் மண் ஆலோசகர்.",
                te: "ఎరువులు మరియు నేల ఆరోగ్యం గురించి స్మార్ట్ నిర్ణయాలు తీసుకోవడానికి రైతులకు సహాయపడే AI-పవర్డ్ నేల సలహాదారు.",
                bn: "AI-চালিত মাটি উপদেষ্টা যা কৃষকদের সার এবং মাটির স্বাস্থ্য সম্পর্কে স্মার্ট সিদ্ধান্ত নিতে সাহায্য করে।",
                mr: "AI-संचलित माती सल्लागार जो शेतकऱ्यांना खते आणि मातीच्या आरोग्याबाबत स्मार्ट निर्णय घेण्यास मदत करतो.",
              })}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3 text-sm text-slate-400">
              <span className="font-medium text-white">
                {t({
                  en: "Follow SoilSathi",
                  hi: "SoilSathi को फॉलो करें",
                  pa: "SoilSathi ਨੂੰ ਫੋਲੋ ਕਰੋ",
                  ta: "SoilSathi ஐ பின்தொடருங்கள்",
                  te: "SoilSathi ను అనుసరించండి",
                  bn: "SoilSathi-কে অনুসরণ করুন",
                  mr: "SoilSathi ला फॉलो करा",
                })}
              </span>
              <div className="flex items-center gap-2">
                <a
                  aria-label="Facebook"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:-translate-y-0.5 hover:bg-emerald-400/20"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  aria-label="YouTube"
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:-translate-y-0.5 hover:bg-emerald-400/20"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  aria-label="LinkedIn"
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:-translate-y-0.5 hover:bg-emerald-400/20"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-y-10 gap-x-12 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-16">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {t({
                  en: "Features",
                  hi: "सुविधाएँ",
                  pa: "ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
                  ta: "அம்சங்கள்",
                  te: "ఫీచర్లు",
                  bn: "বৈশিষ্ট্য",
                  mr: "वैशिष्ट्ये",
                })}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/soil-analyzer" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "Soil Report Analyzer",
                      hi: "मिट्टी रिपोर्ट विश्लेषक",
                      pa: "ਮਿੱਟੀ ਰਿਪੋਰਟ ਵਿਸ਼ਲੇਸ਼ਕ",
                      ta: "மண் அறிக்கை பகுப்பாய்வி",
                      te: "నేల నివేదిక విశ్లేషకుడు",
                      bn: "মাটি রিপোর্ট বিশ্লেষক",
                      mr: "माती अहवाल विश्लेषक",
                    })}
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/recommendations" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "Fertilizer Recommendations",
                      hi: "उर्वरक सिफारिशें",
                      pa: "ਖਾਦ ਸਿਫਾਰਸ਼ਾਂ",
                      ta: "உர பரிந்துரைகள்",
                      te: "ఎరువుల సిఫార్సులు",
                      bn: "সার সুপারিশ",
                      mr: "खत शिफारसी",
                    })}
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/soil-health" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "Soil Health Monitoring",
                      hi: "मिट्टी स्वास्थ्य निगरानी",
                      pa: "ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਨਿਗਰਾਨੀ",
                      ta: "மண் ஆரோக்கிய கண்காணிப்பு",
                      te: "నేల ఆరోగ్య పర్యవేక్షణ",
                      bn: "মাটির স্বাস্থ্য পর্যবেক্ষণ",
                      mr: "मातीच्या आरोग्याचे निरीक्षण",
                    })}
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/organic-farming" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "Organic Farming Advice",
                      hi: "जैविक खेती सलाह",
                      pa: "ਜੈਵਿਕ ਖੇਤੀ ਸਲਾਹ",
                      ta: "இயற்கை விவசாய ஆலோசனை",
                      te: "సేంద్రీయ వ్యవసాయ సలహా",
                      bn: "জৈব কৃষি পরামর্শ",
                      mr: "सेंद्रिय शेती सल्ला",
                    })}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {t({
                  en: "Resources",
                  hi: "संसाधन",
                  pa: "ਸਰੋਤ",
                  ta: "வளங்கள்",
                  te: "వనరులు",
                  bn: "সংস্থান",
                  mr: "साधने",
                })}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/education" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "Soil Education",
                      hi: "मिट्टी शिक्षा",
                      pa: "ਮਿੱਟੀ ਸਿੱਖਿਆ",
                      ta: "மண் கல்வி",
                      te: "నేల విద్య",
                      bn: "মাটি শিক্ষা",
                      mr: "माती शिक्षण",
                    })}
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/faq" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "FAQ",
                      hi: "अक्सर पूछे जाने वाले प्रश्न",
                      pa: "ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ",
                      ta: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
                      te: "తరచుగా అడిగే ప్రశ్నలు",
                      bn: "সাধারণ প্রশ্ন",
                      mr: "वारंवार विचारले जाणारे प्रश्न",
                    })}
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                  <Link to="/regions" className="flex-1 transition hover:text-emerald-300">
                    {t({
                      en: "Regional Insights",
                      hi: "क्षेत्रीय अंतर्दृष्टि",
                      pa: "ਖੇਤਰੀ ਜਾਣਕਾਰੀ",
                      ta: "பிராந்திய நுண்ணறிவுகள்",
                      te: "ప్రాంతీయ అంతర్దృష్టులు",
                      bn: "আঞ্চলিক অন্তর্দৃষ্টি",
                      mr: "प्रादेशिक माहिती",
                    })}
                  </Link>
                </li>
              </ul>
            </div>

              <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">
                {t({
                  en: "Contact",
                  hi: "संपर्क",
                  pa: "ਸੰਪਰਕ",
                  ta: "தொடர்பு",
                  te: "సంప్రదించండి",
                  bn: "যোগাযোগ",
                  mr: "संपर्क",
                })}
              </h3>
              <div className="mx-auto flex w-full max-w-[320px] flex-col items-center gap-4 rounded-2xl border border-emerald-300/20 bg-white/5 p-6 text-center text-sm shadow-inner backdrop-blur sm:max-w-[360px] lg:max-w-[380px] xl:max-w-[420px]">
                <div className="flex items-center justify-center gap-3 text-slate-200">
                  <Mail className="h-4 w-4 text-emerald-300" />
                  <a href="mailto:support@soilsathi.in" className="transition hover:text-emerald-300">
                    support@soilsathi.in
                  </a>
                </div>
                <div className="flex items-start justify-center gap-3 text-slate-200">
                  <Phone className="mt-1 h-4 w-4 text-emerald-300" />
                  <div className="text-left">
                    <p>
                      {t({
                        en: "Toll Free",
                        hi: "टोल फ्री",
                        pa: "ਟੋਲ ਫ੍ਰੀ",
                        ta: "கட்டணமில்லா எண்",
                        te: "టోల్ ఫ్రీ",
                        bn: "টোল ফ্রি",
                        mr: "टोल फ्री",
                      })}
                    </p>
                    <p className="font-semibold text-white">1800-XXX-XXXX</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p className="text-slate-300">
              © {new Date().getFullYear()} SoilSathi.{" "}
              {t({
                en: "All rights reserved.",
                hi: "सर्वाधिकार सुरक्षित।",
                pa: "ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।",
                ta: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
                te: "అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.",
                bn: "সর্বস্বত্ব সংরক্ষিত।",
                mr: "सर्व हक्क राखीव.",
              })}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/privacy" className="transition hover:text-emerald-300">
                {t({
                  en: "Privacy",
                  hi: "गोपनीयता",
                  pa: "ਪ੍ਰਾਈਵੇਸੀ",
                  ta: "தனியுரிமை",
                  te: "గోప్యత",
                  bn: "গोपনীয়তা",
                  mr: "गोपनीयता",
                })}
              </Link>
              <Link to="/terms" className="transition hover:text-emerald-300">
                {t({
                  en: "Terms",
                  hi: "नियम",
                  pa: "ਨਿਯਮ",
                  ta: "விதிமுறைகள்",
                  te: "నిబంధనలు",
                  bn: "শর্তাবলী",
                  mr: "नियम",
                })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
