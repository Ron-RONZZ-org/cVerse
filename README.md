# cVerse - CV Generator

A serverless, frontend-only application to generate professional CVs in PDF format with bilingual support (English/French).

## Features

- **Bilingual Support**: Full English and French UI and export
- **Personal Information**: Required (name, email) and optional fields (location, phone, website, LinkedIn, age, nationality)
- **Professional Experience**: Block-based with title, time period, location, and markdown-supported descriptions
- **Education**: Similar block-based structure to professional experience
- **Qualities & Skills**: Markdown-supported text areas
- **Auto-save**: Input automatically saved to localStorage as you type
- **JSON Export/Import**: Save and reload your CV data
- **PDF Export**: Generate professional PDF matching the reference format
- **Reorderable Blocks**: Move experience and education blocks up/down

## Technology Stack

- **Framework**: Nuxt.js 3
- **Internationalization**: vue-i18n
- **PDF Generation**: jsPDF
- **Markdown Parsing**: Custom lightweight parser

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
# Build for production
npm run build

# Generate static files
npm run generate

# Preview production build
npm run preview
```

## Usage

1. **Fill in Personal Information**: Enter your name (required), email (required), and optional contact details
2. **Add Experience**: Click "Add Experience" to create professional experience blocks
3. **Add Education**: Click "Add Education" to add your educational background
4. **Enter Qualities & Skills**: Use markdown formatting for better structure
5. **Reorder Blocks**: Use up/down arrows to reorder experience and education entries
6. **Switch Language**: Use the language selector in the header
7. **Save Your Work**:
   - Auto-saved to browser localStorage as you type
   - Export as JSON for backup
   - Import JSON to restore data
8. **Export to PDF**: Click "Export to PDF" to generate your CV

## Markdown Support

All description fields support markdown formatting:

- **Bold**: `**text**` or `__text__`
- **Italic**: `*text*` or `_text_`
- **Bullet Points**: Start lines with `*` or `-`

## Data Persistence

- Data is automatically saved to browser localStorage
- Data persists across page reloads
- Use JSON export/import for transferring data between browsers or as backup
- Clear all data using the "Clear All" button

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT License - see LICENSE file for details

## Development Notes

This is a client-side only application (SSR disabled) designed to work as a serverless static site. It can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

Deploy the contents of the `.output/public` directory after running `npm run generate`.
