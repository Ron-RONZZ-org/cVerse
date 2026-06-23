import type { CVData, PersonalInfo, ExperienceBlock, EducationBlock, LanguageSkill, CustomSection, CustomField, CEFRLevel, QualityAttribute } from '~/types/cv'

const STORAGE_KEY = 'cv-data'

// CEFR migration map: old number-based level → CEFR string
const MIGRATE_CEFR: Record<number, CEFRLevel> = {
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'C1',
  5: 'C2'
}

const emptyCV = (): CVData => ({
  personal: {
    name: '',
    email: '',
    headline: '',
    location: '',
    phone: '',
    website: '',
    linkedin: '',
    age: '',
    nationality: '',
    customFields: []
  },
  experience: [],
  education: [],
  languages: [],
  customSections: [],
  qualities: '',
  skills: '',
  interests: '',
  accentColor: '#2563eb',
  qualitiesMode: 'markdown',
  qualityAttributes: [],
  qrCode: {
    enabled: false,
    caption: '',
    decoration: ''
  },
  footer: {
    enabled: false,
    text: ''
  }
})

export const useCVData = () => {
  const cvData = useState<CVData>('cvData', () => emptyCV())

  // Load data from localStorage on initialization
  const loadFromStorage = () => {
    if (process.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const loadedData = JSON.parse(stored)
          // Ensure new fields exist for backward compatibility
          if (!loadedData.languages) loadedData.languages = []
          if (!loadedData.customSections) loadedData.customSections = []
          if (!loadedData.personal) loadedData.personal = {}
          if (!loadedData.personal.customFields) loadedData.personal.customFields = []
          if (!loadedData.accentColor) loadedData.accentColor = '#2563eb'
          if (!loadedData.qualities) loadedData.qualities = ''
          if (!loadedData.skills) loadedData.skills = ''
          if (!loadedData.interests) loadedData.interests = ''
          // Migrate language levels from number to CEFR strings
          if (loadedData.languages) {
            for (const lang of loadedData.languages) {
              if (typeof lang.level === 'number') {
                lang.level = MIGRATE_CEFR[lang.level] || 'B1'
              }
            }
          }
          // New fields from the feature expansion
          if (!loadedData.qualitiesMode) loadedData.qualitiesMode = 'markdown'
          if (!loadedData.qualityAttributes) loadedData.qualityAttributes = []
          if (!loadedData.qrCode) loadedData.qrCode = { enabled: false, caption: '', decoration: '' }
          if (!loadedData.footer) loadedData.footer = { enabled: false, text: '' }
          cvData.value = loadedData
        } catch (e) {
          console.error('Failed to parse stored CV data:', e)
        }
      }
    }
  }

  // Save data to localStorage
  const saveToStorage = () => {
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData.value))
    }
  }

  // Watch for changes and auto-save
  watch(cvData, () => {
    saveToStorage()
  }, { deep: true })

  // --- Experience ---
  const addExperience = () => {
    cvData.value.experience.push({
      id: crypto.randomUUID(),
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      description: ''
    })
  }

  const removeExperience = (id: string) => {
    cvData.value.experience = cvData.value.experience.filter(exp => exp.id !== id)
  }

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < cvData.value.experience.length) {
      const temp = cvData.value.experience[index]
      cvData.value.experience[index] = cvData.value.experience[newIndex]
      cvData.value.experience[newIndex] = temp
    }
  }

  // --- Education ---
  const addEducation = () => {
    cvData.value.education.push({
      id: crypto.randomUUID(),
      degree: '',
      startDate: '',
      endDate: '',
      location: '',
      description: ''
    })
  }

  const removeEducation = (id: string) => {
    cvData.value.education = cvData.value.education.filter(edu => edu.id !== id)
  }

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < cvData.value.education.length) {
      const temp = cvData.value.education[index]
      cvData.value.education[index] = cvData.value.education[newIndex]
      cvData.value.education[newIndex] = temp
    }
  }

  // --- Languages ---
  const addLanguage = () => {
    cvData.value.languages.push({
      id: crypto.randomUUID(),
      name: '',
      level: 'B1'
    })
  }

  const removeLanguage = (id: string) => {
    cvData.value.languages = cvData.value.languages.filter(l => l.id !== id)
  }

  // --- Quality Attributes (polygon mode) ---
  const addQualityAttribute = () => {
    cvData.value.qualityAttributes.push({
      id: crypto.randomUUID(),
      name: '',
      score: 3
    })
  }

  const removeQualityAttribute = (id: string) => {
    cvData.value.qualityAttributes = cvData.value.qualityAttributes.filter(q => q.id !== id)
  }

  // --- Custom Sections ---
  const addCustomSection = () => {
    cvData.value.customSections.push({
      id: crypto.randomUUID(),
      title: '',
      content: ''
    })
  }

  const removeCustomSection = (id: string) => {
    cvData.value.customSections = cvData.value.customSections.filter(s => s.id !== id)
  }

  // --- Custom Fields ---
  const addCustomField = () => {
    cvData.value.personal.customFields.push({
      id: crypto.randomUUID(),
      label: '',
      value: ''
    })
  }

  const removeCustomField = (id: string) => {
    cvData.value.personal.customFields = cvData.value.personal.customFields.filter(f => f.id !== id)
  }

  // --- Sort helpers ---
  const sortExperience = (order: 'newest' | 'oldest') => {
    cvData.value.experience.sort((a, b) => {
      const dateA = a.startDate || ''
      const dateB = b.startDate || ''
      return order === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB)
    })
  }

  const sortEducation = (order: 'newest' | 'oldest') => {
    cvData.value.education.sort((a, b) => {
      const dateA = a.startDate || ''
      const dateB = b.startDate || ''
      return order === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB)
    })
  }

  // --- Clear / Export / Import ---
  const clearData = () => {
    cvData.value = emptyCV()
    if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const exportToJSON = () => {
    const dataStr = JSON.stringify(cvData.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cv-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importFromJSON = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          // Migrate levels on import too
          if (data.languages) {
            for (const lang of data.languages) {
              if (typeof lang.level === 'number') {
                lang.level = MIGRATE_CEFR[lang.level] || 'B1'
              }
            }
          }
          cvData.value = data
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  return {
    cvData,
    loadFromStorage,
    saveToStorage,
    addExperience, removeExperience, moveExperience, sortExperience,
    addEducation, removeEducation, moveEducation, sortEducation,
    addLanguage, removeLanguage,
    addQualityAttribute, removeQualityAttribute,
    addCustomSection, removeCustomSection,
    addCustomField, removeCustomField,
    clearData,
    exportToJSON, importFromJSON
  }
}
