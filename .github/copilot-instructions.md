# GitHub Copilot Instructions for cVerse

## Project Overview

cVerse is a serverless, frontend-only CV (resume) generator application built with Nuxt.js 3. It provides bilingual support (English/French) and generates professional PDFs.

## Technology Stack

- **Framework**: Nuxt.js 3 (Vue 3 with Composition API)
- **Language**: TypeScript
- **Internationalization**: vue-i18n for English/French support
- **PDF Generation**: jsPDF library
- **Data Storage**: Browser localStorage (no backend)
- **Deployment**: Static site generation (SSR disabled)

## Code Style and Conventions

- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns with `<script setup>`
- Use composables for shared logic
- Keep components focused and single-responsibility
- Use descriptive variable and function names
- Prefer `const` over `let` when possible

## Project-Specific Guidelines

### Component Structure

- Place reusable components in `/components` directory
- Use Vue 3 Composition API with `<script setup lang="ts">`
- Components should be self-contained and modular
- Use TypeScript interfaces for props and emits

### Internationalization

- All user-facing text must support both English and French
- Use `$t('key')` for translated strings
- Add translation keys to both `/locales/en.json` and `/locales/fr.json`
- Keep translation keys descriptive and hierarchical (e.g., `header.title`, `buttons.save`)

### Data Management

- All CV data is stored in browser localStorage
- Use composables for localStorage interactions
- Implement auto-save functionality with debouncing
- Provide JSON export/import for data portability

### PDF Generation

- Use jsPDF for PDF generation
- Match the reference format in `cv-example-fr.pdf`
- Support both English and French layouts
- Handle text overflow and pagination properly

### Markdown Support

- Support basic markdown in description fields: bold (`**text**`), italic (`*text*`), bullet points (`*` or `-`)
- Use custom lightweight parser for markdown rendering
- Keep parser simple and focused on CV formatting needs

### Testing and Development

- Test in multiple browsers (Chrome, Firefox, Safari)
- Verify localStorage persistence
- Test language switching functionality
- Validate PDF output in both languages
- Ensure mobile responsiveness

### Performance

- This is a client-side only application (no SSR)
- Minimize bundle size
- Lazy load components when appropriate
- Use efficient data structures for form state

### Accessibility

- Ensure proper semantic HTML
- Add appropriate ARIA labels
- Support keyboard navigation
- Maintain good color contrast

## Build and Deployment

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run generate` - Generate static files for deployment
- `npm run preview` - Preview production build
- Deploy `.output/public` directory to static hosting

## Common Tasks

### Adding a New Field

1. Update TypeScript interfaces in `/types`
2. Add form input in component
3. Add translation keys to both locale files
4. Update localStorage save/load logic
5. Update PDF generation to include the field

### Adding a New Language

1. Create new locale file in `/locales` (e.g., `es.json`)
2. Copy structure from `en.json` and translate
3. Update i18n configuration in `nuxt.config.ts`
4. Update language selector component
5. Update PDF generation for new locale

### Modifying PDF Layout

1. Locate PDF generation logic (likely in composable or utils)
2. Test changes with sample data
3. Verify output matches design requirements
4. Test with both short and long content
5. Ensure proper page breaks and overflow handling

## Important Reminders

- No server-side code or API endpoints - this is a pure frontend application
- Data privacy is critical - everything stays in the browser
- Maintain bilingual parity for all features
- Keep the application lightweight and fast
- Ensure generated PDFs are professional and print-ready
