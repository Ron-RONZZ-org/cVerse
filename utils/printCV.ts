import type { CVData } from '~/types/cv'
import { renderCV } from './cvTemplate'
import QRCode from 'qrcode'

/**
 * Opens the CV in a hidden iframe and triggers the browser's print dialog.
 * The CV template uses a position:fixed ::before pseudo-element on .cv-page
 * to paint a background on every printed page — Chrome replicates fixed
 * elements across page fragments, ensuring the last page is fully filled.
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

  const waitForImages = () => {
    const images = doc.images
    if (images.length === 0) {
      triggerPrint()
      return
    }

    let loaded = 0
    const total = images.length

    const onLoad = () => {
      loaded++
      if (loaded >= total) {
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
