import type { CVData } from '~/types/cv'
import { renderCV } from './cvTemplate'
import QRCode from 'qrcode'

/**
 * Opens the CV in a hidden iframe and triggers the browser's print dialog.
 * The user can then choose "Save as PDF" to export a professional PDF.
 */
export async function printCV(data: CVData, locale: string): Promise<void> {
  let html = renderCV(data, locale)

  // Inject QR code if enabled and website is set
  if (data.qrCode.enabled && data.personal.website) {
    try {
      const qrSvg = await QRCode.toString(data.personal.website, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      })
      // Replace the placeholder QR SVG with the real one
      // The placeholder has id="qr-svg", the real one from qrcode is a full <svg>
      // We extract just the <svg>...</svg> part
      const svgMatch = qrSvg.match(/<svg[\s\S]*?<\/svg>/)
      if (svgMatch) {
        // Remove viewBox from generated SVG so our wrapper controls sizing
        const realSvg = svgMatch[0].replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')
        html = html.replace(
          /<svg id="qr-svg"[\s\S]*?<\/svg>/,
          realSvg
        )
      }
    } catch (e) {
      console.error('Failed to generate QR code:', e)
      // Proceed without QR code
    }
  }

  // Build a name for the document (browsers often use <title> as the suggested filename)
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

  // Write the CV HTML into the iframe
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    console.error('Failed to create print iframe')
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for images (like photo) to load before printing
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
        img.addEventListener('error', onLoad) // Still print even if image fails
      }
    }
  }

  const triggerPrint = () => {
    // Small extra delay to ensure rendering is complete
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Print failed:', e)
      } finally {
        // Remove iframe after print dialog closes (or after a timeout)
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
