import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { marketPricesTranslations, commonTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveMarketPriceAlert } from "@/services/firebase/reportService";
import { TrendingUp, Loader2, DollarSign, MapPin, IndianRupee, ArrowUpRight, ArrowDownRight, Minus, Calendar, Info } from "lucide-react";
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

  const getPriceDifference = (current: number, predicted: number) => {
    const diff = predicted - current;
    const percent = (diff / current) * 100;
    return {
      value: Math.abs(diff),
      percent: Math.abs(percent).toFixed(1),
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable"
    };
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
          <div className="max-w-5xl mx-auto space-y-8">
            <Card className="border-emerald-100 shadow-sm">
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t(commonTranslations.loading)}
                    </>
                  ) : (
                    <>
                      <IndianRupee className="mr-2 h-5 w-5" />
                      {t(marketPricesTranslations.title)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {priceData && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Price Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Price Card */}
                  <Card className="border-none shadow-md bg-white overflow-hidden">
                    <div className="h-2 bg-emerald-500 w-full" />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">{t(marketPricesTranslations.currentPrice)}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-slate-800">
                              ₹{priceData.currentPrice.value.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm font-medium text-slate-500">
                              / {priceData.currentPrice.unit}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(priceData.currentPrice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-full">
                          <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prediction Card */}
                  <Card className="border-none shadow-md bg-white overflow-hidden">
                    <div className={`h-2 w-full ${getPriceDifference(priceData.currentPrice.value, priceData.pricePrediction.predictedPrice).direction === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">{t(marketPricesTranslations.pricePrediction)}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-slate-800">
                              ₹{priceData.pricePrediction.predictedPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm font-medium text-slate-500">
                              / {priceData.pricePrediction.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {(() => {
                              const diff = getPriceDifference(priceData.currentPrice.value, priceData.pricePrediction.predictedPrice);
                              return (
                                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${diff.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {diff.direction === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                  {diff.percent}%
                                </span>
                              );
                            })()}
                            <span className="text-xs text-slate-400">
                              Confidence: {priceData.pricePrediction.confidence.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Best Time to Sell */}
                <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-amber-100 rounded-full shrink-0">
                      <IndianRupee className="h-8 w-8 text-amber-700" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-lg font-bold text-amber-900 mb-1">{t(marketPricesTranslations.bestTimeToSell)}</h3>
                      <p className="text-3xl font-bold text-amber-700 mb-2">
                        {new Date(priceData.bestTimeToSell.recommendedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        {priceData.bestTimeToSell.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-amber-800 font-medium uppercase tracking-wide">Expected Price</p>
                      <p className="text-2xl font-bold text-amber-900">
                        {formatCurrencyWithUnit(priceData.bestTimeToSell.expectedPrice, priceData.currentPrice.unit)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Simple Price History List (Replacing Complex Chart) */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Recent Price Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {priceData.priceHistory.slice(-6).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                          <p className="text-xs text-slate-500 mb-1">
                            {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="font-bold text-slate-700">₹{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Regional Comparison Table */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                      {t(marketPricesTranslations.regionalComparison)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold text-slate-600">Market</TableHead>
                            <TableHead className="font-semibold text-slate-600">Price</TableHead>
                            <TableHead className="font-semibold text-slate-600">Unit</TableHead>
                            {priceData.regionalComparison.some((m) => m.distance) && (
                              <TableHead className="font-semibold text-slate-600">Distance</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {priceData.regionalComparison.map((market, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="font-medium text-slate-800">{market.marketName}</TableCell>
                              <TableCell className="font-bold text-emerald-600">{formatCurrency(market.price)}</TableCell>
                              <TableCell className="text-slate-500">{market.unit}</TableCell>
                              {market.distance && (
                                <TableCell className="text-slate-500">{market.distance.toFixed(1)} {t(commonTranslations.km)}</TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Prediction Factors */}
                <Card className="border border-slate-200 shadow-sm bg-slate-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="h-4 w-4 text-slate-500" />
                      {t(commonTranslations.predictionFactors)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {priceData.pricePrediction.factors.map((factor, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm">
                          {factor}
                        </span>
                      ))}
                    </div>
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
