import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Leaf, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const OrganicFarming = () => {
  const { t } = useLanguage();

  // Comprehensive translations for the organic farming page
  const translations = {
    // Main page content
    title: {
      en: "Organic Farming Advisor",
      hi: "जैविक खेती सलाहकार",
      pa: "ਜੈਵਿਕ ਖੇਤੀ ਸਲਾਹਕਾਰ",
      ta: "இயற்கை விவசாய ஆலோசகர்",
      te: "సేంద్రీయ వ్యవసాయ సలహాదారు",
      bn: "জৈব কৃষি পরামর্শদাতা",
      mr: "सेंद्रिय शेती सल्लागार"
    },
    subtitle: {
      en: "Discover natural alternatives to chemical fertilizers and learn sustainable farming practices that improve soil health and productivity.",
      hi: "रासायनिक उर्वरकों के प्राकृतिक विकल्प खोजें और टिकाऊ खेती की प्रथाओं को सीखें जो मिट्टी के स्वास्थ्य और उत्पादकता में सुधार करती हैं।",
      pa: "रसਾਇਣਕ ਖਾਦਾਂ ਦੇ ਕੁਦਰਤੀ ਵਿਕਲਪ ਖੋਜੋ ਅਤੇ ਟਿਕਾਊ ਖੇਤੀ ਦੇ ਤਰੀਕੇ ਸਿੱਖੋ ਜੋ ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਅਤੇ ਉਤਪਾਦਕਤਾ ਵਿੱਚ ਸੁਧਾਰ ਕरਦੇ ਹਨ।",
      ta: "இரசாயன உரங்களுக்கு இயற்கையான மாற்றுகளைக் கண்டறியுங்கள் மற்றும் மண் ஆரோக்கியம் மற்றும் உற்பத்தித்திறனை மேம்படுத்தும் நிலையான வேளாண்மை நடைமுறைகளைக் கற்றுக்கொள்ளுங்கள்.",
      te: "రసాయన ఎరువులకు సహజ ప్రత్యామ్నాయాలను కనుగొనండి మరియు నేల ఆరోగ్యం మరియు ఉత్పాదకతను మెరుగుపరిచే స్థిరమైన వ్యవసాయ పద్ధతులను నేర్చుకోండి.",
      bn: "রাসায়নিক সারের প্রাকৃতিক বিকল্প আবিষ্কার করুন এবং টেকসই কৃষি পদ্ধতি শিখুন যা মাটির স্বাস্থ্য এবং উৎপাদনশীলতা উন্নত করে।",
      mr: "रासायनिक खतांचे नैसर्गिक पर्याय शोधा आणि शाश्वत शेती पद्धती शिका ज्या मातीचे आरोग्य आणि उत्पादकता सुधारतात."
    },
    
    // Tab titles
    nutrientsTab: {
      en: "Nutrient Management",
      hi: "पोषक तत्व प्रबंधन",
      pa: "ਪੋਸ਼ਕ ਤੱਤ ਪ੍ਰਬੰਧਨ",
      ta: "ஊட்டச்சத்து மேலாண்மை",
      te: "పోషకాల నిర్వహణ",
      bn: "পুষ্টি ব্যবস্থাপনা",
      mr: "पोषक द्रव्य व्यवस्थापन"
    },
    preparationsTab: {
      en: "DIY Preparations",
      hi: "स्वयं निर्मित तैयारियाँ",
      pa: "ਆਪਣੇ ਆਪ ਬਣਾਉਣ ਵਾਲੀਆਂ ਤਿਆਰੀਆਂ",
      ta: "சுய தயாரிப்புகள்",
      te: "స్వయం తయారీలు",
      bn: "নিজে তৈরি প্রস্তুতি",
      mr: "स्वतः तयार करण्याचे मिश्रण"
    },
    practicesTab: {
      en: "Sustainable Practices",
      hi: "टिकाऊ प्रथाएं",
      pa: "ਟਿਕਾਊ ਅਭਿਆਸ",
      ta: "நிலையான நடைமுறைகள்",
      te: "స్థిరమైన పద్ధతులు",
      bn: "টেকসই অনুশীলন",
      mr: "शाश्वत पद्धती"
    },
    
    // Nutrient management content
    nutrientSourcesTitle: {
      en: "Organic Nutrient Sources",
      hi: "जैविक पोषक स्रोत",
      pa: "ਜੈਵਿਕ ਪੋਸ਼ਕ ਸਰੋਤ",
      ta: "இயற்கை ஊட்டச்சத்து ஆதாரங்கள்",
      te: "సేంద్రీయ పోషక వనరులు",
      bn: "জৈব পুষ্টির উৎস",
      mr: "सेंद्रिय पोषक स्रोत"
    },
    nutrientSourcesDesc: {
      en: "Natural alternatives to chemical fertilizers for soil fertility management",
      hi: "मिट्टी की उर्वरता प्रबंधन के लिए रासायनिक उर्वरकों के प्राकृतिक विकल्प",
      pa: "ਮਿੱਟੀ ਦੀ ਉरਵਰਤਾ ਪ੍ਰਬੰਧਨ ਲਈ ਰਸਾਇਣਿਕ ਖਾਦਾਂ ਦੇ ਕੁਦਰਤੀ ਵਿਕਲਪ",
      ta: "மண் வளத்திற்கான இரசாயன உரங்களுக்கு இயற்கையான மாற்றுகள்",
      te: "నేల సారవంతత నిర్వహణ కోసం రసాయన ఎరువులకు సహజ ప్రత్యామ్నాయాలు",
      bn: "মাটির উর্বরতা ব্যবস্থাপনার জন্য রাসায়নিক সারের প্রাকৃতিক বিকল্প",
      mr: "मातीच्या सुपीकतेच्या व्यवस्थापनासाठी रासायनिक खतांचे नैसर्गिक पर्याय"
    },

    // Download button
    downloadGuide: {
      en: "Download Complete Organic Farming Guide (PDF)",
      hi: "संपूर्ण जैविक खेती गाइड डाउनलोड करें (PDF)",
      pa: "ਸੰਪੂਰਨ ਜੈਵਿਕ ਖੇਤੀ ਗਾਈਡ ਡਾਉਨਲੋਡ ਕਰੋ (PDF)",
      ta: "முழுமையான இயற்கை விவசாய வழிகாட்டி பதிவிறக்கம் (PDF)",
      te: "పూర్తి సేంద్రీయ వ్యవసాయ గైడ్ డౌన్‌లోడ్ చేయండి (PDF)",
      bn: "সম্পূর্ণ জৈব কৃষি গাইড ডাউনলোড করুন (PDF)",
      mr: "संपूर्ण सेंद्रिय शेती मार्गदर्शिका डाउनलोड करा (PDF)"
    },

    // Info text
    infoText: {
      en: "For best results, combine multiple organic sources and apply well before planting. This allows microorganisms to break down the organic matter and release nutrients gradually.",
      hi: "सर्वोत्तम परिणामों के लिए, कई जैविक स्रोतों को मिलाएं और रोपण से पहले अच्छी तरह से लगाएं। यह सूक्ष्मजीवों को जैविक पदार्थ को तोड़ने और धीरे-धीरे पोषक तत्वों को छोड़ने की अनुमति देता है।",
      pa: "ਸਭ ਤੋਂ ਵਧੀਆ ਨਤੀਜਿਆਂ ਲਈ, ਕਈ ਜੈਵਿਕ ਸਰੋਤਾਂ ਨੂੰ ਮਿਲਾਓ ਅਤੇ ਬੀਜਣ ਤੋਂ ਪਹਿਲਾਂ ਚੰਗੀ ਤਰ੍ਹਾਂ ਲਗਾਓ। ਇਹ ਸੂਖਮ ਜੀਵਾਂ ਨੂੰ ਜੈਵਿਕ ਪਦਾਰਥ ਨੂੰ ਤੋੜਨ ਅਤੇ ਹੌਲੀ-ਹੌਲੀ ਪੋਸ਼ਕ ਤੱਤ ਛੱਡਣ ਦੀ ਆਗਿਆ ਦਿੰਦਾ ਹੈ।",
      ta: "சிறந்த முடிவுகளுக்காக, பல இயற்கை ஆதாரங்களை இணைத்து நடவு செய்வதற்கு முன்பு நன்றாக பயன்படுத்துங்கள். இது நுண்ணுயிரிகளை இயற்கை பொருட்களை உடைத்து படிப்படியாக ஊட்டச்சத்துக்களை வெளியிட அனுமதிக்கிறது।",
      te: "మంచి ఫలితాల కోసం, అనేక సేంద్రీయ వనరులను కలపండి మరియు నాటడానికి ముందు బాగా వర్తించండి. ఇది సూక్ష్మజీవులను సేంద్రీయ పదార్థాన్ని విచ్ఛిన్నం చేయడానికి మరియు క్రమంగా పోషకాలను విడుదల చేయడానికి అనుమతిస్తుంది।",
      bn: "সর্বোত্তম ফলাফলের জন্য, একাধিক জৈব উৎস একত্রিত করুন এবং রোপণের আগে ভালভাবে প্রয়োগ করুন। এটি অণুজীবদের জৈব পদার্থ ভাঙতে এবং ধীরে ধীরে পুষ্টি নিঃসরণ করতে সহায়তা করে।",
      mr: "सर्वोत्तम परिणामांसाठी, अनेक सेंद्रिय स्रोत एकत्र करा आणि लावणीपूर्वी चांगले वापरा. हे सूक्ष्मजीवांना सेंद्रिय पदार्थ मोडून टाकण्यास आणि हळूहळू पोषक द्रव्ये मुक्त करण्यास अनुमती देते."
    }
  };

  return (
    <Layout>
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Leaf className="h-10 w-10 text-plant" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t(translations.title)}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t(translations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="nutrients">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="nutrients">{t(translations.nutrientsTab)}</TabsTrigger>
                <TabsTrigger value="preparations">{t(translations.preparationsTab)}</TabsTrigger>
                <TabsTrigger value="practices">{t(translations.practicesTab)}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="nutrients">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-plant" />
                      <span>{t(translations.nutrientSourcesTitle)}</span>
                    </CardTitle>
                    <CardDescription>
                      {t(translations.nutrientSourcesDesc)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-accent/50 p-5 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Nitrogen Sources</h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Rich</Badge>
                            <div>
                              <p className="font-medium">Farmyard Manure</p>
                              <p className="text-sm text-muted-foreground">5-10 tonnes/hectare</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Rich</Badge>
                            <div>
                              <p className="font-medium">Vermicompost</p>
                              <p className="text-sm text-muted-foreground">3-5 tonnes/hectare</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Rich</Badge>
                            <div>
                              <p className="font-medium">Green Manuring</p>
                              <p className="text-sm text-muted-foreground">Dhaincha, Sunhemp, Cow pea</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Moderate</Badge>
                            <div>
                              <p className="font-medium">Neem Cake</p>
                              <p className="text-sm text-muted-foreground">100-200 kg/hectare</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-accent/50 p-5 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Phosphorus Sources</h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Rich</Badge>
                            <div>
                              <p className="font-medium">Bone Meal</p>
                              <p className="text-sm text-muted-foreground">200-300 kg/hectare</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Moderate</Badge>
                            <div>
                              <p className="font-medium">Rock Phosphate</p>
                              <p className="text-sm text-muted-foreground">300-400 kg/hectare</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Moderate</Badge>
                            <div>
                              <p className="font-medium">Wood Ash</p>
                              <p className="text-sm text-muted-foreground">500-1000 kg/hectare</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-accent/50 p-5 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Potassium Sources</h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Rich</Badge>
                            <div>
                              <p className="font-medium">Wood Ash</p>
                              <p className="text-sm text-muted-foreground">500-1000 kg/hectare</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Moderate</Badge>
                            <div>
                              <p className="font-medium">Banana Pseudostem</p>
                              <p className="text-sm text-muted-foreground">Chop and mix in soil</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Moderate</Badge>
                            <div>
                              <p className="font-medium">Seaweed Extract</p>
                              <p className="text-sm text-muted-foreground">Applied as foliar spray</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-accent/50 p-5 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Micronutrient Sources</h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Combined</Badge>
                            <div>
                              <p className="font-medium">Seaweed Extract</p>
                              <p className="text-sm text-muted-foreground">Multiple micronutrients</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Iron</Badge>
                            <div>
                              <p className="font-medium">Iron-rich Clay Soil</p>
                              <p className="text-sm text-muted-foreground">Mix with compost</p>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <Badge variant="outline" className="bg-plant-light text-plant-dark">Zinc</Badge>
                            <div>
                              <p className="font-medium">Crushed Eggshells</p>
                              <p className="text-sm text-muted-foreground">For calcium and trace minerals</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted p-4 rounded-md mt-6">
                      <Info className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-sm">
                        {t(translations.infoText)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preparations">
                <Card>
                  <CardHeader>
                    <CardTitle>DIY Organic Preparations</CardTitle>
                    <CardDescription>
                      Learn how to make your own organic fertilizers and soil amendments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="jeevamrut">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <span>Jeevamrut (जीवामृत)</span>
                            <Badge>Popular</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <p>
                              Jeevamrut is a fermented microbial culture that provides nutrients and beneficial microorganisms to the soil.
                            </p>
                            
                            <div>
                              <h4 className="font-medium mb-2">Ingredients:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>10 kg fresh cow dung (गाय का गोबर)</li>
                                <li>5-10 liters cow urine (गौमूत्र)</li>
                                <li>2 kg jaggery/molasses (गुड़)</li>
                                <li>2 kg pulse flour (दाल का आटा)</li>
                                <li>Handful of soil from your farm</li>
                                <li>200 liters water</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Preparation:</h4>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li>Mix all ingredients in a plastic drum or cement tank</li>
                                <li>Stir the mixture clockwise once in the morning and once in the evening</li>
                                <li>Cover with a cloth to allow air but keep insects out</li>
                                <li>Ferment for 48-72 hours (faster in summer, slower in winter)</li>
                                <li>The mixture is ready when white bubbles appear on the surface</li>
                              </ol>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Application:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Dilute 1 part jeevamrut with 10 parts water</li>
                                <li>Apply directly to soil through irrigation water</li>
                                <li>Use as foliar spray at 5-10% concentration</li>
                                <li>Apply every 15-30 days during growing season</li>
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Benefits:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Enhances soil microbial activity</li>
                                <li>Improves nutrient availability</li>
                                <li>Promotes plant growth and disease resistance</li>
                                <li>Cost-effective and uses locally available materials</li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="beejamrut">
                        <AccordionTrigger>Beejamrut (बीजामृत)</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <p>
                              Beejamrut is used for seed treatment before sowing to protect seeds from soil-borne diseases and enhance germination.
                            </p>
                            
                            <div>
                              <h4 className="font-medium mb-2">Ingredients:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>5 kg fresh cow dung</li>
                                <li>5 liters cow urine</li>
                                <li>50 g lime</li>
                                <li>20 liters water</li>
                                <li>Handful of soil from your farm</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Preparation:</h4>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li>Mix cow dung and cow urine thoroughly</li>
                                <li>Add lime, soil, and water</li>
                                <li>Mix well and leave overnight</li>
                                <li>Stir occasionally</li>
                              </ol>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Application:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Soak seeds in beejamrut for 15-30 minutes (smaller seeds) or 8-12 hours (larger seeds)</li>
                                <li>Dry in shade before sowing</li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="panchagavya">
                        <AccordionTrigger>Panchagavya (पंचगव्य)</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <p>
                              Panchagavya is a growth promoter made from five products derived from cows. It enhances plant growth and disease resistance.
                            </p>
                            
                            <div>
                              <h4 className="font-medium mb-2">Ingredients:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>5 kg fresh cow dung</li>
                                <li>3 liters cow urine</li>
                                <li>2 liters cow milk</li>
                                <li>2 liters yogurt (cow milk curd)</li>
                                <li>1 kg ghee (clarified butter)</li>
                                <li>3 liters coconut water (optional)</li>
                                <li>3 liters jaggery solution (250g jaggery in 3L water)</li>
                                <li>12 ripe bananas (optional)</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Preparation:</h4>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li>Mix cow dung and ghee in a clay or plastic container</li>
                                <li>Ferment for 3 days, stirring twice daily</li>
                                <li>Add all other ingredients on the 4th day</li>
                                <li>Continue fermentation for 15-18 days, stirring twice daily</li>
                                <li>Store in shade, covered with cloth</li>
                              </ol>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Application:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Dilute 3-5% solution (3-5 L panchagavya in 100L water)</li>
                                <li>Use as foliar spray every 15 days</li>
                                <li>Apply through irrigation water at 50L/acre</li>
                                <li>Particularly effective during flowering and fruiting stages</li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="vermiwash">
                        <AccordionTrigger>Vermiwash</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <p>
                              Vermiwash is a liquid collected after passing water through a column of vermicompost. It's rich in plant nutrients and beneficial microorganisms.
                            </p>
                            
                            <div>
                              <h4 className="font-medium mb-2">Materials needed:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>A plastic barrel/container with tap at bottom</li>
                                <li>10-15 kg vermicompost with earthworms</li>
                                <li>Coarse sand and pebbles</li>
                                <li>Fresh cow dung</li>
                                <li>Water</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Setup:</h4>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li>Make a layer of pebbles (5-7 cm) at the bottom</li>
                                <li>Add a layer of coarse sand (5-7 cm) above the pebbles</li>
                                <li>Add a layer of vermicompost with earthworms (15-20 cm)</li>
                                <li>Add a thin layer of partially decomposed cow dung</li>
                                <li>Keep the setup in shade</li>
                                <li>Add water slowly at the top, enough to moisten the contents</li>
                                <li>Collect the vermiwash from the tap after 24 hours</li>
                              </ol>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Application:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Use as foliar spray at 5-10% concentration</li>
                                <li>Apply every 10-15 days during growing season</li>
                                <li>Best applied during morning or evening hours</li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="practices">
                <Card>
                  <CardHeader>
                    <CardTitle>Sustainable Soil Management Practices</CardTitle>
                    <CardDescription>
                      Techniques to improve soil health and fertility naturally
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Crop Rotation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Systematically changing crops in the same field to improve soil health and reduce pest pressure.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Benefits:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Breaks pest and disease cycles</li>
                                <li>Improves soil structure</li>
                                <li>Balances nutrient utilization</li>
                                <li>Reduces weed pressure</li>
                              </ul>
                            </div>
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Example Rotation:</p>
                              <p className="mt-1">Legumes → Cereals → Vegetables → Legumes</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Mulching</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Covering the soil surface with organic materials to conserve moisture and suppress weeds.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Benefits:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Reduces water evaporation</li>
                                <li>Moderates soil temperature</li>
                                <li>Suppresses weed growth</li>
                                <li>Adds organic matter as it breaks down</li>
                              </ul>
                            </div>
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Materials:</p>
                              <p className="mt-1">Straw, leaves, grass clippings, newspaper, compost</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Cover Cropping</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Growing plants specifically to cover and protect the soil during off-seasons.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Benefits:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Prevents soil erosion</li>
                                <li>Adds organic matter</li>
                                <li>Suppresses weeds</li>
                                <li>Legume covers add nitrogen</li>
                              </ul>
                            </div>
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Cover Crop Options:</p>
                              <p className="mt-1">Dhaincha, cowpea, sunnhemp, mustard, buckwheat</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Companion Planting</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Growing different plants close together for mutual benefit.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Benefits:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Natural pest control</li>
                                <li>Improved pollination</li>
                                <li>Better space utilization</li>
                                <li>Enhanced biodiversity</li>
                              </ul>
                            </div>
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Examples:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Marigold with vegetables</li>
                                <li>Tomato with basil</li>
                                <li>Corn, beans, and squash</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Minimum Tillage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Reducing soil disturbance to maintain soil structure and biology.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Benefits:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Preserves soil structure</li>
                                <li>Maintains soil organic matter</li>
                                <li>Protects beneficial soil organisms</li>
                                <li>Reduces erosion</li>
                              </ul>
                            </div>
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Techniques:</p>
                              <p className="mt-1">No-till, ridge till, strip till, shallow cultivation</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Integrated Farming</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Combining crops, livestock, and trees in a complementary system.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Benefits:</p>
                              <ul className="list-disc pl-5 mt-1">
                                <li>Closed nutrient cycles</li>
                                <li>Multiple income sources</li>
                                <li>Better resource utilization</li>
                                <li>Enhanced biodiversity</li>
                              </ul>
                            </div>
                            <div className="bg-muted p-2 rounded-md text-sm">
                              <p className="font-medium">Examples:</p>
                              <p className="mt-1">Fish-paddy-duck systems, silvopasture, agroforestry</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-8">
                      <Button variant="secondary" className="w-full">
                        {t(translations.downloadGuide)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrganicFarming;
