type Language = "en" | "hi" | "pa" | "ta" | "te" | "bn" | "mr";

type TranslationSet = Record<Language, string>;

type TranslationLanguages = {
  en: Record<string, string>;
  hi: Record<string, string>;
  pa: Record<string, string>;
  ta: Record<string, string>;
  te: Record<string, string>;
  bn: Record<string, string>;
  mr: Record<string, string>;
};

export const homePageTranslations: TranslationLanguages = {
  en: {
    featuresTitle: "How SoilSathi Helps Your Farm",
    featuresDescription: "Our simple tools help you understand your soil and use the right fertilizers for better crops.",
    
    feature1Title: "Soil Report Helper",
    feature1Description: "Upload your soil report or tell us about your soil color and texture to know what it needs.",
    
    feature2Title: "Crop Advice",
    feature2Description: "Get simple advice on what fertilizers to use for your crops.",
    
    feature3Title: "Local Advice",
    feature3Description: "Get advice that works for your region, soil type, and weather.",
    
    feature4Title: "Soil Health Tracking",
    feature4Description: "See how your soil is improving over time and what you can do better.",
    
    feature5Title: "Natural Farming Options",
    feature5Description: "Learn how to use cow dung, compost, and natural fertilizers to save money.",
    
    feature6Title: "Season Reminders",
    feature6Description: "Get reminders about when to test soil, apply fertilizers, and other important farm tasks.",
    
    howItWorksTitle: "How It Works - Just 3 Easy Steps",
    howItWorksDescription: "SoilSathi is simple to use - even without a soil report",
    
    step1Title: "Tell Us About Your Soil",
    step1Description: "Take a photo of your soil report or just tell us about your soil color and texture.",
    
    step2Title: "Get Simple Advice",
    step2Description: "Our system reads your information and tells you what your soil needs.",
    
    step3Title: "Better Crops, Less Cost",
    step3Description: "Follow our simple advice to use the right amount of fertilizer and grow better crops.",
    
    benefitsTitle: "How Farmers Benefit",
    benefitsDescription: "Thousands of farmers are already using SoilSathi to improve their crops and save money.",
    
    benefit1Title: "Save Money on Fertilizers",
    benefit1Description: "Use only what your soil needs - stop wasting money on extra fertilizers.",
    
    benefit2Title: "Grow Better Crops",
    benefit2Description: "Healthy soil gives you better crops and more income.",
    
    benefit3Title: "Natural Farming Options",
    benefit3Description: "Learn how to use local materials to make natural fertilizers.",
    
    benefit4Title: "Simple Farming Advice",
    benefit4Description: "Get easy-to-follow advice without complicated words.",
    
    ctaTitle: "Ready to Improve Your Soil?",
    ctaDescription: "Join thousands of farmers using SoilSathi for better crops with less cost.",
    
    getStarted: "Start Now",
    startAnalyzing: "Check Your Soil Now"
  },
  hi: {
    featuresTitle: "सॉइल साथी आपकी खेती में कैसे मदद करता है",
    featuresDescription: "हमारे सरल उपकरण आपको अपनी मिट्टी को समझने और बेहतर फसलों के लिए सही उर्वरकों का उपयोग करने में मदद करते हैं।",
    
    feature1Title: "मिट्टी रिपोर्ट सहायक",
    feature1Description: "अपनी मिट्टी की रिपोर्ट अपलोड करें या हमें अपनी मिट्टी के रंग और बनावट के बारे में बताएं।",
    
    feature2Title: "फसल सलाह",
    feature2Description: "अपनी फसलों के लिए किन उर्वरकों का उपयोग करना है, इस पर सरल सलाह प्राप्त करें।",
    
    feature3Title: "स्थानीय सलाह",
    feature3Description: "अपने क्षेत्र, मिट्टी के प्रकार और मौसम के लिए उपयुक्त सलाह प्राप्त करें।",
    
    feature4Title: "मिट्टी स्वास्थ्य ट्रैकिंग",
    feature4Description: "देखें कि आपकी मिट्टी समय के साथ कैसे सुधार कर रही है और आप क्या बेहतर कर सकते हैं।",
    
    feature5Title: "प्राकृतिक खेती विकल्प",
    feature5Description: "गोबर, कम्पोस्ट और प्राकृतिक उर्वरकों का उपयोग करके पैसे बचाने के तरीके सीखें।",
    
    feature6Title: "मौसम अनुस्मारक",
    feature6Description: "मिट्टी का परीक्षण करने, उर्वरक लगाने और अन्य महत्वपूर्ण खेती कार्यों के बारे में अनुस्मारक प्राप्त करें।",
    
    howItWorksTitle: "यह काम कैसे करता है - सिर्फ 3 आसान चरण",
    howItWorksDescription: "सॉइल साथी का उपयोग करना आसान है - बिना मिट्टी रिपोर्ट के भी",
    
    step1Title: "हमें अपनी मिट्टी के बारे में बताएं",
    step1Description: "अपनी मिट्टी की रिपोर्ट की फोटो लें या बस हमें अपनी मिट्टी के रंग और बनावट के बारे में बताएं।",
    
    step2Title: "सरल सलाह प्राप्त करें",
    step2Description: "हमारा सिस्टम आपकी जानकारी पढ़ता है और बताता है कि आपकी मिट्टी को क्या चाहिए।",
    
    step3Title: "बेहतर फसल, कम लागत",
    step3Description: "सही मात्रा में उर्वरक का उपयोग करने और बेहतर फसल उगाने के लिए हमारी सरल सलाह का पालन करें।",
    
    benefitsTitle: "किसानों को कैसे लाभ मिलता है",
    benefitsDescription: "हजारों किसान पहले से ही अपनी फसलों को बेहतर बनाने और पैसे बचाने के लिए सॉइल साथी का उपयोग कर रहे हैं।",
    
    benefit1Title: "उर्वरकों पर पैसे बचाएं",
    benefit1Description: "केवल वही उपयोग करें जिसकी आपकी मिट्टी को ज़रूरत है - अतिरिक्त उर्वरकों पर पैसा बर्बाद करना बंद करें।",
    
    benefit2Title: "बेहतर फसल उगाएं",
    benefit2Description: "स्वस्थ मिट्टी से आपको बेहतर फसल और अधिक आय मिलती है।",
    
    benefit3Title: "प्राकृतिक खेती विकल्प",
    benefit3Description: "प्राकृतिक उर्वरक बनाने के लिए स्थानीय सामग्री का उपयोग करना सीखें।",
    
    benefit4Title: "सरल खेती सलाह",
    benefit4Description: "बिना जटिल शब्दों के आसान सलाह प्राप्त करें।",
    
    ctaTitle: "अपनी मिट्टी को बेहतर बनाने के लिए तैयार हैं?",
    ctaDescription: "कम लागत में बेहतर फसल के लिए सॉइल साथी का उपयोग करने वाले हजारों किसानों से जुड़ें।",
    
    getStarted: "अभी शुरू करें",
    startAnalyzing: "अभी अपनी मिट्टी की जांच करें"
  },
  pa: {
    featuresTitle: "ਸੋਇਲ ਸਾਥੀ ਤੁਹਾਡੀ ਖੇਤੀ ਵਿੱਚ ਕਿਵੇਂ ਮਦਦ ਕਰਦਾ ਹੈ",
    featuresDescription: "ਸਾਡੇ ਸਧਾਰਨ ਟੂਲ ਤੁਹਾਨੂੰ ਆਪਣੀ ਮਿੱਟੀ ਨੂੰ ਸਮਝਣ ਅਤੇ ਵਧੀਆ ਫਸਲਾਂ ਲਈ ਸਹੀ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ।",
    
    feature1Title: "ਮਿੱਟੀ ਰਿਪੋਰਟ ਸਹਾਇਕ",
    feature1Description: "ਆਪਣੀ ਮਿੱਟੀ ਦੀ ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ ਜਾਂ ਸਾਨੂੰ ਆਪਣੀ ਮਿੱਟੀ ਦੇ ਰੰਗ ਅਤੇ ਬਣਤਰ ਬਾਰੇ ਦੱਸੋ।",
    
    feature2Title: "ਫਸਲ ਸਲਾਹ",
    feature2Description: "ਆਪਣੀਆਂ ਫਸਲਾਂ ਲਈ ਕਿਹੜੀਆਂ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰਨੀ ਹੈ, ਇਸ 'ਤੇ ਸਧਾਰਨ ਸਲਾਹ ਪ੍ਰਾਪਤ ਕਰੋ।",
    
    feature3Title: "ਸਥਾਨਕ ਸਲਾਹ",
    feature3Description: "ਆਪਣੇ ਇਲਾਕੇ, ਮਿੱਟੀ ਦੇ ਪ੍ਰਕਾਰ ਅਤੇ ਮੌਸਮ ਲਈ ਢੁਕਵੀਂ ਸਲਾਹ ਪ੍ਰਾਪਤ ਕਰੋ।",
    
    feature4Title: "ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਟਰੈਕਿੰਗ",
    feature4Description: "ਵੇਖੋ ਕਿ ਤੁਹਾਡੀ ਮਿੱਟੀ ਸਮੇਂ ਦੇ ਨਾਲ ਕਿਵੇਂ ਬਿਹਤਰ ਹੋ ਰਹੀ ਹੈ ਅਤੇ ਤੁਸੀਂ ਕੀ ਬਿਹਤਰ ਕਰ ਸਕਦੇ ਹੋ।",
    
    feature5Title: "ਕੁਦਰਤੀ ਖੇਤੀ ਵਿਕਲਪ",
    feature5Description: "ਗੋਬਰ, ਕੰਪੋਸਟ ਅਤੇ ਕੁਦਰਤੀ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਪੈਸੇ ਬਚਾਉਣ ਦੇ ਤਰੀਕੇ ਸਿੱਖੋ।",
    
    feature6Title: "ਮੌਸਮੀ ਰਿਮਾਈਂਡਰ",
    feature6Description: "ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਕਰਨ, ਖਾਦ ਪਾਉਣ ਅਤੇ ਹੋਰ ਮਹੱਤਵਪੂਰਨ ਖੇਤੀ ਕੰਮਾਂ ਬਾਰੇ ਯਾਦ-ਦਹਾਨੀਆਂ ਪ੍ਰਾਪਤ ਕਰੋ।",
    
    howItWorksTitle: "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ - ਸਿਰਫ 3 ਆਸਾਨ ਕਦਮ",
    howItWorksDescription: "ਸੋਇਲ ਸਾਥੀ ਦੀ ਵਰਤੋਂ ਕਰਨਾ ਆਸਾਨ ਹੈ - ਮਿੱਟੀ ਦੀ ਰਿਪੋਰਟ ਤੋਂ ਬਿਨਾਂ ਵੀ",
    
    step1Title: "ਸਾਨੂੰ ਆਪਣੀ ਮਿੱਟੀ ਬਾਰੇ ਦੱਸੋ",
    step1Description: "ਆਪਣੀ ਮਿੱਟੀ ਦੀ ਰਿਪੋਰਟ ਦੀ ਫੋਟੋ ਲਓ ਜਾਂ ਬਸ ਸਾਨੂੰ ਆਪਣੀ ਮਿੱਟੀ ਦੇ ਰੰਗ ਅਤੇ ਬਣਤਰ ਬਾਰੇ ਦੱਸੋ।",
    
    step2Title: "ਸਧਾਰਨ ਸਲਾਹ ਪ੍ਰਾਪਤ ਕਰੋ",
    step2Description: "ਸਾਡਾ ਸਿਸਟਮ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਪੜ੍ਹਦਾ ਹੈ ਅਤੇ ਦੱਸਦਾ ਹੈ ਕਿ ਤੁਹਾਡੀ ਮਿੱਟੀ ਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ।",
    
    step3Title: "ਬਿਹਤਰ ਫਸਲਾਂ, ਘੱਟ ਲਾਗਤ",
    step3Description: "ਸਹੀ ਮਾਤਰਾ ਵਿੱਚ ਖਾਦ ਦੀ ਵਰਤੋਂ ਕਰਨ ਅਤੇ ਵਧੀਆ ਫਸਲਾਂ ਉਗਾਉਣ ਲਈ ਸਾਡੀ ਸਧਾਰਨ ਸਲਾਹ ਦੀ ਪਾਲਣਾ ਕਰੋ।",
    
    benefitsTitle: "ਕਿਸਾਨਾਂ ਨੂੰ ਕਿਵੇਂ ਲਾਭ ਮਿਲਦਾ ਹੈ",
    benefitsDescription: "ਹਜ਼ਾਰਾਂ ਕਿਸਾਨ ਪਹਿਲਾਂ ਹੀ ਆਪਣੀਆਂ ਫਸਲਾਂ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਅਤੇ ਪੈਸੇ ਬਚਾਉਣ ਲਈ ਸੋਇਲ ਸਾਥੀ ਦੀ ਵਰਤੋਂ ਕਰ ਰਹੇ ਹਨ।",
    
    benefit1Title: "ਖਾਦਾਂ 'ਤੇ ਪੈਸੇ ਬਚਾਓ",
    benefit1Description: "ਸਿਰਫ ਉਹੀ ਵਰਤੋ ਜਿਸ ਦੀ ਤੁਹਾਡੀ ਮਿੱਟੀ ਨੂੰ ਲੋੜ ਹੈ - ਵਾਧੂ ਖਾਦਾਂ 'ਤੇ ਪੈਸਾ ਬਰਬਾਦ ਕਰਨਾ ਬੰਦ ਕਰੋ।",
    
    benefit2Title: "ਵਧੀਆ ਫਸਲਾਂ ਉਗਾਓ",
    benefit2Description: "ਸਿਹਤਮੰਦ ਮਿੱਟੀ ਤੁਹਾਨੂੰ ਵਧੀਆ ਫਸਲਾਂ ਅਤੇ ਵਧੇਰੇ ਆਮਦਨ ਦਿੰਦੀ ਹੈ।",
    
    benefit3Title: "ਕੁਦਰਤੀ ਖੇਤੀ ਵਿਕਲਪ",
    benefit3Description: "ਕੁਦਰਤੀ ਖਾਦਾਂ ਬਣਾਉਣ ਲਈ ਸਥਾਨਕ ਸਮੱਗਰੀ ਦੀ ਵਰਤੋਂ ਕਰਨਾ ਸਿੱਖੋ।",
    
    benefit4Title: "ਸਧਾਰਨ ਖੇਤੀ ਸਲਾਹ",
    benefit4Description: "ਬਿਨਾਂ ਗੁੰਝਲਦਾਰ ਸ਼ਬਦਾਂ ਦੇ ਆਸਾਨ ਸਲਾਹ ਪ੍ਰਾਪਤ ਕਰੋ।",
    
    ctaTitle: "ਆਪਣੀ ਮਿੱਟੀ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਲਈ ਤਿਆਰ ਹੋ?",
    ctaDescription: "ਘੱਟ ਲਾਗਤ 'ਤੇ ਵਧੀਆ ਫਸਲਾਂ ਲਈ ਸੋਇਲ ਸਾਥੀ ਦੀ ਵਰਤੋਂ ਕਰਨ ਵਾਲੇ ਹਜ਼ਾਰਾਂ ਕਿਸਾਨਾਂ ਨਾਲ ਜੁੜੋ।",
    
    getStarted: "ਹੁਣੇ ਸ਼ੁਰੂ ਕਰੋ",
    startAnalyzing: "ਹੁਣੇ ਆਪਣੀ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਕਰੋ"
  },
  ta: {
    featuresTitle: "சாயில் சாதி உங்கள் விவசாயத்திற்கு எவ்வாறு உதவுகிறது",
    featuresDescription: "எங்கள் எளிய கருவிகள் உங்கள் மண்ணைப் புரிந்துகொள்ளவும், சிறந்த பயிர்களுக்கு சரியான உரங்களைப் பயன்படுத்தவும் உதவுகின்றன.",
    
    feature1Title: "மண் அறிக்கை உதவி",
    feature1Description: "உங்கள் மண் அறிக்கையை பதிவேற்றவும் அல்லது உங்கள் மண்ணின் நிறம் மற்றும் அமைப்பைப் பற்றி எங்களுக்குத் தெரியப்படுத்துங்கள்.",
    
    feature2Title: "பயிர் ஆலோசனை",
    feature2Description: "உங்கள் பயிர்களுக்கு எந்த உரங்களைப் பயன்படுத்த வேண்டும் என்பது குறித்து எளிய ஆலோசனைகளைப் பெறுங்கள்.",
    
    feature3Title: "உள்ளூர் ஆலோசனை",
    feature3Description: "உங்கள் பகுதி, மண் வகை மற்றும் வானிலைக்கு ஏற்ற ஆலோசனைகளைப் பெறுங்கள்.",
    
    feature4Title: "மண் ஆரோக்கியம் கண்காணிப்பு",
    feature4Description: "உங்கள் மண் காலப்போக்கில் எவ்வாறு மேம்படுகிறது மற்றும் நீங்கள் எவ்வாறு மேம்படுத்தலாம் என்பதைப் பாருங்கள்.",
    
    feature5Title: "இயற்கை வேளாண் விருப்பங்கள்",
    feature5Description: "சாணம், கம்போஸ்ட் மற்றும் இயற்கை உரங்களைப் பயன்படுத்தி பணத்தை சேமிக்கும் வழிகளைக் கற்றுக்கொள்ளுங்கள்.",
    
    feature6Title: "பருவகால நினைவூட்டல்கள்",
    feature6Description: "மண் பரிசோதனை, உரமிடுதல் மற்றும் பிற முக்கியமான பண்ணை வேலைகள் பற்றிய நினைவூட்டல்களைப் பெறுங்கள்.",
    
    howItWorksTitle: "இது எவ்வாறு செயல்படுகிறது - வெறும் 3 எளிய படிகள்",
    howItWorksDescription: "சாயில் சாதி பயன்படுத்துவது எளிதானது - மண் அறிக்கை இல்லாமலும்",
    
    step1Title: "உங்கள் மண்ணைப் பற்றி எங்களுக்குச் சொல்லுங்கள்",
    step1Description: "உங்கள் மண் அறிக்கையின் படம் எடுங்கள் அல்லது உங்கள் மண்ணின் நிறம் மற்றும் அமைப்பைப் பற்றி எங்களுக்குத் தெரியப்படுத்துங்கள்.",
    
    step2Title: "எளிய ஆலோசனை பெறுங்கள்",
    step2Description: "எங்கள் அமைப்பு உங்கள் தகவலைப் படித்து உங்கள் மண்ணுக்கு என்ன தேவை என்பதை உங்களுக்குத் தெரிவிக்கிறது.",
    
    step3Title: "சிறந்த பயிர்கள், குறைந்த செலவு",
    step3Description: "சரியான அளவு உரத்தைப் பயன்படுத்தி சிறந்த பயிர்களை வளர்க்க எங்கள் எளிய ஆலோசனைகளைப் பின்பற்றவும்.",
    
    benefitsTitle: "விவசாயிகள் எவ்வாறு பயனடைகிறார்கள்",
    benefitsDescription: "ஆயிரக்கணக்கான விவசாயிகள் ஏற்கனவே தங்கள் பயிர்களை மேம்படுத்தவும் பணத்தை சேமிக்கவும் சாயில் சாதி பயன்படுத்துகிறார்கள்.",
    
    benefit1Title: "உரங்களில் பணம் சேமியுங்கள்",
    benefit1Description: "உங்கள் மண்ணுக்குத் தேவையானதை மட்டும் பயன்படுத்துங்கள் - கூடுதல் உரங்களுக்கு பணத்தை வீணடிப்பதை நிறுத்துங்கள்.",
    
    benefit2Title: "சிறந்த பயிர்களை வளர்க்கவும்",
    benefit2Description: "ஆரோக்கியமான மண் உங்களுக்கு சிறந்த பயிர்களையும் அதிக வருமானத்தையும் தருகிறது.",
    
    benefit3Title: "இயற்கை வேளாண் விருப்பங்கள்",
    benefit3Description: "இயற்கை உரங்களை தயாரிக்க உள்ளூர் பொருட்களைப் பயன்படுத்துவது எப்படி என்பதைக் கற்றுக்கொள்ளுங்கள்.",
    
    benefit4Title: "எளிய விவசாய ஆலோசனை",
    benefit4Description: "சிக்கலான வார்த்தைகள் இல்லாமல் பின்பற்ற எளிதான ஆலோசனைகளைப் பெறுங்கள்.",
    
    ctaTitle: "உங்கள் மண்ணை மேம்படுத்த தயாரா?",
    ctaDescription: "குறைந்த செலவில் சிறந்த பயிர்களுக்கு சாயில் சாதி பயன்படுத்தும் ஆயிரக்கணக்கான விவசாயிகளுடன் இணையுங்கள்.",
    
    getStarted: "இப்போது தொடங்கவும்",
    startAnalyzing: "இப்போது உங்கள் மண்ணைச் சரிபார்க்கவும்"
  },
  te: {
    featuresTitle: "సాయిల్ సాథి మీ వ్యవసాయానికి ఎలా సహాయపడుతుంది",
    featuresDescription: "మా సరళమైన సాధనాలు మీ మట్టిని అర్థం చేసుకోవడానికి మరియు మంచి పంటల కోసం సరైన ఎరువులను ఉపయోగించడానికి సహాయపడతాయి.",
    
    feature1Title: "మట్టి నివేదిక సహాయకుడు",
    feature1Description: "మీ మట్టి నివేదికను అప్‌లోడ్ చేయండి లేదా మీ మట్టి రంగు మరియు నిర్మాణం గురించి మాకు చెప్పండి.",
    
    feature2Title: "పంట సలహా",
    feature2Description: "మీ పంటలకు ఏ ఎరువులు ఉపయోగించాలో సరళమైన సలహా పొందండి.",
    
    feature3Title: "స్థానిక సలహా",
    feature3Description: "మీ ప్రాంతం, మట్టి రకం మరియు వాతావరణానికి తగిన సలహాలు పొందండి.",
    
    feature4Title: "మట్టి ఆరోగ్య ట్రాకింగ్",
    feature4Description: "మీ మట్టి కాలక్రమేణా ఎలా మెరుగుపడుతుందో మరియు మీరు ఏమి మెరుగుపరచవచ్చో చూడండి.",
    
    feature5Title: "సహజ వ్యవసాయ ఎంపికలు",
    feature5Description: "పేడ, కంపోస్ట్ మరియు సహజ ఎరువులను ఉపయోగించి డబ్బు ఆదా చేయడం ఎలానో నేర్చుకోండి.",
    
    feature6Title: "సీజన్ రిమైండర్లు",
    feature6Description: "మట్టి పరీక్ష, ఎరువుల వినియోగం మరియు ఇతర ముఖ్యమైన వ్యవసాయ పనుల గురించి రిమైండర్‌లను పొందండి.",
    
    howItWorksTitle: "ఇది ఎలా పనిచేస్తుంది - కేవలం 3 సులభమైన దశలు",
    howItWorksDescription: "సాయిల్ సాథి ఉపయోగించడం సులభం - మట్టి నివేదిక లేకుండా కూడా",
    
    step1Title: "మీ మట్టి గురించి మాకు చెప్పండి",
    step1Description: "మీ మట్టి నివేదిక యొక్క ఫోటో తీయండి లేదా మీ మట్టి రంగు మరియు నిర్మాణం గురించి మాకు చెప్పండి.",
    
    step2Title: "సరళమైన సలహా పొందండి",
    step2Description: "మా వ్యవస్థ మీ సమాచారాన్ని చదివి మీ మట్టికి ఏమి కావాలో చెబుతుంది.",
    
    step3Title: "మంచి పంటలు, తక్కువ ఖర్చు",
    step3Description: "సరైన మొత్తంలో ఎరువును ఉపయోగించి మంచి పంటలను పండించడానికి మా సరళమైన సలహాలను పాటించండి.",
    
    benefitsTitle: "రైతులకు ఎలా ప్రయోజనం కలుగుతుంది",
    benefitsDescription: "వేలాది మంది రైతులు ఇప్పటికే తమ పంటలను మెరుగుపరచడానికి మరియు డబ్బు ఆదా చేయడానికి సాయిల్ సాథి ఉపయోగిస్తున్నారు.",
    
    benefit1Title: "ఎరువులపై డబ్బు ఆదా చేయండి",
    benefit1Description: "మీ మట్టికి అవసరమైనవి మాత్రమే ఉపయోగించండి - అదనపు ఎరువులపై డబ్బు వృధా చేయడం ఆపండి.",
    
    benefit2Title: "మంచి పంటలు పండించండి",
    benefit2Description: "ఆరోగ్యకరమైన మట్టి మీకు మంచి పంటలు మరియు ఎక్కువ ఆదాయం ఇస్తుంది.",
    
    benefit3Title: "సహజ వ్యవసాయ ఎంపికలు",
    benefit3Description: "సహజ ఎరువులను తయారు చేయడానికి స్థానిక పదార్థాలను ఉపయోగించడం నేర్చుకోండి.",
    
    benefit4Title: "సరళమైన వ్యవసాయ సలహా",
    benefit4Description: "క్లిష్టమైన పదాలు లేకుండా అనుసరించడానికి సులభమైన సలహాలు పొందండి.",
    
    ctaTitle: "మీ మట్టిని మెరుగుపరచడానికి సిద్ధంగా ఉన్నారా?",
    ctaDescription: "తక్కువ ఖర్చుతో మంచి పంటల కోసం సాయిల్ సాథి ఉపయోగిస్తున్న వేలాది మంది రైతులతో చేరండి.",
    
    getStarted: "ఇప్పుడే ప్రారంభించండి",
    startAnalyzing: "ఇప్పుడే మీ మట్టిని తనిఖీ చేయండి"
  },
  bn: {
    featuresTitle: "সয়েল সাথি কীভাবে আপনার কৃষিকাজে সাহায্য করে",
    featuresDescription: "আমাদের সহজ টুল আপনাকে আপনার মাটি বুঝতে এবং ভাল ফসলের জন্য সঠিক সার ব্যবহার করতে সাহায্য করে।",
    
    feature1Title: "মাটি রিপোর্ট সহায়ক",
    feature1Description: "আপনার মাটি পরীক্ষার রিপোর্ট আপলোড করুন বা আপনার মাটির রং এবং গঠন সম্পর্কে আমাদের বলুন।",
    
    feature2Title: "ফসল পরামর্শ",
    feature2Description: "আপনার ফসলের জন্য কোন সার ব্যবহার করতে হবে তার সহজ পরামর্শ পান।",
    
    feature3Title: "স্থানীয় পরামর্শ",
    feature3Description: "আপনার অঞ্চল, মাটির প্রকার এবং আবহাওয়ার জন্য উপযুক্ত পরামর্শ পান।",
    
    feature4Title: "মাটির স্বাস্থ্য ট্র্যাকিং",
    feature4Description: "দেখুন কীভাবে আপনার মাটি সময়ের সাথে উন্নতি হচ্ছে এবং আপনি কী আরও ভাল করতে পারেন।",
    
    feature5Title: "প্রাকৃতিক কৃষি বিকল্প",
    feature5Description: "গোবর, কম্পোস্ট এবং প্রাকৃতিক সার ব্যবহার করে টাকা বাঁচানোর উপায় শিখুন।",
    
    feature6Title: "মৌসুমী রিমাইন্ডার",
    feature6Description: "মাটি পরীক্ষা, সার প্রয়োগ এবং অন্যান্য গুরুত্বপূর্ণ কৃষি কাজের জন্য রিমাইন্ডার পান।",
    
    howItWorksTitle: "এটি কীভাবে কাজ করে - মাত্র ৩টি সহজ ধাপ",
    howItWorksDescription: "সয়েল সাথি ব্যবহার করা সহজ - মাটির রিপোর্ট ছাড়াই",
    
    step1Title: "আপনার মাটি সম্পর্কে আমাদের বলুন",
    step1Description: "আপনার মাটির রিপোর্টের একটি ছবি তুলুন বা আমাদের আপনার মাটির রং ও গঠন সম্পর্কে বলুন।",
    
    step2Title: "সহজ পরামর্শ পান",
    step2Description: "আমাদের সিস্টেম আপনার তথ্য পড়ে এবং আপনার মাটির কী প্রয়োজন তা বলে।",
    
    step3Title: "ভাল ফসল, কম খরচ",
    step3Description: "সঠিক পরিমাণ সার ব্যবহার করে ভাল ফসল উৎপাদন করতে আমাদের সহজ পরামর্শ অনুসরণ করুন।",
    
    benefitsTitle: "কৃষকরা কীভাবে উপকৃত হন",
    benefitsDescription: "হাজার হাজার কৃষক ইতিমধ্যেই তাদের ফসল উন্নত করতে এবং অর্থ বাঁচাতে সয়েল সাথি ব্যবহার করছেন।",
    
    benefit1Title: "সারের টাকা বাঁচান",
    benefit1Description: "শুধু আপনার মাটির যা প্রয়োজন তাই ব্যবহার করুন - অতিরিক্ত সারে টাকা নষ্ট করা বন্ধ করুন।",
    
    benefit2Title: "ভাল ফসল উৎপাদন করুন",
    benefit2Description: "স্বাস্থ্যকর মাটি আপনাকে ভাল ফসল এবং বেশি আয় দেয়।",
    
    benefit3Title: "প্রাকৃতিক কৃষি বিকল্প",
    benefit3Description: "প্রাকৃতিক সার তৈরি করতে স্থানীয় উপাদান ব্যবহার করতে শিখুন।",
    
    benefit4Title: "সহজ কৃষি পরামর্শ",
    benefit4Description: "জটিল শব্দ ছাড়াই অনুসরণ করার সহজ পরামর্শ পান।",
    
    ctaTitle: "আপনার মাটি উন্নত করতে প্রস্তুত?",
    ctaDescription: "কম খরচে ভাল ফসলের জন্য সয়েল সাথি ব্যবহারকারী হাজার হাজার কৃষকের সাথে যোগ দিন।",
    
    getStarted: "এখনই শুরু করুন",
    startAnalyzing: "এখনই আপনার মাটি পরীক্ষা করুন"
  },
  mr: {
    featuresTitle: "सॉइल साथी तुमच्या शेतीला कसे मदत करते",
    featuresDescription: "आमची साधी साधने तुम्हाला तुमची माती समजून घेण्यासाठी आणि चांगल्या पिकांसाठी योग्य खते वापरण्यास मदत करतात.",
    
    feature1Title: "माती अहवाल मदतनीस",
    feature1Description: "तुमच्या मातीचा अहवाल अपलोड करा किंवा फक्त आम्हाला तुमच्या मातीचा रंग आणि बनावट बद्दल सांगा.",
    
    feature2Title: "पीक सल्ला",
    feature2Description: "तुमच्या पिकांसाठी कोणती खते वापरावीत याबद्दल साधा सल्ला मिळवा.",
    
    feature3Title: "स्थानिक सल्ला",
    feature3Description: "तुमच्या प्रदेशासाठी, मातीच्या प्रकारासाठी आणि हवामानासाठी उपयुक्त सल्ला मिळवा.",
    
    feature4Title: "मातीच्या आरोग्याचे निरीक्षण",
    feature4Description: "पहा की तुमची माती वेळेनुसार कशी सुधारत आहे आणि तुम्ही काय सुधारू शकता.",
    
    feature5Title: "सेंद्रिय शेती पर्याय",
    feature5Description: "गोमूत्र, कंपोस्ट आणि नैसर्गिक खते वापरून पैसे वाचवण्याचे मार्ग शिका.",
    
    feature6Title: "हंगामी आठवणी",
    feature6Description: "माती तपासणी, खते टाकणे आणि इतर महत्त्वाच्या शेती कामांबद्दल आठवणी मिळवा.",
    
    howItWorksTitle: "हे कसे कार्य करते - फक्त ३ सोप्या पायऱ्या",
    howItWorksDescription: "सॉइल साथी वापरणे सोपे आहे - माती अहवालाशिवायही",
    
    step1Title: "आम्हाला तुमच्या मातीबद्दल सांगा",
    step1Description: "तुमच्या मातीच्या अहवालाचा फोटो काढा किंवा फक्त आम्हाला तुमच्या मातीचा रंग आणि बनावट बद्दल सांगा.",
    
    step2Title: "साधा सल्ला मिळवा",
    step2Description: "आमची प्रणाली तुमची माहिती वाचते आणि तुमच्या मातीला काय हवे ते सांगते.",
    
    step3Title: "चांगली पिके, कमी खर्च",
    step3Description: "योग्य प्रमाणात खते वापरून चांगली पिके घेण्यासाठी आमच्या साध्या सल्ल्याचे पालन करा.",
    
    benefitsTitle: "शेतकऱ्यांना कसे फायदे होतात",
    benefitsDescription: "हजारो शेतकरी आधीच त्यांची पिके सुधारण्यासाठी आणि पैसे वाचवण्यासाठी सॉइल साथी वापरत आहेत.",
    
    benefit1Title: "खतांवर पैसे वाचवा",
    benefit1Description: "फक्त तेच वापरा जे तुमच्या मातीला आवश्यक आहे - अतिरिक्त खतांवर पैसे वाया घालवणे थांबवा.",
    
    benefit2Title: "चांगली पिके घ्या",
    benefit2Description: "निरोगी माती तुम्हाला चांगली पिके आणि अधिक उत्पन्न देते.",
    
    benefit3Title: "सेंद्रिय शेती पर्याय",
    benefit3Description: "नैसर्गिक खते बनवण्यासाठी स्थानिक सामग्री कशी वापरायची ते शिका.",
    
    benefit4Title: "साधा शेती सल्ला",
    benefit4Description: "क्लिष्ट शब्दांशिवाय अनुसरण करण्यास सोपा सल्ला मिळवा.",
    
    ctaTitle: "तुमची माती सुधारण्यासाठी तयार आहात?",
    ctaDescription: "कमी खर्चात चांगली पिके घेण्यासाठी सॉइल साथी वापरणाऱ्या हजारो शेतकऱ्यांसोबत सामील व्हा.",
    
    getStarted: "आत्ताच सुरू करा",
    startAnalyzing: "आत्ताच तुमच्या मातीची तपासणी करा"
  }
};
