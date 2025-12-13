import jsPDF from 'jspdf'
import type { CVData } from '~/types/cv'

interface PDFOptions {
  locale: 'en' | 'fr'
}

const translations = {
  en: {
    experience: 'Professional Experience',
    education: 'Education',
    qualities: 'Qualities',
    skills: 'Skills',
    interests: 'Interests'
  },
  fr: {
    experience: 'Expérience Professionnelle',
    education: 'Formation',
    qualities: 'Qualités',
    skills: 'Compétences',
    interests: 'Centres d\'Intérêt'
  }
}

export const generatePDF = (data: CVData, options: PDFOptions) => {
  const doc = new jsPDF()
  const t = translations[options.locale]
  
  // Page layout constants
  const PAGE_TOP_MARGIN = 20
  const PAGE_BOTTOM_MARGIN = 280
  const leftMargin = 20
  const rightMargin = 190
  const photoColumnX = 145  // X position for photo column
  const lineHeight = 7
  const sectionSpacing = 10
  
  let y = PAGE_TOP_MARGIN // Current Y position
  const hasPhoto = !!data.personal.photo
  
  // If there's a photo, we'll render it in the top right
  // and adjust the left column width accordingly
  const contentWidth = hasPhoto ? 115 : 170  // Width for main content when photo is present
  
  // Get divider color from data, default to black
  const dividerColor = data.dividerColor || '#000000'
  // Convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }
  const dividerRGB = hexToRgb(dividerColor)

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, yPos: number, maxWidth: number, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach((line: string) => {
      if (yPos > PAGE_BOTTOM_MARGIN) {
        doc.addPage()
        yPos = PAGE_TOP_MARGIN
      }
      doc.text(line, x, yPos)
      yPos += lineHeight
    })
    return yPos
  }

  // Helper to parse markdown to plain text with basic formatting
  // Note: This removes formatting markers and converts to plain text
  // jsPDF's basic font API doesn't support mixed bold/italic in single text blocks
  // For more advanced formatting, would need to use jsPDF's html() method or custom rendering
  const parseMarkdown = (markdown: string): string => {
    if (!markdown) return ''
    // Simple markdown parsing - convert to plain text with preserved structure
    let text = markdown
    // Remove bold/italic markers but keep the text
    // Use non-greedy matching with .+? to properly handle multiple instances
    text = text.replace(/\*\*(.+?)\*\*/g, '$1')
    text = text.replace(/\*(.+?)\*/g, '$1')
    text = text.replace(/__(.+?)__/g, '$1')
    text = text.replace(/_(.+?)_/g, '$1')
    // Convert bullet points
    text = text.replace(/^[*-]\s+/gm, '• ')
    return text
  }

  // Personal Information Header - Improved formatting
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.personal.name || '', leftMargin, y)
  y += 8
  
  // Headline (if provided)
  if (data.personal.headline) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'italic')
    doc.text(data.personal.headline, leftMargin, y)
    y += 8
  }
  
  // Render photo in top right corner if available
  if (hasPhoto && data.personal.photo) {
    const photoSize = 40  // 40mm square
    const photoY = PAGE_TOP_MARGIN
    try {
      doc.addImage(data.personal.photo, 'JPEG', photoColumnX, photoY, photoSize, photoSize)
      // Draw border around photo
      doc.setLineWidth(0.3)
      doc.setDrawColor(200, 200, 200)
      doc.rect(photoColumnX, photoY, photoSize, photoSize)
    } catch (e) {
      console.error('Failed to add photo to PDF. The image may be corrupted or in an unsupported format:', e)
    }
  }
  
  // Draw a line under the name/headline
  // Adjust line width to not overlap with photo
  const lineEndX = hasPhoto ? photoColumnX - 5 : rightMargin
  doc.setLineWidth(0.5)
  doc.setDrawColor(dividerRGB.r, dividerRGB.g, dividerRGB.b)
  doc.line(leftMargin, y, lineEndX, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Contact information in a more compact format
  const contactInfo = []
  if (data.personal.email) contactInfo.push(data.personal.email)
  if (data.personal.phone) contactInfo.push(data.personal.phone)
  if (data.personal.location) contactInfo.push(data.personal.location)
  
  if (contactInfo.length > 0) {
    // Use word wrap for contact info when photo is present
    if (hasPhoto) {
      const lines = doc.splitTextToSize(contactInfo.join(' | '), contentWidth)
      lines.forEach((line: string) => {
        doc.text(line, leftMargin, y)
        y += lineHeight
      })
    } else {
      doc.text(contactInfo.join(' | '), leftMargin, y)
      y += lineHeight
    }
  }
  
  // Additional info on next line
  const additionalInfo = []
  if (data.personal.age) additionalInfo.push(`${options.locale === 'fr' ? 'Âge' : 'Age'}: ${data.personal.age}`)
  if (data.personal.nationality) additionalInfo.push(`${options.locale === 'fr' ? 'Nationalité' : 'Nationality'}: ${data.personal.nationality}`)
  
  if (additionalInfo.length > 0) {
    if (hasPhoto) {
      const lines = doc.splitTextToSize(additionalInfo.join(' | '), contentWidth)
      lines.forEach((line: string) => {
        doc.text(line, leftMargin, y)
        y += lineHeight
      })
    } else {
      doc.text(additionalInfo.join(' | '), leftMargin, y)
      y += lineHeight
    }
  }
  
  // Web links
  if (data.personal.website) {
    if (hasPhoto) {
      const lines = doc.splitTextToSize(`Web: ${data.personal.website}`, contentWidth)
      lines.forEach((line: string) => {
        doc.text(line, leftMargin, y)
        y += lineHeight
      })
    } else {
      doc.text(`Web: ${data.personal.website}`, leftMargin, y)
      y += lineHeight
    }
  }
  
  if (data.personal.linkedin) {
    if (hasPhoto) {
      const lines = doc.splitTextToSize(`LinkedIn: ${data.personal.linkedin}`, contentWidth)
      lines.forEach((line: string) => {
        doc.text(line, leftMargin, y)
        y += lineHeight
      })
    } else {
      doc.text(`LinkedIn: ${data.personal.linkedin}`, leftMargin, y)
      y += lineHeight
    }
  }

  y += sectionSpacing

  // Professional Experience
  if (data.experience.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.experience.toUpperCase(), leftMargin, y)
    y += 2
    // Draw line under section title
    doc.setLineWidth(0.3)
    doc.setDrawColor(dividerRGB.r, dividerRGB.g, dividerRGB.b)
    doc.line(leftMargin, y, rightMargin, y)
    y += 6
    
    doc.setFontSize(10)
    
    data.experience.forEach((exp) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(exp.title, leftMargin, y)
      y += lineHeight
      
      doc.setFont('helvetica', 'italic')
      const period = `${exp.startDate} - ${exp.endDate}`
      doc.text(period, leftMargin, y)
      
      if (exp.location) {
        doc.text(` | ${exp.location}`, leftMargin + doc.getTextWidth(period) + 2, y)
      }
      y += lineHeight
      
      if (exp.description) {
        doc.setFont('helvetica', 'normal')
        const parsedDesc = parseMarkdown(exp.description)
        y = addText(parsedDesc, leftMargin, y, rightMargin - leftMargin)
      }
      
      y += 5
    })
    
    y += sectionSpacing - 5
  }

  // Education
  if (data.education.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.education.toUpperCase(), leftMargin, y)
    y += 2
    // Draw line under section title
    doc.setLineWidth(0.3)
    doc.setDrawColor(dividerRGB.r, dividerRGB.g, dividerRGB.b)
    doc.line(leftMargin, y, rightMargin, y)
    y += 6
    
    doc.setFontSize(10)
    
    data.education.forEach((edu) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(edu.degree, leftMargin, y)
      y += lineHeight
      
      doc.setFont('helvetica', 'italic')
      const period = `${edu.startDate} - ${edu.endDate}`
      doc.text(period, leftMargin, y)
      
      if (edu.location) {
        doc.text(` | ${edu.location}`, leftMargin + doc.getTextWidth(period) + 2, y)
      }
      y += lineHeight
      
      if (edu.description) {
        doc.setFont('helvetica', 'normal')
        const parsedDesc = parseMarkdown(edu.description)
        y = addText(parsedDesc, leftMargin, y, rightMargin - leftMargin)
      }
      
      y += 5
    })
    
    y += sectionSpacing - 5
  }

  // Qualities
  if (data.qualities && data.qualities.trim()) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.qualities.toUpperCase(), leftMargin, y)
    y += 2
    // Draw line under section title
    doc.setLineWidth(0.3)
    doc.setDrawColor(dividerRGB.r, dividerRGB.g, dividerRGB.b)
    doc.line(leftMargin, y, rightMargin, y)
    y += 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const parsedQualities = parseMarkdown(data.qualities)
    y = addText(parsedQualities, leftMargin, y, rightMargin - leftMargin)
    y += sectionSpacing
  }

  // Skills
  if (data.skills && data.skills.trim()) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.skills.toUpperCase(), leftMargin, y)
    y += 2
    // Draw line under section title
    doc.setLineWidth(0.3)
    doc.setDrawColor(dividerRGB.r, dividerRGB.g, dividerRGB.b)
    doc.line(leftMargin, y, rightMargin, y)
    y += 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const parsedSkills = parseMarkdown(data.skills)
    y = addText(parsedSkills, leftMargin, y, rightMargin - leftMargin)
    y += sectionSpacing
  }

  // Interests
  if (data.interests && data.interests.trim()) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.interests.toUpperCase(), leftMargin, y)
    y += 2
    // Draw line under section title
    doc.setLineWidth(0.3)
    doc.setDrawColor(dividerRGB.r, dividerRGB.g, dividerRGB.b)
    doc.line(leftMargin, y, rightMargin, y)
    y += 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const parsedInterests = parseMarkdown(data.interests)
    y = addText(parsedInterests, leftMargin, y, rightMargin - leftMargin)
  }

  // Save the PDF
  const namePart = data.personal.name ? data.personal.name.replace(/\s+/g, '_') : 'document'
  const fileName = `CV_${namePart}_${Date.now()}.pdf`
  doc.save(fileName)
}
