<template>
  <div class="preview-panel" :class="{ collapsed }">
    <div class="preview-header" @click="collapsed = !collapsed">
      <span class="preview-title">{{ t('preview.title') }}</span>
      <span class="preview-toggle">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-show="!collapsed" class="preview-body">
      <div class="preview-toolbar">
        <button @click="handlePrint" class="btn btn-primary">
          {{ t('app.export') }}
        </button>
        <button @click="refreshPreview" class="btn btn-secondary">
          {{ t('preview.refresh') }}
        </button>
      </div>
      <div ref="previewContainer" class="preview-container">
        <iframe
          ref="previewIframe"
          class="preview-iframe"
          :srcdoc="cvHtml"
          title="CV Preview"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { renderCV } from '~/utils/cvTemplate'
import { printCV } from '~/utils/printCV'
import { useCVData } from '~/composables/useCVData'

const { t, locale } = useI18n()
const { cvData } = useCVData()

const collapsed = ref(false)
const previewIframe = ref<HTMLIFrameElement | null>(null)
const previewContainer = ref<HTMLDivElement | null>(null)
const renderKey = ref(0)

const cvHtml = computed(() => {
  // Force re-computation when renderKey changes
  void renderKey.value
  return renderCV(cvData.value, locale.value)
})

const refreshPreview = () => {
  renderKey.value++
}

const handlePrint = () => {
  printCV(cvData.value, locale.value)
}
</script>

<style scoped>
.preview-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.preview-panel.collapsed .preview-body {
  display: none;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  user-select: none;
}

.preview-title {
  font-weight: 600;
  font-size: 16px;
}

.preview-toggle {
  font-size: 12px;
}

.preview-body {
  padding: 16px;
}

.preview-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.preview-container {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  background: #f1f5f9;
}

.preview-iframe {
  width: 100%;
  height: 80vh;
  border: none;
  display: block;
  transform-origin: top center;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style>
