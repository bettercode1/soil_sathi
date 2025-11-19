import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { commonTranslations } from "@/constants/allTranslations";
import { MessageCircle, Send } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

const FarmerCommunity = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: t(commonTranslations.messageRequired),
        description: t(commonTranslations.enterMessage),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t(commonTranslations.featureComingSoon),
      description: t(commonTranslations.featureComingSoon),
    });
    setMessage("");
  };

  return (
    <Layout>
      <PageHero
        title={t(commonTranslations.farmerCommunityChat)}
        subtitle={t(commonTranslations.connectWithFarmers)}
        icon={MessageCircle}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-500" />
                  {t(commonTranslations.communityChat)}
                </CardTitle>
                <CardDescription>
                  {t(commonTranslations.chatWithFarmers)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/50">
                  <div className="text-center text-muted-foreground py-20">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {t(commonTranslations.realtimeChatComingSoon)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t(commonTranslations.typeYourMessage)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button onClick={handleSend} className="bg-emerald-600 hover:bg-emerald-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FarmerCommunity;

