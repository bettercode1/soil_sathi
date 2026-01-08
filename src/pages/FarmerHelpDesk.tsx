import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Languages,
  Loader2,
  MessageCircleQuestion,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { recommendationsTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
type LanguageCode = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";

type SpeechRecognitionResultItem = {
  0?: {
    transcript?: string;
  };
  isFinal?: boolean;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultItem>;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onnomatch: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type AiAssistSource = {
  title: string;
  summary: string;
  url?: string;
  confidence?: string;
  source?: string;
  lastVerified?: string;
  note?: string;
};

type AiAssistReference = {
  id: string;
  title: string;
  summary: string;
  url?: string;
  updated?: string;
  source: string;
  score?: number;
};

type AiAssistResponsePayload = {
  language: string;
  answer: string;
  followUps: string[];
  clarifyingQuestions?: string[];
  sources?: AiAssistSource[];
  safetyMessage?: string;
  detectedLanguage?: string;
  references?: AiAssistReference[];
};

type AiAssistExchange = {
  id: string;
  question: string;
  language: string;
  detectedLanguage: string;
  answer: string;
  followUps: string[];
  clarifyingQuestions: string[];
  sources: AiAssistSource[];
  safetyMessage?: string | null;
  references: AiAssistReference[];
  isGreeting?: boolean;
};

type FarmerAssistMessage = {
  role: "farmer" | "assistant";
  content: string;
};

type ChatTimelineMessage = {
  id: string;
  exchangeId: string;
  role: "farmer" | "assistant";
  content: string;
  detectedLanguage: LanguageCode;
  followUps?: string[];
  clarifyingQuestions?: string[];
  sources?: AiAssistSource[];
  safetyMessage?: string | null;
  isGreeting?: boolean;
};

type AnimatedMessageState = {
  visibleText: string;
  isComplete: boolean;
};

const MAX_ASSIST_HISTORY_MESSAGES = 6;

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
// Enhanced Marathi hints with more agricultural and regional terms
const MARATHI_HINT_REGEX =
  /(शेत|शेतकरी|महाराष्ट्र|कर्ज|योजना|उत्पादन|खत|पाऊस|माती|सल्ला|अनुदान|शेती|पिक|बियाणे|सिंचन|खरपतवार|कीटक|रोग|उत्पन्न|बाजार|मंडी|कृषी|शेतीमाल|पाणी|वीज|ट्रॅक्टर|कंबाईन|स्प्रे|ड्रिप|स्प्रिंकलर|आंबा|कापूस|सोयाबीन|गहू|तांदूळ|ज्वारी|बाजरी|नागली|तूर|मूग|उडीद|हरभरा|चवळी|मटकी|कांदा|टोमॅटो|मिरची|भेंडी|वांगी|काकडी|लोकी|कर्दळ|पपई|कलिंगड|द्राक्ष|केळी|संत्रा|मोसंबी|नारळ|शेंदूर|काजू|बदाम|पिस्ता|आंबा|पेरू|चिकू|अननस|पपई|कर्दळ|द्राक्ष|केळी|संत्रा|मोसंबी|नारळ|शेंदूर|काजू|बदाम|पिस्ता)/i;
// Enhanced Hindi hints with more agricultural and regional terms
const HINDI_HINT_REGEX =
  /(किसान|योजना|ऋण|उर्वरक|मौसम|पैदावार|फसल|खरीफ|रबी|बीमा|सरकार|खेती|बीज|सिंचाई|खरपतवार|कीट|रोग|उत्पादन|बाजार|मंडी|कृषि|कृषि उत्पाद|पानी|बिजली|ट्रैक्टर|कंबाइन|स्प्रे|ड्रिप|स्प्रिंकलर|आम|कपास|सोयाबीन|गेहूं|चावल|ज्वार|बाजरा|रागी|अरहर|मूंग|उड़द|चना|मटर|प्याज|टमाटर|मिर्च|भिंडी|बैंगन|खीरा|लौकी|केला|अंगूर|संतरा|मौसंबी|नारियल|सिंदूर|काजू|बादाम|पिस्ता|अनानास|पपीता|तरबूज|खरबूजा)/i;

const getTimeOfDayGreeting = (language: LanguageCode, referenceDate: Date = new Date()): string => {
  const hour = referenceDate.getHours();
  const period =
    hour >= 5 && hour < 12
      ? "morning"
      : hour >= 12 && hour < 17
        ? "afternoon"
        : hour >= 17 && hour < 21
          ? "evening"
          : "night";

  const greetings: Record<string, Record<typeof period, string>> = {
    mr: {
      morning: "शुभ प्रभात! मी तुमचा शेतकरी मित्र आहे. मी कशी मदत करू?",
      afternoon: "शुभ दुपार! मी तुमचा शेतकरी मित्र आहे. मी कशी मदत करू?",
      evening: "शुभ संध्या! मी तुमचा शेतकरी मित्र आहे. मी कशी मदत करू?",
      night: "शुभ रात्री! मी तुमचा शेतकरी मित्र आहे. मी कशी मदत करू?",
    },
    hi: {
      morning: "सुप्रभात! मैं आपका किसान साथी हूँ। मैं किस विषय में सहायता करूँ?",
      afternoon: "शुभ दोपहर! मैं आपका किसान साथी हूँ। मैं किस विषय में सहायता करूँ?",
      evening: "शुभ संध्या! मैं आपका किसान साथी हूँ। मैं किस विषय में सहायता करूँ?",
      night: "शुभ रात्रि! मैं आपका किसान साथी हूँ। मैं किस विषय में सहायता करूँ?",
    },
    en: {
      morning: "Good morning! I'm your farmer friend. How can I help you today?",
      afternoon: "Good afternoon! I'm your farmer friend. How can I help you today?",
      evening: "Good evening! I'm your farmer friend. How can I help you today?",
      night: "Good evening! I'm your farmer friend. How can I help you today?",
    },
  };

  const selectedLanguage = ["mr", "hi", "en"].includes(language) ? language : "en";
  return greetings[selectedLanguage][period];
};

const helpDeskText: Record<
  | "tagline"
  | "autoSpeakLabel"
  | "autoSpeakHelper"
  | "autoListenLabel"
  | "autoListenHelper"
  | "voiceUnsupported"
  | "listening"
  | "micHint"
  | "micStop"
  | "detectedLanguage"
  | "referencesHeading"
  | "referencesEmpty"
  | "clarifyingHeading"
  | "safetyHeading"
  | "voiceError"
  | "speakDisabled"
  | "liveChatHeading"
  | "activePillLabel"
  | "assistantName"
  | "playVoiceLabel"
  | "sendMessageLabel"
  | "voiceOnlyActive"
  | "typeFallbackHint"
  | "thinkingMessage"
  | "typingMessage"
  | "speakingMessage"
  | "muteMessageLabel"
  | "unmuteMessageLabel",
  Record<LanguageCode, string>
> = {
  tagline: {
    en: "Realtime guidance on Maharashtra schemes, loans, weather and crop care.",
    hi: "महाराष्ट्र के किसानों के लिए योजनाओं, ऋण, मौसम और फसल देखभाल पर तुरंत मार्गदर्शन।",
    mr: "महाराष्ट्रातील शेतकऱ्यांसाठी योजना, कर्ज, हवामान व पिक व्यवस्थापन यावर तत्काळ मार्गदर्शन.",
    pa: "ਮਹਾਰਾਸ਼ਟਰ ਯੋਜਨਾਵਾਂ, ਕਰਜ਼ੇ, ਮੌਸਮ ਅਤੇ ਫਸਲ ਦੇਖਭਾਲ ਬਾਰੇ ਰੀਅਲਟਾਈਮ ਮਾਰਗਦਰਸ਼ਨ।",
    ta: "மகாராஷ்டிரா திட்டங்கள், கடன்கள், வானிலை மற்றும் பயிர் பராமரிப்பு குறித்த நேரடி வழிகாட்டுதல்.",
    te: "మహారాష్ట్ర పథకాలు, రుణాలు, వాతావరణం మరియు పంట సంరక్షణపై రియల్‌టైమ్ మార్గదర్శకత్వం.",
    bn: "মহারাষ্ট্রের প্রকল্প, ঋণ, আবহাওয়া এবং ফসলের যত্ন সম্পর্কে রিয়েলটাইম নির্দেশনা।",
  },
  autoSpeakLabel: {
    en: "Auto speak replies",
    hi: "उत्तर स्वचालित सुनाएँ",
    mr: "उत्तरे आपोआप वाचा",
    pa: "ਜਵਾਬ ਆਪਣੇ ਆਪ ਬੋਲੋ",
    ta: "பதில்களை தானாக பேசு",
    te: "సమాధానాలను స్వయంచాలకంగా మాట్లాడండి",
    bn: "স্বয়ংক্রিয়ভাবে উত্তর বলুন",
  },
  autoSpeakHelper: {
    en: "Hear the Live Voice Assistant's guidance aloud.",
    hi: "Live Voice Assistant की सलाह सुनें।",
    mr: "Live Voice Assistant चे सल्ले ऐका.",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਦੀ ਸਲਾਹ ਜ਼ੋਰ ਨਾਲ ਸੁਣੋ।",
    ta: "நேரடி குரல் உதவியாளரின் வழிகாட்டுதலை சத்தமாக கேளுங்கள்.",
    te: "లైవ్ వాయిస్ అసిస్టెంట్ యొక్క మార్గదర్శకత్వాన్ని బిగ్గరగా వినండి.",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্টের নির্দেশনা জোরে শুনুন।",
  },
  autoListenLabel: {
    en: "Auto listen",
    hi: "स्वचालित सुनना",
    mr: "ऐकणे आपोआप",
    pa: "ਆਪਣੇ ਆਪ ਸੁਣੋ",
    ta: "தானாக கேள்",
    te: "స్వయంచాలకంగా వినండి",
    bn: "স্বয়ংক্রিয়ভাবে শুনুন",
  },
  autoListenHelper: {
    en: "Keep the mic ready so you can speak without tapping again.",
    hi: "माइक्रोफोन को तैयार रखता है ताकि बिना टैप किए बोल सकें।",
    mr: "मायक्रोफोन तयार ठेवतो जेणेकरून पुन्हा टॅप न करता बोलू शकता.",
    pa: "ਮਾਈਕ ਨੂੰ ਤਿਆਰ ਰੱਖੋ ਤਾਂ ਜੋ ਤੁਸੀਂ ਦੁਬਾਰਾ ਟੈਪ ਕੀਤੇ ਬਿਨਾਂ ਬੋਲ ਸਕੋ।",
    ta: "மீண்டும் தட்டாமல் பேச முடியும் வகையில் மைக்ரோஃபோனை தயாராக வைத்திருங்கள்.",
    te: "మీరు మళ్లీ ట్యాప్ చేయకుండా మాట్లాడగలిగేలా మైక్‌ను సిద్ధంగా ఉంచండి.",
    bn: "মাইকটি প্রস্তুত রাখুন যাতে আপনি আবার ট্যাপ না করে কথা বলতে পারেন।",
  },
  voiceUnsupported: {
    en: "Voice features are not supported in this browser. Please type your question.",
    hi: "यह ब्राउज़र वॉइस सुविधा का समर्थन नहीं करता। कृपया अपना प्रश्न टाइप करें।",
    mr: "हा ब्राउझर आवाज सुविधा समर्थित करत नाही. कृपया तुमचा प्रश्न टाइप करा.",
    pa: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਵੌਇਸ ਫੀਚਰ ਸਮਰਥਿਤ ਨਹੀਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਟਾਈਪ ਕਰੋ।",
    ta: "இந்த உலாவியில் குரல் அம்சங்கள் ஆதரிக்கப்படவில்லை. தயவுசெய்து உங்கள் கேள்வியை தட்டச்சு செய்யவும்.",
    te: "ఈ బ్రౌజర్‌లో వాయిస్ ఫీచర్‌లు మద్దతు లేవు. దయచేసి మీ ప్రశ్నను టైప్ చేయండి.",
    bn: "এই ব্রাউজারে ভয়েস বৈশিষ্ট্যগুলি সমর্থিত নয়। অনুগ্রহ করে আপনার প্রশ্ন টাইপ করুন।",
  },
  listening: {
    en: "Listening…",
    hi: "सुन रहा है…",
    mr: "ऐकत आहे…",
    pa: "ਸੁਣ ਰਿਹਾ ਹੈ…",
    ta: "கேட்கிறது…",
    te: "వింటోంది…",
    bn: "শুনছে…",
  },
  micHint: {
    en: "Tap the mic to speak",
    hi: "बोलने के लिए माइक्रोफोन टैप करें",
    mr: "बोलण्यासाठी मायक्रोफोन टॅप करा",
    pa: "ਬੋਲਣ ਲਈ ਮਾਈਕ ਟੈਪ ਕਰੋ",
    ta: "பேச மைக்ரோஃபோனைத் தட்டவும்",
    te: "మాట్లాడడానికి మైక్‌ను ట్యాప్ చేయండి",
    bn: "কথা বলতে মাইক ট্যাপ করুন",
  },
  micStop: {
    en: "Stop listening",
    hi: "सुनना बंद करें",
    mr: "ऐकणे थांबवा",
    pa: "ਸੁਣਨਾ ਬੰਦ ਕਰੋ",
    ta: "கேட்பதை நிறுத்து",
    te: "వినడం ఆపండి",
    bn: "শোনা বন্ধ করুন",
  },
  detectedLanguage: {
    en: "Detected language",
    hi: "पहचानी गई भाषा",
    mr: "ओळखलेली भाषा",
    pa: "ਖੋਜੀ ਗਈ ਭਾਸ਼ਾ",
    ta: "கண்டறியப்பட்ட மொழி",
    te: "గుర్తించిన భాష",
    bn: "সনাক্তকৃত ভাষা",
  },
  referencesHeading: {
    en: "Verified references",
    hi: "सत्यापित संदर्भ",
    mr: "प्रमाणित संदर्भ",
    pa: "ਪ੍ਰਮਾਣਿਤ ਹਵਾਲੇ",
    ta: "சரிபார்க்கப்பட்ட குறிப்புகள்",
    te: "ధృవీకరించిన సూచనలు",
    bn: "যাচাইকৃত রেফারেন্স",
  },
  referencesEmpty: {
    en: "Ask about a specific crop, scheme, or loan to view matching references.",
    hi: "किसी विशेष फसल, योजना या ऋण के बारे में पूछें ताकि संबंधित संदर्भ दिखें।",
    mr: "विशिष्ट पीक, योजना किंवा कर्जाबद्दल विचारल्यास संबंधित संदर्भ पाहू शकता.",
    pa: "ਮੇਲ ਖਾਂਦੇ ਹਵਾਲੇ ਦੇਖਣ ਲਈ ਕਿਸੇ ਖਾਸ ਫਸਲ, ਯੋਜਨਾ ਜਾਂ ਕਰਜ਼ੇ ਬਾਰੇ ਪੁੱਛੋ।",
    ta: "பொருந்தக்கூடிய குறிப்புகளைப் பார்க்க ஒரு குறிப்பிட்ட பயிர், திட்டம் அல்லது கடன் பற்றி கேளுங்கள்.",
    te: "సరిపోలే సూచనలను చూడటానికి నిర్దిష్ట పంట, పథకం లేదా రుణం గురించి అడగండి.",
    bn: "মিলে যাওয়া রেফারেন্স দেখতে একটি নির্দিষ্ট ফসল, প্রকল্প বা ঋণ সম্পর্কে জিজ্ঞাসা করুন।",
  },
  clarifyingHeading: {
    en: "Clarifying questions",
    hi: "अतिरिक्त जानकारी के प्रश्न",
    mr: "स्पष्ट करणारे प्रश्न",
    pa: "ਸਪੱਸ਼ਟੀਕਰਨ ਪ੍ਰਸ਼ਨ",
    ta: "தெளிவுபடுத்தும் கேள்விகள்",
    te: "స్పష్టీకరణ ప్రశ్నలు",
    bn: "স্পষ্টীকরণ প্রশ্ন",
  },
  safetyHeading: {
    en: "Safety note",
    hi: "सुरक्षा सूचना",
    mr: "सुरक्षा सूचना",
    pa: "ਸੁਰੱਖਿਆ ਨੋਟ",
    ta: "பாதுகாப்பு குறிப்பு",
    te: "భద్రతా గమనిక",
    bn: "নিরাপত্তা নোট",
  },
  voiceError: {
    en: "Voice error",
    hi: "वॉइस त्रुटि",
    mr: "आवाज त्रुटी",
    pa: "ਵੌਇਸ ਗਲਤੀ",
    ta: "குரல் பிழை",
    te: "వాయిస్ లోపం",
    bn: "ভয়েস ত্রুটি",
  },
  speakDisabled: {
    en: "Turn on audio permissions to hear replies.",
    hi: "उत्तर सुनने के लिए ब्राउज़र में ऑडियो अनुमति चालू करें।",
    mr: "उत्तरे ऐकण्यासाठी ब्राउझरमध्ये ऑडिओ परवानग्या सक्रिय करा.",
    pa: "ਜਵਾਬ ਸੁਣਨ ਲਈ ਆਡੀਓ ਇਜਾਜ਼ਤਾਂ ਚਾਲੂ ਕਰੋ।",
    ta: "பதில்களைக் கேட்க ஆடியோ அனுமதிகளை இயக்கவும்.",
    te: "సమాధానాలను వినడానికి ఆడియో అనుమతులను ఆన్ చేయండి.",
    bn: "উত্তর শুনতে অডিও অনুমতি চালু করুন।",
  },
  liveChatHeading: {
    en: "Live Voice Assistant Chat",
    hi: "लाइव वॉइस असिस्टेंट चैट",
    mr: "लाईव्ह व्हॉइस असिस्टंट चॅट",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਚੈਟ",
    ta: "நேரடி குரல் உதவியாளர் அரட்டை",
    te: "లైవ్ వాయిస్ అసిస్టెంట్ చాట్",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট চ্যাট",
  },
  activePillLabel: {
    en: "Live Voice Assistant Active",
    hi: "सक्रिय Live Voice Assistant",
    mr: "Live Voice Assistant सक्रिय",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਸਰਗਰਮ",
    ta: "நேரடி குரல் உதவியாளர் செயலில்",
    te: "లైవ్ వాయిస్ అసిస్టెంట్ సక్రియం",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট সক্রিয়",
  },
  assistantName: {
    en: "Live Voice Assistant",
    hi: "लाइव वॉइस असिस्टेंट",
    mr: "लाईव्ह व्हॉइस असिस्टंट",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ",
    ta: "நேரடி குரல் உதவியாளர்",
    te: "లైవ్ వాయిస్ అసిస్టెంట్",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট",
  },
  playVoiceLabel: {
    en: "Play reply again",
    hi: "उत्तर दोबारा सुनें",
    mr: "उत्तर पुन्हा ऐका",
    pa: "ਜਵਾਬ ਦੁਬਾਰਾ ਚਲਾਓ",
    ta: "பதிலை மீண்டும் இயக்கவும்",
    te: "సమాధానాన్ని మళ్లీ ప్లే చేయండి",
    bn: "উত্তর আবার চালান",
  },
  sendMessageLabel: {
    en: "Send",
    hi: "भेजें",
    mr: "पाठवा",
    pa: "ਭੇਜੋ",
    ta: "அனுப்பு",
    te: "పంపండి",
    bn: "পাঠান",
  },
  voiceOnlyActive: {
    en: "Listening… Speak your question and we will reply aloud automatically.",
    hi: "सुन रहा है… बस बोलें, जवाब अपने आप सुनाई देगा।",
    mr: "ऐकत आहे… तुमचा प्रश्न बोला, उत्तर आपोआप ऐकू येईल.",
    pa: "ਸੁਣ ਰਿਹਾ ਹੈ… ਆਪਣਾ ਸਵਾਲ ਬੋਲੋ ਅਤੇ ਅਸੀਂ ਆਪਣੇ ਆਪ ਜ਼ੋਰ ਨਾਲ ਜਵਾਬ ਦੇਵਾਂਗੇ।",
    ta: "கேட்கிறது… உங்கள் கேள்வியைப் பேசுங்கள், நாங்கள் தானாக சத்தமாக பதிலளிப்போம்.",
    te: "వింటోంది… మీ ప్రశ్నను మాట్లాడండి మరియు మేము స్వయంచాలకంగా బిగ్గరగా సమాధానం ఇస్తాము.",
    bn: "শুনছে… আপনার প্রশ্ন বলুন এবং আমরা স্বয়ংক্রিয়ভাবে জোরে উত্তর দেব।",
  },
  typeFallbackHint: {
    en: "Typing is available when voice support is unavailable.",
    hi: "जब वॉइस सुविधा उपलब्ध नहीं हो, तब आप टाइप कर सकते हैं।",
    mr: "आवाज उपलब्ध नसेल तेव्हा तुम्ही टाइप करू शकता.",
    pa: "ਜਦੋਂ ਵੌਇਸ ਸਹਾਇਤਾ ਉਪਲਬਧ ਨਹੀਂ ਹੁੰਦੀ ਤਾਂ ਟਾਈਪਿੰਗ ਉਪਲਬਧ ਹੈ।",
    ta: "குரல் ஆதரவு கிடைக்காதபோது தட்டச்சு கிடைக்கிறது.",
    te: "వాయిస్ మద్దతు అందుబాటులో లేనప్పుడు టైప్ చేయడం అందుబాటులో ఉంది.",
    bn: "ভয়েস সমর্থন অনুপলব্ধ হলে টাইপিং উপলব্ধ।",
  },
  thinkingMessage: {
    en: "Live Voice Assistant is thinking…",
    hi: "Live Voice Assistant सोच रहा है…",
    mr: "Live Voice Assistant विचार करत आहे…",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਸੋਚ ਰਿਹਾ ਹੈ…",
    ta: "நேரடி குரல் உதவியாளர் சிந்திக்கிறார்…",
    te: "లైవ్ వాయిస్ అసిస్టెంట్ ఆలోచిస్తోంది…",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট ভাবছে…",
  },
  typingMessage: {
    en: "Live Voice Assistant is typing…",
    hi: "Live Voice Assistant टाइप कर रहा है…",
    mr: "Live Voice Assistant टाइप करत आहे…",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਟਾਈਪ ਕਰ ਰਿਹਾ ਹੈ…",
    ta: "நேரடி குரல் உதவியாளர் தட்டச்சு செய்கிறார்…",
    te: "లైవ్ వాయిస్ అసిస్టెంట్ టైప్ చేస్తోంది…",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট টাইপ করছে…",
  },
  speakingMessage: {
    en: "Speaking your answer…",
    hi: "आपके उत्तर को आवाज़ में सुनाया जा रहा है…",
    mr: "आपला उत्तर आवाजेत सांगत आहे…",
    pa: "ਤੁਹਾਡਾ ਜਵਾਬ ਬੋਲ ਰਿਹਾ ਹੈ…",
    ta: "உங்கள் பதிலைப் பேசுகிறது…",
    te: "మీ సమాధానాన్ని మాట్లాడుతోంది…",
    bn: "আপনার উত্তর বলছে…",
  },
  muteMessageLabel: {
    en: "Mute this message",
    hi: "इस संदेश को म्यूट करें",
    mr: "हा संदेश म्यूट करा",
    pa: "ਇਸ ਸੁਨੇਹੇ ਨੂੰ ਮੂਕ ਕਰੋ",
    ta: "இந்த செய்தியை முடக்கு",
    te: "ఈ సందేశాన్ని మ్యూట్ చేయండి",
    bn: "এই বার্তাটি নিঃশব্দ করুন",
  },
  unmuteMessageLabel: {
    en: "Unmute this message",
    hi: "इस संदेश को अनम्यूट करें",
    mr: "हा संदेश अनम्यूट करा",
    pa: "ਇਸ ਸੁਨੇਹੇ ਨੂੰ ਅਨਮੂਕ ਕਰੋ",
    ta: "இந்த செய்தியை முடக்க நீக்கு",
    te: "ఈ సందేశాన్ని అన్మ్యూట్ చేయండి",
    bn: "এই বার্তাটি আনমিউট করুন",
  },
};

const landingCopy: Record<
  | "heroHeading"
  | "heroDescription"
  | "badgeMarathi"
  | "badgeHindi"
  | "badgeEnglish"
  | "featureRagTitle"
  | "featureRagDescription"
  | "featureVoiceTitle"
  | "featureVoiceDescription"
  | "activationTitle"
  | "activationDescription"
  | "activationBulletOne"
  | "activationBulletTwo"
  | "activationBulletThree"
  | "activationButton"
  | "whatHappensTitle"
  | "whatHappensIntro"
  | "whatHappensBulletOne"
  | "whatHappensBulletTwo"
  | "whatHappensBulletThree"
  | "proTip"
  | "voiceModeLabel"
  | "voiceModeDescription"
  | "activationTag",
  Record<LanguageCode, string>
> = {
  heroHeading: {
    en: "Live Voice Assistant",
    hi: "लाइव वॉइस असिस्टेंट",
    mr: "लाईव्ह व्हॉइस असिस्टंट",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ",
    ta: "நேரடி குரல் உதவியாளர்",
    te: "లైవ్ వాయిస్ అసిస్టెంట్",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট",
  },
  heroDescription: {
    en: "Instant support on Maharashtra schemes, credit, soil care and crop management.",
    hi: "महाराष्ट्र की योजनाओं, ऋण, मिट्टी और फसल प्रबंधन पर त्वरित सहायता।",
    mr: "महाराष्ट्रातील योजना, कर्ज, माती आणि पिक व्यवस्थापनावर तत्काळ सहाय्य.",
    pa: "ਮਹਾਰਾਸ਼ਟਰ ਯੋਜਨਾਵਾਂ, ਕਰਜ਼ੇ, ਮਿੱਟੀ ਦੇਖਭਾਲ ਅਤੇ ਫਸਲ ਪ੍ਰਬੰਧਨ 'ਤੇ ਤੁਰੰਤ ਸਹਾਇਤਾ।",
    ta: "மகாராஷ்டிரா திட்டங்கள், கடன், மண் பராமரிப்பு மற்றும் பயிர் மேலாண்மை குறித்த உடனடி ஆதரவு.",
    te: "మహారాష్ట్ర పథకాలు, రుణం, నేల సంరక్షణ మరియు పంట నిర్వహణపై తక్షణ మద్దతు.",
    bn: "মহারাষ্ট্রের প্রকল্প, ঋণ, মাটি যত্ন এবং ফসল ব্যবস্থাপনায় তাৎক্ষণিক সহায়তা।",
  },
  badgeMarathi: {
    en: "Marathi",
    hi: "मराठी",
    mr: "मराठी",
    pa: "ਮਰਾਠੀ",
    ta: "மராத்தி",
    te: "మరాఠీ",
    bn: "মারাঠি",
  },
  badgeHindi: {
    en: "Hindi",
    hi: "हिन्दी",
    mr: "हिंदी",
    pa: "ਹਿੰਦੀ",
    ta: "இந்தி",
    te: "హిందీ",
    bn: "হিন্দি",
  },
  badgeEnglish: {
    en: "English",
    hi: "अंग्रेज़ी",
    mr: "English",
    pa: "ਅੰਗਰੇਜ਼ੀ",
    ta: "ஆங்கிலம்",
    te: "ఆంగ్లం",
    bn: "ইংরেজি",
  },
  featureRagTitle: {
    en: "Realtime RAG Support",
    hi: "रीयलटाइम RAG सहायता",
    mr: "रिअलटाइम RAG सहाय्य",
    pa: "ਰੀਅਲਟਾਈਮ RAG ਸਹਾਇਤਾ",
    ta: "நேரடி RAG ஆதரவு",
    te: "రియల్‌టైమ్ RAG మద్దతు",
    bn: "রিয়েলটাইম RAG সমর্থন",
  },
  featureRagDescription: {
    en: "Verified schemes, weather updates, and crop care insights within seconds.",
    hi: "कुछ ही सेकंड में सत्यापित योजनाएँ, मौसम अपडेट और फसल देखभाल सुझाव।",
    mr: "सेकंदात योजना, हवामान आणि पीक व्यवस्थापन माहिती.",
    pa: "ਕੁਝ ਸਕਿੰਟਾਂ ਵਿੱਚ ਪ੍ਰਮਾਣਿਤ ਯੋਜਨਾਵਾਂ, ਮੌਸਮ ਅਪਡੇਟ ਅਤੇ ਫਸਲ ਦੇਖਭਾਲ ਦੀ ਜਾਣਕਾਰੀ।",
    ta: "சில வினாடிகளில் சரிபார்க்கப்பட்ட திட்டங்கள், வானிலை புதுப்பிப்புகள் மற்றும் பயிர் பராமரிப்பு நுண்ணறிவுகள்.",
    te: "కొన్ని సెకన్లలో ధృవీకరించిన పథకాలు, వాతావరణ నవీకరణలు మరియు పంట సంరక్షణ అంతర్దృష్టులు.",
    bn: "কয়েক সেকেন্ডের মধ্যে যাচাইকৃত প্রকল্প, আবহাওয়া আপডেট এবং ফসলের যত্নের অন্তর্দৃষ্টি।",
  },
  featureVoiceTitle: {
    en: "Voice + Chat Assist",
    hi: "आवाज़ और चैट सहायता",
    mr: "आवाज + चॅट सहाय्य",
    pa: "ਵੌਇਸ + ਚੈਟ ਸਹਾਇਤਾ",
    ta: "குரல் + அரட்டை உதவி",
    te: "వాయిస్ + చాట్ అసిస్ట్",
    bn: "ভয়েস + চ্যাট সহায়তা",
  },
  featureVoiceDescription: {
    en: "Farmers can speak or type in Marathi, Hindi, or English anytime.",
    hi: "किसान कभी भी मराठी, हिंदी या अंग्रेज़ी में बोल या टाइप कर सकते हैं।",
    mr: "शेतकरी कोणत्याही वेळी मराठी, हिंदी किंवा इंग्रजीत बोलू अथवा लिहू शकतात.",
    pa: "ਕਿਸਾਨ ਕਿਸੇ ਵੀ ਸਮੇਂ ਮਰਾਠੀ, ਹਿੰਦੀ ਜਾਂ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਬੋਲ ਸਕਦੇ ਹਨ ਜਾਂ ਟਾਈਪ ਕਰ ਸਕਦੇ ਹਨ।",
    ta: "விவசாயிகள் எந்த நேரத்திலும் மராத்தி, இந்தி அல்லது ஆங்கிலத்தில் பேசலாம் அல்லது தட்டச்சு செய்யலாம்.",
    te: "రైతులు ఎప్పుడైనా మరాఠీ, హిందీ లేదా ఇంగ్లీష్‌లో మాట్లాడవచ్చు లేదా టైప్ చేయవచ్చు.",
    bn: "কৃষকরা যেকোনো সময় মারাঠি, হিন্দি বা ইংরেজিতে কথা বলতে বা টাইপ করতে পারেন।",
  },
  activationTitle: {
    en: "Activate Live Voice Assistant",
    hi: "Live Voice Assistant सक्रिय करें",
    mr: "Live Voice Assistant सक्रिय करा",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਸਰਗਰਮ ਕਰੋ",
    ta: "நேரடி குரல் உதவியாளரை செயல்படுத்தவும்",
    te: "లైవ్ వాయిస్ అసిస్టెంట్‌ను సక్రియం చేయండి",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট সক্রিয় করুন",
  },
  activationTag: {
    en: "Farmer-first conversational support",
    hi: "किसान-केंद्रित संवाद सहायता",
    mr: "शेतकरी-केंद्रित संवाद सहाय्य",
    pa: "ਕਿਸਾਨ-ਪਹਿਲਾਂ ਸੰਵਾਦ ਸਹਾਇਤਾ",
    ta: "விவசாயி-முதல் உரையாடல் ஆதரவு",
    te: "రైతు-మొదటి సంభాషణ మద్దతు",
    bn: "কৃষক-প্রথম কথোপকথন সহায়তা",
  },
  activationDescription: {
    en: "Launch a multilingual assistant that greets farmers naturally and guides them through schemes, credit, soil health, weather, and crop care using verified datasets.",
    hi: "एक बहुभाषी सहायक शुरू करें जो किसानों का स्वाभाविक स्वागत करे और योजनाओं, ऋण, मिट्टी, मौसम और फसल देखभाल में मार्गदर्शन दे।",
    mr: "बहुभाषिक सहाय्यक सक्रिय करा जो शेतकऱ्यांना योजना, कर्ज, माती, हवामान आणि पीक व्यवस्थापनासाठी मार्गदर्शन करतो.",
    pa: "ਇੱਕ ਬਹੁਭਾਸ਼ੀ ਸਹਾਇਕ ਲਾਂਚ ਕਰੋ ਜੋ ਕਿਸਾਨਾਂ ਦਾ ਸੁਭਾਵਿਕ ਤੌਰ 'ਤੇ ਸਵਾਗਤ ਕਰਦਾ ਹੈ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਡੇਟਾਸੈੱਟਾਂ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਯੋਜਨਾਵਾਂ, ਕਰਜ਼ੇ, ਮਿੱਟੀ ਦੀ ਸਿਹਤ, ਮੌਸਮ ਅਤੇ ਫਸਲ ਦੇਖਭਾਲ ਵਿੱਚ ਮਾਰਗਦਰਸ਼ਨ ਕਰਦਾ ਹੈ।",
    ta: "விவசாயிகளை இயற்கையாக வரவேற்கும் மற்றும் சரிபார்க்கப்பட்ட தரவுத்தொகுப்புகளைப் பயன்படுத்தி திட்டங்கள், கடன், மண் ஆரோக்கியம், வானிலை மற்றும் பயிர் பராமரிப்பு வழியாக வழிநடத்தும் பலமொழி உதவியாளரைத் தொடங்கவும்.",
    te: "రైతులను సహజంగా స్వాగతించే మరియు ధృవీకరించిన డేటాసెట్‌లను ఉపయోగించి పథకాలు, రుణం, నేల ఆరోగ్యం, వాతావరణం మరియు పంట సంరక్షణ ద్వారా మార్గనిర్దేశం చేసే బహుభాషా అసిస్టెంట్‌ను ప్రారంభించండి.",
    bn: "একটি বহুভাষিক সহায়ক চালু করুন যা কৃষকদের স্বাভাবিকভাবে স্বাগত জানায় এবং যাচাইকৃত ডেটাসেট ব্যবহার করে প্রকল্প, ঋণ, মাটি স্বাস্থ্য, আবহাওয়া এবং ফসলের যত্নের মাধ্যমে তাদের নির্দেশনা দেয়।",
  },
  activationBulletOne: {
    en: "Hands-free voice questions with automatic speech replies for field situations.",
    hi: "हाथों से मुक्त आवाज़ इनपुट और स्वचालित उत्तर जिससे खेत में भी सलाह मिले।",
    mr: "हँड्स-फ्री आवाज प्रश्न आणि स्वयंचलित उत्तर, शेतातही सल्ला उपलब्ध.",
    pa: "ਖੇਤ ਦੀਆਂ ਸਥਿਤੀਆਂ ਲਈ ਸਵੈਚਾਲਿਤ ਬੋਲਣ ਵਾਲੇ ਜਵਾਬਾਂ ਦੇ ਨਾਲ ਹੈਂਡਸ-ਫ੍ਰੀ ਵੌਇਸ ਸਵਾਲ।",
    ta: "கள சூழ்நிலைகளுக்கான தானியங்கி பேச்சு பதில்களுடன் கைகளில்லா குரல் கேள்விகள்.",
    te: "క్షేత్ర పరిస్థితుల కోసం స్వయంచాలక ప్రసంగ సమాధానాలతో హ్యాండ్స్-ఫ్రీ వాయిస్ ప్రశ్నలు.",
    bn: "ক্ষেত্রের পরিস্থিতির জন্য স্বয়ংক্রিয় বক্তৃতা উত্তর সহ হ্যান্ডস-ফ্রি ভয়েস প্রশ্ন।",
  },
  activationBulletTwo: {
    en: "Clarifying prompts before the final plan so every recommendation fits the farm.",
    hi: "अंतिम सुझाव से पहले स्पष्टीकरण पूछे जाते हैं ताकि सलाह खेत के अनुरूप हो।",
    mr: "अंतिम सल्ल्यापूर्वी स्पष्ट करणारे प्रश्न, जेणेकरून सुचना शेताशी जुळतील.",
    pa: "ਅੰਤਿਮ ਯੋਜਨਾ ਤੋਂ ਪਹਿਲਾਂ ਸਪੱਸ਼ਟੀਕਰਨ ਪ੍ਰੋਮਪਟਸ ਤਾਂ ਜੋ ਹਰ ਸਿਫਾਰਸ਼ ਖੇਤ ਨਾਲ ਮੇਲ ਖਾਂਦੀ ਹੋਵੇ।",
    ta: "இறுதி திட்டத்திற்கு முன் தெளிவுபடுத்தும் கேள்விகள், இதனால் ஒவ்வொரு பரிந்துரையும் பண்ணைக்கு பொருந்தும்.",
    te: "చివరి ప్రణాళికకు ముందు స్పష్టీకరణ ప్రాంప్ట్‌లు తద్వారా ప్రతి సిఫార్సు పొలానికి సరిపోతుంది.",
    bn: "চূড়ান্ত পরিকল্পনার আগে স্পষ্টীকরণ প্রম্পট যাতে প্রতিটি সুপারিশ খামারের সাথে মানানসই হয়।",
  },
  activationBulletThree: {
    en: "Trusted answers grounded in Maharashtra schemes, NABARD, PM-KISAN, and IMD data.",
    hi: "विश्वसनीय उत्तर जो महाराष्ट्र योजनाओं, NABARD, PM-KISAN और IMD डेटा पर आधारित हैं।",
    mr: "महाराष्ट्र योजना, NABARD, PM-KISAN आणि IMD डेटावर आधारित विश्वासार्ह माहिती.",
    pa: "ਮਹਾਰਾਸ਼ਟਰ ਯੋਜਨਾਵਾਂ, NABARD, PM-KISAN, ਅਤੇ IMD ਡੇਟਾ 'ਤੇ ਅਧਾਰਿਤ ਭਰੋਸੇਮੰਦ ਜਵਾਬ।",
    ta: "மகாராஷ்டிரா திட்டங்கள், NABARD, PM-KISAN மற்றும் IMD தரவுகளின் அடிப்படையில் நம்பகமான பதில்கள்.",
    te: "మహారాష్ట్ర పథకాలు, NABARD, PM-KISAN మరియు IMD డేటా ఆధారంగా విశ్వసనీయమైన సమాధానాలు.",
    bn: "মহারাষ্ট্রের প্রকল্প, NABARD, PM-KISAN এবং IMD ডেটার উপর ভিত্তি করে বিশ্বস্ত উত্তর।",
  },
  activationButton: {
    en: "Activate Live Voice Assistant",
    hi: "Live Voice Assistant सक्रिय करें",
    mr: "Live Voice Assistant सक्रिय करा",
    pa: "ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਸਰਗਰਮ ਕਰੋ",
    ta: "நேரடி குரல் உதவியாளரை செயல்படுத்தவும்",
    te: "లైవ్ వాయిస్ అసిస్టెంట్‌ను సక్రియం చేయండి",
    bn: "লাইভ ভয়েস অ্যাসিস্ট্যান্ট সক্রিয় করুন",
  },
  whatHappensTitle: {
    en: "What happens after activation?",
    hi: "सक्रिय करने के बाद क्या होगा?",
    mr: "सक्रिय केल्यावर काय घडते?",
    pa: "ਸਰਗਰਮੀ ਤੋਂ ਬਾਅਦ ਕੀ ਹੁੰਦਾ ਹੈ?",
    ta: "செயல்படுத்திய பிறகு என்ன நடக்கும்?",
    te: "సక్రియం తర్వాత ఏమి జరుగుతుంది?",
    bn: "সক্রিয় করার পর কী হবে?",
  },
  whatHappensIntro: {
    en: "• Smart greeting in Marathi, Hindi, or English based on farmer preference and time of day.",
    hi: "• किसान की पसंद और समय के अनुसार मराठी, हिंदी या अंग्रेज़ी में अभिवादन।",
    mr: "• शेतकऱ्यांच्या पसंती आणि वेळेनुसार मराठी, हिंदी किंवा इंग्रजीत स्वागत.",
    pa: "• ਕਿਸਾਨ ਦੀ ਪਸੰਦ ਅਤੇ ਦਿਨ ਦੇ ਸਮੇਂ ਦੇ ਅਧਾਰ 'ਤੇ ਮਰਾਠੀ, ਹਿੰਦੀ ਜਾਂ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਸਮਾਰਟ ਸਵਾਗਤ।",
    ta: "• விவசாயியின் விருப்பம் மற்றும் நாளின் நேரத்தின் அடிப்படையில் மராத்தி, இந்தி அல்லது ஆங்கிலத்தில் புத்திசாலித்தனமான வாழ்த்து.",
    te: "• రైతు ప్రాధాన్యత మరియు రోజు సమయం ఆధారంగా మరాఠీ, హిందీ లేదా ఇంగ్లీష్‌లో స్మార్ట్ గ్రీటింగ్.",
    bn: "• কৃষকের পছন্দ এবং দিনের সময়ের উপর ভিত্তি করে মারাঠি, হিন্দি বা ইংরেজিতে স্মার্ট অভিবাদন।",
  },
  whatHappensBulletOne: {
    en: "• Live chat timeline with voice playback, clarifying questions, and suggested follow-ups.",
    hi: "• वॉइस प्लेबैक, स्पष्ट सवाल और सुझाए गए फॉलो-अप के साथ लाइव चैट।",
    mr: "• आवाज प्लेबॅक, स्पष्ट करणारे प्रश्न आणि अनुशंसित पुढील प्रश्नांसह लाईव्ह चॅट.",
    pa: "• ਵੌਇਸ ਪਲੇਬੈਕ, ਸਪੱਸ਼ਟੀਕਰਨ ਪ੍ਰਸ਼ਨ ਅਤੇ ਸੁਝਾਏ ਗਏ ਫਾਲੋ-ਅਪਸ ਦੇ ਨਾਲ ਲਾਈਵ ਚੈਟ ਟਾਈਮਲਾਈਨ।",
    ta: "• குரல் இயக்கத்துடன் நேரடி அரட்டை காலக்கோடு, தெளிவுபடுத்தும் கேள்விகள் மற்றும் பரிந்துரைக்கப்பட்ட தொடர்ந்த கேள்விகள்.",
    te: "• వాయిస్ ప్లేబ్యాక్, స్పష్టీకరణ ప్రశ్నలు మరియు సూచించిన ఫాలో-అప్‌లతో లైవ్ చాట్ టైమ్‌లైన్.",
    bn: "• ভয়েস প্লেব্যাক, স্পষ্টীকরণ প্রশ্ন এবং প্রস্তাবিত ফলো-আপ সহ লাইভ চ্যাট টাইমলাইন।",
  },
  whatHappensBulletTwo: {
    en: "• Dedicated panel showing verified government references and advisory sources for every answer.",
    hi: "• प्रत्येक उत्तर के लिए सत्यापित सरकारी संदर्भ और सलाह स्रोत दिखाने वाला पैनल।",
    mr: "• प्रत्येक उत्तरासाठी प्रमाणित सरकारी संदर्भ दाखवणारा स्वतंत्र पॅनेल.",
    pa: "• ਹਰ ਜਵਾਬ ਲਈ ਪ੍ਰਮਾਣਿਤ ਸਰਕਾਰੀ ਹਵਾਲੇ ਅਤੇ ਸਲਾਹਕਾਰ ਸਰੋਤਾਂ ਨੂੰ ਦਿਖਾਉਣ ਵਾਲਾ ਸਮਰਪਿਤ ਪੈਨਲ।",
    ta: "• ஒவ்வொரு பதிலுக்கும் சரிபார்க்கப்பட்ட அரசு குறிப்புகள் மற்றும் ஆலோசனை ஆதாரங்களைக் காட்டும் அர்ப்பணிக்கப்பட்ட பேனல்.",
    te: "• ప్రతి సమాధానం కోసం ధృవీకరించిన ప్రభుత్వ సూచనలు మరియు సలహా మూలాలను చూపించే ప్రత్యేక ప్యానెల్.",
    bn: "• প্রতিটি উত্তরের জন্য যাচাইকৃত সরকারী রেফারেন্স এবং পরামর্শদাতা উৎস দেখানো একটি নিবেদিত প্যানেল।",
  },
  whatHappensBulletThree: {
    en: "• Pro tip: Set the preferred language first. Live Voice Assistant will remember it throughout the session.",
    hi: "• सुझाव: पहले भाषा चुनें. Live Voice Assistant पूरे सत्र में उसी भाषा में उत्तर देगा।",
    mr: "• टिप: आधी पसंतीची भाषा निवडा. Live Voice Assistant संपूर्ण संवादात त्याच भाषेत उत्तर देईल.",
    pa: "• ਪ੍ਰੋ ਟਿਪ: ਪਹਿਲਾਂ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਸੈੱਟ ਕਰੋ। ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਸੈਸ਼ਨ ਦੌਰਾਨ ਇਸਨੂੰ ਯਾਦ ਰੱਖੇਗਾ।",
    ta: "• தொழில்முறை உதவிக்குறிப்பு: முதலில் விருப்பமான மொழியை அமைக்கவும். நேரடி குரல் உதவியாளர் அமர்வு முழுவதும் அதை நினைவில் வைத்திருக்கும்.",
    te: "• ప్రో టిప్: మొదట ప్రాధాన్య భాషను సెట్ చేయండి. లైవ్ వాయిస్ అసిస్టెంట్ సెషన్ అంతటా దాన్ని గుర్తుంచుకుంటుంది.",
    bn: "• প্রো টিপ: প্রথমে পছন্দের ভাষা সেট করুন। লাইভ ভয়েস অ্যাসিস্ট্যান্ট সেশনের পুরো সময় এটি মনে রাখবে।",
  },
  proTip: {
    en: "Set the preferred language first. Live Voice Assistant will remember it and respond in the same language throughout the session.",
    hi: "सबसे पहले पसंदीदा भाषा चुनें. Live Voice Assistant पूरी बातचीत में उसी भाषा में जवाब देगा.",
    mr: "प्रथम पसंतीची भाषा निवडा. Live Voice Assistant संपूर्ण संवादात त्याच भाषेत उत्तर देईल.",
    pa: "ਪਹਿਲਾਂ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਸੈੱਟ ਕਰੋ। ਲਾਈਵ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਇਸਨੂੰ ਯਾਦ ਰੱਖੇਗਾ ਅਤੇ ਸੈਸ਼ਨ ਦੌਰਾਨ ਉਸੇ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਦੇਵੇਗਾ।",
    ta: "முதலில் விருப்பமான மொழியை அமைக்கவும். நேரடி குரல் உதவியாளர் அதை நினைவில் வைத்திருக்கும் மற்றும் அமர்வு முழுவதும் அதே மொழியில் பதிலளிக்கும்.",
    te: "మొదట ప్రాధాన్య భాషను సెట్ చేయండి. లైవ్ వాయిస్ అసిస్టెంట్ దాన్ని గుర్తుంచుకుంటుంది మరియు సెషన్ అంతటా అదే భాషలో సమాధానం ఇస్తుంది.",
    bn: "প্রথমে পছন্দের ভাষা সেট করুন। লাইভ ভয়েস অ্যাসিস্ট্যান্ট এটি মনে রাখবে এবং সেশনের পুরো সময় একই ভাষায় উত্তর দেবে।",
  },
  voiceModeLabel: {
    en: "Voice mode",
    hi: "वॉइस मोड",
    mr: "व्हॉईस मोड",
    pa: "ਵੌਇਸ ਮੋਡ",
    ta: "குரல் முறை",
    te: "వాయిస్ మోడ్",
    bn: "ভয়েস মোড",
  },
  voiceModeDescription: {
    en: "Switch between spoken responses and text-only guidance whenever you need.",
    hi: "आवश्यकतानुसार बोलकर जवाब और केवल-पाठ मार्गदर्शन के बीच स्विच करें।",
    mr: "आवश्यकतेनुसार बोलून उत्तर आणि केवळ मजकूर मार्गदर्शन यामध्ये बदला.",
    pa: "ਜਦੋਂ ਵੀ ਤੁਹਾਨੂੰ ਲੋੜ ਹੋਵੇ, ਬੋਲਣ ਵਾਲੇ ਜਵਾਬਾਂ ਅਤੇ ਸਿਰਫ-ਟੈਕਸਟ ਮਾਰਗਦਰਸ਼ਨ ਵਿਚਕਾਰ ਬਦਲੋ।",
    ta: "நீங்கள் தேவைப்படும்போது பேசும் பதில்கள் மற்றும் உரை-மட்டும் வழிகாட்டுதலுக்கு இடையில் மாறவும்.",
    te: "మీకు అవసరమైనప్పుడు మాట్లాడే సమాధానాలు మరియు టెక్స్ట్-మాత్రమే మార్గదర్శకత్వం మధ్య మారండి.",
    bn: "আপনার প্রয়োজন হলে কথ্য উত্তর এবং শুধুমাত্র পাঠ্য নির্দেশনার মধ্যে স্যুইচ করুন।",
  },
};

const HTML_CONTENT_PATTERN = /<(ul|ol|li|p|br|strong|em|b|i|u|span|a|h[1-6])[\s>]/i;

const ALLOWED_HTML_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
]);

