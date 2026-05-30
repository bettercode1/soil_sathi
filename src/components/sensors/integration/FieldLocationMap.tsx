import { MapPin, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";

interface FieldLocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

export const FieldLocationMap = ({ latitude, longitude, address }: FieldLocationMapProps) => {
  const { t } = useLanguage();
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          {t(si.fieldLocation)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-48 md:h-56">
          <iframe title={t(si.fieldLocation)} src={mapUrl} className="w-full h-full border-0" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center gap-2 text-white text-sm">
              <Navigation className="h-4 w-4" />
              <div>
                <p className="font-medium">{address ?? t(si.demoFarmField)}</p>
                <p className="text-xs text-white/80">
                  {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
