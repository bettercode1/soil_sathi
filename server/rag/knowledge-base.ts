export type KnowledgeBaseEntry = {
  id: string;
  title: string;
  summary: string;
  details: string;
  source: string;
  url?: string;
  updated: string;
  tags: string[];
  regions: string[];
  languages: Array<"en" | "hi" | "mr">;
};

export const knowledgeBase: KnowledgeBaseEntry[] = [
  {
    id: "mahadbt-interest-waiver",
    title: "MahaDBT Crop Loan Interest Waiver (₹3 लाखांपर्यंत)",
    summary:
      "Maharashtra सरकार नियमित कर्जफेड करणाऱ्या शेतकऱ्यांना ₹3 लाखांपर्यंतच्या पीक कर्जावर 100% व्याज माफी देते.",
    details: [
      "अर्ज प्लॅटफॉर्म: https://mahadbt.maharashtra.gov.in वर लॉग-इन करून 'कृषी विभाग' -> 'पीक कर्ज माफी' निवडा.",
      "पात्रता: सहकारी/राष्ट्रीयीकृत बँकांचे अल्पमुदतीचे पीक कर्ज, 30 जून 2024 पर्यंत व्याजासह परतफेड झालेले.",
      "आवश्यक कागदपत्रे: आधार कार्ड, बँक पासबुक, कर्ज मंजूरी पत्र, सादर केलेल्या फॉर्मची पावती.",
      "मदत केंद्र: तालुका कृषी कार्यालय व सेटू सुविधा केंद्र येथे नोंदणीसाठी सहाय्य उपलब्ध.",
    ].join("\n"),
    source: "Government of Maharashtra - Co-operation Department",
    url: "https://mahadbt.maharashtra.gov.in",
    updated: "2024-12-20",
    tags: ["loan", "interest waiver", "maharashtra", "crop"],
    regions: ["Maharashtra"],
    languages: ["mr", "hi", "en"],
  },
  {
    id: "nabard-sugarcane-refinance",
    title: "NABARD Refinance Scheme for Sugarcane Farmers",
    summary:
      "NABARD सहकारी बँका व ग्रामीण बँकांना ऊस लागवड खर्चासाठी 9-12 महिन्यांच्या कर्जांसाठी पुनर्वित्त सुविधा देते.",
    details: [
      "मुख्य वैशिष्ट्ये: 7.25% पासून व्याजदर (बँक मार्जिन जोडला जातो), रु. 50,000 पर्यंत सुलभ कोलेटरल.",
      "लक्ष केंद्र: कानकोण, विदर्भ व पश्चिम महाराष्ट्रातील साखर कारखान्यांशी करार असलेले शेतकरी.",
      "आवश्यक माहिती: ऊस लागवड करार, मागील हंगामाचे उत्पादन/एफआरपी देयकाची पावती, आधार प्रमाणिती.",
      "अर्ज प्रक्रिया: जिल्हा सहकारी बँक शाखेत कृषी तज्ञाची पडताळणी नंतर प्रस्ताव NABARD कडे पाठवला जातो.",
    ].join("\n"),
    source: "NABARD Circular No. 218/Agri/2024",
    url: "https://www.nabard.org/content.aspx?id=708",
    updated: "2025-01-05",
    tags: ["loan", "sugarcane", "finance", "nabard"],
    regions: ["Maharashtra", "India"],
    languages: ["en", "hi"],
  },
  {
    id: "pm-kisan-support",
    title: "PM-KISAN Samman Nidhi Support Desk",
    summary:
      "PM-KISAN अंतर्गत सर्व पात्र शेतकऱ्यांना प्रत्येक वर्षी ₹6,000 तीन सम-हप्ता मध्ये दिले जातात.",
    details: [
      "नोंदणी कशी करावी: https://pmkisan.gov.in वर 'Farmers Corner' -> 'New Farmer Registration'.",
      "e-KYC आवश्यकता: Aadhaar OTP किंवा बायोमेट्रिक पडताळणी CSC केंद्रावर.",
      "महाराष्ट्र संपर्क: जिल्हा कृषी अधिकारी कार्यालय व ‘99818-97555’ राज्य हेल्पलाइन.",
      "ताजी स्थिती तपासा: 'Beneficiary Status' विभागात आधार/मोबाईल क्रमांक टाका.",
    ].join("\n"),
    source: "Department of Agriculture & Farmers Welfare, GoI",
    url: "https://pmkisan.gov.in",
    updated: "2025-02-10",
    tags: ["pm-kisan", "income support", "scheme"],
    regions: ["India", "Maharashtra"],
    languages: ["mr", "hi", "en"],
  },
  {
    id: "soil-testing-centers",
    title: "Maharashtra Soil Testing Labs & प्रक्रिया",
    summary:
      "राज्यातील 234 सरकारी व कृषी विद्यापीठ संलग्न प्रयोगशाळांमध्ये माती चाचणी सेवा उपलब्ध आहेत.",
    details: [
      "नमुना संकलन: 6-8 इंच खोलवरून 5 ठिकाणांहून माती गोळा करून स्वच्छ प्लास्टिक पिशवीत मिसळा.",
      "अर्ज फी: रु. 300 (सर्वसाधारण मॅक्रो + मायक्रो टेस्ट).",
      "ऑनलाइन नोंदणी: https://mahabhunaksh.gov.in वर 'Soil Health Card' login.",
      "अहवाल मिळण्याची वेळ: साधारण 10-12 कार्यदिवस; SMS/ईमेल ने सूचित केले जाते.",
    ].join("\n"),
    source: "State Agriculture Department - Soil Health Mission",
    url: "https://mahabhunaksh.gov.in",
    updated: "2025-01-28",
    tags: ["soil", "testing", "service", "lab"],
    regions: ["Maharashtra"],
    languages: ["mr", "hi", "en"],
  },
  {
    id: "organic-smart-farming",
    title: "SMART Project Organic Farming Support",
    summary:
      "SMART Maharashtra प्रकल्पाद्वारे समूह आधारित सेंद्रीय (organic) शेतीसाठी प्रशिक्षण व सब्सिडी (₹40,000/ha पर्यंत) मिळते.",
    details: [
      "पात्रता: Farmer Producer Company/SHG किंवा 20+ शेतकऱ्यांचा गट.",
      "उपलब्ध सहाय्य: प्रमाणित जैविक इनपुट किट, ड्रिप/मायक्रो स्प्रिंकलर सिस्टीमवर 55% अनुदान, मोबाइल सल्ला.",
      "अर्ज शेवटची तारीख: दर तिमाही ऑनलाईन प्रस्ताव https://www.smart-mh.org वर स्वीकारले जातात.",
      "प्रशिक्षण केंद्र: पुणे, नागपूर, कोल्हापूर कृषी विज्ञान केंद्रे (KVK).",
    ].join("\n"),
    source: "Maharashtra Project on Climate Resilient Agriculture (SMART)",
    url: "https://www.smart-mh.org",
    updated: "2024-11-30",
    tags: ["organic", "smart farming", "subsidy"],
    regions: ["Maharashtra"],
    languages: ["en", "mr"],
  },
  {
    id: "crop-insurance-pmfby",
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY) Maharashtra",
    summary:
      "सब्सिडी प्रीमियमसह नैसर्गिक आपत्ती, कीड व रोगामुळे उत्पादन घटल्यास PMFBY नुकसान भरपाई देते.",
    details: [
      "प्रीमियम: खरीप पिके 2%, रब्बी 1.5%, वार्षिक व्यावसायिक/बागायती 5%. उर्वरित प्रीमियम केंद्र व राज्य देतात.",
      "नोंदणी अंतिम तारीख: खरीप - 31 जुलै, रब्बी - 31 डिसेंबर.",
      "क्लेम प्रक्रिया: नुकसान 72 तासांत महाडीबीटी पोर्टल किंवा विमा कंपनी हेल्पलाइनवर नोंदवा.",
      "हेल्पलाइन: राज्यस्तरावर टोल-फ्री 1800-120-6200.",
    ].join("\n"),
    source: "Agriculture Insurance Company of India",
    url: "https://pmfby.gov.in",
    updated: "2025-03-01",
    tags: ["insurance", "risk", "pmfby"],
    regions: ["Maharashtra", "India"],
    languages: ["mr", "hi", "en"],
  },
  {
    id: "weather-advisory-imd",
    title: "IMD Agro-Meteorological Advisory for Maharashtra",
    summary:
      "भारतीय हवामान विभाग दर 3 दिवसांनी जिल्हावार पर्जन्य व तापमान आधारित कृषी सल्ले प्रकाशित करतो.",
    details: [
      "रिलीज वेळा: सोमवार व गुरुवारी दुपारी https://mausam.imd.gov.in वर PDF स्वरूपात.",
      "केंद्रबिंदू: पर्जन्य अंदाज, सिंचन नियोजन, रोग-किड व्यवस्थापन, तात्काळ संरक्षण उपाय.",
      "मोबाइल सेवा: 'मौसम' अॅपमधून जिल्हा निवडून सूचना मिळवा.",
      "कृषी विज्ञान केंद्रे स्थानिक भाषेत रेडिओ/WhatsApp गटातून सल्ला प्रसारित करतात.",
    ].join("\n"),
    source: "India Meteorological Department (IMD)",
    url: "https://mausam.imd.gov.in",
    updated: "2025-02-26",
    tags: ["weather", "advisory", "imd"],
    regions: ["Maharashtra"],
    languages: ["mr", "hi", "en"],
  },
];


