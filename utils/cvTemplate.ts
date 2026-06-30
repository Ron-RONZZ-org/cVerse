import type { CVData, CEFRLevel } from '~/types/cv'

// ─── Inline markdown to HTML ────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdown(text: string): string {
  let html = escapeHtml(text)
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return html
}

function mdToHtml(md: string): string {
  if (!md) return ''
  const lines = md.split('\n')
  const out: string[] = []
  let inList = false

  for (const rawLine of lines) {
    const indent = rawLine.match(/^(\s*)/)?.[1].length ?? 0
    const trimmed = rawLine.trim()

    if (!trimmed) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('<div class="md-empty"></div>')
      continue
    }

    // Bullet point
    const bulletMatch = trimmed.match(/^[*-]\s+(.*)/)
    if (bulletMatch) {
      if (!inList) { out.push('<ul class="md-list">'); inList = true }
      const margin = Math.floor(indent / 2) * 14
      const style = margin ? ` style="margin-left:${margin}px"` : ''
      out.push(`<li${style}>${inlineMarkdown(bulletMatch[1])}</li>`)
      continue
    }

    if (inList) { out.push('</ul>'); inList = false }

    const margin = Math.floor(indent / 2) * 14
    const style = margin ? ` style="margin-left:${margin}px"` : ''
    out.push(`<p${style}>${inlineMarkdown(trimmed)}</p>`)
  }

  if (inList) out.push('</ul>')
  return out.join('\n')
}

// ─── Language level bar (CEFR) ──────────────────────────────────────

const CEFR_LABELS: Record<string, Record<CEFRLevel, string>> = {
  en: {
    A1: 'A1 – Elementary',
    A2: 'A2 – Pre-Intermediate',
    B1: 'B1 – Intermediate',
    B2: 'B2 – Upper Intermediate',
    C1: 'C1 – Advanced',
    C2: 'C2 – Mastery',
  },
  fr: {
    A1: 'A1 – Débutant',
    A2: 'A2 – Élémentaire',
    B1: 'B1 – Intermédiaire',
    B2: 'B2 – Intermédiaire Supérieur',
    C1: 'C1 – Avancé',
    C2: 'C2 – Maîtrise',
  },
}

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function languageBar(level: CEFRLevel, accent: string, locale: string): string {
  const labels = CEFR_LABELS[locale] || CEFR_LABELS.en
  const idx = CEFR_ORDER.indexOf(level)
  const pct = ((idx + 1) / CEFR_ORDER.length) * 100
  return `
    <div class="lang-bar-bg">
      <div class="lang-bar-fill" style="width:${pct}%;background:${accent}"></div>
    </div>
    <span class="lang-level">${labels[level] || level}</span>`
}

// ─── Strength polygon (SVG) ─────────────────────────────────────────

