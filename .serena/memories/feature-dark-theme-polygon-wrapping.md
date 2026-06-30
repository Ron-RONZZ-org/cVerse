# Feature: Dark Theme + Polygon Label Text Wrapping

**Issue:** https://github.com/Ron-RONZZ-org/cVerse/issues/15
**Status:** Approved, issue filed, not yet implemented

## Summary
Two visual enhancements approved for implementation:

1. **Dark theme** — Theme toggle (light/dark) for both the editing interface and the exported CV PDF
2. **Polygon label text wrapping** — Fix SVG `<text>` overflow for long quality attribute names in the strength polygon diagram

## Key Decisions
- No architect consultation needed — both items extend existing patterns (accent color, localStorage composables, SVG rendering)
- Implementation order: polygon fix first (isolated, low risk), then dark theme (broader scope)
- CV template in `cvTemplate.ts` will get a `darkMode` parameter
- Dark mode composable (`useTheme`) will follow existing `useCVData` pattern

## Files to Modify
- `utils/cvTemplate.ts` — polygon text wrapping + dark mode CSS
- `utils/printCV.ts` — dark mode passthrough
- `composables/useTheme.ts` (new) — theme state composable
- `types/cv.ts` — theme config type
- `app.vue` — theme toggle UI
- Various `components/*.vue` — scoped CSS dark mode support
