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

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
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
  
  // Markdown parsing constants
  const SPACES_PER_INDENT = 2  // Number of spaces that constitute one indent level
  const INDENT_SPACING_MM = 3  // Millimeters to indent per level in PDF
  
  let y = PAGE_TOP_MARGIN // Current Y position
  const hasPhoto = !!data.personal.photo
  
  // If there's a photo, we'll render it in the top right
  // and adjust the left column width accordingly
  const contentWidth = hasPhoto ? 115 : 170  // Width for main content when photo is present
  
  // Get divider color from data, default to black
  const dividerColor = data.dividerColor || '#000000'
  const dividerRGB = hexToRgb(dividerColor)
  
  // Get link color from data, default to blue
  const linkColor = data.linkColor || '#0000FF'
  const linkRGB = hexToRgb(linkColor)

  // Interface for parsed markdown segments
  interface MarkdownSegment {
    type: 'text' | 'link'
    content: string
    url?: string
    indent?: number
  }

  // Helper to parse markdown into structured segments
  const parseMarkdownLine = (line: string): MarkdownSegment[] => {
    const segments: MarkdownSegment[] = []
    
    // Extract links [text](url) with bounds checking to prevent infinite loops
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let lastIndex = 0
    let match
    let iterationCount = 0
    const MAX_ITERATIONS = 100 // Safety limit to prevent infinite loops
    
    while ((match = linkRegex.exec(line)) !== null && iterationCount++ < MAX_ITERATIONS) {
      // Add text before the link
      if (match.index > lastIndex) {
        const textBefore = line.substring(lastIndex, match.index)
        if (textBefore) {
          segments.push({ type: 'text', content: textBefore })
        }
      }
      
      // Add the link
      segments.push({
        type: 'link',
        content: match[1], // link text
        url: match[2] // link URL
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text after last link
    if (lastIndex < line.length) {
      const textAfter = line.substring(lastIndex)
      if (textAfter) {
        segments.push({ type: 'text', content: textAfter })
      }
    }
    
    // If no segments were created (no links), return the whole line as text
    if (segments.length === 0) {
      segments.push({ type: 'text', content: line })
    }
    
    return segments
  }

  // Helper to parse markdown text into lines with metadata
  const parseMarkdown = (markdown: string): { text: string; indent: number; segments: MarkdownSegment[] }[] => {
    if (!markdown) return []
    
    const lines = markdown.split('\n')
    const parsedLines: { text: string; indent: number; segments: MarkdownSegment[] }[] = []
    
    lines.forEach((line) => {
      if (!line.trim()) {
        parsedLines.push({ text: '', indent: 0, segments: [] })
        return
      }
      
      // Detect indentation level (count leading spaces)
      const indentMatch = line.match(/^(\s*)/)
      const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / SPACES_PER_INDENT) : 0
      
      // Remove leading/trailing whitespace for processing
      let processedLine = line.trim()
      
      // Handle bullet points and convert to bullet character
      const bulletMatch = processedLine.match(/^[*-]\s+(.*)/)
      if (bulletMatch) {
        processedLine = '• ' + bulletMatch[1]
      }
      
      // Remove bold/italic markers but keep the text
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '$1')
      processedLine = processedLine.replace(/\*(.+?)\*/g, '$1')
      processedLine = processedLine.replace(/__(.+?)__/g, '$1')
      processedLine = processedLine.replace(/_(.+?)_/g, '$1')
      
      // Parse the line into segments (text and links)
      const segments = parseMarkdownLine(processedLine)
      
      parsedLines.push({
        text: processedLine,
        indent: indentLevel,
        segments
      })
    })
    
    return parsedLines
  }

  // Helper function to add text with word wrap and link support
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

  // Helper function to render parsed markdown with links
  const addMarkdownText = (markdown: string, x: number, yPos: number, maxWidth: number, size: number = 10) => {
    const parsedLines = parseMarkdown(markdown)
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    
    parsedLines.forEach((line) => {
      if (!line.text.trim()) {
        yPos += lineHeight / 2 // Half line height for empty lines
        return
      }
      
      if (yPos > PAGE_BOTTOM_MARGIN) {
        doc.addPage()
        yPos = PAGE_TOP_MARGIN
      }
      
      // Calculate indentation
      const indentX = x + (line.indent * INDENT_SPACING_MM)
      
      // If the line has no links, render it simply
      if (line.segments.length === 1 && line.segments[0].type === 'text') {
        const wrappedLines = doc.splitTextToSize(line.text, maxWidth - (line.indent * INDENT_SPACING_MM))
        wrappedLines.forEach((wrappedLine: string, index: number) => {
          if (yPos > PAGE_BOTTOM_MARGIN) {
            doc.addPage()
            yPos = PAGE_TOP_MARGIN
          }
          doc.text(wrappedLine, index === 0 ? indentX : indentX + 2, yPos)
          yPos += lineHeight
        })
        return
      }
      
      // Render line with mixed text and links
      let currentX = indentX
      const startY = yPos
      
      line.segments.forEach((segment) => {
        if (segment.type === 'text') {
          // Check if text fits on current line
          const textWidth = doc.getTextWidth(segment.content)
          if (currentX + textWidth > x + maxWidth) {
            // Wrap to next line
            yPos += lineHeight
            currentX = indentX + 2
            if (yPos > PAGE_BOTTOM_MARGIN) {
              doc.addPage()
              yPos = PAGE_TOP_MARGIN
              currentX = indentX
            }
          }
          
          doc.setTextColor(0, 0, 0) // Black for regular text
          doc.text(segment.content, currentX, yPos)
          currentX += doc.getTextWidth(segment.content)
        } else if (segment.type === 'link' && segment.url) {
          // Render link in blue
          const linkText = segment.content
          const linkWidth = doc.getTextWidth(linkText)
          
          // Check if link fits on current line
          if (currentX + linkWidth > x + maxWidth) {
            // Wrap to next line
            yPos += lineHeight
            currentX = indentX + 2
            if (yPos > PAGE_BOTTOM_MARGIN) {
              doc.addPage()
              yPos = PAGE_TOP_MARGIN
              currentX = indentX
            }
          }
          
          doc.setTextColor(linkRGB.r, linkRGB.g, linkRGB.b) // Use configurable link color
          doc.textWithLink(linkText, currentX, yPos, { url: segment.url })
          currentX += linkWidth
        }
      })
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0)
      yPos += lineHeight
    })
    
    return yPos
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
  
  // Web links - render as clickable blue links
  if (data.personal.website) {
    const labelWidth = doc.getTextWidth('Web: ')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0) // Black for label
    doc.text('Web: ', leftMargin, y)
    
    doc.setTextColor(linkRGB.r, linkRGB.g, linkRGB.b) // Link color for URL
    doc.textWithLink(data.personal.website, leftMargin + labelWidth, y, { url: data.personal.website })
    y += lineHeight
  }
  
  if (data.personal.linkedin) {
    const labelWidth = doc.getTextWidth('LinkedIn: ')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0) // Black for label
    doc.text('LinkedIn: ', leftMargin, y)
    
    doc.setTextColor(linkRGB.r, linkRGB.g, linkRGB.b) // Link color for URL
    doc.textWithLink(data.personal.linkedin, leftMargin + labelWidth, y, { url: data.personal.linkedin })
    y += lineHeight
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
        y = addMarkdownText(exp.description, leftMargin, y, rightMargin - leftMargin)
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
        y = addMarkdownText(edu.description, leftMargin, y, rightMargin - leftMargin)
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
    y = addMarkdownText(data.qualities, leftMargin, y, rightMargin - leftMargin)
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
    y = addMarkdownText(data.skills, leftMargin, y, rightMargin - leftMargin)
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
    y = addMarkdownText(data.interests, leftMargin, y, rightMargin - leftMargin)
  }

  // Save the PDF
  const namePart = data.personal.name ? data.personal.name.replace(/\s+/g, '_') : 'document'
  const fileName = `CV_${namePart}_${Date.now()}.pdf`
  doc.save(fileName)
}
