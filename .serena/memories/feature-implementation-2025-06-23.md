# Feature Implementation: 5 New CV Features (June 23, 2025)

## Summary
All 5 features from issue #13 have been implemented, committed to main, and verified.

## Files Changed

### New files:
- `data/countries.ts` + `data/countriesEn.json` + `data/countriesFr.json` — 249 countries from umpirsky/country-list
- `data/languages.ts` + `data/languagesEn.json` + `data/languagesFr.json` — 560 languages from umpirsky/language-list
- `components/DropdownAutocomplete.vue` — reusable partial-match autocomplete component

### Modified files:
- `types/cv.ts` — added CEFRLevel, QualityAttribute, QRCodeConfig, FooterConfig types + new CVData fields
- `composables/useCVData.ts` — CEFR migration (1-5 → A1-C2), new default state, quality attribute methods
- `utils/cvTemplate.ts` — CEFR language bars, SVG strength polygon, QR placeholder, credit footer
- `utils/printCV.ts` — async QR code generation via qrcode library, SVG injection into HTML
- `components/PersonalInfoForm.vue` — nationality input replaced with DropdownAutocomplete
- `app.vue` — language name dropdown, CEFR selector, polygon mode toggle, QR settings, footer settings
- `locales/en.json` + `locales/fr.json` — all new i18n keys

## Dependencies
- Added `qrcode` npm package (MIT, ~10KB, zero transitive deps)

## Data Sources
- Countries: https://github.com/umpirsky/country-list (ISO 3166, 249 entries)
- Languages: https://github.com/umpirsky/language-list (filtered to remove regional variants and ancient languages)
