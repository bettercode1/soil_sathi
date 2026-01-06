import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LogIn, Phone, ArrowRight, Loader2, ShieldCheck, Sprout } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { toast } from "sonner";

// Extend window interface to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setOtpSent(false);
        setMobileNumber("");
        setOtp("");
        setIsLoading(false);
        // Clean up recaptcha if needed
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {
            console.error("Error clearing recaptcha", e);
          }
        }
      }, 300);
    }
  }, [isOpen]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier && recaptchaContainerRef.current) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          toast.error(t({
            en: "Recaptcha expired. Please try again.",
            hi: "Recaptcha समाप्त हो गया। कृपया पुन: प्रयास करें।",
            pa: "Recaptcha ਦੀ ਮਿਆਦ ਪੁੱਗ ਗਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
            ta: "Recaptcha காலாவதியானது. மீண்டும் முயற்சிக்கவும்.",
            te: "Recaptcha గడువు ముగిసింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
            bn: "Recaptcha মেয়াদ শেষ। অনুগ্রহ করে আবার চেষ্টা করুন।",
            mr: "Recaptcha कालबाह्य झाले. कृपया पुन्हा प्रयत्न करा.",
          }));
          setIsLoading(false);
        }
      });
    }
  };

  const handleSendOtp = async () => {
    if (mobileNumber.length !== 10) return;
    
    setIsLoading(true);
    
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const phoneNumber = "+91" + mobileNumber;

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // SMS sent. Prompt user to type the code.
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast.success(t({
        en: "OTP sent successfully!",
        hi: "OTP सफलतापूर्वक भेजा गया!",
        pa: "OTP ਸਫਲਤਾਪੂਰਵਕ ਭੇਜਿਆ ਗਿਆ!",
        ta: "OTP வெற்றிகரமாக அனுப்பப்பட்டது!",
        te: "OTP విజయవంతంగా పంపబడింది!",
        bn: "OTP সফলভাবে পাঠানো হয়েছে!",
        mr: "OTP यशस्वीरित्या पाठवला!",
      }));
    } catch (error: any) {
      console.error("Error sending SMS", error);
      setIsLoading(false);
      
      // Handle specific error codes if needed
      if (error.code === 'auth/invalid-phone-number') {
        toast.error(t({
          en: "Invalid phone number.",
          hi: "अमान्य फोन नंबर।",
          pa: "ਗਲਤ ਫੋਨ ਨੰਬਰ।",
          ta: "தவறான தொலைபேசி எண்.",
          te: "చెల్లని ఫోన్ నంబర్.",
          bn: "অবৈধ ফোন নম্বর।",
          mr: "अवैध फोन नंबर.",
        }));
      } else if (error.code === 'auth/billing-not-enabled') {
        toast.error(t({
          en: "Firebase Billing not enabled. Please use Test Phone Numbers or upgrade plan.",
          hi: "Firebase बिलिंग सक्षम नहीं है। कृपया परीक्षण फोन नंबरों का उपयोग करें।",
          pa: "Firebase ਬਿਲਿੰਗ ਸਮਰੱਥ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਟੈਸਟ ਫੋਨ ਨੰਬਰਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
          ta: "Firebase பில்லிங் இயக்கப்படவில்லை. சோதனை எண்களைப் பயன்படுத்தவும்.",
          te: "Firebase బిల్లింగ్ ప్రారంభించబడలేదు. దయచేసి టెస్ట్ నంబర్లను ఉపయోగించండి.",
          bn: "Firebase বিলিং সক্ষম নয়। দয়া করে টেস্ট ফোন নম্বর ব্যবহার করুন।",
          mr: "Firebase बिलिंग सक्षम नाही. कृपया चाचणी फोन नंबर वापरा.",
        }));
      } else if (error.code === 'auth/too-many-requests') {
         toast.error(t({
          en: "Too many requests. Please try again later.",
          hi: "बहुत सारे अनुरोध। कृपया बाद में पुन: प्रयास करें।",
          pa: "ਬਹੁਤ ਸਾਰੀਆਂ ਬੇਨਤੀਆਂ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
          ta: "அதிக கோரிக்கைகள். பின்னர் முயற்சிக்கவும்.",
          te: "చాలా అభ్యర్థనలు. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.",
          bn: "খুব বেশি অনুরোধ। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
          mr: "खूप विनंत्या. कृपया नंतर पुन्हा प्रयत्न करा.",
        }));
      } else {
        toast.error(t({
          en: "Failed to send OTP. Please try again.",
          hi: "OTP भेजने में विफल। कृपया पुन: प्रयास करें।",
          pa: "OTP ਭੇਜਣ ਵਿੱਚ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
          ta: "OTP அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
          te: "OTP పంపడంలో విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
          bn: "OTP পাঠাতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।",
          mr: "OTP पाठवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
        }));
      }
      
      // Clear recaptcha on error so user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        // @ts-ignore
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      console.log("User signed in successfully", user);
      
      toast.success(t({
        en: "Login successful!",
        hi: "लॉगिन सफल!",
        pa: "ਲਾਗਇਨ ਸਫਲ!",
        ta: "உள்நுழைவு வெற்றிகரமாக!",
        te: "లాగిన్ విజయవంతమైంది!",
        bn: "লগইন সফল!",
        mr: "लॉगिन यशस्वी!",
      }));
      
      setIsOpen(false);
    } catch (error) {
      console.error("Bad OTP", error);
      toast.error(t({
        en: "Invalid OTP. Please check and try again.",
        hi: "अमान्य OTP। कृपया जांचें और पुन: प्रयास करें।",
        pa: "ਗਲਤ OTP। ਕਿਰਪਾ ਕਰਕੇ ਜਾਂਚ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
        ta: "தவறான OTP. சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
        te: "చెల్లని OTP. దయచేసి తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి.",
        bn: "অবৈধ OTP। অনুগ্রহ করে চেক করুন এবং আবার চেষ্টা করুন।",
        mr: "अवैध OTP. कृपया तपासा आणि पुन्हा प्रयत्न करा.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md transition-all hover:shadow-lg gap-2 ml-2 rounded-full px-5"
        >
          <LogIn className="h-4 w-4" />
          <span className="font-medium">
            {t({
              en: "Login",
              hi: "लॉग इन",
              pa: "ਲਾਗ ਇਨ",
              ta: "உள்நுழைய",
              te: "లాగిన్",
              bn: "লগ ইন",
              mr: "लॉग इन",
            })}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl gap-0">
        {/* Decorative Header Background */}
        <div className="relative h-32 bg-gradient-to-br from-emerald-600 via-green-500 to-teal-600 flex flex-col items-center justify-center text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-black/10 to-transparent"></div>
          
          <div className="z-10 bg-white/20 p-3 rounded-full backdrop-blur-sm mb-2 shadow-inner ring-1 ring-white/30">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight z-10 text-white drop-shadow-md">
            SoilSathi
          </DialogTitle>
        </div>

        <div className="px-8 pb-8 pt-6">
          <DialogHeader className="mb-6">
            <h3 className="text-xl font-semibold text-center text-gray-800">
              {otpSent 
                ? t({
                    en: "Verification Code",
                    hi: "सत्यापन कोड",
                    pa: "ਤਸਦੀਕ ਕੋਡ",
                    ta: "சரிபார்ப்பு குறியீடு",
                    te: "ధృవీకరణ కోడ్",
                    bn: "যাচাইকরণ কোড",
                    mr: "पडताळणी कोड",
                  })
                : t({
                    en: "Welcome Back",
                    hi: "वापसी पर स्वागत है",
                    pa: "ਜੀ ਆਇਆਂ ਨੂੰ",
                    ta: "மீண்டும் வருக",
                    te: "స్వాగతం",
                    bn: "স্বাগতম",
                    mr: "स्वागत आहे",
                  })
              }
            </h3>
            <DialogDescription className="text-center text-gray-500">
              {otpSent 
                ? t({
                    en: `We sent a code to +91 ${mobileNumber}`,
                    hi: `हमने +91 ${mobileNumber} पर एक कोड भेजा है`,
                    pa: `ਅਸੀਂ +91 ${mobileNumber} 'ਤੇ ਇੱਕ ਕੋਡ ਭੇਜਿਆ ਹੈ`,
                    ta: `+91 ${mobileNumber} க்கு குறியீட்டை அனுப்பினோம்`,
                    te: `మేము +91 ${mobileNumber} కు కోడ్ పంపాము`,
                    bn: `আমরা +91 ${mobileNumber}-এ একটি কোড পাঠিয়েছি`,
                    mr: `आम्ही +91 ${mobileNumber} वर कोड पाठवला आहे`,
                  })
                : t({
                    en: "Enter your mobile number to access your account",
                    hi: "अपने खाते तक पहुँचने के लिए अपना मोबाइल नंबर दर्ज करें",
                    pa: "ਆਪਣੇ ਖਾਤੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਆਪਣਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
                    ta: "உங்கள் கணக்கை அணுக மொபைல் எண்ணை உள்ளிடவும்",
                    te: "మీ ఖాతాను యాక్సెస్ చేయడానికి మొబైల్ నంబర్‌ను నమోదు చేయండి",
                    bn: "আপনার অ্যাকাউন্ট অ্যাক্সেস করতে আপনার মোবাইল নম্বর লিখুন",
                    mr: "तुमच्या खात्यात प्रवेश करण्यासाठी तुमचा मोबाईल नंबर टाका",
                  })
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {!otpSent ? (
              <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-medium text-gray-700 ml-1">
                    {t({
                      en: "Mobile Number",
                      hi: "मोबाइल नंबर",
                      pa: "ਮੋਬਾਈਲ ਨੰਬਰ",
                      ta: "மொபைல் எண்",
                      te: "మొబైల్ సంఖ్య",
                      bn: "মোবাইল নম্বর",
                      mr: "मोबाईल नंबर",
                    })}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center border-r pr-2 border-gray-300 text-gray-500 font-medium select-none">
                      +91
                    </div>
                    <Input
                      id="mobile"
                      placeholder="98765 43210"
                      className="pl-14 h-11 border-gray-200 bg-gray-50/50 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all group-hover:bg-white"
                      value={mobileNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) setMobileNumber(value);
                      }}
                      type="tel"
                      maxLength={10}
                      autoFocus
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                  </div>
                </div>

                <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

                <Button 
                  onClick={handleSendOtp} 
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all rounded-lg"
                  disabled={mobileNumber.length !== 10 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {t({
                        en: "Get OTP",
                        hi: "OTP प्राप्त करें",
                        pa: "OTP ਪ੍ਰਾਪਤ ਕਰੋ",
                        ta: "OTP பெறவும்",
                        te: "OTP పొందండి",
                        bn: "OTP পান",
                        mr: "OTP मिळवा",
                      })}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-center py-2">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot 
                          key={index} 
                          index={index} 
                          className="h-12 w-10 sm:h-12 sm:w-12 border-emerald-200 bg-emerald-50/30 focus:bg-white focus:border-emerald-500 text-lg font-semibold rounded-md shadow-sm transition-all" 
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleLogin} 
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all rounded-lg"
                    disabled={otp.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {t({
                          en: "Verify & Login",
                          hi: "सत्यापित करें और लॉग इन करें",
                          pa: "ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਲਾਗ ਇਨ ਕਰੋ",
                          ta: "சரிபார்த்து உள்நுழையவும்",
                          te: "ధృవీకరించండి మరియు లాగిన్ చేయండి",
                          bn: "যাচাই করুন এবং লগ ইন করুন",
                          mr: "पडताळणी करा आणि लॉग इन करा",
                        })}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex justify-between items-center text-sm">
                    <button 
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        // Clear recaptcha to allow re-sending
                        if (window.recaptchaVerifier) {
                          window.recaptchaVerifier.clear();
                          // @ts-ignore
                          window.recaptchaVerifier = null;
                        }
                      }}
                      className="text-gray-500 hover:text-emerald-600 transition-colors"
                    >
                      {t({
                        en: "Change Number",
                        hi: "नंबर बदलें",
                        pa: "ਨੰਬਰ ਬਦਲੋ",
                        ta: "எண்ணை மாற்றவும்",
                        te: "నంబర్‌ను మార్చండి",
                        bn: "নম্বর পরিবর্তন করুন",
                        mr: "नंबर बदला",
                      })}
                    </button>
                    <button 
                      className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                      onClick={() => {
                        // Reset and retry send logic
                        setOtpSent(false);
                        setOtp("");
                        // Clear verifier to force re-render/re-verify
                        if (window.recaptchaVerifier) {
                          window.recaptchaVerifier.clear();
                          // @ts-ignore
                          window.recaptchaVerifier = null;
                        }
                      }}
                    >
                      {t({
                        en: "Resend OTP",
                        hi: "OTP पुनः भेजें",
                        pa: "OTP ਦੁਬਾਰਾ ਭੇਜੋ",
                        ta: "OTP மீண்டும் அனுப்பவும்",
                        te: "OTP మళ్లీ పంపండి",
                        bn: "OTP পুনরায় পাঠান",
                        mr: "OTP पुन्हा पाठवा",
                      })}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer info */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-400">
            {t({
              en: "By continuing, you agree to our Terms of Service & Privacy Policy",
              hi: "जारी रखकर, आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत हैं",
              pa: "ਜਾਰੀ ਰੱਖ ਕੇ, ਤੁਸੀਂ ਸਾਡੀ ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ ਅਤੇ ਪ੍ਰਾਈਵੇਸੀ ਨੀਤੀ ਨਾਲ ਸਹਿਮਤ ਹੋ",
              ta: "தொடர்வதன் மூலம், எங்கள் சேவை விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஒப்புக்கொள்கிறீர்கள்",
              te: "కొనసాగించడం ద్వారా, మీరు మా సేవా నిబంధనలు మరియు గోప్యతా విధానాన్ని అంగీకరిస్తున్నారు",
              bn: "চালিয়ে যাওয়ার মাধ্যমে, আপনি আমাদের পরিষেবার শর্তাবলী এবং গোপনীয়তা নীতিতে সম্মত হন",
              mr: "पुढे जाऊन, तुम्ही आमच्या सेवा अटी आणि गोपनीयता धोरणाशी सहमत आहात",
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
