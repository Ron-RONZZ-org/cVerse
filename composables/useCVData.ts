import type { CVData, PersonalInfo, ExperienceBlock, EducationBlock } from '~/types/cv'

const STORAGE_KEY = 'cv-data'

export const useCVData = () => {
  const cvData = useState<CVData>('cvData', () => ({
    personal: {
      name: '',
      email: '',
      location: '',
      phone: '',
      website: '',
      linkedin: '',
      age: '',
      nationality: ''
    },
    experience: [],
    education: [],
    qualities: '',
    skills: ''
  }))

  // Load data from localStorage on initialization
  const loadFromStorage = () => {
    if (process.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          cvData.value = JSON.parse(stored)
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

  // Add experience block
  const addExperience = () => {
    cvData.value.experience.push({
      id: Date.now().toString(),
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      description: ''
    })
  }

  // Remove experience block
  const removeExperience = (id: string) => {
    cvData.value.experience = cvData.value.experience.filter(exp => exp.id !== id)
  }

  // Move experience block
  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < cvData.value.experience.length) {
      const temp = cvData.value.experience[index]
      cvData.value.experience[index] = cvData.value.experience[newIndex]
      cvData.value.experience[newIndex] = temp
    }
  }

  // Add education block
  const addEducation = () => {
    cvData.value.education.push({
      id: Date.now().toString(),
      degree: '',
      startDate: '',
      endDate: '',
      location: '',
      description: ''
    })
  }

  // Remove education block
  const removeEducation = (id: string) => {
    cvData.value.education = cvData.value.education.filter(edu => edu.id !== id)
  }

  // Move education block
  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < cvData.value.education.length) {
      const temp = cvData.value.education[index]
      cvData.value.education[index] = cvData.value.education[newIndex]
      cvData.value.education[newIndex] = temp
    }
  }

  // Clear all data
  const clearData = () => {
    cvData.value = {
      personal: {
        name: '',
        email: '',
        location: '',
        phone: '',
        website: '',
        linkedin: '',
        age: '',
        nationality: ''
      },
      experience: [],
      education: [],
      qualities: '',
      skills: ''
    }
    if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Export to JSON
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

  // Import from JSON
  const importFromJSON = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
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
    addExperience,
    removeExperience,
    moveExperience,
    addEducation,
    removeEducation,
    moveEducation,
    clearData,
    exportToJSON,
    importFromJSON
  }
}
