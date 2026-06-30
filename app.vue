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
          <!-- Persistent layout mode toggle (always visible) -->
          <button
            class="header-layout-toggle"
            :title="t('layout.toggleMenu')"
            @click="cycleLayoutMode"
          >
            <span class="layout-mode-icon" v-html="layoutIcon"></span>
          </button>
          <!-- Theme toggle -->
          <button
            class="header-theme-toggle"
            :title="t('theme.toggle')"
            @click="toggleTheme"
          >
            <span v-if="isDark" class="theme-icon">&#x2600;</span>
            <span v-else class="theme-icon">&#x263E;</span>
          </button>
        </div>
      </div>
    </header>
    
    <SplitPane>
      <template #default>
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

        <!-- Custom Fields -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('customFields.title') }}</h2>
            <button @click="addCustomField" class="btn btn-primary">{{ t('customFields.add') }}</button>
          </div>
          <p v-if="cvData.personal.customFields.length === 0" class="empty-message">
            {{ t('customFields.empty') }}
          </p>
          <div
            v-for="(field, index) in cvData.personal.customFields"
            :key="field.id"
            class="block"
          >
            <div class="block-header">
              <h3>{{ t('customFields.field') }} #{{ index + 1 }}</h3>
              <button @click="removeCustomField(field.id)" class="btn-icon btn-danger" :title="t('customFields.remove')">✕</button>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('customFields.label') }}</label>
                <input v-model="field.label" type="text" :placeholder="t('customFields.labelPlaceholder')" />
              </div>
              <div class="form-group">
                <label>{{ t('customFields.value') }}</label>
                <input v-model="field.value" type="text" :placeholder="t('customFields.valuePlaceholder')" />
              </div>
            </div>
          </div>
        </div>

        <!-- PDF Settings -->
        <div class="section">
          <h2>{{ t('settings.title') }}</h2>
          <div class="form-group">
            <label>{{ t('settings.accentColor') }}</label>
            <div class="color-picker-wrapper">
              <input v-model="cvData.accentColor" type="color" class="color-picker" />
              <span class="color-value">{{ cvData.accentColor }}</span>
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

        <!-- Languages -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('languages.title') }}</h2>
            <button @click="addLanguage" class="btn btn-primary">{{ t('languages.add') }}</button>
          </div>
          <p v-if="cvData.languages.length === 0" class="empty-message">
            {{ t('languages.empty') }}
          </p>
          <div
            v-for="(lang, index) in cvData.languages"
            :key="lang.id"
            class="block"
          >
            <div class="block-header">
              <h3>{{ t('languages.language') }} #{{ index + 1 }}</h3>
              <button @click="removeLanguage(lang.id)" class="btn-icon btn-danger" :title="t('languages.remove')">✕</button>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('languages.name') }}</label>
                <DropdownAutocomplete
                  :model-value="lang.name"
                  :options="languageOptions"
                  :placeholder="t('languages.namePlaceholder')"
                  @update:model-value="lang.name = $event"
                />
              </div>
              <div class="form-group">
                <label>{{ t('languages.level') }}</label>
                <select v-model="lang.level" class="form-select">
                  <option value="A1">A1 – {{ t('languages.levelA1') }}</option>
                  <option value="A2">A2 – {{ t('languages.levelA2') }}</option>
                  <option value="B1">B1 – {{ t('languages.levelB1') }}</option>
                  <option value="B2">B2 – {{ t('languages.levelB2') }}</option>
                  <option value="C1">C1 – {{ t('languages.levelC1') }}</option>
                  <option value="C2">C2 – {{ t('languages.levelC2') }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Qualities -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('qualities.title') }}</h2>
            <label class="toggle-label">
              <input type="checkbox" v-model="cvData.qualitiesShowStrength" />
              <span>{{ t('qualities.showStrength') }}</span>
            </label>
          </div>
          <div class="form-group">
            <button @click="addQualityAttribute" class="btn btn-primary btn-small">{{ t('qualities.addAttribute') }}</button>
          </div>
          <div
            v-for="(attr, idx) in cvData.qualityAttributes"
            :key="attr.id"
            class="block"
          >
            <div class="block-header">
              <h3>{{ t('qualities.attribute') }} #{{ idx + 1 }}</h3>
              <button @click="removeQualityAttribute(attr.id)" class="btn-icon btn-danger">✕</button>
            </div>
            <div class="form-group">
              <label>{{ t('qualities.attributeName') }}</label>
              <input v-model="attr.name" type="text" :placeholder="t('qualities.attributeNamePlaceholder')" />
            </div>
            <div v-if="cvData.qualitiesShowStrength" class="form-group">
              <label>{{ t('qualities.attributeScore') }}: {{ attr.score }}</label>
              <input v-model.number="attr.score" type="range" min="1" max="5" step="1" class="slider" />
            </div>
          </div>
          <p v-if="cvData.qualityAttributes.length === 0" class="empty-message">
            {{ t('qualities.emptyAttributes') }}
          </p>
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

        <!-- Custom Sections -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('customSections.title') }}</h2>
            <button @click="addCustomSection" class="btn btn-primary">{{ t('customSections.add') }}</button>
          </div>
          <p v-if="cvData.customSections.length === 0" class="empty-message">
            {{ t('customSections.empty') }}
          </p>
          <div
            v-for="(section, index) in cvData.customSections"
            :key="section.id"
            class="block"
          >
            <div class="block-header">
              <h3>{{ t('customSections.section') }} #{{ index + 1 }}</h3>
              <button @click="removeCustomSection(section.id)" class="btn-icon btn-danger" :title="t('customSections.remove')">✕</button>
            </div>
            <div class="form-group">
              <label>{{ t('customSections.sectionTitle') }}</label>
              <input v-model="section.title" type="text" :placeholder="t('customSections.sectionTitlePlaceholder')" />
            </div>
            <div class="form-group">
              <label>{{ t('customSections.content') }}</label>
              <textarea
                v-model="section.content"
                :placeholder="t('customSections.contentPlaceholder')"
                rows="6"
                class="full-width"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- QR Code Settings -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('qrCode.title') }}</h2>
            <label class="toggle-label">
              <input type="checkbox" v-model="cvData.qrCode.enabled" />
              <span>{{ t('qrCode.enable') }}</span>
            </label>
          </div>
          <div v-if="cvData.qrCode.enabled">
            <div class="form-group">
              <button @click="addQRCode(cvData.personal.website || '')" class="btn btn-primary btn-small">
                {{ t('qrCode.add') }}
              </button>
            </div>
            <p v-if="cvData.qrCode.items.length === 0" class="empty-message">
              {{ t('qrCode.empty') }}
            </p>
            <div
              v-for="(q, idx) in cvData.qrCode.items"
              :key="q.id"
              class="block"
            >
              <div class="block-header">
                <h3>{{ t('qrCode.qrCode') }} #{{ idx + 1 }}</h3>
                <button @click="removeQRCode(q.id)" class="btn-icon btn-danger" :title="t('qrCode.remove')">✕</button>
              </div>
              <div class="form-group">
                <label>{{ t('qrCode.url') }}</label>
                <input v-model="q.url" type="url" :placeholder="t('qrCode.urlPlaceholder')" />
              </div>
              <div class="form-group">
                <label>{{ t('qrCode.caption') }}</label>
                <input v-model="q.caption" type="text" :placeholder="t('qrCode.captionPlaceholder')" />
              </div>
              <div class="form-group">
                <label>{{ t('qrCode.decoration') }}</label>
                <div class="photo-upload-btn-wrapper">
                  <input
                    :id="'qr-dec-input-' + q.id"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="(e) => handleQRDecorationUpload(e, q)"
                  />
                  <button @click="triggerQRFileInput(q.id)" class="btn btn-secondary btn-small">
                    {{ q.decoration ? t('qrCode.changeDecoration') : t('qrCode.uploadDecoration') }}
                  </button>
                  <button v-if="q.decoration" @click="q.decoration = ''" class="btn btn-danger btn-small">
                    {{ t('qrCode.removeDecoration') }}
                  </button>
                </div>
                <img v-if="q.decoration" :src="q.decoration" class="decoration-preview" alt="QR decoration" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Settings -->
        <div class="section">
          <div class="section-header">
            <h2>{{ t('footer.title') }}</h2>
            <label class="toggle-label">
              <input type="checkbox" v-model="cvData.footer.enabled" />
              <span>{{ t('footer.enable') }}</span>
            </label>
          </div>
          <div v-if="cvData.footer.enabled">
            <div class="form-group">
              <label>{{ t('footer.text') }}</label>
              <textarea
                v-model="cvData.footer.text"
                :placeholder="t('footer.placeholder')"
                rows="3"
                class="full-width"
              ></textarea>
            </div>
          </div>
        </div>
      </template>

      <template #preview>
        <CVPreview />
      </template>
    </SplitPane>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguages } from '~/data/languages'
