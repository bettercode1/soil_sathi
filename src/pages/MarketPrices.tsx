import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { marketPricesTranslations, commonTranslations } from "@/constants/allTranslations";
import { PriceChart } from "@/components/shared/PriceChart";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveMarketPriceAlert } from "@/services/firebase/reportService";
import { TrendingUp, Loader2, DollarSign, MapPin, IndianRupee } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatCurrencyWithUnit } from "@/utils/currencyUtils";
import { PageHero } from "@/components/shared/PageHero";

type MarketPriceData = {
  language: string;
  currentPrice: {
    value: number;
    unit: string;
    date: string;
  };
  priceHistory: Array<{
    date: string;
    price: number;
    unit: string;
  }>;
  pricePrediction: {
    predictedPrice: number;
    unit: string;
    dateRange: {
      start: string;
      end: string;
    };
    confidence: number;
    factors: string[];
  };
  bestTimeToSell: {
    recommendedDate: string;
    expectedPrice: number;
    reason: string;
  };
  regionalComparison: Array<{
    marketName: string;
    price: number;
    unit: string;
    distance?: number;
  }>;
};

const MarketPrices = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const cropOptions = [
    { id: "wheat", label: t(commonTranslations.wheat) },
    { id: "rice", label: t(commonTranslations.rice) },
    { id: "cotton", label: t(commonTranslations.cotton) },
    { id: "tomato", label: t(commonTranslations.tomato) },
    { id: "potato", label: t(commonTranslations.potato) },
    { id: "onion", label: t(commonTranslations.onion) },
    { id: "sugarcane", label: t(commonTranslations.sugarcane) },
    { id: "maize", label: t(commonTranslations.maize) },
  ];

  const [selectedCrop, setSelectedCrop] = useState("");
  const [region, setRegion] = useState("");
  const [days, setDays] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<MarketPriceData | null>(null);

  const handleGetPrices = async () => {
    if (!selectedCrop) {
      toast({
        title: t(marketPricesTranslations.selectCrop),
        description: t(marketPricesTranslations.selectCrop),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPriceData(null);

    try {
      const crop = cropOptions.find((c) => c.id === selectedCrop);
      const params = new URLSearchParams({
        language,
        cropName: crop?.label || selectedCrop,
        ...(region && { region }),
        days,
      });

      const response = await fetch(buildApiUrl(`/api/market-prices?${params}`));

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<MarketPriceData>(response);
      setPriceData(result);

      // Save to Firebase
      try {
        await saveMarketPriceAlert({
          language: result.language as any,
          cropName: crop?.label || selectedCrop,
          cropType: "Unknown",
          region: region || "Unknown",
          currentPrice: {
            value: result.currentPrice.value,
            unit: result.currentPrice.unit,
            date: new Date(result.currentPrice.date),
          },
          priceHistory: result.priceHistory.map((h) => ({
            date: new Date(h.date),
            price: h.price,
            unit: h.unit,
          })),
          pricePrediction: {
            predictedPrice: result.pricePrediction.predictedPrice,
            unit: result.pricePrediction.unit,
            dateRange: {
              start: new Date(result.pricePrediction.dateRange.start),
              end: new Date(result.pricePrediction.dateRange.end),
            },
            confidence: result.pricePrediction.confidence,
            factors: result.pricePrediction.factors,
          },
          bestTimeToSell: {
            recommendedDate: new Date(result.bestTimeToSell.recommendedDate),
            expectedPrice: result.bestTimeToSell.expectedPrice,
            reason: result.bestTimeToSell.reason,
          },
          regionalComparison: result.regionalComparison,
        });
      } catch (err) {
        console.error("Failed to save price alert:", err);
      }
    } catch (error) {
      toast({
        title: t(commonTranslations.errorFetchingPrices),
        description: error instanceof Error ? error.message : t(commonTranslations.errorFetchingPrices),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHero
        title={t(marketPricesTranslations.title)}
        subtitle={t(marketPricesTranslations.subtitle)}
        icon={IndianRupee}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  {t(commonTranslations.marketInformation)}
                </CardTitle>
                <CardDescription>
                  {t(marketPricesTranslations.subtitle)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(marketPricesTranslations.selectCrop)} *
                    </label>
                    <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder={t(marketPricesTranslations.selectCrop)} />
                      </SelectTrigger>
                      <SelectContent>
                        {cropOptions.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {crop.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.region)}</label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder={t(commonTranslations.regionPlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(commonTranslations.predictionDays)}
                    </label>
                    <Select value={days} onValueChange={setDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 {t(commonTranslations.days)}</SelectItem>
                        <SelectItem value="15">15 {t(commonTranslations.days)}</SelectItem>
                        <SelectItem value="30">30 {t(commonTranslations.days)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGetPrices}
                  disabled={isLoading || !selectedCrop}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t(commonTranslations.loading)}
                    </>
                  ) : (
                    <>
                      <IndianRupee className="mr-2 h-4 w-4" />
                      {t(marketPricesTranslations.title)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {priceData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        {t(marketPricesTranslations.currentPrice)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-emerald-600 flex items-center gap-1">
                        <IndianRupee className="h-8 w-8" />
                        {priceData.currentPrice.value.toLocaleString("en-IN")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t(commonTranslations.per)} {priceData.currentPrice.unit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t(commonTranslations.date)}: {new Date(priceData.currentPrice.date).toLocaleDateString(language === "en" ? "en-IN" : "hi-IN")}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        {t(marketPricesTranslations.pricePrediction)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-emerald-600 flex items-center gap-1">
                        <IndianRupee className="h-8 w-8" />
                        {priceData.pricePrediction.predictedPrice.toLocaleString("en-IN")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t(commonTranslations.per)} {priceData.pricePrediction.unit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t(commonTranslations.confidence)}: {priceData.pricePrediction.confidence.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(priceData.pricePrediction.dateRange.start).toLocaleDateString(language === "en" ? "en-IN" : "hi-IN")} -{" "}
                        {new Date(priceData.pricePrediction.dateRange.end).toLocaleDateString(language === "en" ? "en-IN" : "hi-IN")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      {t(commonTranslations.priceTrend)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PriceChart
                      data={priceData.priceHistory.map((h) => ({
                        date: new Date(h.date),
                        price: h.price,
                        unit: h.unit,
                      }))}
                      unit={priceData.currentPrice.unit}
                      height={300}
                    />
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>{t(marketPricesTranslations.bestTimeToSell)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">
                        {new Date(priceData.bestTimeToSell.recommendedDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(commonTranslations.expectedPrice)}: <span className="font-semibold text-emerald-600">{formatCurrencyWithUnit(priceData.bestTimeToSell.expectedPrice, priceData.currentPrice.unit)}</span>
                      </p>
                      <p className="text-sm">{priceData.bestTimeToSell.reason}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                      {t(marketPricesTranslations.regionalComparison)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Market</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Unit</TableHead>
                            {priceData.regionalComparison.some((m) => m.distance) && (
                              <TableHead>Distance</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {priceData.regionalComparison.map((market, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{market.marketName}</TableCell>
                              <TableCell className="font-semibold text-emerald-600">{formatCurrency(market.price)}</TableCell>
                              <TableCell>{market.unit}</TableCell>
                              {market.distance && (
                                <TableCell>{market.distance.toFixed(1)} {t(commonTranslations.km)}</TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>
                      {t(commonTranslations.predictionFactors)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {priceData.pricePrediction.factors.map((factor, idx) => (
                        <li key={idx} className="leading-relaxed">{factor}</li>
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

export default MarketPrices;