const renderHtmlNodes = (nodes: ChildNode[], keyPrefix: string): React.ReactNode[] => {
  const results: React.ReactNode[] = [];

  nodes.forEach((node, index) => {
    const rendered = renderHtmlNode(node, `${keyPrefix}-${index}`);

    if (Array.isArray(rendered)) {
      results.push(...rendered);
    } else if (rendered !== null && rendered !== undefined) {
      results.push(rendered);
    }
  });

  return results;
};

const renderHtmlNode = (node: ChildNode, key: string): React.ReactNode | React.ReactNode[] | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    const textContent = node.textContent;
    if (!textContent || textContent.trim().length === 0) {
      return null;
    }
    return textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  if (!ALLOWED_HTML_TAGS.has(tagName)) {
    return renderHtmlNodes(Array.from(element.childNodes), key);
  }

  const children = renderHtmlNodes(Array.from(element.childNodes), `${key}-child`);

  switch (tagName) {
    case "ul":
      return (
        <ul key={key} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {children}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {children}
        </ol>
      );
    case "li":
      return <li key={key}>{children}</li>;
    case "p":
      return (
        <p key={key} className="text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      );
    case "a": {
      const href = element.getAttribute("href") || "";
      const isSafeLink = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={isSafeLink ? href : undefined}
          target={isSafeLink ? "_blank" : undefined}
          rel={isSafeLink ? "noreferrer noopener" : undefined}
          className="text-sm text-primary underline"
        >
          {children}
        </a>
      );
    }
    case "strong":
    case "b":
      return (
        <strong key={key} className="font-semibold">
          {children}
        </strong>
      );
    case "em":
    case "i":
      return (
        <em key={key} className="italic">
          {children}
        </em>
      );
    case "u":
      return (
        <u key={key} className="underline">
          {children}
        </u>
      );
    case "br":
      return <br key={key} />;
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return (
        <p key={key} className="text-sm font-semibold leading-relaxed text-muted-foreground">
          {children}
        </p>
      );
    default:
      return (
        <React.Fragment key={key}>
          {children}
        </React.Fragment>
      );
  }
};