import { useLayoutState } from '~/composables/useLayoutState'
import { useTheme } from '~/composables/useTheme'

const { t, locale } = useI18n()
const layoutState = useLayoutState()
const { isDark, toggleTheme } = useTheme()

// Cycle through layout modes: split → preview → form → split
function cycleLayoutMode() {
  const modes = ['split', 'preview', 'form'] as const
  const current = layoutState.mode.value
  const nextIndex = (modes.indexOf(current) + 1) % modes.length
  layoutState.setMode(modes[nextIndex])
}

const layoutIcon = computed(() => {
  switch (layoutState.mode.value) {
    case 'preview': return '&#x25A3;'  // ▣
    case 'form': return '&#x2630;'      // ☰
    default: return '&#x229E;'           // ⊞
  }
})

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
  addLanguage,
  removeLanguage,
  addQualityAttribute,
  removeQualityAttribute,
  addCustomSection,
  removeCustomSection,
  addCustomField,
  removeCustomField,
  addQRCode,
  removeQRCode,
} = useCVData()

const languageOptions = computed(() => useLanguages(locale.value))

// Load data from localStorage on mount
onMounted(() => {
  loadFromStorage()
  layoutState.loadFromStorage()
})

const triggerQRFileInput = (itemId: string) => {
  document.getElementById('qr-dec-input-' + itemId)?.click()
}

