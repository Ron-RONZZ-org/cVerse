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
    skills: 'Skills'
  },
  fr: {
    experience: 'Expérience Professionnelle',
    education: 'Formation',
    qualities: 'Qualités',
    skills: 'Compétences'
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
  const lineHeight = 7
  const sectionSpacing = 10
  
  let y = PAGE_TOP_MARGIN // Current Y position

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
  const parseMarkdown = (markdown: string): string => {
    if (!markdown) return ''
    // Simple markdown parsing - convert to plain text with preserved structure
    let text = markdown
    // Remove bold/italic markers but keep the text
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
    text = text.replace(/\*([^*]+)\*/g, '$1')
    text = text.replace(/__([^_]+)__/g, '$1')
    text = text.replace(/_([^_]+)_/g, '$1')
    // Convert bullet points
    text = text.replace(/^[*-]\s+/gm, '• ')
    return text
  }

  // Personal Information Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(data.personal.name || '', leftMargin, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (data.personal.email) {
    doc.text(`Email: ${data.personal.email}`, leftMargin, y)
    y += lineHeight
  }
  
  if (data.personal.phone) {
    doc.text(`${options.locale === 'fr' ? 'Tél' : 'Phone'}: ${data.personal.phone}`, leftMargin, y)
    y += lineHeight
  }
  
  if (data.personal.location) {
    doc.text(`${options.locale === 'fr' ? 'Lieu' : 'Location'}: ${data.personal.location}`, leftMargin, y)
    y += lineHeight
  }
  
  if (data.personal.age) {
    doc.text(`${options.locale === 'fr' ? 'Âge' : 'Age'}: ${data.personal.age}`, leftMargin, y)
    y += lineHeight
  }
  
  if (data.personal.nationality) {
    doc.text(`${options.locale === 'fr' ? 'Nationalité' : 'Nationality'}: ${data.personal.nationality}`, leftMargin, y)
    y += lineHeight
  }
  
  if (data.personal.website) {
    doc.text(`Web: ${data.personal.website}`, leftMargin, y)
    y += lineHeight
  }
  
  if (data.personal.linkedin) {
    doc.text(`LinkedIn: ${data.personal.linkedin}`, leftMargin, y)
    y += lineHeight
  }

  y += sectionSpacing

  // Professional Experience
  if (data.experience.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.experience, leftMargin, y)
    y += 8
    
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
    doc.text(t.education, leftMargin, y)
    y += 8
    
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
  if (data.qualities) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.qualities, leftMargin, y)
    y += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const parsedQualities = parseMarkdown(data.qualities)
    y = addText(parsedQualities, leftMargin, y, rightMargin - leftMargin)
    y += sectionSpacing
  }

  // Skills
  if (data.skills) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(t.skills, leftMargin, y)
    y += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const parsedSkills = parseMarkdown(data.skills)
    y = addText(parsedSkills, leftMargin, y, rightMargin - leftMargin)
  }

  // Save the PDF
  const namePart = data.personal.name ? data.personal.name.replace(/\s+/g, '_') : 'document'
  const fileName = `CV_${namePart}_${Date.now()}.pdf`
  doc.save(fileName)
}