const parseHtmlAnswer = (text: string): React.ReactNode[] => {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return [];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return renderHtmlNodes(Array.from(doc.body.childNodes), "html");
  } catch {
    return [];
  }
};

const renderAnswerText = (text: string) => {
  const trimmedText = text.trim();

  if (HTML_CONTENT_PATTERN.test(trimmedText)) {
    const htmlNodes = parseHtmlAnswer(trimmedText);
    if (htmlNodes.length > 0) {
      return htmlNodes;
    }
  }

  return trimmedText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block, index) => {
      const lines = block.split("\n").filter((line) => line.trim().length > 0);
      const isList = lines.every((line) => /^[-•]/.test(line.trim()));

      if (isList) {
        return (
          <ul key={`${block}-${index}`} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {lines.map((line, itemIndex) => (
              <li key={`${line}-${itemIndex}`}>{line.replace(/^[-•]+\s*/, "")}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={`${block}-${index}`} className="text-sm leading-relaxed text-muted-foreground">
          {block}
        </p>
      );
    });
};

/**
 * Enhanced language detection with improved accuracy using:
 * 1. Script analysis (Devanagari detection)
 * 2. Contextual keyword matching with scoring
 * 3. Character frequency analysis
 * 4. Fallback to user preference
 */
const detectInputLanguage = (value: string, preferredLanguage?: LanguageCode): LanguageCode => {
  if (!value || value.trim().length === 0) {
    return preferredLanguage || "en";
  }

  const trimmedValue = value.trim();
  
  // Check for Devanagari script
  if (DEVANAGARI_REGEX.test(trimmedValue)) {
    // Score-based detection for better accuracy
    let marathiScore = 0;
    let hindiScore = 0;
    
    // Count keyword matches (more matches = higher confidence)
    const marathiMatches = trimmedValue.match(MARATHI_HINT_REGEX);
    const hindiMatches = trimmedValue.match(HINDI_HINT_REGEX);
    
    if (marathiMatches) {
      marathiScore += marathiMatches.length * 2; // Weight matches
    }
    if (hindiMatches) {
      hindiScore += hindiMatches.length * 2;
    }
    
    // Character frequency analysis (Marathi-specific characters)
    // Marathi uses some unique characters like ॲ, ऑ, ळ, ऱ्
    const marathiSpecificChars = /[ॲऑळऱ्]/g;
    const marathiCharMatches = trimmedValue.match(marathiSpecificChars);
    if (marathiCharMatches) {
      marathiScore += marathiCharMatches.length * 1.5;
    }
    
    // Hindi-specific characters and patterns
    const hindiSpecificPatterns = /(क्या|है|हो|गया|आया|किया|दिया|लिया)/g;
    const hindiPatternMatches = trimmedValue.match(hindiSpecificPatterns);
    if (hindiPatternMatches) {
      hindiScore += hindiPatternMatches.length * 1.5;
    }
    
    // Length-based confidence (longer text = more reliable)
    const textLength = trimmedValue.length;
    const lengthMultiplier = Math.min(textLength / 50, 1.5); // Cap at 1.5x
    
    marathiScore *= lengthMultiplier;
    hindiScore *= lengthMultiplier;
    
    // Determine language based on scores
    if (marathiScore > hindiScore && marathiScore > 1) {
      return "mr";
    }
    if (hindiScore > marathiScore && hindiScore > 1) {
      return "hi";
    }
    
    // If scores are equal or low, use preferred language or default to Marathi
    // (since this is Maharashtra-focused)
    return preferredLanguage === "hi" ? "hi" : "mr";
  }

  // For non-Devanagari text, check for English patterns
  // If it contains mostly English characters, return English
  const englishPattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
  if (englishPattern.test(trimmedValue) || trimmedValue.length > 0) {
    return preferredLanguage || "en";
  }

  // Fallback to preferred language or English
  return preferredLanguage || "en";
};

const mapLanguageToLocale = (code: string): string => {
  switch (code) {
    case "mr":
      return "mr-IN";
    case "hi":
      return "hi-IN";
    default:
      return "en-IN";
  }
};

const stripMarkup = (input: string) =>
  input
    .replace(/\*\*/g, "")
    .replace(/[_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const FarmerHelpDesk = () => {
  const { t, language, setLanguage, getLanguageName } = useLanguage();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [activationSequence, setActivationSequence] = useState(0);
  const [assistantHistory, setAssistantHistory] = useState<FarmerAssistMessage[]>([]);
  const [assistantResponses, setAssistantResponses] = useState<AiAssistExchange[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<LanguageCode>(language);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoListen, setAutoListen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listeningSupported, setListeningSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [latestReferences, setLatestReferences] = useState<AiAssistReference[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [animatedMessages, setAnimatedMessages] = useState<Record<string, AnimatedMessageState>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mutedMessageIds, setMutedMessageIds] = useState<Set<string>>(new Set());
  const [micManuallyOpened, setMicManuallyOpened] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const pauseTimeoutRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const greetingSpokenRef = useRef<string | null>(null);
  const lastGreetedActivationRef = useRef<number | null>(null);
  const activationLanguageRef = useRef<LanguageCode>("en");
  const pendingSpeechSubmitRef = useRef(false);
  const animationIntervalsRef = useRef<Record<string, number>>({});
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const handleSubmitQuestionRef = useRef<((event?: React.FormEvent<HTMLFormElement>, questionOverride?: string) => Promise<void>) | null>(
    null,
  );
  const animatedMessageIdsRef = useRef<Set<string>>(new Set());
  const lastAutoResumeMessageIdRef = useRef<string | null>(null);
  const detectedLanguageSourceRef = useRef<"initial" | "manual" | "input" | "voice" | "response">("initial");
  const userInteractedRef = useRef(false);
  const processedResultIndexRef = useRef(0); // Track which recognition results we've already processed

  const languageOptions = useMemo<Array<{ code: LanguageCode; label: string }>>(
    () => [
      { code: "mr", label: "मराठी" },
      { code: "hi", label: "हिंदी" },
      { code: "en", label: "English" },
    ],
    [],
  );

  const selectedLanguageValue = useMemo<LanguageCode>(
    () => languageOptions.find((option) => option.code === language)?.code ?? "mr",
    [language, languageOptions],
  );

  const updateDetectedLanguage = useCallback(
    (value: LanguageCode, source: "manual" | "input" | "voice" | "response" = "input") => {
      detectedLanguageSourceRef.current = source;
      setDetectedLanguage(value);
    },
    [setDetectedLanguage],
  );

  /**
   * Enhanced voice selection with better language matching and natural voice preferences
   * Prioritizes native voices for each language with fallback strategies
   */
  const selectVoiceForLanguage = useCallback(
    (languageCode: LanguageCode): SpeechSynthesisVoice | null => {
      if (availableVoices.length === 0) {
        return null;
      }

      const locale = mapLanguageToLocale(languageCode).toLowerCase();
      const base = locale.split("-")[0];

      // Enhanced preference map with more specific voice matching
      const preferenceMap: Partial<Record<LanguageCode, string[]>> = {
        mr: [
          locale,           // mr-IN (exact match)
          "mr",            // Marathi (any variant)
          "hi-in",         // Hindi-India (closest Devanagari script)
          "hi",            // Hindi (any variant)
          "en-in",         // English-India (fallback)
          "en",            // English (final fallback)
        ],
        hi: [
          locale,          // hi-IN (exact match)
          "hi",            // Hindi (any variant)
          "mr-in",         // Marathi-India (closest Devanagari script)
          "mr",            // Marathi (any variant)
          "en-in",         // English-India (fallback)
          "en",            // English (final fallback)
        ],
        en: [
          "en-in",         // English-India (preferred for Indian context)
          "en-us",         // English-US
          "en-gb",         // English-UK
          "en",            // English (any variant)
        ],
      };

      const preferences = preferenceMap[languageCode] ?? preferenceMap.en ?? ["en"];

      // First pass: exact locale match
      for (const tag of preferences) {
        const match = availableVoices.find((voice) => 
          voice.lang.toLowerCase() === tag.toLowerCase()
        );
        if (match) {
          return match;
        }
      }

      // Second pass: language code match (e.g., "mr" matches "mr-IN", "mr-MX", etc.)
      for (const tag of preferences) {
        const normalized = tag.includes("-") ? tag.split("-")[0] : tag;
        const match = availableVoices.find((voice) => 
          voice.lang.toLowerCase().startsWith(normalized.toLowerCase() + "-") ||
          voice.lang.toLowerCase() === normalized.toLowerCase()
        );
        if (match) {
          return match;
        }
      }

      // Third pass: partial match (fallback)
      for (const tag of preferences) {
        const normalized = tag.includes("-") ? tag.split("-")[0] : tag;
        const match = availableVoices.find((voice) => 
          voice.lang.toLowerCase().includes(normalized.toLowerCase())
        );
        if (match) {
          return match;
        }
      }

      // Final fallback: return first available voice
      return availableVoices[0] ?? null;
    },
    [availableVoices],
  );

  const resumeAutoListening = useCallback(
    (force = false, onError?: (error: unknown) => void) => {
      if ((!autoListen && !force) || !listeningSupported || !recognitionRef.current) {
        return false;
      }

      try {
        // Set appropriate mode based on whether mic is manually opened
        recognitionRef.current.continuous = force ? true : false; // Continuous for manual, single for auto
        recognitionRef.current.interimResults = force ? true : false; // Interim results for manual mode
        recognitionRef.current.lang = mapLanguageToLocale(detectedLanguage);
        recognitionRef.current.start();
        setIsListening(true);
        pendingSpeechSubmitRef.current = false;
        setVoiceError(null);
        setInterimTranscript("");
        processedResultIndexRef.current = 0; // Reset processed index when recognition starts
        return true;
      } catch (error) {
        setIsListening(false);
        onError?.(error);
        return false;
      }
    },
    [autoListen, detectedLanguage, listeningSupported],
  );

  const chatTimeline = useMemo<ChatTimelineMessage[]>(() => {
    const timeline: ChatTimelineMessage[] = [];

    assistantResponses.forEach((exchange) => {
      if (exchange.question.trim().length > 0) {
        timeline.push({
          id: `${exchange.id}-question`,
          exchangeId: exchange.id,
          role: "farmer",
          content: exchange.question,
          detectedLanguage: exchange.detectedLanguage as LanguageCode,
        });
      }

      timeline.push({
        id: `${exchange.id}-answer`,
        exchangeId: exchange.id,
        role: "assistant",
        content: exchange.answer,
        detectedLanguage: exchange.detectedLanguage as LanguageCode,
        followUps: exchange.followUps,
        clarifyingQuestions: exchange.clarifyingQuestions,
        sources: exchange.sources,
        safetyMessage: exchange.safetyMessage ?? null,
        isGreeting: exchange.isGreeting,
      });
    });

    return timeline;
  }, [assistantResponses]);

  const latestAssistantMessage = useMemo(() => {
    return [...chatTimeline].reverse().find((message) => message.role === "assistant");
  }, [chatTimeline]);

  const isLatestAssistantAnimating = useMemo(() => {
    if (!latestAssistantMessage) {
      return false;
    }
    const state = animatedMessages[latestAssistantMessage.id];
    return Boolean(state && !state.isComplete);
  }, [animatedMessages, latestAssistantMessage]);

  const liveStatus = useMemo<"idle" | "thinking" | "typing" | "speaking" | "listening">(() => {
    if (isLoading) {
      return "thinking";
    }
    if (isSpeaking) {
      return "speaking";
    }
    if (isLatestAssistantAnimating) {
      return "typing";
    }
    if (isListening) {
      return "listening";
    }
    return "idle";
  }, [isLatestAssistantAnimating, isListening, isLoading, isSpeaking]);

  const liveStatusLabel = useMemo(() => {
    switch (liveStatus) {
      case "thinking":
        return t(helpDeskText.thinkingMessage);
      case "typing":
        return t(helpDeskText.typingMessage);
      case "speaking":
        return t(helpDeskText.speakingMessage);
      case "listening":
        return t(helpDeskText.listening);
      default:
        return null;
    }
  }, [liveStatus, t]);

  const liveStatusIcon = useMemo<React.ReactNode>(() => {
    switch (liveStatus) {
      case "thinking":
        return <Loader2 className="h-4 w-4 animate-spin text-amber-600" />;
      case "typing":
        return <Sparkles className="h-4 w-4 animate-pulse text-amber-600" />;
      case "speaking":
        return <Volume2 className="h-4 w-4 animate-pulse text-amber-600" />;
      case "listening":
        return (
          <div className="relative inline-flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <Mic className="relative h-3 w-3 text-emerald-600" />
          </div>
        );
      default:
        return null;
    }
  }, [liveStatus]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("speechSynthesis" in window) {
      setSpeechSupported(true);
    }

    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;

    if (!SpeechRecognitionCtor) {
      setVoiceError(t(helpDeskText.voiceUnsupported));
      return;
    }

    try {
      const recognitionInstance = new SpeechRecognitionCtor();
      // Use continuous mode when mic is manually opened for better control
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true; // Enable interim results for real-time feedback
      recognitionInstance.lang = mapLanguageToLocale(detectedLanguage);
      
      const PAUSE_DURATION_MS = 2000; // Wait 2 seconds of silence before processing
      
      recognitionInstance.onresult = (event: SpeechRecognitionEventLike) => {
        const results = Array.from(event.results);
        let finalTranscript = "";
        let interimTranscript = "";

        // Only process NEW results that we haven't seen before
        // This prevents duplicate text from being added when continuous recognition fires multiple times
        for (let i = processedResultIndexRef.current; i < results.length; i++) {
          const transcript = results[i][0]?.transcript ?? "";
          if (results[i].isFinal) {
            finalTranscript += transcript + " ";
            // Update processed index to skip this result next time
            processedResultIndexRef.current = i + 1;
          } else {
            // Only use the LAST interim result (most recent)
            if (i === results.length - 1) {
              interimTranscript = transcript;
            }
          }
        }

        finalTranscript = finalTranscript.trim();
        interimTranscript = interimTranscript.trim();

        // Update interim transcript for real-time display (only if we have new interim text)
        if (interimTranscript) {
          setInterimTranscript(interimTranscript);
          lastSpeechTimeRef.current = Date.now();
          
          // Clear any existing pause timeout
          if (pauseTimeoutRef.current) {
            window.clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
          }
        } else if (finalTranscript.length === 0) {
          // Clear interim if we don't have any interim or final results
          setInterimTranscript("");
        }

        // If we have final results, append them to the question (don't auto-submit)
        if (finalTranscript.length > 0 && !isProcessingVoice) {
          // Stop speech synthesis when user speaks
          if (typeof window !== "undefined" && window.speechSynthesis) {
            currentUtteranceRef.current = null;
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
          
          // Clear pause timeout
          if (pauseTimeoutRef.current) {
            window.clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
          }
          
          const detected = detectInputLanguage(finalTranscript, detectedLanguage);
          
          // Append final transcript to existing question (add space if needed)
          // Only append if it's not already in the question to prevent duplicates
          setQuestion((prev) => {
            const trimmedPrev = prev.trim();
            const trimmedFinal = finalTranscript.trim();
            if (!trimmedPrev) {
              return trimmedFinal;
            }
            // Check if the final transcript is already at the end of the question
            if (trimmedPrev.endsWith(trimmedFinal)) {
              return trimmedPrev; // Don't duplicate
            }
            // Add space between existing content and new content
            return `${trimmedPrev} ${trimmedFinal}`;
          });
          
          updateDetectedLanguage(detected, "voice");
          setInterimTranscript(""); // Clear interim since we got final
          
          // Keep mic open - don't stop recognition or submit
          // Mic stays active for continuous input
        }
      };
      
      recognitionInstance.onerror = (event: { error?: string }) => {
        const errorType = event.error;
        
        // Handle different error types with appropriate responses
        switch (errorType) {
          case "no-speech":
            // This is normal - user hasn't spoken yet, keep listening
            return;
          case "aborted":
            // Recognition was manually stopped, don't show error
            return;
          case "audio-capture":
            // Microphone not available or permission denied
            setIsListening(false);
            setMicManuallyOpened(false);
            setVoiceError(t(helpDeskText.voiceUnsupported) || "Microphone not available. Please check permissions.");
            setInterimTranscript("");
            pendingSpeechSubmitRef.current = false;
            break;
          case "network":
            // Network error
            setIsListening(false);
            setVoiceError("Network error. Please check your connection.");
            setInterimTranscript("");
            pendingSpeechSubmitRef.current = false;
            break;
          case "not-allowed":
            // Permission denied
            setIsListening(false);
            setMicManuallyOpened(false);
            setVoiceError("Microphone permission denied. Please allow microphone access.");
            setInterimTranscript("");
            pendingSpeechSubmitRef.current = false;
            break;
          case "service-not-allowed":
            // Service not allowed
            setIsListening(false);
            setMicManuallyOpened(false);
            setVoiceError(t(helpDeskText.voiceUnsupported) || "Speech recognition service not available.");
            setInterimTranscript("");
            pendingSpeechSubmitRef.current = false;
            break;
          default:
            // Other errors - log but don't necessarily stop
            console.warn("Speech recognition error:", errorType);
            if (errorType && !["no-speech", "aborted"].includes(errorType)) {
              setIsListening(false);
              pendingSpeechSubmitRef.current = false;
              setInterimTranscript("");
              // Only show error for critical failures
              if (micManuallyOpened) {
                setVoiceError(`Recognition error: ${errorType}. Please try again.`);
              }
            }
        }
      };
      
      recognitionInstance.onend = () => {
        // Clear pause timeout
        if (pauseTimeoutRef.current) {
          window.clearTimeout(pauseTimeoutRef.current);
          pauseTimeoutRef.current = null;
        }
        
        // Only update listening state if mic was manually opened
        // (auto-resume will handle state for auto-listening mode)
        if (micManuallyOpened) {
          setIsListening(false);
          setInterimTranscript("");
          
          // Auto-resume if mic was manually opened and not processing
          if (!isProcessingVoice && recognitionRef.current) {
            // Keep mic open - restart listening after a short delay
            setTimeout(() => {
              try {
                if (recognitionRef.current && micManuallyOpened && !isProcessingVoice) {
                  recognitionRef.current.lang = mapLanguageToLocale(detectedLanguage);
                  recognitionRef.current.continuous = true;
                  recognitionRef.current.interimResults = true;
                  recognitionRef.current.start();
                  setIsListening(true);
                  setVoiceError(null); // Clear any previous errors
                  processedResultIndexRef.current = 0; // Reset processed index when recognition restarts
                }
              } catch (error) {
                // If restart fails, log but don't show error (might be temporary)
                console.warn("Failed to restart recognition:", error);
                setMicManuallyOpened(false);
                setIsListening(false);
              }
            }, 300);
          }
        } else if (!micManuallyOpened) {
          // Auto-resume only if autoListen is enabled
          setIsListening(false);
          setInterimTranscript("");
          const restarted = resumeAutoListening();
          if (!restarted) {
            pendingSpeechSubmitRef.current = false;
          }
        }
      };
      
      recognitionInstance.onaudiostart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onspeechstart = () => {
        setIsListening(true);
        lastSpeechTimeRef.current = Date.now();
      };
      
      recognitionInstance.onspeechend = () => {
        // Speech ended, but keep listening for more input
        lastSpeechTimeRef.current = Date.now();
      };

      recognitionRef.current = recognitionInstance;
      setListeningSupported(true);
      setVoiceError(null);
    } catch (error) {
      setVoiceError(error instanceof Error ? error.message : t(helpDeskText.voiceUnsupported));
    }

    return () => {
      recognitionRef.current?.stop();
      pendingSpeechSubmitRef.current = false;
    };
  }, [autoListen, detectedLanguage, listeningSupported, resumeAutoListening, t, updateDetectedLanguage]);

  useEffect(() => {
    if (!speechSupported || typeof window === "undefined" || !window.speechSynthesis) {
      console.log("[Speech Init] Speech synthesis not supported or window not available");
      return;
    }

    console.log("[Speech Init] Initializing speech synthesis...");
    
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("[Speech Init] Voices loaded:", voices.length);
      if (voices.length > 0) {
        setAvailableVoices(voices);
        console.log("[Speech Init] Available voices:", voices.map(v => ({ name: v.name, lang: v.lang })));
      } else {
        console.warn("[Speech Init] No voices available yet");
      }
    };

    // Try to get voices immediately
    updateVoices();
    
    // Some browsers need the voiceschanged event
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    
    // Also try after a delay (some browsers load voices asynchronously)
    setTimeout(updateVoices, 1000);
    
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [speechSupported]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = mapLanguageToLocale(detectedLanguage);
    }
  }, [detectedLanguage]);

  useEffect(() => {
    if (!question.trim()) {
      updateDetectedLanguage(language as LanguageCode, "manual");
    }
  }, [language, question, updateDetectedLanguage]);

  useEffect(() => {
    if (!isActivated || activationSequence === 0) {
      return;
    }
    if (lastGreetedActivationRef.current === activationSequence) {
      return;
    }

    const preferredLanguage = activationLanguageRef.current ?? "en";
    const formattedGreeting = getTimeOfDayGreeting(preferredLanguage);

    setAssistantResponses((previous) => {
      const withoutGreeting = previous.filter((entry) => !entry.isGreeting);
      const greetingEntry: AiAssistExchange = {
        id: generateId(),
        question: "",
        language: preferredLanguage,
        detectedLanguage: preferredLanguage,
        answer: formattedGreeting,
        followUps: [],
        clarifyingQuestions: [],
        sources: [],
        safetyMessage: null,
        references: [],
        isGreeting: true,
      };
      spokenIdsRef.current.delete(greetingEntry.id);
      return [...withoutGreeting, greetingEntry];
    });

    greetingSpokenRef.current = preferredLanguage;
    lastGreetedActivationRef.current = activationSequence;
    setLatestReferences([]);
  }, [activationSequence, isActivated]);

  // Track user interaction for browser autoplay policies
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
    };

    // Listen for various user interaction events
    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });
    window.addEventListener("touchstart", handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    console.log("[Speech Debug] useEffect triggered", {
      speechSupported,
      responsesCount: assistantResponses.length,
      autoSpeak,
      hasWindow: typeof window !== "undefined",
      hasSpeechSynthesis: typeof window !== "undefined" && !!window.speechSynthesis,
    });

    if (!speechSupported) {
      console.log("[Speech Debug] Speech not supported, returning");
      return;
    }
    if (assistantResponses.length === 0) {
      console.log("[Speech Debug] No assistant responses, returning");
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.log("[Speech Debug] Window or speechSynthesis not available, returning");
      return;
    }
    
    // Check if user has interacted (required for some browsers' autoplay policies)
    // Note: Speech synthesis usually works without user interaction, but we check anyway
    if (!userInteractedRef.current) {
      // Try to enable speech anyway - most browsers allow speech synthesis without user interaction
      // But log a warning if it fails
      console.log("[Speech Debug] User interaction not detected, but will attempt speech");
    }
    const latest = assistantResponses[assistantResponses.length - 1];
    if (!latest || !latest.answer.trim()) {
      console.log("[Speech Debug] No latest response or empty answer", { latest: latest?.id, hasAnswer: !!latest?.answer });
      return;
    }
    // CRITICAL: Mark as spoken immediately to prevent infinite loop
    if (spokenIdsRef.current.has(latest.id)) {
      console.log("[Speech Debug] Message already spoken, skipping", latest.id);
      return;
    }
    // Mark as spoken BEFORE starting to prevent re-triggering
    spokenIdsRef.current.add(latest.id);

    // Ensure voices are loaded before speaking
    // Some browsers require voices to be loaded before use
    const ensureVoicesLoaded = () => {
      return new Promise<void>((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve();
          return;
        }
        
        // Wait for voices to load
        const onVoicesChanged = () => {
          const loadedVoices = window.speechSynthesis.getVoices();
          if (loadedVoices.length > 0) {
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            resolve();
          }
        };
        
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
        
        // Timeout after 2 seconds if voices don't load
        setTimeout(() => {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          resolve(); // Continue anyway
        }, 2000);
      });
    };

    const speakMessage = async () => {
      // Wait for voices to be available
      await ensureVoicesLoaded();
      
      // Refresh available voices (but don't update state to avoid re-render)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && availableVoices.length === 0) {
        // Use setTimeout to avoid triggering re-render during effect
        setTimeout(() => setAvailableVoices(voices), 0);
      }

      const languageForVoice = (latest.detectedLanguage || latest.language || detectedLanguage) as LanguageCode;
      const cleanedText = stripMarkup(latest.answer);
      
      if (!cleanedText || cleanedText.trim().length === 0) {
        // Remove from spoken set if text is empty
        spokenIdsRef.current.delete(latest.id);
        return;
      }
      
      // Check if this message is muted BEFORE creating utterance
      if (mutedMessageIds.has(latest.id)) {
        setIsSpeaking(false);
        return;
      }

      if (!autoSpeak) {
        console.log("[Speech Debug] AutoSpeak is disabled, not speaking");
        setIsSpeaking(false);
        return;
      }
      
      console.log("[Speech Debug] Starting speech synthesis", {
        messageId: latest.id,
        language: languageForVoice,
        textLength: cleanedText.length,
        textPreview: cleanedText.substring(0, 50),
      });
      
      // Create utterance with enhanced natural speech settings
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = mapLanguageToLocale(languageForVoice);
      
      // Optimize speech parameters for natural, farmer-friendly delivery
      // Slightly slower rate for better comprehension, especially for non-native speakers
      utterance.rate = languageForVoice === "en" ? 0.9 : 0.85; // Slower for Indian languages
      utterance.pitch = 1.0; // Natural pitch
      utterance.volume = 1.0; // Full volume - ensure maximum volume
      
      // Force volume to maximum (some browsers may ignore the property)
      try {
        if (utterance.volume !== 1.0) {
          utterance.volume = 1.0;
        }
      } catch (e) {
        console.warn("[Speech Debug] Could not set volume:", e);
      }
      
      // Select appropriate voice for language (use fresh voices list)
      const currentVoices = window.speechSynthesis.getVoices();
      const locale = mapLanguageToLocale(languageForVoice).toLowerCase();
      const base = locale.split("-")[0];
      
      console.log("[Speech Debug] Selecting voice for language:", languageForVoice, "locale:", locale);
      console.log("[Speech Debug] Available voices count:", currentVoices.length);
      console.log("[Speech Debug] Voice list:");
      currentVoices.forEach((voice, index) => {
        console.log(`[Speech Debug]   ${index + 1}. "${voice.name}" - Language: ${voice.lang} - Default: ${voice.default}`);
      });
      
      // Try to find the best matching voice
      let targetVoice = currentVoices.find((voice) => {
        const voiceLang = voice.lang.toLowerCase();
        // Exact match
        if (voiceLang === locale) return true;
        // Language code match (e.g., mr-IN, mr)
        if (voiceLang.startsWith(base + "-") || voiceLang === base) return true;
        return false;
      });
      
      // If no match found, try to find any voice with the language code in the name
      if (!targetVoice) {
        targetVoice = currentVoices.find((voice) => {
          const voiceName = voice.name.toLowerCase();
          const voiceLang = voice.lang.toLowerCase();
          // Check if language code appears in voice name or lang
          return voiceName.includes(base) || voiceLang.includes(base);
        });
      }
      
      // CRITICAL: For Hindi/Marathi, NEVER use English voices - they can't pronounce Devanagari script
      // English voices (even en-IN) will fail immediately (speech ends in 16-26ms)
      if (!targetVoice && (languageForVoice === "mr" || languageForVoice === "hi")) {
        // First, try to find Hindi or Marathi specific voices
        targetVoice = currentVoices.find((voice) => {
          const voiceLang = voice.lang.toLowerCase();
          const voiceName = voice.name.toLowerCase();
          // Look for Hindi or Marathi in language code or name
          return voiceLang.includes("hi") || voiceLang.includes("mr") || 
                 voiceName.includes("hindi") || voiceName.includes("marathi");
        });
        
        // If no Hindi/Marathi voice, try any Indian non-English voice
        if (!targetVoice) {
          targetVoice = currentVoices.find((voice) => {
            const voiceLang = voice.lang.toLowerCase();
            const voiceName = voice.name.toLowerCase();
            // Must have "in" or "india" but NOT be English
            const hasIndia = voiceLang.includes("in") || voiceName.includes("india");
            const isEnglish = voiceLang.startsWith("en");
            return hasIndia && !isEnglish;
          });
        }
        
        // Last resort: any non-English voice
        if (!targetVoice) {
          targetVoice = currentVoices.find((voice) => {
            const voiceLang = voice.lang.toLowerCase();
            return !voiceLang.startsWith("en");
          });
        }
        
        // If we still don't have a voice, don't use English - it won't work
        if (!targetVoice) {
          console.error("[Speech Debug] ❌ No non-English voice available for Hindi/Marathi!");
          console.error("[Speech Debug] English voices cannot pronounce Devanagari script");
        }
      }
      
      // Last resort: use default voice but ONLY if it's not English for Hindi/Marathi
      if (!targetVoice) {
        targetVoice = currentVoices[0] || null;
        if (targetVoice && (languageForVoice === "mr" || languageForVoice === "hi")) {
          const voiceLang = targetVoice.lang.toLowerCase();
          // NEVER use English voices for Hindi/Marathi - they can't pronounce Devanagari
          if (voiceLang.startsWith("en")) {
          console.error("[Speech Debug] ❌ CRITICAL: No Hindi/Marathi voice found!");
          console.error("[Speech Debug] Available voices:", currentVoices.map(v => ({ name: v.name, lang: v.lang })));
          console.error("[Speech Debug] Full voice details:");
          currentVoices.forEach((voice, index) => {
            console.error(`[Speech Debug]   ${index + 1}. "${voice.name}" - Language: ${voice.lang} - Default: ${voice.default}`);
          });
          console.error("[Speech Debug] English voices cannot pronounce Hindi/Marathi Devanagari script");
          console.error("[Speech Debug] Please install Hindi/Marathi language packs in Windows Settings");
            // Don't set the voice - skip speech to avoid silent failure
            targetVoice = null;
          } else {
            console.warn("[Speech Debug] ⚠️ No matching voice found, using default:", targetVoice?.name);
          }
        }
      }
      
      if (targetVoice) {
        utterance.voice = targetVoice;
        console.log("[Speech Debug] ✅ Using voice:", targetVoice.name, "lang:", targetVoice.lang, "for language:", languageForVoice);
        
        // Verify the voice is actually set
        if (utterance.voice !== targetVoice) {
          console.warn("[Speech Debug] ⚠️ Voice may not have been set correctly");
        }
      } else {
        console.error("[Speech Debug] ❌ No suitable voice available!");
        // For Hindi/Marathi without a proper voice, show error and skip speech
        if (languageForVoice === "mr" || languageForVoice === "hi") {
          const errorMsg = languageForVoice === "hi" 
            ? "हिंदी वॉइस उपलब्ध नहीं है। कृपया Windows Settings में Hindi Language Pack इंस्टॉल करें।"
            : "मराठी आवाज उपलब्ध नाही. कृपया Windows Settings मध्ये Marathi Language Pack इंस्टॉल करा.";
          setVoiceError(errorMsg);
          console.error("[Speech Debug] ❌ No Hindi/Marathi voice found!");
          console.error("[Speech Debug] Available voices:", currentVoices.map(v => ({ name: v.name, lang: v.lang })));
          console.error("[Speech Debug] Full voice list:");
          currentVoices.forEach((voice, index) => {
            console.error(`[Speech Debug]   ${index + 1}. "${voice.name}" - Language: ${voice.lang} - Default: ${voice.default}`);
          });
          console.error("[Speech Debug] Please install Hindi/Marathi language packs in Windows Settings");
          console.error("[Speech Debug] See LANGUAGE_PACK_INSTALLATION.md for instructions");
          setIsSpeaking(false);
          return; // Skip speech - it won't work without proper voice
        }
      }

      // Track start time for duration calculation
      const speechStartTimeRef = { value: null as number | null };
      
      utterance.onstart = () => {
        // Only handle onstart for the current active utterance
        if (currentUtteranceRef.current !== utterance) {
          return;
        }
        
        speechStartTimeRef.value = Date.now();
        setIsSpeaking(true);
        setVoiceError(null); // Clear any previous errors
        console.log("[Speech Debug] ✅ Speech STARTED successfully:", cleanedText.substring(0, 50));
        console.log("[Speech Debug] Speech synthesis status:", {
          speaking: window.speechSynthesis.speaking,
          pending: window.speechSynthesis.pending,
          paused: window.speechSynthesis.paused,
        });
        console.log("[Speech Debug] Utterance details:", {
          text: utterance.text.substring(0, 50),
          lang: utterance.lang,
          voice: utterance.voice?.name,
          voiceLang: utterance.voice?.lang,
          rate: utterance.rate,
          pitch: utterance.pitch,
          volume: utterance.volume,
        });
        
        // CRITICAL: Check if wrong voice is being used for Hindi/Marathi
        if (languageForVoice === "mr" || languageForVoice === "hi") {
          const voiceLang = utterance.voice?.lang?.toLowerCase() || "";
          const voiceName = utterance.voice?.name?.toLowerCase() || "";
          
          // Check if it's an English voice (not en-IN)
          if (voiceLang.startsWith("en") && !voiceLang.includes("in") && !voiceName.includes("india")) {
            console.error("[Speech Debug] ❌ CRITICAL: English voice detected for Hindi/Marathi!");
            console.error("[Speech Debug] Voice:", utterance.voice?.name, "cannot pronounce Devanagari script");
            console.error("[Speech Debug] Cancelling speech immediately to prevent silent failure");
            
            // Cancel immediately
            currentUtteranceRef.current = null;
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            spokenIdsRef.current.delete(latest.id);
            
            // Show user-friendly error
            const langName = languageForVoice === "mr" ? "Marathi" : "Hindi";
            setVoiceError(`No ${langName} voice available on your system. English voices cannot pronounce ${langName} text. Please install ${langName} language packs in Windows Settings, or switch to English language.`);
            return;
          }
          
          // Warn if not perfect match but might work
          if (!voiceLang.includes("mr") && !voiceLang.includes("hi") && !voiceLang.includes("in")) {
            console.warn("[Speech Debug] ⚠️ WARNING: Using non-Indian voice for Indian language text!");
            console.warn("[Speech Debug] Voice:", utterance.voice?.name, "may not pronounce", languageForVoice, "correctly");
          }
        }
      };

      utterance.onend = () => {
        // Only handle onend for the current active utterance
        if (currentUtteranceRef.current !== utterance) {
          return;
        }
        
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        console.log("[Speech Debug] ✅ Speech ENDED successfully");
        
        // Check if speech actually played
        if (speechStartTimeRef.value) {
          const duration = Date.now() - speechStartTimeRef.value;
          console.log("[Speech Debug] Speech duration:", duration, "ms");
          if (duration < 100) {
            console.warn("[Speech Debug] ⚠️ Speech ended too quickly - may not have played audio!");
            console.warn("[Speech Debug] This might indicate the voice cannot handle the text language");
          } else {
            console.log("[Speech Debug] ✅ Speech played for", duration, "ms - audio should have been heard");
          }
        }
        
        // Enhanced state management: Auto-resume listening after speech ends
        // Only auto-resume if mic wasn't manually opened (manual mode handles its own resumption)
        if (!micManuallyOpened && autoListen) {
          // Small delay to ensure speech has fully ended
          setTimeout(() => {
            if (!isSpeaking && !micManuallyOpened) {
              const restarted = resumeAutoListening();
              if (restarted) {
                lastAutoResumeMessageIdRef.current = latest.id;
              }
            }
          }, 200);
        }
      };

      utterance.onerror = (error) => {
        // Ignore errors from cancelled utterances (not the current active one)
        if (currentUtteranceRef.current !== utterance) {
          // This is a cancelled utterance, ignore the error
          return;
        }
        
        const errorMsg = error.error || "unknown";
        
        // "interrupted" errors are expected when cancelling speech - ignore them silently
        if (errorMsg === "interrupted") {
          // This is normal when cancelling, don't log or show error
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          return;
        }
        
        // Only log and handle errors for the active utterance
        console.error("[Speech Debug] ❌ Speech synthesis ERROR:", error, error.error);
        console.error("[Speech Debug] Error details:", {
          errorType: error.error,
          charIndex: error.charIndex,
          charLength: error.charLength,
          utterance: error.utterance?.text?.substring(0, 50),
        });
        
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        // Remove from spoken set on error so it can be retried
        spokenIdsRef.current.delete(latest.id);
        
        // Provide helpful error messages
        if (errorMsg === "not-allowed") {
          setVoiceError("Speech synthesis not allowed. Please check browser permissions.");
        } else if (errorMsg === "synthesis-failed") {
          setVoiceError("Failed to synthesize speech. Please try again.");
        } else {
          setVoiceError("Failed to speak response. Text is still available.");
        }
        
        // Auto-resume listening even on error if autoListen is enabled
        if (!micManuallyOpened && autoListen) {
          setTimeout(() => {
            if (!isSpeaking && !micManuallyOpened) {
              const restarted = resumeAutoListening();
              if (restarted) {
                lastAutoResumeMessageIdRef.current = latest.id;
              }
            }
          }, 200);
        }
      };

      // Improved speech synthesis with better error handling and browser compatibility
      const startSpeech = () => {
        try {
          // Check if speech synthesis is available and not paused
          if (!window.speechSynthesis) {
            console.error("Speech synthesis not available");
            setVoiceError("Speech synthesis not available in this browser.");
            spokenIdsRef.current.delete(latest.id);
            return;
          }

          // Check if message is muted
          if (mutedMessageIds.has(latest.id)) {
            setIsSpeaking(false);
            return;
          }

          // Cancel any ongoing speech first, but wait for it to complete
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            // Clear the current utterance ref so cancelled utterance errors are ignored
            currentUtteranceRef.current = null;
            window.speechSynthesis.cancel();
            // Wait a bit longer to ensure cancellation completes
            setTimeout(() => {
              try {
                if (window.speechSynthesis && !mutedMessageIds.has(latest.id)) {
                  // Double-check speech synthesis is still available
                  if (window.speechSynthesis.speak) {
                    console.log("[Speech Debug] 🎤 Calling speechSynthesis.speak() (after cancellation)");
                    // Set the new utterance as current before speaking
                    currentUtteranceRef.current = utterance;
                    window.speechSynthesis.speak(utterance);
                    // Optimistically set speaking state (will be confirmed by onstart event)
                    setIsSpeaking(true);
                    console.log("[Speech Debug] Speech queued successfully, checking status...");
                    // Check status after a short delay
                    setTimeout(() => {
                      console.log("[Speech Debug] Speech status check:", {
                        speaking: window.speechSynthesis.speaking,
                        pending: window.speechSynthesis.pending,
                        paused: window.speechSynthesis.paused,
                      });
                    }, 100);
                  } else {
                    console.error("speechSynthesis.speak is not available");
                    setVoiceError("Speech synthesis not supported. Please try again.");
                    spokenIdsRef.current.delete(latest.id);
                  }
                }
              } catch (speakError) {
                console.error("Error calling speak after cancellation:", speakError);
                setVoiceError("Failed to start speech. Please try again.");
                setIsSpeaking(false);
                spokenIdsRef.current.delete(latest.id);
              }
            }, 200);
          } else {
            // No ongoing speech, start immediately
            try {
              if (window.speechSynthesis.speak) {
                console.log("[Speech Debug] 🎤 Calling speechSynthesis.speak() (immediate)");
                
                // Check if speech synthesis is paused (some browsers pause by default)
                if (window.speechSynthesis.paused) {
                  console.log("[Speech Debug] Speech synthesis was paused, resuming...");
                  try {
                    window.speechSynthesis.resume();
                  } catch (e) {
                    console.warn("[Speech Debug] Could not resume:", e);
                  }
                }
                
                // Cancel any pending speech first
                if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                  // Clear the current utterance ref so cancelled utterance errors are ignored
                  currentUtteranceRef.current = null;
                  window.speechSynthesis.cancel();
                  // Wait a moment for cancellation
                  setTimeout(() => {
                    // Set the new utterance as current before speaking
                    currentUtteranceRef.current = utterance;
                    window.speechSynthesis.speak(utterance);
                    setIsSpeaking(true);
                  }, 50);
                } else {
                  // Set the new utterance as current before speaking
                  currentUtteranceRef.current = utterance;
                  window.speechSynthesis.speak(utterance);
                }
                
                // Optimistically set speaking state (will be confirmed by onstart event)
                setIsSpeaking(true);
                console.log("[Speech Debug] Speech started immediately, checking status...");
                
                // Verify speech actually started after a short delay
                setTimeout(() => {
                  const status = {
                    speaking: window.speechSynthesis.speaking,
                    pending: window.speechSynthesis.pending,
                    paused: window.speechSynthesis.paused,
                  };
                  console.log("[Speech Debug] Speech status check:", status);
                  if (!status.speaking && !status.pending && !status.paused) {
                    // Speech didn't start, might be a browser autoplay issue
                    console.warn("[Speech Debug] ⚠️ Speech may not have started - trying again...");
                    // Try once more
                    try {
                      currentUtteranceRef.current = null;
                      window.speechSynthesis.cancel();
                      setTimeout(() => {
                        currentUtteranceRef.current = utterance;
                        window.speechSynthesis.speak(utterance);
                      }, 100);
                    } catch (retryError) {
                      console.error("[Speech Debug] Retry failed:", retryError);
                    }
                  }
                }, 500);
              } else {
                console.error("speechSynthesis.speak is not available");
                setVoiceError("Speech synthesis not supported. Please try again.");
                spokenIdsRef.current.delete(latest.id);
              }
            } catch (speakError) {
              console.error("Error calling speak:", speakError);
              setVoiceError("Failed to start speech. Please try again.");
              setIsSpeaking(false);
              spokenIdsRef.current.delete(latest.id);
            }
          }
        } catch (error) {
          console.error("Error in startSpeech:", error);
          setVoiceError("Failed to start speech. Please try again.");
          setIsSpeaking(false);
          spokenIdsRef.current.delete(latest.id);
        }
      };

      // Start speech synthesis
      startSpeech();
    };

    void speakMessage();
    // Removed availableVoices from dependencies to prevent infinite loop
  }, [assistantResponses, autoSpeak, detectedLanguage, micManuallyOpened, mutedMessageIds, resumeAutoListening, speechSupported]);

  useEffect(() => {
    // Only auto-resume if mic wasn't manually opened
    if (!isActivated || isListening || micManuallyOpened) {
      return;
    }

    resumeAutoListening();
  }, [isActivated, isListening, micManuallyOpened, resumeAutoListening]);

  useEffect(() => {
    if (!chatContainerRef.current) {
      return;
    }
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatTimeline]);

  useEffect(() => {
    const validIds = new Set(chatTimeline.map((message) => message.id));
    setAnimatedMessages((previous) => {
      const entries = Object.entries(previous).filter(([id]) => validIds.has(id));
      if (entries.length === Object.keys(previous).length) {
        return previous;
      }
      return Object.fromEntries(entries) as Record<string, AnimatedMessageState>;
    });
    animatedMessageIdsRef.current = new Set(
      Array.from(animatedMessageIdsRef.current).filter((id) => validIds.has(id)),
    );
  }, [chatTimeline]);

  useEffect(() => {
    if (assistantResponses.length === 0) {
      return;
    }
    lastAutoResumeMessageIdRef.current = null;
  }, [assistantResponses]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    chatTimeline
      .filter((message) => message.role === "assistant")
      .forEach((message) => {
        if (animatedMessageIdsRef.current.has(message.id)) {
          return;
        }

        animatedMessageIdsRef.current.add(message.id);

        const sanitizedContent = stripMarkup(message.content);
        const totalChars = sanitizedContent.length;

        if (totalChars === 0) {
          setAnimatedMessages((previous) => ({
            ...previous,
            [message.id]: { visibleText: "", isComplete: true },
          }));
          return;
        }

        const tickMs = 30;
        const targetDurationMs = Math.min(2000, Math.max(900, totalChars * 35));
        const steps = Math.max(1, Math.floor(targetDurationMs / tickMs));
        const increment = Math.max(1, Math.ceil(totalChars / steps));
        let current = 0;

        setAnimatedMessages((previous) => ({
          ...previous,
          [message.id]: { visibleText: "", isComplete: false },
        }));

        const intervalId = window.setInterval(() => {
          current = Math.min(totalChars, current + increment);
          const done = current >= totalChars;

          setAnimatedMessages((previous) => ({
            ...previous,
            [message.id]: {
              visibleText: sanitizedContent.slice(0, current),
              isComplete: done,
            },
          }));

          if (done) {
            window.clearInterval(intervalId);
            animationIntervalsRef.current[message.id] = undefined;
          }
        }, tickMs);

        animationIntervalsRef.current[message.id] = intervalId;
      });
  }, [chatTimeline]);

  useEffect(() => {
    // Don't auto-resume if mic was manually opened
    if (!autoListen || isListening || !listeningSupported || !latestAssistantMessage || micManuallyOpened) {
      return;
    }

    const animationState = animatedMessages[latestAssistantMessage.id];
    if (!animationState || !animationState.isComplete) {
      return;
    }

    if (lastAutoResumeMessageIdRef.current === latestAssistantMessage.id) {
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
      return;
    }

    const restarted = resumeAutoListening();
    if (restarted) {
      lastAutoResumeMessageIdRef.current = latestAssistantMessage.id;
    }
  }, [animatedMessages, autoListen, isListening, latestAssistantMessage, listeningSupported, micManuallyOpened, resumeAutoListening]);

  useEffect(() => {
    return () => {
      Object.values(animationIntervalsRef.current).forEach((intervalId) => {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
      });
      // Cleanup pause timeout
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isActivated) {
      return;
    }
    if (!["mr", "hi", "en"].includes(detectedLanguage)) {
      return;
    }
    if (language === detectedLanguage) {
      return;
    }

    const source = detectedLanguageSourceRef.current;
    if (source !== "voice" && source !== "response") {
      return;
    }

    detectedLanguageSourceRef.current = "manual";
    setLanguage(detectedLanguage as LanguageCode);
  }, [detectedLanguage, isActivated, language, setLanguage]);

  const detectedLanguageLabel = useMemo(() => {
    try {
      return getLanguageName(detectedLanguage as never);
    } catch {
      return detectedLanguage.toUpperCase();
    }
  }, [detectedLanguage, getLanguageName]);

  /**
   * Enhanced mic toggle with robust error handling and state management
   * Provides manual control over microphone with proper cleanup and recovery
   */
  const handleToggleListening = () => {
    if (!listeningSupported || !recognitionRef.current) {
      setVoiceError(t(helpDeskText.voiceUnsupported) || "Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      // Stop listening - cleanup and reset state
      try {
        // Stop speech synthesis first
        if (typeof window !== "undefined" && window.speechSynthesis) {
          currentUtteranceRef.current = null;
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
        
        // Clear pause timeout
        if (pauseTimeoutRef.current) {
          window.clearTimeout(pauseTimeoutRef.current);
          pauseTimeoutRef.current = null;
        }
        
        // Stop recognition with proper error handling
        try {
          if (recognitionRef.current.abort) {
            recognitionRef.current.abort();
          } else {
            recognitionRef.current.stop();
          }
        } catch (stopError) {
          console.warn("Error stopping recognition:", stopError);
          // Continue with cleanup even if stop fails
        }
        
        // Reset all state
        setIsListening(false);
        setMicManuallyOpened(false);
        setInterimTranscript("");
        setIsProcessingVoice(false);
        pendingSpeechSubmitRef.current = false;
        setVoiceError(null); // Clear any errors
        
      } catch (error) {
        console.error("Error in handleToggleListening (stop):", error);
        // Force reset state even on error
        setIsListening(false);
        setMicManuallyOpened(false);
        setInterimTranscript("");
        setIsProcessingVoice(false);
        pendingSpeechSubmitRef.current = false;
      }
      return;
    }

    // Start listening - initialize and configure
    try {
      // Stop any ongoing speech
      if (typeof window !== "undefined" && window.speechSynthesis) {
        currentUtteranceRef.current = null;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      // Clear any existing pause timeout
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }

      // Reset state
      setVoiceError(null);
      setInterimTranscript("");
      setIsProcessingVoice(false);
      setMicManuallyOpened(true); // Mark mic as manually opened
      
      // Update recognition settings for continuous mode
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = mapLanguageToLocale(detectedLanguage);
      }
      
      // Start recognition with error callback
      const started = resumeAutoListening(true, (error) => {
        const errorMessage = error instanceof Error 
          ? error.message 
          : t(helpDeskText.voiceUnsupported) || "Failed to start microphone";
        setVoiceError(errorMessage);
        setMicManuallyOpened(false);
        setIsListening(false);
        setInterimTranscript("");
      });

      if (!started) {
        pendingSpeechSubmitRef.current = false;
        setMicManuallyOpened(false);
        setIsListening(false);
        setVoiceError("Failed to start microphone. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleToggleListening (start):", error);
      setVoiceError(error instanceof Error ? error.message : "Failed to start microphone");
      setMicManuallyOpened(false);
      setIsListening(false);
      setInterimTranscript("");
      setIsProcessingVoice(false);
    }
  };

  const handleSpeakMessage = useCallback(
    async (message: ChatTimelineMessage) => {
      // Prevent multiple simultaneous calls
      if (isSpeaking) {
        console.log("Already speaking, ignoring request");
        return;
      }

      if (typeof window === "undefined" || !window.speechSynthesis) {
        setVoiceError(t(helpDeskText.voiceUnsupported) || "Speech synthesis not supported.");
        return;
      }

      // Check if message is muted
      if (mutedMessageIds.has(message.id)) {
        return;
      }

      const cleanedText = stripMarkup(message.content);
      if (!cleanedText || cleanedText.trim().length === 0) {
        return;
      }

      // Check if already spoken
      if (spokenIdsRef.current.has(message.exchangeId)) {
        console.log("Message already spoken, ignoring");
        return;
      }

      // Mark as speaking immediately to prevent multiple calls
      setIsSpeaking(true);

      // Ensure voices are loaded
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        await new Promise<void>((resolve) => {
          const onVoicesChanged = () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            if (loadedVoices.length > 0) {
              window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
              resolve();
            }
          };
          window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
          setTimeout(() => {
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            resolve();
          }, 2000);
        });
      }

      setVoiceError(null);
      const languageForVoice = (message.detectedLanguage || detectedLanguage) as LanguageCode;
      
      // Create utterance with enhanced natural speech settings
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = mapLanguageToLocale(languageForVoice);
      
      // Optimize speech parameters for natural, farmer-friendly delivery
      utterance.rate = languageForVoice === "en" ? 0.9 : 0.85; // Slower for Indian languages
      utterance.pitch = 1.0; // Natural pitch
      utterance.volume = 1.0; // Full volume
      
      // Select appropriate voice for language (use fresh voices list)
      const currentVoices = window.speechSynthesis.getVoices();
      const targetVoice = currentVoices.find((voice) => {
        const locale = mapLanguageToLocale(languageForVoice).toLowerCase();
        const base = locale.split("-")[0];
        if (voice.lang.toLowerCase() === locale) return true;
        if (voice.lang.toLowerCase().startsWith(base + "-") || voice.lang.toLowerCase() === base) return true;
        return false;
      }) || currentVoices[0] || null;
      
      if (targetVoice) {
        utterance.voice = targetVoice;
        console.log("Manual speak - Using voice:", targetVoice.name, "for language:", languageForVoice);
      } else {
        console.warn("Manual speak - No voice found for language:", languageForVoice);
      }
      
      // Enhanced error handling for speech synthesis
      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceError(null);
        console.log("Manual speech started:", cleanedText.substring(0, 50));
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        spokenIdsRef.current.add(message.exchangeId);
        console.log("Manual speech ended successfully");
      };

      utterance.onerror = (error) => {
        console.error("Manual speech synthesis error:", error, error.error);
        setIsSpeaking(false);
        
        const errorMsg = error.error || "unknown";
        if (errorMsg === "not-allowed") {
          setVoiceError("Speech synthesis not allowed. Please check browser permissions.");
        } else if (errorMsg === "synthesis-failed") {
          setVoiceError("Failed to synthesize speech. Please try again.");
        } else if (errorMsg === "interrupted") {
          // This is normal when cancelling, don't show error
          console.log("Manual speech interrupted (normal)");
          setIsSpeaking(false);
        } else {
          setVoiceError("Failed to speak message. Please try again.");
        }
      };

      // Improved speech synthesis with better error handling
      const startSpeech = () => {
        try {
          // Check if speech synthesis is available
          if (!window.speechSynthesis) {
            console.error("Speech synthesis not available");
            setVoiceError("Speech synthesis not available in this browser.");
            setIsSpeaking(false);
            return;
          }

          // Check if message is muted
          if (mutedMessageIds.has(message.id)) {
            setIsSpeaking(false);
            return;
          }

          // Cancel any ongoing speech first, but wait for it to complete
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            currentUtteranceRef.current = null;
            window.speechSynthesis.cancel();
            // Wait a bit longer to ensure cancellation completes
            setTimeout(() => {
              try {
                if (window.speechSynthesis && !mutedMessageIds.has(message.id)) {
                  // Double-check speech synthesis is still available
                  if (window.speechSynthesis.speak) {
                    // Set the new utterance as current before speaking
                    currentUtteranceRef.current = utterance;
                    window.speechSynthesis.speak(utterance);
                    console.log("Manual speech queued successfully");
                  } else {
                    console.error("speechSynthesis.speak is not available");
                    setVoiceError("Speech synthesis not supported. Please try again.");
                    setIsSpeaking(false);
                  }
                } else {
                  setIsSpeaking(false);
                }
              } catch (speakError) {
                console.error("Error calling speak after cancellation:", speakError);
                setVoiceError("Failed to start speech. Please try again.");
                setIsSpeaking(false);
              }
            }, 200);
          } else {
            // No ongoing speech, start immediately
            try {
              if (window.speechSynthesis.speak) {
                // Set the new utterance as current before speaking
                currentUtteranceRef.current = utterance;
                window.speechSynthesis.speak(utterance);
                console.log("Manual speech started immediately");
              } else {
                console.error("speechSynthesis.speak is not available");
                setVoiceError("Speech synthesis not supported. Please try again.");
                setIsSpeaking(false);
              }
            } catch (speakError) {
              console.error("Error calling speak:", speakError);
              setVoiceError("Failed to start speech. Please try again.");
              setIsSpeaking(false);
            }
          }
        } catch (error) {
          console.error("Error in startSpeech:", error);
          setVoiceError("Failed to speak message. Please try again.");
          setIsSpeaking(false);
        }
      };

      // Start speech synthesis
      startSpeech();
    },
    [detectedLanguage, t, mutedMessageIds, isSpeaking],
  );

  const handleToggleMuteMessage = useCallback(
    (messageId: string) => {
      setMutedMessageIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(messageId)) {
          newSet.delete(messageId);
          // If unmuting and currently speaking this message, stop and restart
          if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
            currentUtteranceRef.current = null;
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
        } else {
          newSet.add(messageId);
          // Stop speaking if this message is currently being spoken
          if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
            currentUtteranceRef.current = null;
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
        }
        return newSet;
      });
    },
    [],
  );

  const handleActivate = () => {
    console.log("[Activation] Activating Live Voice Assistant...");
    console.log("[Activation] Speech supported:", speechSupported);
    console.log("[Activation] AutoSpeak:", autoSpeak);
    console.log("[Activation] AutoListen:", autoListen);
    
    activationLanguageRef.current = selectedLanguageValue ?? "en";
    lastGreetedActivationRef.current = null;
    setActivationSequence((previous) => previous + 1);
    setIsActivated(true);
    setAssistantResponses([]);
    setAssistantHistory([]);
    setLatestReferences([]);
    setQuestion("");
    setAnimatedMessages({});
    animatedMessageIdsRef.current.clear();
    Object.values(animationIntervalsRef.current).forEach((intervalId) => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    });
    animationIntervalsRef.current = {};
    spokenIdsRef.current.clear();
    setVoiceError(null); // Clear any previous errors
    
    // Verify speech synthesis is available
    if (speechSupported && typeof window !== "undefined" && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      console.log("[Activation] Speech synthesis available, voices:", voices.length);
      if (voices.length === 0) {
        console.warn("[Activation] No voices loaded yet, may need to wait");
      }
    } else {
      console.warn("[Activation] Speech synthesis not available");
    }
    
    if (autoListen) {
      console.log("[Activation] Starting auto-listen...");
      const started = resumeAutoListening(false, (error) => {
        console.error("[Activation] Failed to start auto-listen:", error);
        setVoiceError(error instanceof Error ? error.message : t(helpDeskText.voiceUnsupported));
      });
      if (!started) {
        console.warn("[Activation] Auto-listen did not start");
        setIsListening(false);
      } else {
        console.log("[Activation] Auto-listen started successfully");
      }
    }
    
    console.log("[Activation] ✅ Live Voice Assistant activated!");
  };

  const handleSubmitQuestion = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>, questionOverride?: string) => {
      event?.preventDefault();

      // Stop microphone/recognition when send button is clicked
      if (recognitionRef.current && isListening) {
        try {
          if (recognitionRef.current.abort) {
            recognitionRef.current.abort();
          } else {
            recognitionRef.current.stop();
          }
          setIsListening(false);
          setMicManuallyOpened(false);
        } catch (stopError) {
          console.warn("Error stopping recognition on send:", stopError);
          // Continue even if stop fails
          setIsListening(false);
          setMicManuallyOpened(false);
        }
      }

      if (!isActivated) {
        toast({
          title: t(landingCopy.activationTitle),
          description: "Please activate the assistant to start the conversation.",
          variant: "destructive",
        });
        return;
      }

      const questionToSubmit = questionOverride ?? question;
      const trimmedQuestion = questionToSubmit.trim();
      if (!trimmedQuestion) {
        toast({
          title: t(recommendationsTranslations.assistantMissingQuestionTitle),
          description: t(recommendationsTranslations.assistantMissingQuestionDescription),
          variant: "destructive",
        });
        return;
      }

      if (trimmedQuestion.length < 5) {
        toast({
          title: t(recommendationsTranslations.assistantMissingQuestionTitle),
          description: t(recommendationsTranslations.assistantMissingQuestionDescription),
          variant: "destructive",
        });
        return;
      }

      const preferredLanguage = selectedLanguageValue;
      const inputLanguage = detectInputLanguage(trimmedQuestion, preferredLanguage);
      const effectiveLanguage = preferredLanguage || inputLanguage;

      updateDetectedLanguage(effectiveLanguage, "input");
      setIsLoading(true);

      try {
        const response = await fetch(buildApiUrl("/api/farmer-assist"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: effectiveLanguage,
            question: trimmedQuestion,
            history: assistantHistory.slice(-MAX_ASSIST_HISTORY_MESSAGES),
          }),
        });

        if (!response.ok) {
          let errorMessage = `Server responded with ${response.status}`;
          let errorTitle = t(recommendationsTranslations.assistantUnavailableTitle);
          
          try {
            // Parse the response text directly to avoid parseJsonResponse throwing
            const responseText = await response.clone().text();
            let errorPayload: { 
              error?: string | { code?: number; message?: string; status?: string }; 
              details?: string;
              code?: number;
              status?: string;
              message?: string;
            } = {};
            
            try {
              errorPayload = JSON.parse(responseText);
            } catch {
              // If JSON parsing fails, use the raw text
              errorMessage = responseText || errorMessage;
            }
            
            // Extract error message from nested error object if present
            let extractedMessage: string | undefined;
            if (errorPayload.error) {
              if (typeof errorPayload.error === "string") {
                extractedMessage = errorPayload.error;
              } else if (typeof errorPayload.error === "object" && errorPayload.error !== null) {
                extractedMessage = errorPayload.error.message;
              }
            }
            
            // Handle 503 Service Unavailable (model overloaded)
            if (response.status === 503 || errorPayload.status === "UNAVAILABLE" || 
                (typeof errorPayload.error === "object" && errorPayload.error?.status === "UNAVAILABLE")) {
              errorTitle = t(recommendationsTranslations.assistantUnavailableTitle);
              errorMessage = extractedMessage || errorPayload.details || errorPayload.message || 
                "The model is currently overloaded. Please wait a moment and try again.";
            } else {
              errorMessage = extractedMessage || errorPayload.details || errorPayload.message || errorMessage;
            }
          } catch (parseError) {
            // If it's a 503 status, provide a helpful message even if parsing fails
            if (response.status === 503) {
              errorMessage = "The model is currently overloaded. Please wait a moment and try again.";
            } else if (parseError instanceof Error && parseError.message) {
              // Only use parseError message if it's not a JSON string
              const parsedMsg = parseError.message;
              if (!parsedMsg.startsWith("{") && !parsedMsg.includes('"error"')) {
                errorMessage = parsedMsg;
              }
            }
          }
          
          const customError = new Error(errorMessage) as Error & { title?: string; statusCode?: number };
          customError.title = errorTitle;
          customError.statusCode = response.status;
          throw customError;
        }

        const data = await parseJsonResponse<AiAssistResponsePayload>(response);

        const responseLanguage =
          (data.detectedLanguage as LanguageCode | undefined) ??
          (data.language as LanguageCode | undefined) ??
          effectiveLanguage;

        updateDetectedLanguage(responseLanguage, "response");

        setAssistantHistory((previous) => {
          const updated: FarmerAssistMessage[] = [
            ...previous,
            { role: "farmer", content: trimmedQuestion },
            { role: "assistant", content: data.answer },
          ];
          return updated.slice(-MAX_ASSIST_HISTORY_MESSAGES);
        });

        const exchange: AiAssistExchange = {
          id: generateId(),
          question: trimmedQuestion,
          language: data.language,
          detectedLanguage: responseLanguage,
          answer: data.answer,
          followUps: data.followUps ?? [],
          clarifyingQuestions: data.clarifyingQuestions ?? [],
          sources: data.sources ?? [],
          safetyMessage: data.safetyMessage ?? null,
          references: data.references ?? [],
        };

        setAssistantResponses((previous) => [...previous, exchange]);
        setLatestReferences(data.references ?? []);
        setQuestion("");
        setInterimTranscript(""); // Clear interim transcript after successful submission
        pendingSpeechSubmitRef.current = false;
        setIsProcessingVoice(false);
        
        // Enhanced state management: Restart listening after submission if mic was manually opened
        // Wait for speech to potentially start before resuming listening
        if (micManuallyOpened && recognitionRef.current && !isListening) {
          // Delay restart to allow speech synthesis to start if autoSpeak is enabled
          const restartDelay = autoSpeak ? 1000 : 500; // Longer delay if speech will play
          
          setTimeout(() => {
            try {
              if (recognitionRef.current && micManuallyOpened && !isProcessingVoice) {
                recognitionRef.current.lang = mapLanguageToLocale(responseLanguage);
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.start();
                setIsListening(true);
                setVoiceError(null); // Clear any errors
                processedResultIndexRef.current = 0; // Reset processed index when recognition restarts
              }
            } catch (error) {
              console.warn("Failed to restart recognition after submission:", error);
              // Don't show error - might be temporary
            }
          }, restartDelay);
        }
      } catch (error) {
        let message =
          error instanceof Error ? error.message : "Failed to get advice from Gemini assistant.";
        const errorTitle = (error as Error & { title?: string })?.title || t(recommendationsTranslations.assistantUnavailableTitle);
        const statusCode = (error as Error & { statusCode?: number })?.statusCode;
        
        // Clean up any JSON strings that might be in the error message
        if (message && (message.startsWith("{") || message.includes('"error"'))) {
          try {
            const parsed = JSON.parse(message);
            if (parsed && typeof parsed === "object") {
              // Extract message from nested error object
              if (parsed.error) {
                if (typeof parsed.error === "string") {
                  message = parsed.error;
                } else if (typeof parsed.error === "object" && parsed.error.message) {
                  message = parsed.error.message;
                }
              } else if (parsed.details) {
                message = parsed.details;
              } else if (parsed.message) {
                message = parsed.message;
              }
            }
          } catch {
            // If parsing fails, use a fallback message
            if (statusCode === 503) {
              message = "The assistant is temporarily unavailable due to high demand. Please wait a few seconds and try again.";
            }
          }
        }
        
        // For 503 errors, show a more helpful message
        const displayMessage = statusCode === 503 
          ? (message.includes("overloaded") || message.includes("unavailable") 
              ? message 
              : "The assistant is temporarily unavailable due to high demand. Please wait a few seconds and try again.")
          : message || t(recommendationsTranslations.assistantErrorDescription);
        
        toast({
          title: errorTitle,
          description: displayMessage,
          variant: "destructive",
          duration: statusCode === 503 ? 8000 : 5000, // Show 503 errors longer
        });
      } finally {
        setIsLoading(false);
        pendingSpeechSubmitRef.current = false;
      }
    },
    [assistantHistory, isActivated, question, selectedLanguageValue, t, toast, updateDetectedLanguage]
  );

  const handleSuggestionClick = (value: string) => {
    setQuestion(value);
    updateDetectedLanguage(detectInputLanguage(value, detectedLanguage), "input");
    // Pass the question directly to avoid state update timing issues
    void handleSubmitQuestion(undefined, value);
  };

  useEffect(() => {
    handleSubmitQuestionRef.current = handleSubmitQuestion;
  }, [handleSubmitQuestion]);

  const voiceOnlyActive = listeningSupported && autoListen;

  return (
    <Layout>
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/90 via-white to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-24 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl sm:h-72 sm:w-72" />
        <div className="pointer-events-none absolute -right-24 bottom-16 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto w-full max-w-7xl px-2">
          <div className="flex flex-col gap-8">
            <header className="grid gap-6 rounded-[32px] border border-emerald-100/70 bg-white/90 p-6 shadow-xl shadow-emerald-200/40 backdrop-blur sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-emerald-600">
                  <Sprout className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">{t(helpDeskText.liveChatHeading)}</span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t(landingCopy.heroHeading)}</h1>
                  <p className="max-w-2xl text-sm text-slate-600 sm:text-base">{t(helpDeskText.tagline)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-700">
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1">
                    {t(landingCopy.badgeMarathi)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1">
                    {t(landingCopy.badgeHindi)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1">
                    {t(landingCopy.badgeEnglish)}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 shadow-sm">
                    <Languages className="h-4 w-4 text-emerald-600" />
                    <span>{t(helpDeskText.detectedLanguage)}: {detectedLanguageLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    {isActivated ? t(helpDeskText.activePillLabel) : t(landingCopy.activationTag)}
                  </span>
                </div>

                <div className="rounded-[28px] border border-emerald-100/70 bg-white/90 p-4 shadow-lg shadow-emerald-200/30 sm:p-5">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{t(landingCopy.activationTitle)}</p>
                      <p className="text-xs text-slate-500 sm:text-sm">{t(landingCopy.proTip)}</p>
                    </div>
                    <Select
                      value={selectedLanguageValue}
                      onValueChange={(value) => {
                        const languageValue = value as LanguageCode;
                        setLanguage(languageValue);
                        updateDetectedLanguage(languageValue, "manual");
                      }}
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl border border-emerald-200 bg-white/80 text-sm font-semibold text-slate-700 shadow-sm focus:ring-emerald-400 focus:ring-offset-0">
                        <SelectValue placeholder={detectedLanguageLabel} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-emerald-100 bg-white shadow-lg">
                        {languageOptions.map((option) => (
                          <SelectItem key={option.code} value={option.code} className="text-sm">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>
            </header>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                {!isActivated ? (
                  <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 p-6 shadow-lg shadow-emerald-200/40 sm:p-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t(landingCopy.activationTitle)}</h2>
                        <p className="text-sm text-slate-600 sm:text-base">{t(landingCopy.activationDescription)}</p>
                      </div>
                      <ul className="space-y-4 text-sm text-slate-600">
                        <li className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Volume2 className="h-4 w-4" />
                          </span>
                          <span>{t(landingCopy.activationBulletOne)}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <MessageCircleQuestion className="h-4 w-4" />
                          </span>
                          <span>{t(landingCopy.activationBulletTwo)}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <span>{t(landingCopy.activationBulletThree)}</span>
                        </li>
                      </ul>
                      <Button
                        size="lg"
                        onClick={handleActivate}
                        className="w-full rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-500/90 sm:w-auto"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t(landingCopy.activationButton)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 p-6 shadow-lg shadow-emerald-200/35 sm:p-7">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">{t(landingCopy.voiceModeLabel)}</p>
                        <p className="text-sm text-slate-600">{t(landingCopy.voiceModeDescription)}</p>
                        <p className="text-sm text-slate-600">{t(helpDeskText.autoSpeakHelper)}</p>
                        {voiceOnlyActive && (
                          <p className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-2 text-sm font-medium text-emerald-700">
                            {t(helpDeskText.voiceOnlyActive)}
                          </p>
                        )}
                        {!listeningSupported && (
                          <p className="text-xs text-slate-500">{t(helpDeskText.typeFallbackHint)}</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 shadow-xl shadow-emerald-200/40">
                      <div className="flex flex-col gap-4 rounded-t-[32px] border-b border-emerald-100 bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/30 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                            <Sparkles className="h-4 w-4" />
                            <span>{t(helpDeskText.assistantName)}</span>
                          </div>
                          {(liveStatusLabel || liveStatusIcon) && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                              {liveStatusIcon ?? <Sprout className="h-4 w-4 text-emerald-500" />}
                              <span>{liveStatusLabel ?? t(recommendationsTranslations.assistantHelper)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        ref={chatContainerRef}
                        className="flex max-h-[70vh] min-h-[320px] flex-col gap-5 overflow-y-auto bg-gradient-to-b from-white via-white to-emerald-50/60 p-4 sm:min-h-[360px] sm:p-6"
                      >
                        {chatTimeline.length === 0 ? (
                          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white/90 p-6 text-center">
                            <Sprout className="h-6 w-6 text-emerald-600" />
                            <p className="text-sm text-slate-600">{t(recommendationsTranslations.assistantEmptyState)}</p>
                            <p className="text-xs text-slate-500">{t(recommendationsTranslations.assistantHelper)}</p>
                          </div>
                        ) : (
                          <>
                            {chatTimeline.map((message) => {
                              const isAssistant = message.role === "assistant";
                              const animationState = animatedMessages[message.id];
                              const isAnimating = Boolean(isAssistant && animationState && !animationState.isComplete);
                              const animatedText = animationState?.visibleText ?? "";

                              return (
                                <div key={message.id} className="flex w-full justify-start">
                                  <div className={`flex w-full gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
                                    <Avatar
                                      className={`h-10 w-10 border text-sm font-semibold ${isAssistant ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                                    >
                                      <AvatarFallback>{isAssistant ? "LV" : "FR"}</AvatarFallback>
                                    </Avatar>

                                    <div className={`flex max-w-full flex-col gap-2 ${isAssistant ? "items-start sm:max-w-[80%]" : "items-end sm:max-w-[80%]"}`}>
                                      <div className={`flex w-full flex-wrap items-center gap-2 text-xs font-semibold ${isAssistant ? "text-amber-700" : "justify-end text-emerald-700"}`}>
                                        <div className="flex items-center gap-2">
                                          {isAssistant ? (
                                            <>
                                              <Sparkles className="h-4 w-4" />
                                              <span>{t(helpDeskText.assistantName)}</span>
                                            </>
                                          ) : (
                                            <>
                                              <Sprout className="h-4 w-4" />
                                              <span>{t(recommendationsTranslations.assistantFarmerLabel)}</span>
                                            </>
                                          )}
                                        </div>
                                        {isAssistant && (
                                          <div className="flex items-center gap-1">
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`flex h-9 w-9 rounded-full border bg-white/90 text-amber-600 hover:bg-amber-100 sm:h-8 sm:w-8 ${
                                                      mutedMessageIds.has(message.id)
                                                        ? "border-amber-300 opacity-60"
                                                        : "border-amber-200"
                                                    }`}
                                                    onClick={() => handleToggleMuteMessage(message.id)}
                                                    disabled={!speechSupported || isAnimating}
                                                    aria-label={mutedMessageIds.has(message.id) ? t(helpDeskText.unmuteMessageLabel) : t(helpDeskText.muteMessageLabel)}
                                                  >
                                                    {mutedMessageIds.has(message.id) ? (
                                                      <VolumeX className="h-4 w-4" />
                                                    ) : (
                                                      <Volume2 className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  {mutedMessageIds.has(message.id)
                                                    ? t(helpDeskText.unmuteMessageLabel)
                                                    : speechSupported
                                                      ? t(helpDeskText.muteMessageLabel)
                                                      : t(helpDeskText.speakDisabled)}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                            {!mutedMessageIds.has(message.id) && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      type="button"
                                                      size="icon"
                                                      variant="ghost"
                                                      className="flex h-9 w-9 rounded-full border border-amber-200 bg-white/90 text-amber-600 hover:bg-amber-100 sm:h-8 sm:w-8"
                                                      onClick={() => handleSpeakMessage(message)}
                                                      disabled={!speechSupported || isAnimating}
                                                      aria-label={t(helpDeskText.playVoiceLabel)}
                                                    >
                                                      <Volume2 className="h-4 w-4" />
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    {speechSupported ? t(helpDeskText.playVoiceLabel) : t(helpDeskText.speakDisabled)}
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      <div className={`w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${isAssistant ? "border-amber-200 bg-amber-50 text-slate-800" : "border-emerald-200 bg-emerald-50 text-slate-800"}`}>
                                        {isAssistant ? (
                                          isAnimating ? (
                                            <p className="whitespace-pre-wrap">{animatedText}</p>
                                          ) : (
                                            <div className="space-y-3">{renderAnswerText(message.content)}</div>
                                          )
                                        ) : (
                                          <p className="whitespace-pre-wrap">{message.content}</p>
                                        )}
                                      </div>

                                      {isAssistant && message.clarifyingQuestions && message.clarifyingQuestions.length > 0 && (
                                        <div className="flex w-full flex-wrap justify-start gap-2">
                                          {message.clarifyingQuestions.map((item, index) => (
                                            <Button
                                              key={`${message.id}-clarify-${index}`}
                                              type="button"
                                              size="sm"
                                              variant="secondary"
                                              className="rounded-full border-amber-200 bg-white/90 text-xs text-amber-700 hover:bg-amber-100"
                                              onClick={() => handleSuggestionClick(item)}
                                              disabled={isAnimating}
                                            >
                                              {item}
                                            </Button>
                                          ))}
                                        </div>
                                      )}

                                      {isAssistant && message.followUps && message.followUps.length > 0 && (
                                        <div className="flex w-full flex-wrap justify-start gap-2">
                                          {message.followUps.map((item, index) => (
                                            <Button
                                              key={`${message.id}-follow-${index}`}
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="rounded-full border-amber-300 text-xs text-amber-700 hover:bg-amber-100"
                                              onClick={() => handleSuggestionClick(item)}
                                              disabled={isAnimating}
                                            >
                                              {item}
                                            </Button>
                                          ))}
                                        </div>
                                      )}

                                      {isAssistant && message.sources && message.sources.length > 0 && (
                                        <div className="w-full space-y-2 rounded-2xl border border-amber-200 bg-white/90 p-3 text-xs text-slate-600">
                                          <div className="flex items-center gap-2 font-semibold text-amber-700">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {t(helpDeskText.referencesHeading)}
                                          </div>
                                          <ul className="space-y-2">
                                            {message.sources.map((source, index) => (
                                              <li key={`${message.id}-source-${index}`} className="space-y-1">
                                                <p className="font-medium text-slate-800">{source.title}</p>
                                                <p>{source.summary}</p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                  {source.confidence && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                      {source.confidence}
                                                    </Badge>
                                                  )}
                                                  {source.source && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                      {source.source}
                                                    </Badge>
                                                  )}
                                                  {source.lastVerified && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                      {source.lastVerified}
                                                    </Badge>
                                                  )}
                                                  {source.url && (
                                                    <a
                                                      href={source.url}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="text-[10px] text-primary underline"
                                                    >
                                                      {source.url}
                                                    </a>
                                                  )}
                                                </div>
                                                {source.note && <p>{source.note}</p>}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {isAssistant && message.safetyMessage && (
                                        <Alert className="w-full border-amber-300 bg-amber-50">
                                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                                          <AlertTitle>{t(helpDeskText.safetyHeading)}</AlertTitle>
                                          <AlertDescription>{message.safetyMessage}</AlertDescription>
                                        </Alert>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {isLoading && (
                              <div className="flex w-full justify-start">
                                <div className="flex w-full gap-3">
                                  <Avatar className="h-10 w-10 border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700">
                                    <AvatarFallback>SM</AvatarFallback>
                                  </Avatar>
                                  <div className="flex max-w-full flex-col items-start gap-2 sm:max-w-[80%]">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                                      <Sparkles className="h-4 w-4" />
                                      <span>{t(helpDeskText.assistantName)}</span>
                                    </div>
                                    <div className="w-full rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-700 shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t(helpDeskText.thinkingMessage)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <form className="space-y-3 border-t border-emerald-100 px-4 py-4 sm:px-6" onSubmit={handleSubmitQuestion}>
                        <div className="flex flex-col items-stretch gap-3 rounded-[24px] border border-emerald-200 bg-white px-4 py-3 shadow-sm focus-within:border-emerald-400 sm:flex-row sm:items-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant={isListening ? "default" : "outline"}
                                  className={`h-10 w-10 rounded-full transition-colors ${
                                    isListening
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                      : "border-emerald-300 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                  onClick={handleToggleListening}
                                  disabled={!listeningSupported}
                                  aria-pressed={isListening}
                                >
                                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{isListening ? t(helpDeskText.micStop) : t(helpDeskText.micHint)}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Textarea
                            value={
                              isListening && interimTranscript
                                ? `${question.trim()} ${interimTranscript}`.trim()
                                : question
                            }
                            onChange={(event) => {
                              if (!isListening) {
                                setQuestion(event.target.value);
                                updateDetectedLanguage(detectInputLanguage(event.target.value, detectedLanguage), "input");
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey && !isListening) {
                                event.preventDefault();
                                void handleSubmitQuestion();
                              }
                            }}
                            placeholder={
                              isListening && interimTranscript
                                ? interimTranscript
                                : t(recommendationsTranslations.assistantPlaceholder)
                            }
                            rows={2}
                            className={`min-h-[42px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 ${
                              isListening && interimTranscript ? "text-emerald-600 italic" : ""
                            }`}
                            readOnly={voiceOnlyActive || isListening}
                          />

                          {!voiceOnlyActive && (
                            <Button
                              type="submit"
                              size="icon"
                              className="ml-auto h-12 w-12 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-500/90 sm:ml-0"
                              disabled={isLoading}
                              aria-label={t(helpDeskText.sendMessageLabel)}
                            >
                              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            {isListening ? (
                              <>
                                <div className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                                  <Mic className="relative h-3.5 w-3.5 text-emerald-500" />
                                </div>
                                <span className="text-emerald-600 font-medium">
                                  {interimTranscript ? `${t(helpDeskText.listening)}... "${interimTranscript}"` : t(helpDeskText.listening)}
                                </span>
                              </>
                            ) : (
                              <>
                                <Mic className="h-3.5 w-3.5 text-emerald-400" />
                                <span>{t(helpDeskText.micHint)}</span>
                              </>
                            )}
                          </div>
                          {!speechSupported && <span>{t(helpDeskText.speakDisabled)}</span>}
                        </div>
                      </form>

                      {voiceError && (
                        <div className="mx-4 mb-4 sm:mx-6">
                          <Alert variant="destructive">
                            <AlertTitle>{t(helpDeskText.voiceError)}</AlertTitle>
                            <AlertDescription>{voiceError}</AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <aside className="space-y-6">
                {!isActivated ? (
                  <>
                    <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 p-6 shadow-lg shadow-emerald-200/30 sm:p-7">
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{t(landingCopy.whatHappensTitle)}</p>
                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <p>{t(landingCopy.whatHappensIntro)}</p>
                        <p>{t(landingCopy.whatHappensBulletOne)}</p>
                        <p>{t(landingCopy.whatHappensBulletTwo)}</p>
                        <p>{t(landingCopy.whatHappensBulletThree)}</p>
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 p-6 shadow-lg shadow-emerald-200/30 sm:p-7">
                      <div className="space-y-5">
                        {[
                          {
                            icon: Sparkles,
                            title: t(landingCopy.featureRagTitle),
                            description: t(landingCopy.featureRagDescription),
                          },
                          {
                            icon: Mic,
                            title: t(landingCopy.featureVoiceTitle),
                            description: t(landingCopy.featureVoiceDescription),
                          },
                          {
                            icon: ShieldCheck,
                            title: t(landingCopy.voiceModeLabel),
                            description: t(landingCopy.voiceModeDescription),
                          },
                        ].map(({ icon, title, description }, index) => {
                          const Icon = icon;
                          return (
                            <div key={title} className={`flex items-start gap-3 ${index !== 0 ? "border-t border-emerald-50 pt-5" : ""}`}>
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <Icon className="h-5 w-5" />
                              </span>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-800">{title}</p>
                                <p className="text-xs text-slate-600 sm:text-sm">{description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 p-6 shadow-lg shadow-emerald-200/30 sm:p-7">
                      <div className="flex items-center gap-3">
                        {liveStatusIcon ?? <Sparkles className="h-5 w-5 text-emerald-500" />}
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-800">{t(helpDeskText.assistantName)}</p>
                          <p className="text-xs text-slate-600 sm:text-sm">{liveStatusLabel ?? t(recommendationsTranslations.assistantHelper)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-800">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{t(helpDeskText.autoSpeakLabel)}</span>
                          <Badge variant="outline" className="border-emerald-200 bg-white/70 text-[11px] text-emerald-700">
                            {autoSpeak ? "ON" : "OFF"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{t(helpDeskText.autoListenLabel)}</span>
                          <Badge variant="outline" className="border-emerald-200 bg-white/70 text-[11px] text-emerald-700">
                            {autoListen && listeningSupported ? "ON" : "OFF"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{t(helpDeskText.detectedLanguage)}</span>
                          <Badge variant="outline" className="border-emerald-200 bg-white/70 text-[11px] text-emerald-700">
                            {detectedLanguageLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-emerald-100/70 bg-white/95 p-6 shadow-lg shadow-emerald-200/30 sm:p-7">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        {t(helpDeskText.referencesHeading)}
                      </div>
                      {latestReferences.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-600">{t(helpDeskText.referencesEmpty)}</p>
                      ) : (
                        <ul className="mt-5 space-y-4">
                          {latestReferences.map((reference) => (
                            <li key={reference.id} className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-slate-700">
                              <p className="font-semibold text-slate-800">{reference.title}</p>
                              <p className="text-xs text-slate-600">{reference.summary}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700">
                                  {reference.source}
                                </Badge>
                                {reference.updated && (
                                  <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700">
                                    {reference.updated}
                                  </Badge>
                                )}
                                {typeof reference.score === "number" && (
                                  <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700">
                                    {Math.round(reference.score * 100)}%
                                  </Badge>
                                )}
                                {reference.url && (
                                  <a
                                    href={reference.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 underline"
                                  >
                                    {reference.url.replace(/^https?:\/\//i, "").split("/")[0]}
                                  </a>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FarmerHelpDesk;


