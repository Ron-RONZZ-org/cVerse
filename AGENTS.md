# AGENTS.md — Root Project Rules for cVerse

This is the canonical, repo-wide instruction file for AI agents working on **cVerse**.

## Hierarchical Context Model

Agents **must** follow this rule:

> When working inside a directory, load the nearest `AGENTS.md` file and merge it with parent `AGENTS.md` files up to root.  
> Local rules override global rules.

Context resolution order (highest priority first):
1. `AGENTS-[module].md` in module directories — module-specific context
2. `AGENTS.md` in current working directory (if present)
3. Root `AGENTS.md` — global project rules

---
## Project Overview

**cVerse** is a serverless, client-side-only CV (resume) generator built with Nuxt 4. It provides bilingual support (English/French) and generates professional PDFs via browser-native print-to-PDF (HTML/CSS rendering).

### Key Features
- Bilingual UI (English/French) with i18n
- Personal info with photo cropping, custom header fields, web links
- Professional experience & education blocks (reorderable, markdown descriptions)
- Language skills section with proficiency levels (1-5) and visual progress bars
- Qualities, Skills, Interests sections (markdown supported)
- Custom markdown sections (arbitrary title + body)
- Accent color customization for PDF output
- Live CV preview (rendered HTML in iframe)
- PDF export via browser print-to-PDF (`window.print()`)
- Auto-save to localStorage, JSON export/import

---

## Language and Naming Conventions

- **Language**: TypeScript throughout
- **Components**: PascalCase (e.g., `PersonalInfoForm.vue`, `CVPreview.vue`)
- **Composables**: `use` prefix + camelCase (e.g., `useCVData`)
- **Utilities**: camelCase (e.g., `renderCV`, `printCV`, `mdToHtml`)
- **Types/Interfaces**: PascalCase (e.g., `CVData`, `ExperienceBlock`, `LanguageSkill`)
- **Files**: match the exported symbol name where sensible
- **All user-facing text** must support both English and French via locale files

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (Vue 3 with Composition API, `<script setup lang="ts">`) |
| Language | TypeScript 5 |
| i18n | vue-i18n (compat mode, `useI18n()` composable) |
| PDF Export | Browser-native `window.print()` via hidden iframe |
| Markdown | Custom lightweight parser (bold, italic, links, bullet lists, indentation) |
| Storage | Browser localStorage (no backend) |
| CSS | Scoped `<style>` in components + global styles in `app.vue` |
| Photo Crop | Custom canvas-based cropper (`PhotoCropper.vue`) |

---

## Dependency management

This project uses **npm** for dependency management.

```bash
npm install        # Install dependencies
npm run dev        # Start dev server on localhost:3000
npm run build      # Build for production
npm run generate   # Generate static files (.output/public/)
npm run preview    # Preview production build
```

No package manager other than npm should be used.

---

## Coding Guidelines

1. **Vue 3 Composition API** — Always use `<script setup lang="ts">` with explicit `defineProps`/`defineEmits`.
2. **Single-responsibility components** — Keep components focused. Split at ~300 lines.
3. **TypeScript interfaces for all data** — Define in `types/cv.ts`. Use `defineProps<Props>()` pattern.
4. **Composables for shared state** — Use `useState` for reactive data, `watch` with `{ deep: true }` for auto-save.
5. **i18n for all text** — Never hardcode user-facing strings. Add keys to both `locales/en.json` and `locales/fr.json`.
6. **No server-side logic** — This is `ssr: false`, pure client-side SPA. No API routes, no database.
7. **PDF via HTML/CSS print** — The CV is rendered as an HTML document with `@media print` CSS. Use `utils/cvTemplate.ts` for the template, `utils/printCV.ts` for the print trigger.
8. **Markdown parsing** — Use the built-in `mdToHtml()` / `inlineMarkdown()` functions in `cvTemplate.ts`. Supported: `**bold**`, `*italic*`, `[link](url)`, `-`/`*` bullet lists, indentation.
9. **Auto-save** — CV data auto-saves to localStorage via `watch` in `useCVData`. Don't add manual save triggers.

---

## Documentation Standards

- **This AGENTS.md is the single source of truth** for agent instructions.
- **Every module should have a corresponding `AGENTS-[module].md` file** if it contains non-trivial domain logic.
- No `docs/man/` directory — this project doesn't expose CLI commands.

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code change that neither fixes a bug nor adds a feature
- `docs:` — Documentation only
- `chore:` — Maintenance, tooling, dependencies
- `test:` — Adding or correcting tests

Reference GitHub issues where applicable: `fix: #42 — handle empty state for languages`

---

## What to Avoid

- **Do not** add server-side code or API endpoints — this is a pure frontend app
- **Do not** add additional PDF libraries (jsPDF, html2pdf, etc.) — the browser's native print-to-PDF is the standard
- **Do not** add a state management library (Pinia, Vuex) — `useState` composables are sufficient for this scope
- **Do not** introduce SSR — the app is deployed as a static SPA
- **Do not** hardcode user-facing strings — always use i18n keys
- **Do not** store sensitive data — everything is client-side localStorage

---

## Module-Level AGENTS Files

This project has a flat structure — no submodules. The root `AGENTS.md` covers the entire codebase. Key directories:

| Directory | Purpose |
|---|---|
| `components/` | Vue 3 UI components (forms, preview, photo cropper) |
| `composables/` | Shared reactive state logic (`useCVData`) |
| `utils/` | Pure functions: `cvTemplate.ts` (HTML renderer), `printCV.ts` (print trigger) |
| `types/` | TypeScript interfaces (`cv.ts`) |
| `locales/` | i18n JSON files (`en.json`, `fr.json`) |
| `plugins/` | Nuxt plugins (`i18n.ts`) |

---

## Dependency and Inheritance Map

```
Root AGENTS.md (global rules)
    │
    └── Future: AGENTS-[module].md in any subdirectory (local context)
```

Local rules override global rules. Module-level files focus on domain-specific behavior, constraints, and invariants.