const handleQRDecorationUpload = (event: Event, qrItem: { id: string; decoration: string }) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      qrItem.decoration = e.target?.result as string
    }
    reader.readAsDataURL(file)
    if (target) target.value = ''
  }
}
</script>

<style>
/* ── Theme CSS custom properties ── */
:root {
  --bg-primary: #f5f7fa;
  --bg-card: #ffffff;
  --bg-block: #f8f9fa;
  --bg-block-border: #e0e0e0;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --text-muted: #95a5a6;
  --border-color: #ddd;
  --border-light: #e0e0e0;
  --slider-bg: #e2e8f0;
  --preview-bg: #f1f5f9;
  --preview-border: #e2e8f0;
}

html.dark {
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --bg-block: #1e293b;
  --bg-block-border: #334155;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #334155;
  --border-light: #334155;
  --slider-bg: #334155;
  --preview-bg: #0f172a;
  --preview-border: #334155;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
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

.header-layout-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
  line-height: 1;
}

.header-layout-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.layout-mode-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  line-height: 1;
}

.header-theme-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.theme-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 1200px;
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
  background: var(--bg-card);
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
  color: var(--text-primary);
  margin: 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

textarea.full-width {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
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
  border: 1px solid var(--border-color);
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
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.color-picker:hover {
  border-color: #3498db;
}

.color-value {
  font-family: monospace;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 600;
}

.empty-message {
  color: var(--text-muted);
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* ── Block (reusable for language, custom section, etc.) ── */
.block {
  background: var(--bg-block);
  padding: 15px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
  margin-bottom: 15px;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.block-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

/* ── Buttons ── */
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

.btn-icon {
  padding: 5px 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-icon.btn-danger:hover {
  background: #e74c3c;
  border-color: #e74c3c;
}

/* ── Form select ── */
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

/* ── Toggle label ── */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* ── Range slider ── */
.slider {
  width: 100%;
  height: 8px;
  appearance: none;
  background: var(--slider-bg);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* ── QR decoration preview ── */
.decoration-preview {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-top: 8px;
}

/* ── Input/textarea dark mode overrides ── */
html.dark input,
html.dark textarea,
html.dark select {
  background: #253548;
  color: #e2e8f0;
  border-color: #334155;
}

html.dark input:focus,
html.dark textarea:focus,
html.dark select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

html.dark input::placeholder,
html.dark textarea::placeholder {
  color: #64748b;
}

html.dark .language-select option {
  background: #1e293b;
  color: #e2e8f0;
}

/* ── Component-level dark overrides ── */

/* SplitPane divider */
html.dark .split-handle {
  background: #334155 !important;
}
html.dark .split-handle:hover {
  background: #3b82f6 !important;
}
html.dark .split-handle::after {
  background: #64748b !important;
}

/* LayoutToggle */
html.dark .layout-toggle-btn {
  color: #94a3b8 !important;
}
html.dark .layout-toggle-btn.active {
  background: #253548 !important;
  border-color: #3b82f6 !important;
  color: #e2e8f0 !important;
}

/* DropdownAutocomplete */
html.dark .dropdown-panel {
  background: #1e293b !important;
  border-color: #334155 !important;
}
html.dark .dropdown-item {
  color: #e2e8f0 !important;
}
html.dark .dropdown-item:hover,
html.dark .dropdown-item.highlighted {
  background: #253548 !important;
}

/* PhotoCropper */
html.dark .cropper-label {
  color: #e2e8f0 !important;
}
html.dark .cropper-hint {
  color: #64748b !important;
}
html.dark .cropper-coords {
  color: #94a3b8 !important;
}

/* ExperienceBlock / EducationBlock */
html.dark .block-entry {
  background: #253548 !important;
  border-color: #334155 !important;
}
html.dark .block-entry h3,
html.dark .block-entry .entry-label {
  color: #e2e8f0 !important;
}
html.dark .block-entry .entry-meta {
  color: #94a3b8 !important;
}

/* PersonalInfoForm */
html.dark .photo-label {
  color: #e2e8f0 !important;
}
html.dark .photo-hint {
  color: #94a3b8 !important;
}

.photo-upload-btn-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
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

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
