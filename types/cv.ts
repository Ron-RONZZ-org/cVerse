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

export interface LanguageSkill {
  id: string
  name: string
  level: number  // 1-5
}

export interface CustomSection {
  id: string
  title: string
  content: string  // markdown
}

export interface CVData {
  personal: PersonalInfo
  experience: ExperienceBlock[]
  education: EducationBlock[]
  languages: LanguageSkill[]
  customSections: CustomSection[]
  qualities: string
  skills: string
  interests: string
  accentColor: string
}
