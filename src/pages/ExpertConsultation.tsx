import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { commonTranslations } from "@/constants/allTranslations";
import { Users, Calendar, Video } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

const ExpertConsultation = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [selectedExpert, setSelectedExpert] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const handleBook = () => {
    if (!selectedExpert || !selectedDate) {
      toast({
        title: t(commonTranslations.missingInformation),
        description: t(commonTranslations.selectExpertAndDate),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t(commonTranslations.featureComingSoon),
      description: t(commonTranslations.featureComingSoon),
    });
  };

  return (
    <Layout>
      <PageHero
        title={t(commonTranslations.expertConsultation)}
        subtitle={t(commonTranslations.bookExpertConsultation)}
        icon={Users}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  {t(commonTranslations.availableExperts)}
                </CardTitle>
                <CardDescription>
                  {t(commonTranslations.selectExpertAndBook)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t(commonTranslations.selectExpert)}
                  </label>
                  <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                    <SelectTrigger>
                      <SelectValue placeholder={t(commonTranslations.chooseExpert)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expert1">
                        Dr. Rajesh Kumar - {t(commonTranslations.soilInformation)}
                      </SelectItem>
                      <SelectItem value="expert2">
                        Dr. Priya Sharma - {t(commonTranslations.cropName)}
                      </SelectItem>
                      <SelectItem value="expert3">
                        Dr. Amit Singh - {t(commonTranslations.cropName)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t(commonTranslations.selectDateAndTime)}
                  </label>
                  <Input
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleBook} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30" size="lg">
                  <Video className="mr-2 h-4 w-4" />
                  {t(commonTranslations.bookConsultation)}
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  {t(commonTranslations.howItWorks)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t(commonTranslations.selectExpert)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(commonTranslations.chooseFromPanel)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t(commonTranslations.bookSlot)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(commonTranslations.selectConvenientDateTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t(commonTranslations.videoCall)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(commonTranslations.joinVideoCall)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ExpertConsultation;

