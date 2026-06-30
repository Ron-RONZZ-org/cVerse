import type { CVData } from '~/types/cv'
import { renderCV } from './cvTemplate'
import QRCode from 'qrcode'

const PAGE_MM = 297
const PAGE_TOP_PAD = 8  // mm of top padding on each page

/**
 * After render, slices the CV into separate .cv-page containers — one per
 * printed page — by splitting at entry boundaries. Each container gets its
 * own background and padding, guaranteeing the correct color on every page.
 */
function sliceIntoPages(doc: Document): void {
  const original = doc.querySelector('.cv-page') as HTMLElement | null
  if (!original) return

  const isDark = doc.documentElement.classList.contains('dark')
  const pageBg = isDark ? '#1e293b' : '#ffffff'

  // Scale: the iframe content width / 210mm
  const pxPerMm = original.getBoundingClientRect().width / 210
  const pageHeightPx = PAGE_MM * pxPerMm
  const topPadPx = PAGE_TOP_PAD * pxPerMm

  // Sections container
  const sectionsContainer = original.querySelector('.cv-sections') as HTMLElement | null
  if (!sectionsContainer) return
  const sectionsComputed = getComputedStyle(sectionsContainer)
  const sectionsPadPx =
    parseFloat(sectionsComputed.paddingTop) + parseFloat(sectionsComputed.paddingBottom)

  // Collect all sections and their entries
  const sections = Array.from(sectionsContainer.querySelectorAll(':scope > .section'))
  type EntryRec = { el: HTMLElement; height: number; secIdx: number; firstInSec: boolean }
  const allEntries: EntryRec[] = []

  sections.forEach((sec, si) => {
    const entries = Array.from(sec.querySelectorAll(':scope > .entry')) as HTMLElement[]
    entries.forEach((entry, ei) => {
      allEntries.push({
        el: entry,
        height: entry.getBoundingClientRect().height,
        secIdx: si,
        firstInSec: ei === 0,
      })
    })
  })
  if (allEntries.length === 0) return

  // Header height (everything above .cv-sections)
  const headerHeight = sectionsContainer.getBoundingClientRect().top - original.getBoundingClientRect().top

  // Section header measurements
  const secHeaderHeights: number[] = sections.map(sec => {
    const hdr = sec.querySelector(':scope > .section-header')
    return hdr ? hdr.getBoundingClientRect().height : 0
  })

  // ---- Distribute entries across pages ----
  const pages: { entries: EntryRec[]; secHeaders: Set<number> }[] = []
  let curEntries: EntryRec[] = []
  let curAvail = pageHeightPx - topPadPx - sectionsPadPx - headerHeight  // page 1
  let curSecHeaders = new Set<number>()

  for (const entry of allEntries) {
    const extra = entry.firstInSec ? secHeaderHeights[entry.secIdx] : 0
    if ((curAvail >= entry.height + extra) || curEntries.length === 0) {
      curEntries.push(entry)
      curAvail -= (entry.height + extra)
      if (entry.firstInSec) curSecHeaders.add(entry.secIdx)
    } else {
      pages.push({ entries: curEntries, secHeaders: curSecHeaders })
      curEntries = [entry]
      curSecHeaders = new Set([entry.secIdx])
      curAvail = pageHeightPx - topPadPx - sectionsPadPx
      if (entry.firstInSec) curAvail -= secHeaderHeights[entry.secIdx]
      curAvail -= entry.height
    }
  }
  if (curEntries.length > 0) pages.push({ entries: curEntries, secHeaders: curSecHeaders })

  // ---- Build per-page DOM ----
  const pageDivs: HTMLElement[] = []

  for (let pi = 0; pi < pages.length; pi++) {
    const { entries, secHeaders } = pages[pi]

    const pageDiv = doc.createElement('div')
    pageDiv.className = 'cv-page'
    pageDiv.style.cssText = [
      `min-height:${PAGE_MM}mm`,
      'width:210mm',
      'margin:0 auto',
      `padding-top:${PAGE_TOP_PAD}mm`,
      `background:${pageBg}`,
      'position:relative',
      pi > 0 ? 'page-break-before:always' : '',
    ].filter(Boolean).join(';')

    // Page 1: clone header elements (accent-bar, name, contact info)
    if (pi === 0) {
      for (const child of Array.from(original.children)) {
        if (!child.classList.contains('cv-sections')) {
          pageDiv.appendChild(child.cloneNode(true))
        }
      }
    }

    // Build .cv-sections container
    const secBox = doc.createElement('div')
    secBox.className = 'cv-sections'
    for (const prop of ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'] as const) {
      secBox.style[prop] = sectionsComputed[prop]
    }

    // Group entries by section
    const groups = new Map<number, HTMLElement[]>()
    for (const e of entries) {
      const g = groups.get(e.secIdx) || []
      g.push(e.el)
      groups.set(e.secIdx, g)
    }

    for (const [secIdx, entryEls] of groups) {
      const secDiv = doc.createElement('div')
      secDiv.className = 'section'
      if (secHeaders.has(secIdx)) {
        const origHdr = sections[secIdx].querySelector(':scope > .section-header')
        if (origHdr) secDiv.appendChild(origHdr.cloneNode(true))
      }
      for (const el of entryEls) secDiv.appendChild(el)
      secBox.appendChild(secDiv)
    }

    pageDiv.appendChild(secBox)
    pageDivs.push(pageDiv)
  }

  // Replace original .cv-page with sliced pages
  original.replaceWith(...pageDivs)
}

/**
 * Opens the CV in a hidden iframe, slices into per-page containers,
 * and triggers the browser's print dialog.
 */
export async function printCV(data: CVData, locale: string, darkMode = false): Promise<void> {
  let html = renderCV(data, locale, darkMode)

  // Inject QR codes
  if (data.qrCode.enabled && data.qrCode.items.length > 0) {
    for (const item of data.qrCode.items) {
      if (!item.url) continue
      try {
        const qrDark = darkMode ? '#e2e8f0' : '#1e293b'
        const qrLight = darkMode ? '#1e293b' : '#ffffff'
        const qrSvg = await QRCode.toString(item.url, {
          type: 'svg', margin: 2,
          color: { dark: qrDark, light: qrLight },
        })
        const svgMatch = qrSvg.match(/<svg[\s\S]*?<\/svg>/)
        if (svgMatch) {
          const realSvg = svgMatch[0].replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')
          const qrId = `qr-svg-${item.id}`
          html = html.replace(new RegExp(`<svg id="${qrId}"[\\s\\S]*?</svg>`), realSvg)
        }
      } catch (e) {
        console.error(`Failed to generate QR code for ${item.url}:`, e)
      }
    }
  }

  const safeName = data.personal.name
    ? data.personal.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
    : 'CV'

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  iframe.style.border = 'none'
  iframe.title = `CV_${safeName}`
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for images then slice and print
  let imgLoaded = 0
  const imgs = doc.images
  const afterLoad = () => {
    imgLoaded++
    if (imgLoaded >= imgs.length) {
      sliceIntoPages(doc)
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (e) {
          console.error('Print failed:', e)
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe)
          }, 1000)
        }
      }, 300)
    }
  }

  if (imgs.length === 0) {
    sliceIntoPages(doc)
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Print failed:', e)
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe)
        }, 1000)
      }
    }, 300)
  } else {
    for (const img of Array.from(imgs)) {
      if (img.complete) afterLoad()
      else { img.addEventListener('load', afterLoad); img.addEventListener('error', afterLoad) }
    }
  }
}
