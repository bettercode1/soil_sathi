
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Leaf, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { recommendationsTranslations } from "@/constants/allTranslations";

const soilTypes = [
  { id: "black", name: "Black Soil (Regur)" },
  { id: "red", name: "Red Soil" },
  { id: "alluvial", name: "Alluvial Soil" },
  { id: "laterite", name: "Laterite Soil" },
  { id: "sandy", name: "Sandy Soil" },
  { id: "clayloam", name: "Clay Loam" },
];

const regions = [
  { id: "north", name: "North India" },
  { id: "south", name: "South India" },
  { id: "east", name: "East India" },
  { id: "west", name: "West India" },
  { id: "central", name: "Central India" },
  { id: "northeast", name: "North East India" },
];

const cropOptions = [
  { id: "wheat", name: "Wheat (गेहूं)" },
  { id: "rice", name: "Rice (चावल)" },
  { id: "cotton", name: "Cotton (कपास)" },
  { id: "maize", name: "Maize (मक्का)" },
  { id: "sugarcane", name: "Sugarcane (गन्ना)" },
  { id: "potato", name: "Potato (आलू)" },
  { id: "tomato", name: "Tomato (टमाटर)" },
  { id: "onion", name: "Onion (प्याज)" },
  { id: "mustard", name: "Mustard (सरसों)" },
  { id: "soybean", name: "Soybean (सोयाबीन)" },
];

const cropStages = [
  { id: "pre-sowing", name: "Pre-sowing / Land Preparation" },
  { id: "sowing", name: "Sowing / Planting" },
  { id: "vegetative", name: "Vegetative Growth" },
  { id: "flowering", name: "Flowering Stage" },
  { id: "fruiting", name: "Fruiting Stage" },
  { id: "maturity", name: "Maturity Stage" },
];

const Recommendations = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedSoil, setSelectedSoil] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<null | any>(null);

  const handleGetRecommendations = () => {
    if (!selectedSoil || !selectedRegion || !selectedCrop || !selectedStage) {
      toast({
        title: "Missing information",
        description: "Please select all required fields to get recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call to get recommendations
    setTimeout(() => {
      const dummyRecommendations = {
        chemical: {
          primary: [
            { name: "NPK 12:32:16", quantity: "150 kg/hectare", frequency: "Once at planting", details: "Mix well in soil before sowing" },
            { name: "Urea", quantity: "100 kg/hectare", frequency: "Split application", details: "Apply 50kg at 30 days after sowing, and 50kg at flowering stage" }
          ],
          secondary: [
            { name: "Zinc Sulfate", quantity: "25 kg/hectare", frequency: "Once per season", details: "Apply 3 weeks after germination" }
          ]
        },
        organic: {
          primary: [
            { name: "Farmyard Manure", quantity: "10-15 tonnes/hectare", frequency: "Once before planting", details: "Apply 2-3 weeks before sowing and mix well" },
            { name: "Vermicompost", quantity: "5 tonnes/hectare", frequency: "Once at land preparation", details: "Incorporate into soil before planting" }
          ],
          secondary: [
            { name: "Neem Cake", quantity: "200 kg/hectare", frequency: "Once per season", details: "Apply during land preparation" },
            { name: "Jeevamrut", quantity: "500 liters/hectare", frequency: "Every 15-30 days", details: "Apply as soil drench or foliar spray" }
          ]
        },
        tips: [
          "For this soil type, maintain pH between 6.0-7.0 for optimal nutrient availability",
          "Consider green manuring with dhaincha or sunhemp before wheat cultivation",
          "Use mulching to conserve soil moisture and suppress weeds"
        ]
      };

      setRecommendations(dummyRecommendations);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Layout>
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t(recommendationsTranslations.title)}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t(recommendationsTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{t(recommendationsTranslations.customRecommendations)}</CardTitle>
                <CardDescription>
                  {t(recommendationsTranslations.selectDetails)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.soilType)}
                    </label>
                    <Select value={selectedSoil} onValueChange={setSelectedSoil}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                        {soilTypes.map((soil) => (
                          <SelectItem key={soil.id} value={soil.id}>
                            {soil.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.region)}
                    </label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.crop)}
                    </label>
                    <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropOptions.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {crop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(recommendationsTranslations.cropStage)}
                    </label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select growth stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleGetRecommendations}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading-dots">{t(recommendationsTranslations.generatingRecommendations)}</span>
                  ) : (
                    t(recommendationsTranslations.getRecommendations)
                  )}
                </Button>
              </CardContent>
            </Card>

            {recommendations && (
              <div className="mt-12 animate-grow">
                <h2 className="text-2xl font-bold mb-6">{t(recommendationsTranslations.yourRecommendations)}</h2>
                <Tabs defaultValue="chemical">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="chemical">{t(recommendationsTranslations.chemicalFertilizers)}</TabsTrigger>
                    <TabsTrigger value="organic">{t(recommendationsTranslations.organicAlternatives)}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chemical">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>Chemical Fertilizer Recommendations</span>
                        </CardTitle>
                        <CardDescription>
                          Based on your soil type, region, and crop requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Primary Nutrients</h3>
                            <div className="space-y-4">
                              {recommendations.chemical.primary.map((fertilizer: any, index: number) => (
                                <div key={index} className="bg-muted p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">Frequency:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Application:</span> {fertilizer.details}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Secondary & Micronutrients</h3>
                            <div className="space-y-4">
                              {recommendations.chemical.secondary.map((fertilizer: any, index: number) => (
                                <div key={index} className="bg-muted p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">Frequency:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Application:</span> {fertilizer.details}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="organic">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Leaf className="h-5 w-5" />
                          <span>Organic Alternatives</span>
                        </CardTitle>
                        <CardDescription>
                          Natural and sustainable options for soil fertility management
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Primary Organic Inputs</h3>
                            <div className="space-y-4">
                              {recommendations.organic.primary.map((fertilizer: any, index: number) => (
                                <div key={index} className="bg-accent p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">Frequency:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Application:</span> {fertilizer.details}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Biofertilizers & Natural Amendments</h3>
                            <div className="space-y-4">
                              {recommendations.organic.secondary.map((fertilizer: any, index: number) => (
                                <div key={index} className="bg-accent p-4 rounded-md">
                                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="font-medium">{fertilizer.name}</h4>
                                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                                      {fertilizer.quantity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    <span className="font-medium">Frequency:</span> {fertilizer.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Application:</span> {fertilizer.details}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      <span>{t(recommendationsTranslations.additionalTips)}</span>
                    </CardTitle>
                    <CardDescription>
                      Helpful advice to improve your soil and crop management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.tips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Recommendations;
