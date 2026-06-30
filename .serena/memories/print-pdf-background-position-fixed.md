# Print/PDF Background Fill: `position:fixed` Pseudo-Element

## Problem
When printing HTML to PDF via `window.print()` (Chrome), the last printed page shows a white (or wrong-color) strip below the content. Chrome's print engine paints block backgrounds ONCE on the full document canvas, then slices into pages. Below the last content pixel, there's no background.

## Solution
Use a `::before` pseudo-element on the page container with `position: fixed`:

```css
.cv-page::before {
  content: '';
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: #ffffff;   /* desired page background */
  z-index: -1;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  pointer-events: none;
}
```

## Why This Works
Chrome's print engine **replicates `position: fixed` elements on every printed page**. This is the standard CSS print behavior designed for running headers and footers (e.g., a fixed header appears at the top of page 2, page 3, etc.). By using a fixed full-viewport pseudo-element behind the content (`z-index: -1`), every page gets a complete background fill — including the area below the last page's content.

## Why Other Approaches Failed

| Approach | Failure mode |
|----------|-------------|
| `background` on `html`/`body` | Painted once on full document canvas; sliced area below content has no bg |
| `repeating-linear-gradient` | Same — painted on full canvas, not repeated per page |
| `box-decoration-break: clone` | Not supported for block elements in Chrome print engine |
| Pre-slicing into separate per-page divs | Fails when a single element (e.g., a section) is taller than one page and cannot be split |
| Matching body bg to page bg | Body bg also fragments with the content |

## Usage in cVerse
Implemented in `utils/cvTemplate.ts` as `.cv-page::before`. Dark mode variant via `html.dark .cv-page::before { background: #1e293b; }`. The `.cv-page` itself no longer sets `background` (it's delegated to `::before`).

## Key Insight
This is not a "background rendering" problem — it's a "positioning" problem. The fix comes from understanding Chrome's print-specific behavior of `position: fixed`, not from CSS background properties.
