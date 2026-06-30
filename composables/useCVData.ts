import type { CVData, PersonalInfo, ExperienceBlock, EducationBlock, LanguageSkill, CustomSection, CustomField, CEFRLevel, QualityAttribute, QRCodeItem } from '~/types/cv'

const STORAGE_KEY = 'cv-data'

// CEFR migration map: old number-based level → CEFR string
const MIGRATE_CEFR: Record<number, CEFRLevel> = {
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'C1',
  5: 'C2'
}

function parseQualitiesMarkdown(text: string): QualityAttribute[] {
  const attrs: QualityAttribute[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // Remove leading bullet markers
    const name = trimmed.replace(/^[*-]\s+/, '').trim()
    if (name) {
      attrs.push({ id: crypto.randomUUID(), name, score: 3 })
    }
  }
  return attrs
}

/** Migrate old CV data that may have `qualities`/`qualitiesMode` to new shape. */
function migrateOldData(data: Record<string, unknown>): void {
  // Ensure arrays exist for backward compatibility with old JSON exports
  if (!data.languages) (data as Record<string, unknown>).languages = []
  if (!data.customSections) (data as Record<string, unknown>).customSections = []
  if (!data.qualityAttributes) (data as Record<string, unknown>).qualityAttributes = []
  if (!data.skills) (data as Record<string, unknown>).skills = ''
  if (!data.interests) (data as Record<string, unknown>).interests = ''
  if (!data.accentColor) (data as Record<string, unknown>).accentColor = '#2563eb'
  if (!data.qrCode) (data as Record<string, unknown>).qrCode = { enabled: false, items: [] }
  if (!data.footer) (data as Record<string, unknown>).footer = { enabled: false, text: '' }

  // Migrate old single-QR format to multi-QR items
  const qr = data.qrCode as Record<string, unknown>
  if (qr && !('items' in qr)) {
    const personal = data.personal as Record<string, unknown> | undefined
    const website = (personal?.website as string) || ''
    const items: QRCodeItem[] = []
    if (qr.enabled && website) {
      items.push({
        id: crypto.randomUUID(),
        url: website,
        caption: (qr.caption as string) || '',
        decoration: (qr.decoration as string) || ''
      })
    }
    data.qrCode = { enabled: qr.enabled as boolean || false, items }
  }

  // personal sub-object may be partial
  const personal = data.personal as Record<string, unknown> | undefined
  if (personal) {
    if (!personal.customFields) personal.customFields = []
  }

  // Migrate language levels from number to CEFR strings
  const langs = data.languages as Array<Record<string, unknown>> | undefined
  if (langs) {
    for (const lang of langs) {
      if (typeof lang.level === 'number') {
        lang.level = MIGRATE_CEFR[lang.level as number] || 'B1'
      }
    }
  }

  // Migrate old qualities system: remove `qualities` and `qualitiesMode`,
  // populate `qualityAttributes` if empty, set `qualitiesShowStrength`
  const oldQualities = data.qualities as string | undefined
  const oldMode = data.qualitiesMode as string | undefined

  delete data.qualities
  delete data.qualitiesMode

  // Now data.qualityAttributes is guaranteed to be an array (initialized above)
  const attrs = data.qualityAttributes as QualityAttribute[]

  // If old markdown text exists and no structured attributes yet, parse it
  if (oldQualities && attrs.length === 0) {
    const parsed = parseQualitiesMarkdown(oldQualities)
    if (parsed.length > 0) {
      ;(data.qualityAttributes as QualityAttribute[]) = parsed
    }
  }

  // Migrate showStrength from old mode (only when migrating from old system)
  if (oldMode !== undefined) {
    data.qualitiesShowStrength = oldMode === 'polygon'
  } else if (data.qualitiesShowStrength === undefined) {
    (data as Record<string, unknown>).qualitiesShowStrength = false
  }

  // Default export theme to light for backward compatibility
  if (!data.exportTheme) (data as Record<string, unknown>).exportTheme = 'light'

  // Default accentSaturation to 100 if missing (backward compat)
  if (data.accentSaturation === undefined) (data as Record<string, unknown>).accentSaturation = 100
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
  skills: '',
  interests: '',
  accentColor: '#2563eb',
  qualityAttributes: [],
  qualitiesShowStrength: false,
  qrCode: {
    enabled: false,
    items: []
  },
  footer: {
    enabled: false,
    text: ''
  },
  exportTheme: 'light',
  accentSaturation: 100
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
          migrateOldData(loadedData)
          cvData.value = loadedData as CVData
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

  // --- Quality Attributes ---
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

  // --- QR Code Items ---
  const addQRCode = (url: string) => {
    cvData.value.qrCode.items.push({
      id: crypto.randomUUID(),
      url,
      caption: '',
      decoration: ''
    })
  }

  const removeQRCode = (id: string) => {
    cvData.value.qrCode.items = cvData.value.qrCode.items.filter(q => q.id !== id)
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
    const name = cvData.value.personal.name?.trim() || 'CV'
    const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    const dataStr = JSON.stringify(cvData.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeName}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importFromJSON = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          // Preserve current exportTheme if imported data lacks it
          const prevExportTheme = cvData.value.exportTheme
          const hadExportTheme = 'exportTheme' in data
          migrateOldData(data)
          // Check BEFORE migrateOldData — it adds 'exportTheme' if missing
          if (!hadExportTheme) {
            (data as CVData).exportTheme = prevExportTheme
          }
          cvData.value = data as CVData
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
    addQRCode, removeQRCode,
    clearData,
    exportToJSON, importFromJSON
  }
}
