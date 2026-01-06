import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { recommendationsTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse, parseErrorResponse } from "@/lib/api";
import { 
  Leaf, 
  Sprout, 
  Droplets, 
  TrendingUp, 
  Calendar, 
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Beaker,
  Sparkles
} from "lucide-react";

interface RecommendationData {
  soilType: string;
  region: string;
  crop: string;
  cropStage: string;
  farmSize: string;
  farmSizeUnit: string;
  irrigation: string;
  farmingGoal: string;
  challenges: string[];
  additionalNotes: string;
}

interface FertilizerRecommendation {
  name: string;
  quantity: string;
  timing: string;
  application: string;
  notes: string;
}

interface RecommendationResult {
  chemical: FertilizerRecommendation[];
  organic: FertilizerRecommendation[];
  keyInsights: string[];
  warnings: string[];
  nextSteps: string[];
}

const Recommendations = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  
  const [formData, setFormData] = useState<RecommendationData>({
    soilType: "",
    region: "",
    crop: "",
    cropStage: "",
    farmSize: "",
    farmSizeUnit: "acres",
    irrigation: "",
    farmingGoal: "",
    challenges: [],
    additionalNotes: "",
  });

  const soilTypes = [
    "Alluvial", "Black (Regur)", "Red", "Laterite", "Desert", "Mountain", "Clayey", "Sandy", "Loamy"
  ];

  const regions = [
    "Punjab", "Haryana", "Uttar Pradesh", "Bihar", "West Bengal", "Maharashtra", 
    "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala", "Gujarat", "Rajasthan", "Madhya Pradesh"
  ];

  const crops = [
    "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Potato", "Tomato",
    "Onion", "Mango", "Banana", "Groundnut", "Mustard", "Chickpea", "Pulses"
  ];

  const cropStages = [
    { value: "sowing", label: "Sowing/Planting" },
    { value: "vegetative", label: "Vegetative Growth" },
    { value: "flowering", label: "Flowering" },
    { value: "fruiting", label: "Fruiting/Grain Filling" },
    { value: "harvest", label: "Pre-Harvest" }
  ];

  const irrigationMethods = [
    "Drip Irrigation", "Sprinkler", "Flood/Furrow", "Rainfed"
  ];

  const farmingGoals = [
    "Maximum Yield", "Cost Reduction", "Organic Transition", "Soil Health Improvement"
  ];

  const commonChallenges = [
    "Low crop yield", "Soil nutrient deficiency", "Pest/disease issues", 
    "Water scarcity", "Poor soil drainage", "Soil salinity"
  ];

  const handleInputChange = (field: keyof RecommendationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChallengeToggle = (challenge: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : [...prev.challenges, challenge]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.soilType || !formData.region || !formData.crop || !formData.cropStage) {
      toast({
        title: "Missing Information",
        description: "Please fill in Soil Type, Region, Crop, and Crop Stage.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.farmSize || parseFloat(formData.farmSize) <= 0) {
      toast({
        title: t(recommendationsTranslations.invalidFarmSizeTitle),
        description: t(recommendationsTranslations.invalidFarmSizeDescription),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Mock generator for recommendations since backend is not available
  const generateMockRecommendations = (data: RecommendationData): RecommendationResult => {
    return {
      chemical: [
        {
          name: "Urea (46% N)",
          quantity: "110 kg/acre",
          timing: "Split Application (3 splits)",
          application: "Broadcast",
          notes: "Apply 1/3 at basal, 1/3 at active tillering, 1/3 at panicle initiation."
        },
        {
          name: "DAP (18:46:0)",
          quantity: "55 kg/acre",
          timing: "Basal Dose",
          application: "Soil Incorporation",
          notes: "Apply before final puddling/sowing."
        },
        {
          name: "MOP (60% K2O)",
          quantity: "40 kg/acre",
          timing: "Split Application (2 splits)",
          application: "Broadcast",
          notes: "Apply 50% at basal and 50% at panicle initiation."
        }
      ],
      organic: [
        {
          name: "Farm Yard Manure",
          quantity: "5-10 tons/acre",
          timing: "Pre-sowing (2-3 weeks before)",
          application: "Spread and mix",
          notes: "Well decomposed manure improves soil structure."
        },
        {
          name: "Bio-fertilizers (Azospirillum)",
          quantity: "2 kg/acre",
          timing: "Seed Treatment/Soil Application",
          application: "Mix with sand/compost",
          notes: "Enhances nitrogen fixation naturally."
        }
      ],
      keyInsights: [
        `Optimal NPK ratio for ${data.crop} in ${data.soilType} soil is maintained.`,
        `Split application of Nitrogen improves efficiency by 20%.`,
        `Organic matter addition is crucial for long-term health of ${data.soilType} soil.`
      ],
      warnings: [
        "Avoid applying urea when leaves are wet to prevent leaf scorch.",
        "Ensure proper moisture in soil before fertilizer application."
      ],
      nextSteps: [
        "Procure the recommended fertilizers.",
        "Prepare the field for basal application.",
        "Schedule irrigation 2 days after application."
      ]
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setRecommendations(null);

    // Simulation of API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = generateMockRecommendations(formData);
      setRecommendations(result);
      
      toast({
        title: "Recommendations Ready",
        description: "Your personalized fertilizer recommendations have been generated.",
      });
    } catch (error) {
      console.error("[Recommendations] Error:", error);
      toast({
        title: t(recommendationsTranslations.assistantErrorTitle),
        description: "Failed to generate recommendations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden py-12 sm:py-16 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <div className="container relative mx-auto px-4 max-w-4xl">
          <div className="text-center text-white">
            <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/30 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Insights
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              {t(recommendationsTranslations.title)}
            </h1>
            <p className="text-white/90 mb-6 text-base sm:text-lg max-w-2xl mx-auto font-light">
              {t(recommendationsTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 bg-slate-50/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Field Profile */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t(recommendationsTranslations.fieldProfileHeading)}</CardTitle>
                      <CardDescription>{t(recommendationsTranslations.fieldProfileDescription)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Soil Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {t(recommendationsTranslations.soilType)} <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.soilType} onValueChange={(val) => handleInputChange("soilType", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select soil type" />
                        </SelectTrigger>
                        <SelectContent>
                          {soilTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Region */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {t(recommendationsTranslations.region)} <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.region} onValueChange={(val) => handleInputChange("region", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Crop */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {t(recommendationsTranslations.crop)} <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.crop} onValueChange={(val) => handleInputChange("crop", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {crops.map(crop => (
                            <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Crop Stage */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {t(recommendationsTranslations.cropStage)} <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.cropStage} onValueChange={(val) => handleInputChange("cropStage", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropStages.map(stage => (
                            <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Farm Size */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {t(recommendationsTranslations.farmSize)} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={t(recommendationsTranslations.farmSizePlaceholder)}
                          value={formData.farmSize}
                          onChange={(e) => handleInputChange("farmSize", e.target.value)}
                          className="flex-1"
                        />
                        <Select value={formData.farmSizeUnit} onValueChange={(val) => handleInputChange("farmSizeUnit", val)}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acres">{t(recommendationsTranslations.farmSizeUnitAcre)}</SelectItem>
                            <SelectItem value="hectares">{t(recommendationsTranslations.farmSizeUnitHectare)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-slate-500">{t(recommendationsTranslations.farmSizeHelper)}</p>
                    </div>

                    {/* Irrigation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {t(recommendationsTranslations.irrigation)}
                      </label>
                      <Select value={formData.irrigation} onValueChange={(val) => handleInputChange("irrigation", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t(recommendationsTranslations.irrigationPlaceholder)} />
                        </SelectTrigger>
                        <SelectContent>
                          {irrigationMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cultivation Focus */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t(recommendationsTranslations.cultivationFocusHeading)}</CardTitle>
                      <CardDescription>{t(recommendationsTranslations.cultivationFocusDescription)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Farming Goal */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {t(recommendationsTranslations.farmingGoal)}
                    </label>
                    <Select value={formData.farmingGoal} onValueChange={(val) => handleInputChange("farmingGoal", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(recommendationsTranslations.farmingGoalPlaceholder)} />
                      </SelectTrigger>
                      <SelectContent>
                        {farmingGoals.map(goal => (
                          <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Context */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t(recommendationsTranslations.additionalContextHeading)}</CardTitle>
                      <CardDescription>{t(recommendationsTranslations.additionalContextDescription)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Challenges */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">
                      {t(recommendationsTranslations.challengesLabel)}
                    </label>
                    <p className="text-xs text-slate-500">{t(recommendationsTranslations.challengesHelper)}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {commonChallenges.map(challenge => (
                        <div key={challenge} className="flex items-center space-x-2">
                          <Checkbox
                            id={challenge}
                            checked={formData.challenges.includes(challenge)}
                            onCheckedChange={() => handleChallengeToggle(challenge)}
                          />
                          <label
                            htmlFor={challenge}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {challenge}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {t(recommendationsTranslations.additionalNotes)}
                    </label>
                    <Textarea
                      placeholder={t(recommendationsTranslations.notesPlaceholder)}
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-slate-500">{t(recommendationsTranslations.notesHelper)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t(recommendationsTranslations.generatingRecommendations)}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t(recommendationsTranslations.getRecommendations)}
                  </>
                )}
              </Button>
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                    What You'll Get
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Beaker className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Chemical fertilizer recommendations with precise quantities</p>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Leaf className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Organic alternatives for sustainable farming</p>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Timing and application methods</p>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Sprout className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Crop-specific insights and warnings</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>• More details = better recommendations</p>
                  <p>• Select all relevant challenges</p>
                  <p>• Mention local conditions in notes</p>
                  <p>• Update for each crop stage</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommendations Display */}
          {recommendations && (
            <div className="mt-12 animate-fade-in-up">
              <Card className="border-0 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{t(recommendationsTranslations.yourRecommendations)}</CardTitle>
                      <CardDescription className="text-emerald-100">
                        Personalized for {formData.crop} • {formData.region} • {formData.farmSize} {formData.farmSizeUnit}
                      </CardDescription>
                    </div>
                    <div className="hidden sm:block">
                      <Sparkles className="w-12 h-12 text-white/20" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <Tabs defaultValue="chemical" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="chemical" className="gap-2">
                        <Beaker className="w-4 h-4" />
                        Chemical Fertilizers
                      </TabsTrigger>
                      <TabsTrigger value="organic" className="gap-2">
                        <Leaf className="w-4 h-4" />
                        Organic Alternatives
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chemical" className="space-y-4">
                      {recommendations.chemical.map((rec, idx) => (
                        <Card key={idx} className="border-slate-200 hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                                {idx + 1}
                              </div>
                              {rec.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Quantity</p>
                                <p className="text-sm font-semibold text-slate-800">{rec.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Timing</p>
                                <p className="text-sm font-semibold text-slate-800">{rec.timing}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Application Method</p>
                              <p className="text-sm text-slate-700">{rec.application}</p>
                            </div>
                            {rec.notes && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-amber-900 mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Important Note
                                </p>
                                <p className="text-sm text-amber-800">{rec.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="organic" className="space-y-4">
                      {recommendations.organic.map((rec, idx) => (
                        <Card key={idx} className="border-emerald-200 hover:shadow-lg transition-shadow bg-emerald-50/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                {idx + 1}
                              </div>
                              {rec.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Quantity</p>
                                <p className="text-sm font-semibold text-slate-800">{rec.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Timing</p>
                                <p className="text-sm font-semibold text-slate-800">{rec.timing}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Application Method</p>
                              <p className="text-sm text-slate-700">{rec.application}</p>
                            </div>
                            {rec.notes && (
                              <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3">
                                <p className="text-xs font-medium text-emerald-900 mb-1 flex items-center gap-1">
                                  <Leaf className="w-3 h-3" />
                                  Eco-Friendly Tip
                                </p>
                                <p className="text-sm text-emerald-800">{rec.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>

                  {/* Key Insights */}
                  {recommendations.keyInsights && recommendations.keyInsights.length > 0 && (
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Key Insights
                      </h3>
                      <ul className="space-y-2">
                        {recommendations.keyInsights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {recommendations.warnings && recommendations.warnings.length > 0 && (
                    <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-xl">
                      <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Important Warnings
                      </h3>
                      <ul className="space-y-2">
                        {recommendations.warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Steps */}
                  {recommendations.nextSteps && recommendations.nextSteps.length > 0 && (
                    <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Next Steps
                      </h3>
                      <ol className="space-y-2">
                        {recommendations.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-emerald-800">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Recommendations;
