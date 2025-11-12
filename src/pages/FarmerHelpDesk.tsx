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
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { recommendationsTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
type LanguageCode = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";

type SpeechRecognitionResultItem = {
  0?: {
    transcript?: string;
  };
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
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
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
const MARATHI_HINT_REGEX =
  /(शेत|शेतकरी|महाराष्ट्र|कर्ज|योजना|उत्पादन|खत|पाऊस|माती|सल्ला|अनुदान)/;
const HINDI_HINT_REGEX =
  /(किसान|योजना|ऋण|उर्वरक|मौसम|पैदावार|फसल|खरीफ|रबी|बीमा|सरकार)/;

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
  | "speakingMessage",
  Record<LanguageCode, string>
> = {
  tagline: {
    en: "Realtime guidance on Maharashtra schemes, loans, weather and crop care.",
    hi: "महाराष्ट्र के किसानों के लिए योजनाओं, ऋण, मौसम और फसल देखभाल पर तुरंत मार्गदर्शन।",
    mr: "महाराष्ट्रातील शेतकऱ्यांसाठी योजना, कर्ज, हवामान व पिक व्यवस्थापन यावर तत्काळ मार्गदर्शन.",
    pa: "Realtime guidance on Maharashtra schemes, loans, weather and crop care.",
    ta: "Realtime guidance on Maharashtra schemes, loans, weather and crop care.",
    te: "Realtime guidance on Maharashtra schemes, loans, weather and crop care.",
    bn: "Realtime guidance on Maharashtra schemes, loans, weather and crop care.",
  },
  autoSpeakLabel: {
    en: "Auto speak replies",
    hi: "उत्तर स्वचालित सुनाएँ",
    mr: "उत्तरे आपोआप वाचा",
    pa: "Auto speak replies",
    ta: "Auto speak replies",
    te: "Auto speak replies",
    bn: "Auto speak replies",
  },
  autoSpeakHelper: {
    en: "Hear the Live Voice Assistant's guidance aloud.",
    hi: "Live Voice Assistant की सलाह सुनें।",
    mr: "Live Voice Assistant चे सल्ले ऐका.",
    pa: "Hear the Live Voice Assistant's guidance aloud.",
    ta: "Hear the Live Voice Assistant's guidance aloud.",
    te: "Hear the Live Voice Assistant's guidance aloud.",
    bn: "Hear the Live Voice Assistant's guidance aloud.",
  },
  autoListenLabel: {
    en: "Auto listen",
    hi: "स्वचालित सुनना",
    mr: "ऐकणे आपोआप",
    pa: "Auto listen",
    ta: "Auto listen",
    te: "Auto listen",
    bn: "Auto listen",
  },
  autoListenHelper: {
    en: "Keep the mic ready so you can speak without tapping again.",
    hi: "माइक्रोफोन को तैयार रखता है ताकि बिना टैप किए बोल सकें।",
    mr: "मायक्रोफोन तयार ठेवतो जेणेकरून पुन्हा टॅप न करता बोलू शकता.",
    pa: "Keep the mic ready so you can speak without tapping again.",
    ta: "Keep the mic ready so you can speak without tapping again.",
    te: "Keep the mic ready so you can speak without tapping again.",
    bn: "Keep the mic ready so you can speak without tapping again.",
  },
  voiceUnsupported: {
    en: "Voice features are not supported in this browser. Please type your question.",
    hi: "यह ब्राउज़र वॉइस सुविधा का समर्थन नहीं करता। कृपया अपना प्रश्न टाइप करें।",
    mr: "हा ब्राउझर आवाज सुविधा समर्थित करत नाही. कृपया तुमचा प्रश्न टाइप करा.",
    pa: "Voice features are not supported in this browser. Please type your question.",
    ta: "Voice features are not supported in this browser. Please type your question.",
    te: "Voice features are not supported in this browser. Please type your question.",
    bn: "Voice features are not supported in this browser. Please type your question.",
  },
  listening: {
    en: "Listening…",
    hi: "सुन रहा है…",
    mr: "ऐकत आहे…",
    pa: "Listening…",
    ta: "Listening…",
    te: "Listening…",
    bn: "Listening…",
  },
  micHint: {
    en: "Tap the mic to speak",
    hi: "बोलने के लिए माइक्रोफोन टैप करें",
    mr: "बोलण्यासाठी मायक्रोफोन टॅप करा",
    pa: "Tap the mic to speak",
    ta: "Tap the mic to speak",
    te: "Tap the mic to speak",
    bn: "Tap the mic to speak",
  },
  micStop: {
    en: "Stop listening",
    hi: "सुनना बंद करें",
    mr: "ऐकणे थांबवा",
    pa: "Stop listening",
    ta: "Stop listening",
    te: "Stop listening",
    bn: "Stop listening",
  },
  detectedLanguage: {
    en: "Detected language",
    hi: "पहचानी गई भाषा",
    mr: "ओळखलेली भाषा",
    pa: "Detected language",
    ta: "Detected language",
    te: "Detected language",
    bn: "Detected language",
  },
  referencesHeading: {
    en: "Verified references",
    hi: "सत्यापित संदर्भ",
    mr: "प्रमाणित संदर्भ",
    pa: "Verified references",
    ta: "Verified references",
    te: "Verified references",
    bn: "Verified references",
  },
  referencesEmpty: {
    en: "Ask about a specific crop, scheme, or loan to view matching references.",
    hi: "किसी विशेष फसल, योजना या ऋण के बारे में पूछें ताकि संबंधित संदर्भ दिखें।",
    mr: "विशिष्ट पीक, योजना किंवा कर्जाबद्दल विचारल्यास संबंधित संदर्भ पाहू शकता.",
    pa: "Ask about a specific crop, scheme, or loan to view matching references.",
    ta: "Ask about a specific crop, scheme, or loan to view matching references.",
    te: "Ask about a specific crop, scheme, or loan to view matching references.",
    bn: "Ask about a specific crop, scheme, or loan to view matching references.",
  },
  clarifyingHeading: {
    en: "Clarifying questions",
    hi: "अतिरिक्त जानकारी के प्रश्न",
    mr: "स्पष्ट करणारे प्रश्न",
    pa: "Clarifying questions",
    ta: "Clarifying questions",
    te: "Clarifying questions",
    bn: "Clarifying questions",
  },
  safetyHeading: {
    en: "Safety note",
    hi: "सुरक्षा सूचना",
    mr: "सुरक्षा सूचना",
    pa: "Safety note",
    ta: "Safety note",
    te: "Safety note",
    bn: "Safety note",
  },
  voiceError: {
    en: "Voice error",
    hi: "वॉइस त्रुटि",
    mr: "आवाज त्रुटी",
    pa: "Voice error",
    ta: "Voice error",
    te: "Voice error",
    bn: "Voice error",
  },
  speakDisabled: {
    en: "Turn on audio permissions to hear replies.",
    hi: "उत्तर सुनने के लिए ब्राउज़र में ऑडियो अनुमति चालू करें।",
    mr: "उत्तरे ऐकण्यासाठी ब्राउझरमध्ये ऑडिओ परवानग्या सक्रिय करा.",
    pa: "Turn on audio permissions to hear replies.",
    ta: "Turn on audio permissions to hear replies.",
    te: "Turn on audio permissions to hear replies.",
    bn: "Turn on audio permissions to hear replies.",
  },
  liveChatHeading: {
    en: "Live Voice Assistant Chat",
    hi: "लाइव वॉइस असिस्टेंट चैट",
    mr: "लाईव्ह व्हॉइस असिस्टंट चॅट",
    pa: "Live Voice Assistant Chat",
    ta: "Live Voice Assistant Chat",
    te: "Live Voice Assistant Chat",
    bn: "Live Voice Assistant Chat",
  },
  activePillLabel: {
    en: "Live Voice Assistant Active",
    hi: "सक्रिय Live Voice Assistant",
    mr: "Live Voice Assistant सक्रिय",
    pa: "Live Voice Assistant Active",
    ta: "Live Voice Assistant Active",
    te: "Live Voice Assistant Active",
    bn: "Live Voice Assistant Active",
  },
  assistantName: {
    en: "Live Voice Assistant",
    hi: "लाइव वॉइस असिस्टेंट",
    mr: "लाईव्ह व्हॉइस असिस्टंट",
    pa: "Live Voice Assistant",
    ta: "Live Voice Assistant",
    te: "Live Voice Assistant",
    bn: "Live Voice Assistant",
  },
  playVoiceLabel: {
    en: "Play reply again",
    hi: "उत्तर दोबारा सुनें",
    mr: "उत्तर पुन्हा ऐका",
    pa: "Play reply again",
    ta: "Play reply again",
    te: "Play reply again",
    bn: "Play reply again",
  },
  sendMessageLabel: {
    en: "Send",
    hi: "भेजें",
    mr: "पाठवा",
    pa: "Send",
    ta: "Send",
    te: "Send",
    bn: "Send",
  },
  voiceOnlyActive: {
    en: "Listening… Speak your question and we will reply aloud automatically.",
    hi: "सुन रहा है… बस बोलें, जवाब अपने आप सुनाई देगा।",
    mr: "ऐकत आहे… तुमचा प्रश्न बोला, उत्तर आपोआप ऐकू येईल.",
    pa: "Listening… Speak your question and we will reply aloud automatically.",
    ta: "Listening… Speak your question and we will reply aloud automatically.",
    te: "Listening… Speak your question and we will reply aloud automatically.",
    bn: "Listening… Speak your question and we will reply aloud automatically.",
  },
  typeFallbackHint: {
    en: "Typing is available when voice support is unavailable.",
    hi: "जब वॉइस सुविधा उपलब्ध नहीं हो, तब आप टाइप कर सकते हैं।",
    mr: "आवाज उपलब्ध नसेल तेव्हा तुम्ही टाइप करू शकता.",
    pa: "Typing is available when voice support is unavailable.",
    ta: "Typing is available when voice support is unavailable.",
    te: "Typing is available when voice support is unavailable.",
    bn: "Typing is available when voice support is unavailable.",
  },
  thinkingMessage: {
    en: "Live Voice Assistant is thinking…",
    hi: "Live Voice Assistant सोच रहा है…",
    mr: "Live Voice Assistant विचार करत आहे…",
    pa: "Live Voice Assistant is thinking…",
    ta: "Live Voice Assistant is thinking…",
    te: "Live Voice Assistant is thinking…",
    bn: "Live Voice Assistant is thinking…",
  },
  typingMessage: {
    en: "Live Voice Assistant is typing…",
    hi: "Live Voice Assistant टाइप कर रहा है…",
    mr: "Live Voice Assistant टाइप करत आहे…",
    pa: "Live Voice Assistant is typing…",
    ta: "Live Voice Assistant is typing…",
    te: "Live Voice Assistant is typing…",
    bn: "Live Voice Assistant is typing…",
  },
  speakingMessage: {
    en: "Speaking your answer…",
    hi: "आपके उत्तर को आवाज़ में सुनाया जा रहा है…",
    mr: "आपला उत्तर आवाजेत सांगत आहे…",
    pa: "Speaking your answer…",
    ta: "Speaking your answer…",
    te: "Speaking your answer…",
    bn: "Speaking your answer…",
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
    pa: "Live Voice Assistant",
    ta: "Live Voice Assistant",
    te: "Live Voice Assistant",
    bn: "Live Voice Assistant",
  },
  heroDescription: {
    en: "Instant support on Maharashtra schemes, credit, soil care and crop management.",
    hi: "महाराष्ट्र की योजनाओं, ऋण, मिट्टी और फसल प्रबंधन पर त्वरित सहायता।",
    mr: "महाराष्ट्रातील योजना, कर्ज, माती आणि पिक व्यवस्थापनावर तत्काळ सहाय्य.",
    pa: "Instant support on Maharashtra schemes, credit, soil care and crop management.",
    ta: "Instant support on Maharashtra schemes, credit, soil care and crop management.",
    te: "Instant support on Maharashtra schemes, credit, soil care and crop management.",
    bn: "Instant support on Maharashtra schemes, credit, soil care and crop management.",
  },
  badgeMarathi: {
    en: "Marathi",
    hi: "मराठी",
    mr: "मराठी",
    pa: "Marathi",
    ta: "Marathi",
    te: "Marathi",
    bn: "Marathi",
  },
  badgeHindi: {
    en: "Hindi",
    hi: "हिन्दी",
    mr: "हिंदी",
    pa: "Hindi",
    ta: "Hindi",
    te: "Hindi",
    bn: "Hindi",
  },
  badgeEnglish: {
    en: "English",
    hi: "अंग्रेज़ी",
    mr: "English",
    pa: "English",
    ta: "English",
    te: "English",
    bn: "English",
  },
  featureRagTitle: {
    en: "Realtime RAG Support",
    hi: "रीयलटाइम RAG सहायता",
    mr: "रिअलटाइम RAG सहाय्य",
    pa: "Realtime RAG Support",
    ta: "Realtime RAG Support",
    te: "Realtime RAG Support",
    bn: "Realtime RAG Support",
  },
  featureRagDescription: {
    en: "Verified schemes, weather updates, and crop care insights within seconds.",
    hi: "कुछ ही सेकंड में सत्यापित योजनाएँ, मौसम अपडेट और फसल देखभाल सुझाव।",
    mr: "सेकंदात योजना, हवामान आणि पीक व्यवस्थापन माहिती.",
    pa: "Verified schemes, weather updates, and crop care insights within seconds.",
    ta: "Verified schemes, weather updates, and crop care insights within seconds.",
    te: "Verified schemes, weather updates, and crop care insights within seconds.",
    bn: "Verified schemes, weather updates, and crop care insights within seconds.",
  },
  featureVoiceTitle: {
    en: "Voice + Chat Assist",
    hi: "आवाज़ और चैट सहायता",
    mr: "आवाज + चॅट सहाय्य",
    pa: "Voice + Chat Assist",
    ta: "Voice + Chat Assist",
    te: "Voice + Chat Assist",
    bn: "Voice + Chat Assist",
  },
  featureVoiceDescription: {
    en: "Farmers can speak or type in Marathi, Hindi, or English anytime.",
    hi: "किसान कभी भी मराठी, हिंदी या अंग्रेज़ी में बोल या टाइप कर सकते हैं।",
    mr: "शेतकरी कोणत्याही वेळी मराठी, हिंदी किंवा इंग्रजीत बोलू अथवा लिहू शकतात.",
    pa: "Farmers can speak or type in Marathi, Hindi, or English anytime.",
    ta: "Farmers can speak or type in Marathi, Hindi, or English anytime.",
    te: "Farmers can speak or type in Marathi, Hindi, or English anytime.",
    bn: "Farmers can speak or type in Marathi, Hindi, or English anytime.",
  },
  activationTitle: {
    en: "Activate Live Voice Assistant",
    hi: "Live Voice Assistant सक्रिय करें",
    mr: "Live Voice Assistant सक्रिय करा",
    pa: "Activate Live Voice Assistant",
    ta: "Activate Live Voice Assistant",
    te: "Activate Live Voice Assistant",
    bn: "Activate Live Voice Assistant",
  },
  activationTag: {
    en: "Farmer-first conversational support",
    hi: "किसान-केंद्रित संवाद सहायता",
    mr: "शेतकरी-केंद्रित संवाद सहाय्य",
    pa: "Farmer-first conversational support",
    ta: "Farmer-first conversational support",
    te: "Farmer-first conversational support",
    bn: "Farmer-first conversational support",
  },
  activationDescription: {
    en: "Launch a multilingual assistant that greets farmers naturally and guides them through schemes, credit, soil health, weather, and crop care using verified datasets.",
    hi: "एक बहुभाषी सहायक शुरू करें जो किसानों का स्वाभाविक स्वागत करे और योजनाओं, ऋण, मिट्टी, मौसम और फसल देखभाल में मार्गदर्शन दे।",
    mr: "बहुभाषिक सहाय्यक सक्रिय करा जो शेतकऱ्यांना योजना, कर्ज, माती, हवामान आणि पीक व्यवस्थापनासाठी मार्गदर्शन करतो.",
    pa: "Launch a multilingual assistant that greets farmers naturally and guides them through schemes, credit, soil health, weather, and crop care using verified datasets.",
    ta: "Launch a multilingual assistant that greets farmers naturally and guides them through schemes, credit, soil health, weather, and crop care using verified datasets.",
    te: "Launch a multilingual assistant that greets farmers naturally and guides them through schemes, credit, soil health, weather, and crop care using verified datasets.",
    bn: "Launch a multilingual assistant that greets farmers naturally and guides them through schemes, credit, soil health, weather, and crop care using verified datasets.",
  },
  activationBulletOne: {
    en: "Hands-free voice questions with automatic speech replies for field situations.",
    hi: "हाथों से मुक्त आवाज़ इनपुट और स्वचालित उत्तर जिससे खेत में भी सलाह मिले।",
    mr: "हँड्स-फ्री आवाज प्रश्न आणि स्वयंचलित उत्तर, शेतातही सल्ला उपलब्ध.",
    pa: "Hands-free voice questions with automatic speech replies for field situations.",
    ta: "Hands-free voice questions with automatic speech replies for field situations.",
    te: "Hands-free voice questions with automatic speech replies for field situations.",
    bn: "Hands-free voice questions with automatic speech replies for field situations.",
  },
  activationBulletTwo: {
    en: "Clarifying prompts before the final plan so every recommendation fits the farm.",
    hi: "अंतिम सुझाव से पहले स्पष्टीकरण पूछे जाते हैं ताकि सलाह खेत के अनुरूप हो।",
    mr: "अंतिम सल्ल्यापूर्वी स्पष्ट करणारे प्रश्न, जेणेकरून सुचना शेताशी जुळतील.",
    pa: "Clarifying prompts before the final plan so every recommendation fits the farm.",
    ta: "Clarifying prompts before the final plan so every recommendation fits the farm.",
    te: "Clarifying prompts before the final plan so every recommendation fits the farm.",
    bn: "Clarifying prompts before the final plan so every recommendation fits the farm.",
  },
  activationBulletThree: {
    en: "Trusted answers grounded in Maharashtra schemes, NABARD, PM-KISAN, and IMD data.",
    hi: "विश्वसनीय उत्तर जो महाराष्ट्र योजनाओं, NABARD, PM-KISAN और IMD डेटा पर आधारित हैं।",
    mr: "महाराष्ट्र योजना, NABARD, PM-KISAN आणि IMD डेटावर आधारित विश्वासार्ह माहिती.",
    pa: "Trusted answers grounded in Maharashtra schemes, NABARD, PM-KISAN, and IMD data.",
    ta: "Trusted answers grounded in Maharashtra schemes, NABARD, PM-KISAN, and IMD data.",
    te: "Trusted answers grounded in Maharashtra schemes, NABARD, PM-KISAN, and IMD data.",
    bn: "Trusted answers grounded in Maharashtra schemes, NABARD, PM-KISAN, and IMD data.",
  },
  activationButton: {
    en: "Activate Live Voice Assistant",
    hi: "Live Voice Assistant सक्रिय करें",
    mr: "Live Voice Assistant सक्रिय करा",
    pa: "Activate Live Voice Assistant",
    ta: "Activate Live Voice Assistant",
    te: "Activate Live Voice Assistant",
    bn: "Activate Live Voice Assistant",
  },
  whatHappensTitle: {
    en: "What happens after activation?",
    hi: "सक्रिय करने के बाद क्या होगा?",
    mr: "सक्रिय केल्यावर काय घडते?",
    pa: "What happens after activation?",
    ta: "What happens after activation?",
    te: "What happens after activation?",
    bn: "What happens after activation?",
  },
  whatHappensIntro: {
    en: "• Smart greeting in Marathi, Hindi, or English based on farmer preference and time of day.",
    hi: "• किसान की पसंद और समय के अनुसार मराठी, हिंदी या अंग्रेज़ी में अभिवादन।",
    mr: "• शेतकऱ्यांच्या पसंती आणि वेळेनुसार मराठी, हिंदी किंवा इंग्रजीत स्वागत.",
    pa: "• Smart greeting in Marathi, Hindi, or English based on farmer preference and time of day.",
    ta: "• Smart greeting in Marathi, Hindi, or English based on farmer preference and time of day.",
    te: "• Smart greeting in Marathi, Hindi, or English based on farmer preference and time of day.",
    bn: "• Smart greeting in Marathi, Hindi, or English based on farmer preference and time of day.",
  },
  whatHappensBulletOne: {
    en: "• Live chat timeline with voice playback, clarifying questions, and suggested follow-ups.",
    hi: "• वॉइस प्लेबैक, स्पष्ट सवाल और सुझाए गए फॉलो-अप के साथ लाइव चैट।",
    mr: "• आवाज प्लेबॅक, स्पष्ट करणारे प्रश्न आणि अनुशंसित पुढील प्रश्नांसह लाईव्ह चॅट.",
    pa: "• Live chat timeline with voice playback, clarifying questions, and suggested follow-ups.",
    ta: "• Live chat timeline with voice playback, clarifying questions, and suggested follow-ups.",
    te: "• Live chat timeline with voice playback, clarifying questions, and suggested follow-ups.",
    bn: "• Live chat timeline with voice playback, clarifying questions, and suggested follow-ups.",
  },
  whatHappensBulletTwo: {
    en: "• Dedicated panel showing verified government references and advisory sources for every answer.",
    hi: "• प्रत्येक उत्तर के लिए सत्यापित सरकारी संदर्भ और सलाह स्रोत दिखाने वाला पैनल।",
    mr: "• प्रत्येक उत्तरासाठी प्रमाणित सरकारी संदर्भ दाखवणारा स्वतंत्र पॅनेल.",
    pa: "• Dedicated panel showing verified government references and advisory sources for every answer.",
    ta: "• Dedicated panel showing verified government references and advisory sources for every answer.",
    te: "• Dedicated panel showing verified government references and advisory sources for every answer.",
    bn: "• Dedicated panel showing verified government references and advisory sources for every answer.",
  },
  whatHappensBulletThree: {
    en: "• Pro tip: Set the preferred language first. Live Voice Assistant will remember it throughout the session.",
    hi: "• सुझाव: पहले भाषा चुनें. Live Voice Assistant पूरे सत्र में उसी भाषा में उत्तर देगा।",
    mr: "• टिप: आधी पसंतीची भाषा निवडा. Live Voice Assistant संपूर्ण संवादात त्याच भाषेत उत्तर देईल.",
    pa: "• Pro tip: Set the preferred language first. Live Voice Assistant will remember it throughout the session.",
    ta: "• Pro tip: Set the preferred language first. Live Voice Assistant will remember it throughout the session.",
    te: "• Pro tip: Set the preferred language first. Live Voice Assistant will remember it throughout the session.",
    bn: "• Pro tip: Set the preferred language first. Live Voice Assistant will remember it throughout the session.",
  },
  proTip: {
    en: "Set the preferred language first. Live Voice Assistant will remember it and respond in the same language throughout the session.",
    hi: "सबसे पहले पसंदीदा भाषा चुनें. Live Voice Assistant पूरी बातचीत में उसी भाषा में जवाब देगा.",
    mr: "प्रथम पसंतीची भाषा निवडा. Live Voice Assistant संपूर्ण संवादात त्याच भाषेत उत्तर देईल.",
    pa: "Set the preferred language first. Live Voice Assistant will remember it and respond in the same language throughout the session.",
    ta: "Set the preferred language first. Live Voice Assistant will remember it and respond in the same language throughout the session.",
    te: "Set the preferred language first. Live Voice Assistant will remember it and respond in the same language throughout the session.",
    bn: "Set the preferred language first. Live Voice Assistant will remember it and respond in the same language throughout the session.",
  },
  voiceModeLabel: {
    en: "Voice mode",
    hi: "वॉइस मोड",
    mr: "व्हॉईस मोड",
    pa: "Voice mode",
    ta: "Voice mode",
    te: "Voice mode",
    bn: "Voice mode",
  },
  voiceModeDescription: {
    en: "Switch between spoken responses and text-only guidance whenever you need.",
    hi: "आवश्यकतानुसार बोलकर जवाब और केवल-पाठ मार्गदर्शन के बीच स्विच करें।",
    mr: "आवश्यकतेनुसार बोलून उत्तर आणि केवळ मजकूर मार्गदर्शन यामध्ये बदला.",
    pa: "Switch between spoken responses and text-only guidance whenever you need.",
    ta: "Switch between spoken responses and text-only guidance whenever you need.",
    te: "Switch between spoken responses and text-only guidance whenever you need.",
    bn: "Switch between spoken responses and text-only guidance whenever you need.",
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

const detectInputLanguage = (value: string): LanguageCode => {
  if (!value) {
    return "en";
  }

  if (DEVANAGARI_REGEX.test(value)) {
    if (MARATHI_HINT_REGEX.test(value)) {
      return "mr";
    }
    if (HINDI_HINT_REGEX.test(value)) {
      return "hi";
    }
    return "mr";
  }

  return "en";
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

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const greetingSpokenRef = useRef<string | null>(null);
  const lastGreetedActivationRef = useRef<number | null>(null);
  const activationLanguageRef = useRef<LanguageCode>("en");
  const pendingSpeechSubmitRef = useRef(false);
  const animationIntervalsRef = useRef<Record<string, number>>({});
  const handleSubmitQuestionRef = useRef<((event?: React.FormEvent<HTMLFormElement>) => Promise<void>) | null>(
    null,
  );
  const animatedMessageIdsRef = useRef<Set<string>>(new Set());
  const lastAutoResumeMessageIdRef = useRef<string | null>(null);
  const detectedLanguageSourceRef = useRef<"initial" | "manual" | "input" | "voice" | "response">("initial");

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

  const selectVoiceForLanguage = useCallback(
    (languageCode: LanguageCode): SpeechSynthesisVoice | null => {
      if (availableVoices.length === 0) {
        return null;
      }

      const locale = mapLanguageToLocale(languageCode).toLowerCase();
      const base = locale.split("-")[0];

      const preferenceMap: Partial<Record<LanguageCode, string[]>> = {
        mr: [locale, base, "hi-in", "hi", "en-in", "en"],
        hi: [locale, base, "hi", "en-in", "en"],
        en: ["en-in", "en-us", "en-gb", "en"],
      };

      const preferences = preferenceMap[languageCode] ?? preferenceMap.en ?? ["en"];

      for (const tag of preferences) {
        const match = availableVoices.find((voice) => voice.lang.toLowerCase() === tag);
        if (match) {
          return match;
        }
      }

      for (const tag of preferences) {
        const normalized = tag.includes("-") ? tag.split("-")[0] : tag;
        const match = availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(normalized));
        if (match) {
          return match;
        }
      }

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
        recognitionRef.current.lang = mapLanguageToLocale(detectedLanguage);
        recognitionRef.current.start();
        setIsListening(true);
        pendingSpeechSubmitRef.current = false;
        setVoiceError(null);
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
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = mapLanguageToLocale(detectedLanguage);
      recognitionInstance.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = Array.from(event.results)
          .map((result) => (result[0]?.transcript ?? "").trim())
          .join(" ")
          .trim();

        if (transcript.length > 0) {
          recognitionInstance.stop();
          setIsListening(false);
          const detected = detectInputLanguage(transcript);
          setQuestion(transcript);
          updateDetectedLanguage(detected, "voice");
          pendingSpeechSubmitRef.current = true;
          setTimeout(() => {
            if (pendingSpeechSubmitRef.current) {
              handleSubmitQuestionRef.current?.();
              pendingSpeechSubmitRef.current = false;
            }
          }, 150);
        }
      };
      recognitionInstance.onerror = () => {
        setIsListening(false);
        pendingSpeechSubmitRef.current = false;
      };
      recognitionInstance.onend = () => {
        setIsListening(false);
        const restarted = resumeAutoListening();
        if (!restarted) {
          pendingSpeechSubmitRef.current = false;
        }
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
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
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

  useEffect(() => {
    if (!speechSupported || assistantResponses.length === 0) {
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    const latest = assistantResponses[assistantResponses.length - 1];
    if (!latest || !latest.answer.trim()) {
      return;
    }
    if (spokenIdsRef.current.has(latest.id)) {
      return;
    }

    const languageForVoice = (latest.detectedLanguage || latest.language || detectedLanguage) as LanguageCode;
    const utterance = new SpeechSynthesisUtterance(stripMarkup(latest.answer));
    utterance.lang = mapLanguageToLocale(languageForVoice);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const targetVoice = selectVoiceForLanguage(languageForVoice);
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      const restarted = resumeAutoListening();
      if (restarted) {
        lastAutoResumeMessageIdRef.current = latest.id;
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      const restarted = resumeAutoListening();
      if (restarted) {
        lastAutoResumeMessageIdRef.current = latest.id;
      }
    };

    if (autoSpeak) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      spokenIdsRef.current.add(latest.id);
      setIsSpeaking(true);
    } else {
      setIsSpeaking(false);
    }
  }, [assistantResponses, autoSpeak, detectedLanguage, resumeAutoListening, selectVoiceForLanguage, speechSupported]);

  useEffect(() => {
    if (!isActivated || isListening) {
      return;
    }

    resumeAutoListening();
  }, [isActivated, isListening, resumeAutoListening]);

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
    if (!autoListen || isListening || !listeningSupported || !latestAssistantMessage) {
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
  }, [animatedMessages, autoListen, isListening, latestAssistantMessage, listeningSupported, resumeAutoListening]);

  useEffect(() => {
    return () => {
      Object.values(animationIntervalsRef.current).forEach((intervalId) => {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
      });
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

  const handleToggleListening = () => {
    if (!listeningSupported || !recognitionRef.current) {
      setVoiceError(t(helpDeskText.voiceUnsupported));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      pendingSpeechSubmitRef.current = false;
      return;
    }

    setVoiceError(null);
    const started = resumeAutoListening(true, (error) => {
      setVoiceError(error instanceof Error ? error.message : t(helpDeskText.voiceUnsupported));
    });

    if (!started) {
      pendingSpeechSubmitRef.current = false;
    }
  };

  const handleSpeakMessage = useCallback(
    (message: ChatTimelineMessage) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setVoiceError(t(helpDeskText.voiceUnsupported));
        return;
      }

      const cleanedText = stripMarkup(message.content);
      if (!cleanedText) {
        return;
      }

      setVoiceError(null);
      const languageForVoice = (message.detectedLanguage || detectedLanguage) as LanguageCode;
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = mapLanguageToLocale(languageForVoice);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      const targetVoice = selectVoiceForLanguage(languageForVoice);
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      spokenIdsRef.current.add(message.exchangeId);
    },
    [detectedLanguage, selectVoiceForLanguage, t],
  );

  const handleActivate = () => {
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
    if (autoListen) {
      const started = resumeAutoListening(false, (error) => {
        setVoiceError(error instanceof Error ? error.message : t(helpDeskText.voiceUnsupported));
      });
      if (!started) {
        setIsListening(false);
      }
    }
  };

  const handleSubmitQuestion = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (!isActivated) {
        toast({
          title: t(landingCopy.activationTitle),
          description: "Please activate the assistant to start the conversation.",
          variant: "destructive",
        });
        return;
      }

      const trimmedQuestion = question.trim();
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
      const inputLanguage = detectInputLanguage(trimmedQuestion);
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
          try {
            const errorPayload = await parseJsonResponse<{ error?: string; details?: string }>(response.clone());
            errorMessage = errorPayload.details || errorPayload.error || errorMessage;
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message) {
              errorMessage = parseError.message;
            }
          }
          throw new Error(errorMessage);
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
        pendingSpeechSubmitRef.current = false;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to get advice from Gemini assistant.";
        toast({
          title: t(recommendationsTranslations.assistantErrorTitle),
          description: message || t(recommendationsTranslations.assistantErrorDescription),
          variant: "destructive",
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
    updateDetectedLanguage(detectInputLanguage(value), "input");
    setTimeout(() => {
      void handleSubmitQuestion();
    }, 0);
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

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
                                                {speechSupported ? t(helpDeskText.autoSpeakHelper) : t(helpDeskText.speakDisabled)}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
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
                            value={question}
                            onChange={(event) => {
                              setQuestion(event.target.value);
                              updateDetectedLanguage(detectInputLanguage(event.target.value), "input");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void handleSubmitQuestion();
                              }
                            }}
                            placeholder={t(recommendationsTranslations.assistantPlaceholder)}
                            rows={2}
                            className="min-h-[42px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                            readOnly={voiceOnlyActive}
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
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                            ) : (
                              <Mic className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            <span>{isListening ? t(helpDeskText.listening) : t(helpDeskText.micHint)}</span>
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


