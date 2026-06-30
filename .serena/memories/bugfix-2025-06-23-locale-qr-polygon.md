# Bugfix: Locale, QR codes, polygon overflow, checkbox text

## Changes made
1. **Qualities checkbox text** — Updated `en.json`/`fr.json` `qualities.showStrength` to "Show as polygon strength diagram" / "Afficher sous forme de diagramme de force"
2. **QR code placeholder text** — Removed ugly `QR: {url}` text from placeholder SVG. `CVPreview.vue` now generates real QR codes using the `qrcode` library after iframe load. `printCV.ts` already did this for PDF export.
3. **Locale-aware template** — Created `LOCALE_STRINGS` lookup in `cvTemplate.ts` with bilingual translations for:
   - Section titles (Experience, Education, Languages, Qualities, Skills, Interests)
   - Contact labels (Email, Phone, Location, Age, Nationality, Web, LinkedIn)
   - CEFR level labels
   - `renderCV()` now uses `locale` parameter for all text
4. **Polygon text overflow** — Increased SVG viewBox from `300x300` to `400x400`, center from `(150,150)` to `(200,200)`, label radius from `140` to `175`, added dynamic text-length-based label offset
5. **Multiple QR codes** — Data model changed from single `QRCodeConfig` with `{enabled, caption, decoration}` to `{enabled, items: QRCodeItem[]}`. Migration converts old format. UI lets you add/remove QR items with URL, caption, decoration. Template renders side-by-side in flex row.

## Files modified
- `types/cv.ts` — New `QRCodeItem` interface, updated `QRCodeConfig`
- `composables/useCVData.ts` — Migration, new `addQRCode`/`removeQRCode` methods
- `locales/en.json`, `locales/fr.json` — New/updated locale keys
- `utils/cvTemplate.ts` — Locale-aware strings, fixed polygon, multi-QR
- `utils/printCV.ts` — Multi-QR code replacement
- `components/CVPreview.vue` — QR code generation for preview
- `app.vue` — Multi-QR UI, checkbox text
