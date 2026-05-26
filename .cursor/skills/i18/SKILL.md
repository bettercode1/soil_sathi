---
name: i18
description: >-
  SoilSathi full-site internationalization. Use when adding or fixing translations,
  language selector, Northeast India languages, i18n, locale, or when any page shows
  English/hardcoded text after the user changes language. Ensures selecting any language
  updates the entire website via LanguageContext.
---

# /i18 — Full-site language switching (SoilSathi)

## Goal

When the user picks **any** language in the header globe menu, **every user-visible string** on every page must update immediately and stay in sync (persisted in `localStorage`).

Supported codes (13): `en`, `hi`, `pa`, `ta`, `te`, `bn`, `mr`, `as`, `mni`, `lus`, `ne`, `kha`, `brx`.

## Architecture (do not reinvent)

| Layer | File | Role |
|-------|------|------|
| Types & labels | `src/constants/languages.ts` | `Language`, `ALL_LANGUAGES`, `LANGUAGE_OPTIONS`, `resolveTranslation`, `mapLanguageToLocale` |
| Context | `src/contexts/LanguageContext.tsx` | `language`, `setLanguage`, `t()`, `getLanguageName`; persists `soilsathi-language` |
| NE auto-fill | `src/utils/expandTranslations.ts` | `expandTranslationSet`, `toAllLanguages` — fills missing NE keys from bn/hi/en |
| NE string map | `src/constants/northeastUiByEnglish.ts` | Native NE text keyed by English `en` string |
| UI picker | `src/components/shared/LanguageSelector.tsx` | India + Northeast groups; used in `Header.tsx` |
| Copy bundles | `src/constants/*Translations.ts`, `allTranslations.ts` | Page/feature strings as `TranslationSet` |
| App root | `src/App.tsx` | Wraps routes in `<LanguageProvider>` |

**Rule:** Never add a second language state. Always `useLanguage()` from context.

## How to show translated text

### 1. Translation constants (preferred for pages)

```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import { soilAnalyzerTranslations } from "@/constants/allTranslations";

const { t, language } = useLanguage();

// t() auto-expands NE languages via expandTranslationSet
<h1>{t(soilAnalyzerTranslations.title)}</h1>
```

New keys go in the nearest `*Translations.ts` file. **Every key must have `en`**. Add `hi`, `mr`, `bn`, etc. when you have real copy; NE codes can rely on `expandTranslationSet` + `northeastUiByEnglish`.

### 2. Inline multi-language object

```typescript
const { t } = useLanguage();

t({
  en: "Save",
  hi: "सहेजें",
  mr: "जतन करा",
  // as/mni/lus/ne/kha/brx optional — filled by expandTranslationSet if omitted
});
```

For `Record<Language, string>` literals (e.g. Farmer Help Desk), use `toAllLanguages({ en: "...", hi: "..." })` from `expandTranslations.ts`.

### 3. Dynamic / API content

- Pass `language` in API body: `{ language, ...payload }` (see `SoilAnalyzer.tsx`).
- Server should respect `language` for prompts; UI labels still use `t()`.
- Do not hardcode `language: "en"` in client-generated reports.

### 4. Dates & numbers

Use `mapLanguageToLocale(language)` from `languages.ts` for `toLocaleString` / `toLocaleTimeString`.

### 5. Sensor / IoT labels

Use `translateSensorType`, `translateDeviceStatus`, `translateReadingQuality` from `src/utils/sensorLanguageHelpers.ts` — never show raw `ph`, `good`, `active` in UI.

## Adding a new language (rare)

1. Add code to `Language` union + `ALL_LANGUAGES` + `LANGUAGE_NATIVE_NAMES` + `LANGUAGE_DISPLAY_LABELS` + `LANGUAGE_OPTIONS` in `languages.ts`.
2. Add `REGIONAL_FALLBACK` / `NE_FILL_SOURCES` entries in `languages.ts` and `expandTranslations.ts`.
3. Add `mapLanguageToLocale` case.
4. Add entries to `northeastUiByEnglish.ts` only if it is a NE language.
5. Grep for hardcoded language lists and update.

## Adding a new page or component

Checklist — complete before marking done:

```
- [ ] Component calls useLanguage() (or receives t/language from parent that does)
- [ ] No user-facing hardcoded English (grep title=, placeholder=, toast, Alert, Button children)
- [ ] New strings live in *Translations.ts with at least en (+ hi/mr when possible)
- [ ] Mobile nav / sheet labels use t() (see Header.tsx pattern)
- [ ] Error toasts use translated keys (soilAnalyzer server/gemini/missing key types)
- [ ] API calls send language from context, not a literal
- [ ] PDF/export text uses t() for section titles
- [ ] Test: switch mr → as → hi → en in header; entire page updates without refresh
```

## Audit commands (run on changed areas)

```bash
# Pages missing useLanguage
rg -l "\.tsx$" src/pages | xargs -I{} sh -c 'rg -q "useLanguage" {} || echo {}'

# Obvious hardcoded UI strings in TSX (review hits)
rg '>(Home|Submit|Error|Loading|Save|Cancel)<' src --glob "*.tsx"

# Old 7-language-only types (should use @/constants/languages)
rg '"en" \| "hi" \| "pa"' src

# Language selector duplicates (should use LanguageSelector only)
rg "setLanguage\(\"" src/components --glob "!LanguageSelector.tsx"
```

## Common bugs

| Symptom | Fix |
|---------|-----|
| Header changes language but page stays English | Page missing `useLanguage()` / `t()` |
| NE language shows Hindi only | OK fallback; add real copy to translation key or `northeastUiByEnglish` |
| Toast wrong language | Pass `t(translations.key)` not English string |
| "API कोटा" for server 429 | Use `errorType` from API + `getErrorCopy` pattern in `SoilAnalyzer.tsx` |
| Language resets on reload | Ensure `setLanguage` writes `localStorage` (already in context) |
| newFeatureItems in Header show English | Translate keys in Header or feature translation map |

## Files that must stay in sync

- `src/components/layout/Header.tsx` — nav labels + `LanguageSelector`
- `src/constants/allTranslations.ts` — large shared bundles
- `src/constants/siteTranslations.ts`, `sensorTranslations.ts`, `sensorAnalysisTranslations.ts`
- `src/pages/FarmerHelpDesk.tsx` — `toAllLanguages` for big copy blocks
- `server/index.ts` — `language` on analyze/recommendation endpoints

## Quality bar

- **Never** ship user-visible English on non-English selection unless `en` is selected.
- Prefer **native script** for NE languages in `northeastUiByEnglish`, not transliteration-only.
- Keep `SKILL` changes minimal: one translation file per feature area; avoid duplicate keys.
- Do not create README or docs unless the user asks.

## Quick test plan

1. Open deployed or `npm run dev` →任意 page.
2. Globe → select **मराठी**, **অসমীয়া**, **नेपाली**, **English** — nav, body, buttons, errors all switch.
3. Reload — language persists.
4. Soil Analyzer + Sensor Data + Help Desk — run one action per language.

For file-level detail, see [reference.md](reference.md).
