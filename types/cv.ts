export interface CustomField {
  id: string
  label: string
  value: string
}

export interface PersonalInfo {
  name: string
  email: string
  headline?: string
  photo?: string  // base64 encoded image
  location?: string
  phone?: string
  website?: string
  linkedin?: string
  age?: string
  nationality?: string
  customFields: CustomField[]
}

export interface ExperienceBlock {
  id: string
  title: string
  startDate: string
  endDate: string
  location?: string
  description?: string
}

export interface EducationBlock {
  id: string
  degree: string
  startDate: string
  endDate: string
  location?: string
  description?: string
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface LanguageSkill {
  id: string
  name: string
  level: CEFRLevel
}

export interface QualityAttribute {
  id: string
  name: string
  score: number  // 1-5
}

export interface CustomSection {
  id: string
  title: string
  content: string  // markdown
}

export interface QRCodeItem {
  id: string
  url: string
  caption: string
  decoration: string  // base64 or URL of center image
}

export interface QRCodeConfig {
  enabled: boolean
  items: QRCodeItem[]
}

export interface FooterConfig {
  enabled: boolean
  text: string
}

export interface CVData {
  personal: PersonalInfo
  experience: ExperienceBlock[]
  education: EducationBlock[]
  languages: LanguageSkill[]
  customSections: CustomSection[]
  skills: string
  interests: string
  accentColor: string
  qualityAttributes: QualityAttribute[]
  qualitiesShowStrength: boolean
  qrCode: QRCodeConfig
  footer: FooterConfig
  exportTheme: 'light' | 'dark'
  accentSaturation: number  // 0-100, default 100 (fully saturated)
}

// Dropdown data types
export interface Country {
  code: string
  name: string
}

export interface Language {
  code: string
  name: string
}
