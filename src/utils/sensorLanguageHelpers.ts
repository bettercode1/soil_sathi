import type { Language, TranslationSet } from "@/constants/languages";
import { mapLanguageToLocale } from "@/constants/languages";
import { sensorTranslations } from "@/constants/sensorTranslations";

type TranslateFn = (translations: Partial<Record<Language, string>> & { en: string }) => string;

const SENSOR_TYPE_KEYS: Record<string, keyof typeof sensorTranslations> = {
  ph: "ph",
  moisture: "moisture",
  temperature: "temperature",
  nitrogen: "nitrogen",
  n: "nitrogen",
  phosphorus: "phosphorus",
  p: "phosphorus",
  potassium: "potassium",
  k: "potassium",
  organic_matter: "organicMatter",
  organic: "organicMatter",
  oc: "organicMatter",
  om: "organicMatter",
  ec: "ec",
  salinity: "salinity",
  humidity: "humidity",
};

const DEVICE_STATUS_KEYS: Record<string, keyof typeof sensorTranslations> = {
  active: "active",
  calibrating: "calibrating",
  low_battery: "lowBattery",
  error: "errorStatus",
  inactive: "inactiveStatus",
};

const QUALITY_KEYS: Record<string, keyof typeof sensorTranslations> = {
  good: "good",
  fair: "fair",
  poor: "poor",
};

export const SENSOR_RECOMMENDATION_KEYS = [
  "recPhAcidic",
  "recPhAlkaline",
  "recMoistureLow",
  "recMoistureHigh",
] as const;

export type SensorRecommendationKey = (typeof SENSOR_RECOMMENDATION_KEYS)[number];

export function translateSensorType(sensorType: string, t: TranslateFn): string {
  const normalized = sensorType.toLowerCase().replace(/-/g, "_");
  const key = SENSOR_TYPE_KEYS[normalized];
  if (key && sensorTranslations[key]) {
    return t(sensorTranslations[key] as TranslationSet);
  }
  return sensorType.replace(/_/g, " ");
}

export function translateDeviceStatus(status: string, t: TranslateFn): string {
  const key = DEVICE_STATUS_KEYS[status];
  if (key && sensorTranslations[key]) {
    return t(sensorTranslations[key] as TranslationSet);
  }
  return status.replace(/_/g, " ");
}

export function translateReadingQuality(quality: string, t: TranslateFn): string {
  const key = QUALITY_KEYS[quality];
  if (key && sensorTranslations[key]) {
    return t(sensorTranslations[key] as TranslationSet);
  }
  return quality;
}

export function formatSensorLocaleTime(
  date: Date | string,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const locale = mapLanguageToLocale(language);
  return value.toLocaleTimeString(locale, options ?? { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatSensorLocaleDateTime(
  date: Date | string,
  language: Language,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const locale = mapLanguageToLocale(language);
  return value.toLocaleString(locale);
}

export function translateSensorRecommendation(recKey: string, t: TranslateFn): string {
  if (recKey in sensorTranslations) {
    return t(sensorTranslations[recKey as keyof typeof sensorTranslations] as TranslationSet);
  }
  return recKey;
}
