# i18 reference — SoilSathi file map

## Translation bundles

| File | Contents |
|------|----------|
| `src/constants/allTranslations.ts` | Index, soil analyzer, not found, shared errors |
| `src/constants/siteTranslations.ts` | Soil analyzer form, recommendations |
| `src/constants/translations.ts` | Home page (`getHomePageCopy`) |
| `src/constants/sensorTranslations.ts` | IoT collector, charts |
| `src/constants/sensorAnalysisTranslations.ts` | Sensor report analysis |
| `src/constants/newCommonTranslations.ts` | Shared report labels |
| `src/constants/northeastUiByEnglish.ts` | NE overrides by English source text |

## Pages using `useLanguage` (keep this list updated)

`Index`, `SoilAnalyzer`, `SensorData`, `Recommendations`, `SoilHealth`, `OrganicFarming`, `FarmerHelpDesk`, `CropDiseaseIdentifier`, `WeatherAlerts`, `MarketPrices`, `IrrigationScheduler`, `FarmingCalendar`, `FertilizerCostCalculator`, `CropGrowthMonitor`, `FarmerCommunity`, `ExpertConsultation`, `Regions`, `SoilHealthPrediction`, `NotFound`

## `TranslationSet` type

```typescript
// src/constants/languages.ts
export type TranslationSet = Partial<Record<Language, string>> & { en: string };
```

`resolveTranslation` fallback order: selected → regional (e.g. as→bn→hi) → hi → en.

## Language selector

Only add languages to `LANGUAGE_OPTIONS` in `languages.ts`. Header imports `LanguageSelector` — do not duplicate dropdown items elsewhere.

## Server

- Client sends `language` on POST bodies.
- `languageSchema` in `server/index.ts` accepts 2–10 char codes.
- Demo/fallback text may use Hindi/Marathi for Indian locale codes.
