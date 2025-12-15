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

export interface CVData {
  personal: PersonalInfo
  experience: ExperienceBlock[]
  education: EducationBlock[]
  qualities: string
  skills: string
  interests: string
  dividerColor?: string  // Color for section divider lines in PDF
  linkColor?: string  // Color for links in PDF
}
