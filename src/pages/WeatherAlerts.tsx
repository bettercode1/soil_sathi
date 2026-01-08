import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { weatherAlertsTranslations, commonTranslations } from "@/constants/allTranslations";
import { AlertCard } from "@/components/shared/AlertCard";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveWeatherAlert } from "@/services/firebase/reportService";
import { MapPin, Cloud, Loader2, Thermometer, Droplets, Wind, Umbrella, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

type WeatherAlert = {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  recommendations: string[];
  weatherData: {
    temperature: number;
    humidity: number;
    precipitation?: number;
    windSpeed?: number;
    condition: string;
    forecast?: string;
  };
};

type WeatherAlertsResponse = {
  language: string;
  alerts: WeatherAlert[];
};

const WeatherAlerts = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [region, setRegion] = useState("");
  const [cropName, setCropName] = useState("");
  const [cropStage, setCropStage] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherAlert["weatherData"] | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t(commonTranslations.geolocationNotSupported),
        description: t(commonTranslations.enterRegionManually),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLoading(false);
        toast({
          title: t(commonTranslations.locationDetected),
          description: t(commonTranslations.usingCurrentLocation),
        });
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: t(commonTranslations.locationAccessDenied),
          description: t(commonTranslations.enterRegionManually),
          variant: "destructive",
        });
      }
    );
  };

  const handleGetAlerts = async () => {
    if (!region.trim() && !latitude && !longitude) {
      toast({
        title: t(commonTranslations.locationRequired),
        description: t(commonTranslations.provideRegionOrLocation),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAlerts([]);
    setWeatherData(null);

    try {
      const response = await fetch(buildApiUrl("/api/weather-alerts"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          region: region.trim() || undefined,
          cropName: cropName.trim() || undefined,
          cropStage: cropStage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<WeatherAlertsResponse>(response);
      setAlerts(result.alerts);
      if (result.alerts.length > 0) {
        setWeatherData(result.alerts[0].weatherData);
      }

      // Save alerts to Firebase
      for (const alert of result.alerts) {
        try {
          await saveWeatherAlert({
            language: result.language as any,
            region: region.trim() || "Unknown",
            location: latitude && longitude ? { latitude, longitude } : undefined,
            alertType: alert.type as any,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            recommendations: alert.recommendations,
            weatherData: alert.weatherData,
            effectiveDate: new Date(),
          });
        } catch (err) {
          console.error("Failed to save alert:", err);
        }
      }
    } catch (error) {
      toast({
        title: t(commonTranslations.errorFetchingAlerts),
        description: error instanceof Error ? error.message : t(commonTranslations.errorFetchingAlerts),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHero
        title={t(weatherAlertsTranslations.title)}
        subtitle={t(weatherAlertsTranslations.subtitle)}
        icon={Cloud}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Input Form */}
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  {t(commonTranslations.cropFarmInfo)}
                </CardTitle>
                <CardDescription>
                  {t(weatherAlertsTranslations.subtitle)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">
                      {t(weatherAlertsTranslations.region)} *
                    </label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder={t(commonTranslations.regionPlaceholder)}
                    />
                  </div>
                  <Button
                    onClick={getLocation}
                    disabled={isLoading}
                    variant="outline"
                    className="sm:mt-8"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {t(weatherAlertsTranslations.getLocation)}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(weatherAlertsTranslations.cropName)}
                    </label>
                    <Input
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder={t(commonTranslations.cropNamePlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t(weatherAlertsTranslations.cropStage)}
                    </label>
                    <Input
                      value={cropStage}
                      onChange={(e) => setCropStage(e.target.value)}
                      placeholder={t(commonTranslations.cropStagePlaceholder)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGetAlerts}
                  disabled={isLoading || (!region.trim() && !latitude && !longitude)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 py-6 text-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t(weatherAlertsTranslations.loading)}
                    </>
                  ) : (
                    <>
                      <Cloud className="mr-2 h-5 w-5" />
                      {t(weatherAlertsTranslations.getAlerts)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Weather Data Display */}
            {weatherData && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Visual Weather Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-orange-50 border-orange-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                        <Thermometer className="h-6 w-6 text-orange-500" />
                      </div>
                      <span className="text-2xl font-bold text-slate-800">{weatherData.temperature}°C</span>
                      <span className="text-xs text-slate-500">{t(weatherAlertsTranslations.temperature)}</span>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                        <Droplets className="h-6 w-6 text-blue-500" />
                      </div>
                      <span className="text-2xl font-bold text-slate-800">{weatherData.humidity}%</span>
                      <span className="text-xs text-slate-500">{t(weatherAlertsTranslations.humidity)}</span>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50 border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                        <Wind className="h-6 w-6 text-slate-500" />
                      </div>
                      <span className="text-2xl font-bold text-slate-800">{weatherData.windSpeed || 0}</span>
                      <span className="text-xs text-slate-500">{t(commonTranslations.kmhWind)}</span>
                    </CardContent>
                  </Card>

                  <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                        <Umbrella className="h-6 w-6 text-indigo-500" />
                      </div>
                      <span className="text-2xl font-bold text-slate-800">{weatherData.precipitation || 0}%</span>
                      <span className="text-xs text-slate-500">{t(commonTranslations.precipitation)}</span>
                    </CardContent>
                  </Card>
                </div>
                
                {weatherData.forecast && (
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Cloud className="h-5 w-5 text-blue-500" />
                        {t(commonTranslations.forecastPeriod)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{weatherData.forecast}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Alerts Display */}
            {alerts.length > 0 ? (
              <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  <h2 className="text-2xl font-bold text-slate-800">{t(weatherAlertsTranslations.title)}</h2>
                </div>
                {alerts.map((alert, index) => (
                  <AlertCard
                    key={index}
                    title={alert.title}
                    message={alert.message}
                    severity={alert.severity}
                    recommendations={alert.recommendations}
                    date={new Date()}
                  />
                ))}
              </div>
            ) : !isLoading && alerts.length === 0 && (region || latitude) ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground flex flex-col items-center py-8">
                    <Cloud className="h-12 w-12 text-slate-200 mb-4" />
                    <p>{t(weatherAlertsTranslations.noAlerts)}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WeatherAlerts;
