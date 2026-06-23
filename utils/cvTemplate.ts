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

const CEFR_LABELS: Record<CEFRLevel, string> = {
  A1: 'A1 – Elementary',
  A2: 'A2 – Pre-Intermediate',
  B1: 'B1 – Intermediate',
  B2: 'B2 – Upper Intermediate',
  C1: 'C1 – Advanced',
  C2: 'C2 – Mastery'
}

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function languageBar(level: CEFRLevel, accent: string): string {
  const idx = CEFR_ORDER.indexOf(level)
  const pct = ((idx + 1) / CEFR_ORDER.length) * 100
  return `
    <div class="lang-bar-bg">
      <div class="lang-bar-fill" style="width:${pct}%;background:${accent}"></div>
    </div>
    <span class="lang-level">${CEFR_LABELS[level] || level}</span>`
}

// ─── Strength polygon (SVG) ─────────────────────────────────────────

function renderStrengthPolygon(attributes: { name: string; score: number }[], accent: string): string {
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
  const cx = 150
  const cy = 150
  const radius = 120
  const labelR = 140
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // start at top

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

  // Labels
  const labels = attributes.map((a, i) => {
    const angle = startAngle + i * angleStep
    const x = cx + labelR * Math.cos(angle)
    const y = cy + labelR * Math.sin(angle)
    const anchor = angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? 'end' : angle === -Math.PI / 2 ? 'middle' : 'start'
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="9" fill="#334155">${escapeHtml(a.name)}</text>`
  }).join('\n')

  return `
  <div class="polygon-container">
    <svg viewBox="0 0 300 300" class="strength-polygon" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid -->
      ${gridPolygons.map(pts => `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1" />`).join('\n')}
      <!-- Axes -->
      ${attributes.map((_, i) => {
        const angle = startAngle + i * angleStep
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />`
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

// Generate a minimal QR-like SVG as a placeholder.
// In production, this is replaced by the actual qrcode library output.
function renderQRCode(url: string, decoration: string, caption: string, accent: string): string {
  // Dynamically import qrcode to generate SVG on the fly
  // The QR code SVG will be rendered by the printCV utility before printing
  return `<div class="qr-section" id="qr-section">
    <div class="qr-code" id="qr-code-container">
      <!-- QR code will be rendered here by qrcode library -->
      <svg id="qr-svg" class="qr-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="white" rx="8" />
        <text x="150" y="150" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#94a3b8">QR: ${escapeHtml(url)}</text>
      </svg>
      ${decoration ? `<img src="${decoration}" class="qr-decoration" alt="decoration" />` : ''}
    </div>
    ${caption ? `<div class="qr-caption">${escapeHtml(caption)}</div>` : ''}
  </div>`
}

// ─── HTML document builder ──────────────────────────────────────────

export function renderCV(data: CVData, locale: string): string {
  const accent = data.accentColor || '#2563eb'
  const name = escapeHtml(data.personal.name || '')
  const headline = data.personal.headline ? escapeHtml(data.personal.headline) : ''
  const photo = data.personal.photo || ''
  const hasPhoto = !!photo

  // Collect contact items
  const contactItems: string[] = []
  if (data.personal.email) contactItems.push(`<span class="contact-item"><span class="contact-label">Email</span> ${escapeHtml(data.personal.email)}</span>`)
  if (data.personal.phone) contactItems.push(`<span class="contact-item"><span class="contact-label">Phone</span> ${escapeHtml(data.personal.phone)}</span>`)
  if (data.personal.location) contactItems.push(`<span class="contact-item"><span class="contact-label">Location</span> ${escapeHtml(data.personal.location)}</span>`)
  if (data.personal.age) contactItems.push(`<span class="contact-item"><span class="contact-label">Age</span> ${escapeHtml(data.personal.age)}</span>`)
  if (data.personal.nationality) contactItems.push(`<span class="contact-item"><span class="contact-label">Nationality</span> ${escapeHtml(data.personal.nationality)}</span>`)

  // Custom fields
  for (const f of data.personal.customFields) {
    if (f.label && f.value) {
      contactItems.push(`<span class="contact-item"><span class="contact-label">${escapeHtml(f.label)}</span> ${escapeHtml(f.value)}</span>`)
    }
  }

  // Web links
  const webLinks: string[] = []
  if (data.personal.website) webLinks.push(`<span class="contact-item"><span class="contact-label">Web</span> ${escapeHtml(data.personal.website)}</span>`)
  if (data.personal.linkedin) webLinks.push(`<span class="contact-item"><span class="contact-label">LinkedIn</span> ${escapeHtml(data.personal.linkedin)}</span>`)

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
    sections.push(sectionBlock('Professional Experience', items, accent))
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
    sections.push(sectionBlock('Education', items, accent))
  }

  // ── Languages ──
  if (data.languages.length > 0) {
    const items = data.languages.map(lang =>
      `<div class="lang-row">
        <span class="lang-name">${escapeHtml(lang.name)}</span>
        ${languageBar(lang.level, accent)}
      </div>`
    ).join('\n')
    sections.push(sectionBlock('Languages', items, accent))
  }

  // ── Qualities ──
  if (data.qualityAttributes.length > 0) {
    const body = data.qualitiesShowStrength
      ? renderStrengthPolygon(data.qualityAttributes, accent)
      : renderSimpleList(data.qualityAttributes, accent)
    sections.push(sectionBlock('Qualities', body, accent))
  }

  // ── Skills ──
  if (data.skills.trim()) {
    sections.push(sectionBlock('Skills', mdToHtml(data.skills), accent))
  }

  // ── Interests ──
  if (data.interests.trim()) {
    sections.push(sectionBlock('Interests', mdToHtml(data.interests), accent))
  }

  // ── Custom Sections ──
  for (const cs of data.customSections) {
    if (cs.title.trim() && cs.content.trim()) {
      sections.push(sectionBlock(escapeHtml(cs.title), mdToHtml(cs.content), accent))
    }
  }

  // ── QR Code ──
  let qrSection = ''
  if (data.qrCode.enabled && data.personal.website) {
    const caption = data.qrCode.caption || (locale === 'fr'
      ? 'Scannez pour en savoir plus sur mon site web'
      : 'Scan to learn more about me on my website')
    qrSection = renderQRCode(data.personal.website, data.qrCode.decoration, caption, accent)
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
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>CV – ${name || 'document'}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: A4;
    margin: 0;
  }

  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1e293b;
    background: #f1f5f9;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cv-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #ffffff;
    position: relative;
    overflow: hidden;
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
    padding: 4mm 12mm 8mm 12mm;
  }

  .section {
    margin-bottom: 5mm;
    page-break-inside: avoid;
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
    flex-direction: column;
    align-items: center;
    padding: 4mm 0;
    page-break-inside: avoid;
  }

  .qr-code {
    position: relative;
    width: 50mm;
    height: 50mm;
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
  }

  /* ── Footer ── */
  .cv-footer {
    text-align: center;
    padding: 3mm 12mm 5mm 12mm;
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
    body {
      background: white;
    }

    .cv-page {
      box-shadow: none;
      margin: 0;
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

  /* ── Screen only (preview) ── */
  @media screen {
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
