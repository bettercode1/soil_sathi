
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, PlusCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilHealthTranslations } from "@/constants/allTranslations";

const mockSoilHistoryData = [
  {
    date: "Jan 2023",
    ph: 6.2,
    nitrogen: 240,
    phosphorus: 35,
    potassium: 180,
    organic: 1.8
  },
  {
    date: "Apr 2023",
    ph: 6.5,
    nitrogen: 260,
    phosphorus: 38,
    potassium: 195,
    organic: 2.1
  },
  {
    date: "Oct 2023",
    ph: 6.7,
    nitrogen: 280,
    phosphorus: 42,
    potassium: 210,
    organic: 2.5
  },
  {
    date: "Jan 2024",
    ph: 6.8,
    nitrogen: 285,
    phosphorus: 45,
    potassium: 215,
    organic: 2.6
  },
];

const nutrientStandardLevels = {
  ph: {
    low: 5.5,
    optimal: 6.5,
    high: 7.5
  },
  nitrogen: {
    low: 140,
    optimal: 280,
    high: 400
  },
  phosphorus: {
    low: 20,
    optimal: 40,
    high: 60
  },
  potassium: {
    low: 150,
    optimal: 250,
    high: 350
  },
  organic: {
    low: 1.0,
    optimal: 3.0,
    high: 5.0
  }
};

const getNutrientStatus = (value: number, nutrient: string) => {
  const levels = nutrientStandardLevels[nutrient as keyof typeof nutrientStandardLevels];
  if (value < levels.low) {
    return "Very Low";
  } else if (value < levels.optimal) {
    return "Low";
  } else if (value <= levels.high) {
    return "Optimal";
  } else {
    return "High";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Very Low":
      return "text-red-600";
    case "Low":
      return "text-yellow-600";
    case "Optimal":
      return "text-green-600";
    case "High":
      return "text-blue-600";
    default:
      return "text-foreground";
  }
};

const SoilHealth = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Latest soil data is the most recent entry
  const latestSoilData = mockSoilHistoryData[mockSoilHistoryData.length - 1];

  const handleAddNewReading = () => {
    toast({
      title: "Coming soon!",
      description: "This feature will allow you to add new soil test readings."
    });
  };

  const handleSetReminder = () => {
    toast({
      title: "Reminder set!",
      description: "We'll remind you to test your soil again in 3 months."
    });
  };

  return (
    <Layout>
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t(soilHealthTranslations.title)}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t(soilHealthTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t(soilHealthTranslations.soilHealthOverview)}</CardTitle>
                  <CardDescription>
                    {t(soilHealthTranslations.currentStatus)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">Soil pH</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.ph}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.ph, "ph"))} text-sm font-medium`}>
                          {getNutrientStatus(latestSoilData.ph, "ph")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">Nitrogen (N)</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.nitrogen}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.nitrogen, "nitrogen"))} text-sm font-medium`}>
                          {getNutrientStatus(latestSoilData.nitrogen, "nitrogen")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">kg/hectare</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">Phosphorus (P)</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.phosphorus}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.phosphorus, "phosphorus"))} text-sm font-medium`}>
                          {getNutrientStatus(latestSoilData.phosphorus, "phosphorus")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">kg/hectare</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">Potassium (K)</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.potassium}</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.potassium, "potassium"))} text-sm font-medium`}>
                          {getNutrientStatus(latestSoilData.potassium, "potassium")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">kg/hectare</p>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h3 className="font-semibold">Organic Matter</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xl font-bold">{latestSoilData.organic}%</span>
                        <span className={`${getStatusColor(getNutrientStatus(latestSoilData.organic, "organic"))} text-sm font-medium`}>
                          {getNutrientStatus(latestSoilData.organic, "organic")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t(soilHealthTranslations.actions)}</CardTitle>
                  <CardDescription>
                    {t(soilHealthTranslations.manageData)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={handleAddNewReading} className="w-full flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>{t(soilHealthTranslations.addNewTest)}</span>
                    </Button>
                    
                    <Button variant="outline" onClick={handleSetReminder} className="w-full flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t(soilHealthTranslations.setReminder)}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t(soilHealthTranslations.nutrientTrends)}</CardTitle>
                <CardDescription>
                  {t(soilHealthTranslations.trackChanges)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="npk">
                  <TabsList className="mb-6">
                    <TabsTrigger value="npk">NPK Levels</TabsTrigger>
                    <TabsTrigger value="ph">pH & Organic Matter</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="npk">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={mockSoilHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="nitrogen" stroke="#4CAF50" name="Nitrogen (N)" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="phosphorus" stroke="#2196F3" name="Phosphorus (P)" />
                        <Line type="monotone" dataKey="potassium" stroke="#FF9800" name="Potassium (K)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="ph">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-center font-medium mb-4">pH Level</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={mockSoilHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[5, 8]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="ph" stroke="#9C27B0" name="pH" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h3 className="text-center font-medium mb-4">Organic Matter (%)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={mockSoilHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="organic" fill="#8B4513" name="Organic Matter %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t(soilHealthTranslations.testHistory)}</CardTitle>
                <CardDescription>
                  {t(soilHealthTranslations.completeRecord)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">pH</th>
                        <th className="text-left py-3 px-4">Nitrogen (N)</th>
                        <th className="text-left py-3 px-4">Phosphorus (P)</th>
                        <th className="text-left py-3 px-4">Potassium (K)</th>
                        <th className="text-left py-3 px-4">Organic Matter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSoilHistoryData.slice().reverse().map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{item.date}</td>
                          <td className="py-3 px-4">{item.ph}</td>
                          <td className="py-3 px-4">{item.nitrogen} kg/ha</td>
                          <td className="py-3 px-4">{item.phosphorus} kg/ha</td>
                          <td className="py-3 px-4">{item.potassium} kg/ha</td>
                          <td className="py-3 px-4">{item.organic}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SoilHealth;