function renderStrengthPolygon(attributes: { name: string; score: number }[], accent: string, darkMode = false): string {
  if (attributes.length < 3) {
    // Fallback to list if fewer than 3 attributes
    return attributes.map(a =>
      `<div class="polygon-fallback-row">
        <span class="polygon-fallback-name">${escapeHtml(a.name)}</span>
        <div class="polygon-fallback-bar-bg">
          <div class="polygon-fallback-bar-fill" style="width:${(a.score / 5) * 100}%;background:${accent}"></div>
        </div>
        <span class="polygon-fallback-score">${a.score}/5</span>
      </div>`
    ).join('\n')
  }

  const n = attributes.length
  const cx = 200
  const cy = 200
  const radius = 130
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // start at top
  const gridStroke = darkMode ? '#334155' : '#e2e8f0'
  const labelFill = darkMode ? '#cbd5e1' : '#334155'

  // Build polygon points
  const points = attributes.map((a, i) => {
    const angle = startAngle + i * angleStep
    const r = (a.score / 5) * radius
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

  // Build background grid (concentric pentagons)
  const gridLevels = [1, 2, 3, 4, 5]
  const gridPolygons = gridLevels.map(lvl => {
    const pts = attributes.map((_, i) => {
      const angle = startAngle + i * angleStep
      const r = (lvl / 5) * radius
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
    return pts
  })

  // Labels – placed near vertex positions with small offsets.
  // Uses <tspan> to wrap long names on multiple lines, preventing viewBox overflow.
  const radialOff = 8
  const perpOff = 14
  const pad = 6
  const FONT_SIZE = 9
  const CHAR_W = 5.2          // avg char width at font-size=9 (sans-serif)
  const LINE_H = 11            // line height in SVG user units
  const VIEWBOX = 400

  function wrapLabel(text: string, maxWidth: number): string[] {
    if (maxWidth <= 0) return [text]
    const words = text.split(/\s+/)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word
      if (candidate.length * CHAR_W <= maxWidth) {
        current = candidate
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
    return lines.length > 0 ? lines : [text]
  }

  const labels = attributes.map((a, i) => {
    const angle = startAngle + i * angleStep
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)

    // Perpendicular direction (clockwise 90°)
    const pdx = Math.cos(angle + Math.PI / 2)
    const pdy = Math.sin(angle + Math.PI / 2)

    // Start at vertex + radial offset + perpendicular shift
    let x = cx + (radius + radialOff) * dx + perpOff * pdx
    let y = cy + (radius + radialOff) * dy + perpOff * pdy

    // Clamp to viewBox bounds
    x = Math.max(pad, Math.min(VIEWBOX - pad, x))
    y = Math.max(pad, Math.min(VIEWBOX - pad, y))

    let anchor: string
    const normAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    if (normAngle > Math.PI / 2 && normAngle < (3 * Math.PI) / 2) {
      anchor = 'end'
    } else if (normAngle === Math.PI / 2 || normAngle === (3 * Math.PI) / 2) {
      anchor = 'middle'
    } else {
      anchor = 'start'
    }

    // Compute available width for this label based on anchor
    const availWidth = anchor === 'start' ? VIEWBOX - pad - x
      : anchor === 'end' ? x - pad
      : 2 * Math.min(x - pad, VIEWBOX - pad - x)

    const lines = wrapLabel(a.name, Math.max(availWidth, 30))
    const escaped = escapeHtml(a.name)

    if (lines.length === 1) {
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="${FONT_SIZE}" fill="${labelFill}">${escaped}</text>`
    }

    // Multi-line: shift first-line baseline up so the block is centred on y
    const firstY = y - (lines.length - 1) * LINE_H / 2
    const tspans = lines.map((line, li) =>
      `<tspan x="${x}" dy="${li === 0 ? 0 : LINE_H}">${escapeHtml(line)}</tspan>`
    ).join('')
    return `<text x="${x}" y="${firstY}" text-anchor="${anchor}" font-size="${FONT_SIZE}" fill="${labelFill}">${tspans}</text>`
  }).join('\n')

  return `
  <div class="polygon-container">
    <svg viewBox="0 0 400 400" class="strength-polygon" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid -->
      ${gridPolygons.map(pts => `<polygon points="${pts}" fill="none" stroke="${gridStroke}" stroke-width="1" />`).join('\n')}
      <!-- Axes -->
      ${attributes.map((_, i) => {
        const angle = startAngle + i * angleStep
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${gridStroke}" stroke-width="1" />`
      }).join('\n')}
      <!-- Data polygon -->
      <polygon points="${points}" fill="${accent}30" stroke="${accent}" stroke-width="2" />
      <!-- Data points -->
      ${attributes.map((a, i) => {
        const angle = startAngle + i * angleStep
        const r = (a.score / 5) * radius
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        return `<circle cx="${x}" cy="${y}" r="4" fill="${accent}" />`
      }).join('\n')}
      <!-- Labels -->
      ${labels}
    </svg>
  </div>`
}

function renderSimpleList(attributes: { name: string }[], accent: string): string {
  if (attributes.length === 0) return ''
  const items = attributes.map(a =>
    `<li>${escapeHtml(a.name)}</li>`
  ).join('\n')
  return `<ul class="md-list">${items}</ul>`
}

// ─── QR Code (SVG embed) ────────────────────────────────────────────

// Generate a QR placeholder SVG for a single QR item.
// The placeholder SVG is replaced by the real QR code via qrcode library
// in printCV.ts and CVPreview.vue.
function renderQRCodeItem(item: { id: string; url: string; caption: string; decoration: string }): string {
  const qrId = `qr-svg-${escapeHtml(item.id)}`
  return `<div class="qr-item">
    <div class="qr-code" id="qr-container-${escapeHtml(item.id)}">
      <svg id="${qrId}" class="qr-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="white" rx="8" />
      </svg>
      ${item.decoration ? `<img src="${escapeHtml(item.decoration)}" class="qr-decoration" alt="decoration" />` : ''}
    </div>
    ${item.caption ? `<div class="qr-caption">${escapeHtml(item.caption)}</div>` : ''}
  </div>`
}

// ─── Locale-aware section titles ────────────────────────────────────

// ─── Locale-aware strings ────────────────────────────────────────────

const LOCALE_STRINGS: Record<string, Record<string, string>> = {
  en: {
    experience: 'Professional Experience',
    education: 'Education',
    languages: 'Languages',
    qualities: 'Qualities',
    skills: 'Skills',
    interests: 'Interests',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    age: 'Age',
    nationality: 'Nationality',
    web: 'Web',
    linkedin: 'LinkedIn',
  },
  fr: {
    experience: 'Expérience Professionnelle',
    education: 'Formation',
    languages: 'Langues',
    qualities: 'Qualités',
    skills: 'Compétences',
    interests: 'Centres d\'Intérêt',
    email: 'Email',
    phone: 'Téléphone',
    location: 'Localisation',
    age: 'Âge',
    nationality: 'Nationalité',
    web: 'Site Web',
    linkedin: 'LinkedIn',
  },
}

function tStr(key: string, locale: string): string {
  return LOCALE_STRINGS[locale]?.[key] || LOCALE_STRINGS.en[key] || key
}

// ─── HTML document builder ──────────────────────────────────────────

export function renderCV(data: CVData, locale: string, darkMode = false): string {
  const accent = data.accentColor || '#2563eb'
  const name = escapeHtml(data.personal.name || '')
  const headline = data.personal.headline ? escapeHtml(data.personal.headline) : ''
  const photo = data.personal.photo || ''
  const hasPhoto = !!photo

  // Collect contact items
  const contactItems: string[] = []
  if (data.personal.email) contactItems.push(`<span class="contact-item"><span class="contact-label">${tStr('email', locale)}</span> ${escapeHtml(data.personal.email)}</span>`)
  if (data.personal.phone) contactItems.push(`<span class="contact-item"><span class="contact-label">${tStr('phone', locale)}</span> ${escapeHtml(data.personal.phone)}</span>`)
  if (data.personal.location) contactItems.push(`<span class="contact-item"><span class="contact-label">${tStr('location', locale)}</span> ${escapeHtml(data.personal.location)}</span>`)
  if (data.personal.age) contactItems.push(`<span class="contact-item"><span class="contact-label">${tStr('age', locale)}</span> ${escapeHtml(data.personal.age)}</span>`)
  if (data.personal.nationality) contactItems.push(`<span class="contact-item"><span class="contact-label">${tStr('nationality', locale)}</span> ${escapeHtml(data.personal.nationality)}</span>`)

  // Custom fields
  for (const f of data.personal.customFields) {
    if (f.label && f.value) {
      contactItems.push(`<span class="contact-item"><span class="contact-label">${escapeHtml(f.label)}</span> ${escapeHtml(f.value)}</span>`)
    }
  }

  // Web links
  const webLinks: string[] = []
  if (data.personal.website) webLinks.push(`<span class="contact-item"><span class="contact-label">${tStr('web', locale)}</span> ${escapeHtml(data.personal.website)}</span>`)
  if (data.personal.linkedin) webLinks.push(`<span class="contact-item"><span class="contact-label">${tStr('linkedin', locale)}</span> ${escapeHtml(data.personal.linkedin)}</span>`)

  // Sections
  const sections: string[] = []

  // ── Experience ──
  if (data.experience.length > 0) {
    const items = data.experience.map(exp => {
      const period = `${escapeHtml(exp.startDate)} – ${escapeHtml(exp.endDate)}`
      const loc = exp.location ? escapeHtml(exp.location) : ''
      return `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${escapeHtml(exp.title)}</span>
            <span class="entry-period">${period}</span>
          </div>
          ${loc ? `<div class="entry-subtitle">${loc}</div>` : ''}
          ${exp.description ? `<div class="entry-body">${mdToHtml(exp.description)}</div>` : ''}
        </div>`
    }).join('\n')
    sections.push(sectionBlock(tStr('experience', locale), items, accent))
  }

  // ── Education ──
  if (data.education.length > 0) {
    const items = data.education.map(edu => {
      const period = `${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}`
      const loc = edu.location ? escapeHtml(edu.location) : ''
      return `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">${escapeHtml(edu.degree)}</span>
            <span class="entry-period">${period}</span>
          </div>
          ${loc ? `<div class="entry-subtitle">${loc}</div>` : ''}
          ${edu.description ? `<div class="entry-body">${mdToHtml(edu.description)}</div>` : ''}
        </div>`
    }).join('\n')
    sections.push(sectionBlock(tStr('education', locale), items, accent))
  }

  // ── Languages ──
  if (data.languages.length > 0) {
    const items = data.languages.map(lang =>
      `<div class="lang-row">
        <span class="lang-name">${escapeHtml(lang.name)}</span>
        ${languageBar(lang.level, accent, locale)}
      </div>`
    ).join('\n')
    sections.push(sectionBlock(tStr('languages', locale), items, accent))
  }

  // ── Qualities ──
  if (data.qualityAttributes.length > 0) {
    const body = data.qualitiesShowStrength
      ? renderStrengthPolygon(data.qualityAttributes, accent, darkMode)
      : renderSimpleList(data.qualityAttributes, accent)
    sections.push(sectionBlock(tStr('qualities', locale), body, accent))
  }

  // ── Skills ──
  if (data.skills.trim()) {
    sections.push(sectionBlock(tStr('skills', locale), mdToHtml(data.skills), accent))
  }

  // ── Interests ──
  if (data.interests.trim()) {
    sections.push(sectionBlock(tStr('interests', locale), mdToHtml(data.interests), accent))
  }

  // ── Custom Sections ──
  for (const cs of data.customSections) {
    if (cs.title.trim() && cs.content.trim()) {
      sections.push(sectionBlock(escapeHtml(cs.title), mdToHtml(cs.content), accent))
    }
  }

  // ── QR Code ──
  let qrSection = ''
  if (data.qrCode.enabled && data.qrCode.items.length > 0) {
    const items = data.qrCode.items.map(item => renderQRCodeItem(item)).join('\n')
    qrSection = `<div class="qr-section">${items}</div>`
  }

  // ── Footer ──
  let footerText = ''
  if (data.footer.enabled) {
    if (data.footer.text) {
      footerText = escapeHtml(data.footer.text)
    } else {
      footerText = locale === 'fr'
        ? 'Réalisé avec cVerse. cVerse est un logiciel libre et open source. Essayez-le vous-même sur https://cv.ronzz.org/'
        : 'Made with cVerse. cVerse is free and open source software. Try it yourself at https://cv.ronzz.org/'
    }
  }

  // ── Assemble full HTML ──
  return `<!DOCTYPE html>
<html lang="${locale}"${darkMode ? ' class="dark"' : ''}>
<head>
<meta charset="utf-8">
<title>CV – ${name || 'document'}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: A4;
    margin: 0;
  }

  /*
   * html background fills the viewport/page area uniformly.
   * Chrome's print engine clips body backgrounds below fragmented
   * content, but html backgrounds reliably span every printed page.
   * During screen preview we hide it via @media screen override.
   */
  html {
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1e293b;
    background: transparent;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cv-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #ffffff;
    position: relative;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  /* ── Accent top bar ── */
  .accent-bar {
    height: 5mm;
    background: ${accent};
  }

  /* ── Header ── */
  .cv-header {
    padding: 10mm 12mm 6mm 12mm;
    display: flex;
    align-items: flex-start;
    gap: 8mm;
  }

  .header-main { flex: 1; min-width: 0; }

  .cv-name {
    font-size: 24pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  .cv-headline {
    font-size: 11pt;
    color: ${accent};
    font-weight: 500;
    margin-top: 2mm;
  }

  .header-photo {
    flex-shrink: 0;
    width: 32mm;
    height: 32mm;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid ${accent}20;
  }

  /* ── Contact divider ── */
  .contact-divider {
    height: 1.5px;
    background: linear-gradient(to right, ${accent}, ${accent}40, transparent);
    margin: 0 12mm;
  }

  /* ── Contact row ── */
  .contact-row {
    padding: 3mm 12mm;
    display: flex;
    flex-wrap: wrap;
    gap: 2mm 5mm;
    font-size: 9pt;
    color: #475569;
  }

  .contact-item {
    white-space: nowrap;
  }

  .contact-label {
    font-weight: 600;
    color: ${accent};
    margin-right: 1mm;
  }

  .contact-row + .contact-row {
    padding-top: 0;
  }

  /* ── Sections ── */
  .cv-sections {
    padding: 4mm 12mm 15mm 12mm;
  }

  .section {
    margin-top: 8mm;
    margin-bottom: 5mm;
    page-break-inside: avoid;
  }

  .section:first-of-type {
    margin-top: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 2.5mm;
    padding-bottom: 0.8mm;
    border-bottom: 1.5px solid ${accent};
  }

  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: ${accent};
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Entry (experience/education) ── */
  .entry {
    margin-bottom: 3mm;
    page-break-inside: avoid;
  }

  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 3mm;
  }

  .entry-title {
    font-weight: 600;
    font-size: 10pt;
    color: #0f172a;
  }

  .entry-period {
    font-size: 9pt;
    color: ${accent};
    font-weight: 500;
    white-space: nowrap;
  }

  .entry-subtitle {
    font-size: 9pt;
    color: #64748b;
    font-style: italic;
    margin-top: 0.3mm;
  }

  .entry-body {
    margin-top: 1mm;
    font-size: 9.5pt;
    color: #334155;
  }

  /* ── Language rows ── */
  .lang-row {
    display: flex;
    align-items: center;
    gap: 4mm;
    margin-bottom: 2mm;
  }

  .lang-name {
    font-weight: 500;
    min-width: 30mm;
    font-size: 10pt;
  }

  .lang-bar-bg {
    flex: 1;
    max-width: 50mm;
    height: 5px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
  }

  .lang-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
  }

  .lang-level {
    font-size: 8.5pt;
    color: #64748b;
    min-width: 28mm;
  }

  /* ── Strength polygon ── */
  .polygon-container {
    display: flex;
    justify-content: center;
    margin: 2mm 0;
  }

  .strength-polygon {
    width: 100%;
    max-width: 160mm;
    height: auto;
  }

  .polygon-fallback-row {
    display: flex;
    align-items: center;
    gap: 4mm;
    margin-bottom: 2mm;
  }

  .polygon-fallback-name {
    font-weight: 500;
    min-width: 30mm;
    font-size: 10pt;
  }

  .polygon-fallback-bar-bg {
    flex: 1;
    max-width: 50mm;
    height: 5px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
  }

  .polygon-fallback-bar-fill {
    height: 100%;
    border-radius: 3px;
  }

  .polygon-fallback-score {
    font-size: 8.5pt;
    color: #64748b;
    min-width: 10mm;
    text-align: right;
  }

  /* ── QR Code ── */
  .qr-section {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6mm;
    padding: 4mm 0;
    page-break-inside: avoid;
  }

  .qr-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 1 auto;
  }

  .qr-code {
    position: relative;
    width: 40mm;
    height: 40mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-svg {
    width: 100%;
    height: 100%;
  }

  .qr-decoration {
    position: absolute;
    width: 30%;
    height: 30%;
    object-fit: contain;
    border-radius: 4px;
    pointer-events: none;
  }

  .qr-caption {
    margin-top: 2mm;
    font-size: 8pt;
    color: #64748b;
    text-align: center;
    max-width: 40mm;
    word-wrap: break-word;
  }

  /* ── Footer ── */
  .cv-footer {
    text-align: center;
    padding: 3mm 12mm 30mm 12mm;
    font-size: 7.5pt;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    margin-top: 4mm;
  }

  /* ── Markdown content ── */
  .entry-body p,
  .section > p {
    margin-bottom: 1mm;
  }

  .md-list {
    list-style: none;
    padding: 0;
    margin: 0.5mm 0 1mm 0;
  }

  .md-list li {
    position: relative;
    padding-left: 5mm;
    margin-bottom: 0.5mm;
  }

  .md-list li::before {
    content: "•";
    position: absolute;
    left: 1.5mm;
    color: ${accent};
    font-weight: bold;
  }

  .md-empty {
    height: 1.5mm;
  }

  a {
    color: ${accent};
    text-decoration: none;
  }

  /* ── Print only ── */
  @media print {
    html {
      background: #ffffff;
    }

    body {
      background: transparent;
    }

    .cv-page {
      box-shadow: none;
      margin: 0 auto;
      width: 100%;
      min-height: 100vh;
    }

    .section {
      page-break-inside: avoid;
    }

    .entry {
      page-break-inside: avoid;
    }
  }

  /* ── Dark mode overrides (must come before @media screen) ── */
  html.dark {
    background: #1e293b;
  }

  /*
   * Body transparent in base so html background shows during print.
   * @media screen re-opacifies body for preview.
   */
  html.dark body {
    color: #e2e8f0;
    background: transparent;
  }

  html.dark .cv-page {
    background: #1e293b;
  }

  html.dark .cv-name,
  html.dark .entry-title {
    color: #f1f5f9;
  }

  html.dark .contact-row {
    color: #94a3b8;
  }

  html.dark .entry-subtitle {
    color: #94a3b8;
  }

  html.dark .entry-body,
  html.dark .polygon-fallback-name {
    color: #cbd5e1;
  }

  html.dark .lang-bar-bg,
  html.dark .polygon-fallback-bar-bg {
    background: #334155;
  }

  html.dark .lang-level,
  html.dark .polygon-fallback-score {
    color: #94a3b8;
  }

  html.dark .qr-caption {
    color: #94a3b8;
  }

  html.dark .cv-footer {
    color: #64748b;
    border-top-color: #334155;
  }

  /* ── Screen only (preview) — overrides dark transparent body ── */
  @media screen {
    html {
      background: transparent;
    }

    body {
      background: #f1f5f9;
    }

    html.dark body {
      background: #0f172a;
    }

    .cv-page {
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      margin: 16px auto;
      border-radius: 2px;
    }
  }
</style>
</head>
<body>
<div class="cv-page">
  <div class="accent-bar"></div>

  <div class="cv-header">
    <div class="header-main">
      <div class="cv-name">${name}</div>
      ${headline ? `<div class="cv-headline">${headline}</div>` : ''}
    </div>
    ${hasPhoto ? `<img class="header-photo" src="${photo}" alt="Photo" />` : ''}
  </div>

  ${contactItems.length > 0 ? '<div class="contact-divider"></div>' : ''}
  ${contactItems.length > 0 ? `<div class="contact-row">${contactItems.join('')}</div>` : ''}
  ${webLinks.length > 0 ? `<div class="contact-row">${webLinks.join('')}</div>` : ''}

  <div class="cv-sections">
    ${sections.join('\n')}
    ${qrSection}
  </div>

  ${footerText ? `<div class="cv-footer">${footerText}</div>` : ''}
</div>
</body>
</html>`
}

function sectionBlock(title: string, body: string, accent: string): string {
  return `
<div class="section">
  <div class="section-header">
    <span class="section-title">${title}</span>
  </div>
  ${body}
</div>`
}
