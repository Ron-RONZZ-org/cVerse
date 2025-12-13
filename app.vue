<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <h1>{{ t('app.title') }}</h1>
        <div class="header-actions">
          <select v-model="locale" class="language-select">
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
    </header>
    
    <main class="container">
      <div class="toolbar">
        <button @click="handleExportJSON" class="btn btn-secondary">
          {{ t('app.save') }}
        </button>
        <button @click="handleImportJSON" class="btn btn-secondary">
          {{ t('app.load') }}
        </button>
        <input 
          ref="fileInput" 
          type="file" 
          accept=".json" 
          style="display: none" 
          @change="handleFileSelect"
        />
        <button @click="handleClear" class="btn btn-danger">
          {{ t('app.clear') }}
        </button>
        <button @click="handleExportPDF" class="btn btn-primary">
          {{ t('app.export') }}
        </button>
      </div>

      <PersonalInfoForm />

      <!-- Headline -->
      <div class="section">
        <h2>{{ t('personal.headline') }}</h2>
        <div class="form-group">
          <input 
            v-model="cvData.personal.headline" 
            type="text" 
            :placeholder="t('personal.headlinePlaceholder')"
            class="headline-input"
          />
        </div>
      </div>

      <!-- PDF Settings -->
      <div class="section">
        <h2>{{ t('pdfSettings.title') }}</h2>
        <div class="form-group">
          <label>{{ t('pdfSettings.dividerColor') }}</label>
          <div class="color-picker-wrapper">
            <input 
              v-model="cvData.dividerColor" 
              type="color" 
              class="color-picker"
            />
            <span class="color-value">{{ cvData.dividerColor }}</span>
          </div>
        </div>
      </div>

      <!-- Professional Experience -->
      <div class="section">
        <div class="section-header">
          <h2>{{ t('experience.title') }}</h2>
          <div class="header-actions">
            <button @click="sortExperience('newest')" class="btn btn-secondary btn-small">
              {{ t('sort.newest') }}
            </button>
            <button @click="sortExperience('oldest')" class="btn btn-secondary btn-small">
              {{ t('sort.oldest') }}
            </button>
            <button @click="addExperience" class="btn btn-primary">
              {{ t('experience.add') }}
            </button>
          </div>
        </div>
        <ExperienceBlock
          v-for="(exp, index) in cvData.experience"
          :key="exp.id"
          :experience="exp"
          :index="index"
          :total="cvData.experience.length"
          @remove="removeExperience(exp.id)"
          @move-up="moveExperience(index, 'up')"
          @move-down="moveExperience(index, 'down')"
        />
        <p v-if="cvData.experience.length === 0" class="empty-message">
          {{ t('experience.add') }}
        </p>
      </div>

      <!-- Education -->
      <div class="section">
        <div class="section-header">
          <h2>{{ t('education.title') }}</h2>
          <div class="header-actions">
            <button @click="sortEducation('newest')" class="btn btn-secondary btn-small">
              {{ t('sort.newest') }}
            </button>
            <button @click="sortEducation('oldest')" class="btn btn-secondary btn-small">
              {{ t('sort.oldest') }}
            </button>
            <button @click="addEducation" class="btn btn-primary">
              {{ t('education.add') }}
            </button>
          </div>
        </div>
        <EducationBlock
          v-for="(edu, index) in cvData.education"
          :key="edu.id"
          :education="edu"
          :index="index"
          :total="cvData.education.length"
          @remove="removeEducation(edu.id)"
          @move-up="moveEducation(index, 'up')"
          @move-down="moveEducation(index, 'down')"
        />
        <p v-if="cvData.education.length === 0" class="empty-message">
          {{ t('education.add') }}
        </p>
      </div>

      <!-- Qualities -->
      <div class="section">
        <h2>{{ t('qualities.title') }}</h2>
        <div class="form-group">
          <textarea 
            v-model="cvData.qualities" 
            :placeholder="t('qualities.placeholder')"
            rows="6"
            class="full-width"
          ></textarea>
        </div>
      </div>

      <!-- Skills -->
      <div class="section">
        <h2>{{ t('skills.title') }}</h2>
        <div class="form-group">
          <textarea 
            v-model="cvData.skills" 
            :placeholder="t('skills.placeholder')"
            rows="6"
            class="full-width"
          ></textarea>
        </div>
      </div>

      <!-- Interests -->
      <div class="section">
        <h2>{{ t('interests.title') }}</h2>
        <div class="form-group">
          <textarea 
            v-model="cvData.interests" 
            :placeholder="t('interests.placeholder')"
            rows="6"
            class="full-width"
          ></textarea>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { generatePDF } from '~/utils/pdfGenerator'

const { t, locale } = useI18n()
const { 
  cvData, 
  loadFromStorage,
  addExperience,
  removeExperience,
  moveExperience,
  sortExperience,
  addEducation,
  removeEducation,
  moveEducation,
  sortEducation,
  clearData,
  exportToJSON,
  importFromJSON
} = useCVData()

const fileInput = ref<HTMLInputElement | null>(null)

// Load data from localStorage on mount
onMounted(() => {
  loadFromStorage()
})

const handleExportJSON = () => {
  exportToJSON()
}

const handleImportJSON = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      await importFromJSON(file)
      alert('CV data loaded successfully!')
    } catch (error) {
      alert('Error loading file. Please make sure it\'s a valid JSON file.')
    }
    // Reset input
    if (target) target.value = ''
  }
}

const handleClear = () => {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    clearData()
  }
}

const handleExportPDF = () => {
  if (!cvData.value.personal.name || !cvData.value.personal.email) {
    alert('Please fill in at least Name and Email before exporting.')
    return
  }
  
  generatePDF(cvData.value, { locale: locale.value as 'en' | 'fr' })
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f7fa;
  color: #2c3e50;
}

#app {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
}

.language-select {
  padding: 8px 12px;
  border: 2px solid white;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.language-select:hover {
  background: rgba(255, 255, 255, 0.3);
}

.language-select option {
  color: #2c3e50;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.form-group {
  margin-bottom: 15px;
}

textarea.full-width {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

textarea.full-width:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.headline-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
}

.headline-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}

.color-picker {
  width: 60px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-picker:hover {
  border-color: #3498db;
}

.color-value {
  font-family: monospace;
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 600;
}

.empty-message {
  color: #95a5a6;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-small {
  padding: 8px 15px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.5rem;
  }
  
  .toolbar {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>

