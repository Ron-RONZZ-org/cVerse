import type { CVData } from '~/types/cv'
import { renderCV } from './cvTemplate'
import QRCode from 'qrcode'

/**
 * After writing the CV HTML into the print iframe, measures the rendered
 * content and splits it across separate `.cv-page` containers — one per
 * printed page.  Each container gets an independent background and
 * `min-height: 297mm`, so every page in the printed PDF is fully filled
 * with the correct color, including the last page.
 */
function sliceIntoPages(doc: Document): void {
  const originalPage = doc.querySelector('.cv-page') as HTMLElement | null
  if (!originalPage) return

  const isDark = doc.documentElement.classList.contains('dark')
  const pageBg = isDark ? '#1e293b' : '#ffffff'

  // Compute px→mm scale from the rendered width (the iframe is 210mm wide)
  const renderedWidthPx = originalPage.getBoundingClientRect().width
  const pxPerMm = renderedWidthPx / 210
  const pageHeightPx = 297 * pxPerMm

  // Gather children and their measured heights BEFORE any DOM changes
  const children = Array.from(originalPage.children)
  const childData = children.map(el => ({
    el,
    height: el.getBoundingClientRect().height,
    tag: el.tagName.toLowerCase(),
    isSections: el.classList.contains('cv-sections'),
    isFooter: el.classList.contains('cv-footer'),
  }))

  // The sections container holds all .section elements on one page
  const sectionsEl = children.find(c => c.classList.contains('cv-sections')) as HTMLElement | undefined
  if (!sectionsEl) return

  // Collect individual items inside .cv-sections (.section + .qr-section)
  const sectionItems = Array.from(sectionsEl.children) as HTMLElement[]

  // Measure each item
  const itemData = sectionItems.map(el => ({
    el,
    height: el.getBoundingClientRect().height,
  }))

  // ---- Build page 1 ----
  // Remove all items from the sections container (it becomes empty)
  for (const item of sectionItems) {
    sectionsEl.removeChild(item)
  }

  // Measure the empty container height (= padding + border)
  const emptySectionsHeight = sectionsEl.getBoundingClientRect().height

  // Header height = original page height minus sections container minus footer
  const footerEl = children.find(c => c.classList.contains('cv-footer'))
  const footerHeight = footerEl ? footerEl.getBoundingClientRect().height : 0
  const headerHeight = originalPage.getBoundingClientRect().height
    - (childData.find(c => c.isSections)?.height ?? 0)
    - footerHeight

  // Page 1 available height for sections
  const page1Available = pageHeightPx - headerHeight - emptySectionsHeight
  // Subsequent pages: full page minus empty sections padding
  const pageNAvailable = pageHeightPx - emptySectionsHeight

  // ---- Distribute items across pages ----
  const pages: { container: HTMLElement; items: HTMLElement[] }[] = []
  let currentPageItems: HTMLElement[] = []
  let currentPageRemaining = page1Available

  for (const item of itemData) {
    if (currentPageRemaining >= item.height) {
      // Fits on current page
      currentPageItems.push(item.el)
      currentPageRemaining -= item.height
    } else if (currentPageItems.length === 0) {
      // Item is taller than the page — force it on its own page anyway
      currentPageItems.push(item.el)
      currentPageRemaining = pageNAvailable - item.height
    } else {
      // Start a new page for this item
      const container = createSectionsContainer(doc, sectionsEl)
      pages.push({ container, items: currentPageItems })
      currentPageItems = [item.el]
      currentPageRemaining = pageNAvailable - item.height
    }
  }
  // Flush remaining items
  if (currentPageItems.length > 0 || pages.length === 0) {
    const container = pages.length === 0
      ? sectionsEl  // reuse the original container for page 1
      : createSectionsContainer(doc, sectionsEl)
    pages.push({ container, items: currentPageItems })
  }

  // ---- Assemble page DOMs ----
  // Page 1: keep the original .cv-page, add items to its sections container
  const pageContainers: HTMLElement[] = [originalPage]
  const page0 = pages[0]
  for (const item of page0.items) {
    sectionsEl.appendChild(item)
  }

  // Page 2+: create new .cv-page elements
  for (let i = 1; i < pages.length; i++) {
    const { container, items } = pages[i]
    for (const item of items) {
      container.appendChild(item)
    }

    const newPage = doc.createElement('div')
    newPage.className = 'cv-page'
    newPage.style.cssText = `
      min-height: 297mm;
      width: 210mm;
      margin: 0 auto;
      background: ${pageBg};
      position: relative;
      page-break-before: always;
    `
    newPage.appendChild(container)
    originalPage.parentNode?.insertBefore(newPage, originalPage.nextSibling)
    pageContainers.push(newPage)
  }

  // Ensure every page has at least min-height 297mm
  for (const p of pageContainers) {
    p.style.minHeight = '297mm'
  }

  // Remove the original page-1 footer from the end of sections if it was there
  // Footer stays on the last page
  if (footerEl && pages.length > 1) {
    // Move footer to the last page
    const lastPage = pageContainers[pageContainers.length - 1]
    lastPage.appendChild(footerEl)
  }
}

/** Create a fresh .cv-sections container (same styling as the original). */
function createSectionsContainer(doc: Document, template: HTMLElement): HTMLElement {
  const el = doc.createElement('div')
  el.className = 'cv-sections'
  // Copy computed style for padding (the only meaningful property)
  const cs = getComputedStyle(template)
  el.style.padding = cs.padding
  el.style.paddingTop = cs.paddingTop
  el.style.paddingRight = cs.paddingRight
  el.style.paddingBottom = cs.paddingBottom
  el.style.paddingLeft = cs.paddingLeft
  return el
}

/**
 * Opens the CV in a hidden iframe, slices it into individually-styled pages,
 * and triggers the browser's print dialog.
 */
export async function printCV(data: CVData, locale: string, darkMode = false): Promise<void> {
  let html = renderCV(data, locale, darkMode)

  // Inject QR codes for each item
  if (data.qrCode.enabled && data.qrCode.items.length > 0) {
    for (const item of data.qrCode.items) {
      if (!item.url) continue
      try {
        const qrDark = darkMode ? '#e2e8f0' : '#1e293b'
        const qrLight = darkMode ? '#1e293b' : '#ffffff'
        const qrSvg = await QRCode.toString(item.url, {
          type: 'svg',
          margin: 2,
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
  if (!doc) {
    console.error('Failed to create print iframe')
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for images to load, then slice and print
  const waitForImages = () => {
    const images = doc.images
    if (images.length === 0) {
      sliceIntoPages(doc)
      triggerPrint()
      return
    }

    let loaded = 0
    const total = images.length

    const onLoad = () => {
      loaded++
      if (loaded >= total) {
        sliceIntoPages(doc)
        triggerPrint()
      }
    }

    for (const img of Array.from(images)) {
      if (img.complete) {
        onLoad()
      } else {
        img.addEventListener('load', onLoad)
        img.addEventListener('error', onLoad)
      }
    }
  }

  const triggerPrint = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Print failed:', e)
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1000)
      }
    }, 300)
  }

  waitForImages()
}
