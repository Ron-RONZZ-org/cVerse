<template>
  <div class="preview-panel" :class="{ collapsed }">
    <div class="preview-header" @click="collapsed = !collapsed">
      <span class="preview-title">{{ t('preview.title') }}</span>
      <span class="preview-toggle">{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-show="!collapsed" class="preview-body">
      <div class="preview-toolbar">
        <button @click="handleExportJSON" class="btn btn-secondary btn-sm">
          {{ t('app.save') }}
        </button>
        <button @click="handleImportJSON" class="btn btn-secondary btn-sm">
          {{ t('app.load') }}
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileSelect"
        />
        <button @click="handleClear" class="btn btn-danger btn-sm">
          {{ t('app.clear') }}
        </button>
        <button @click="handlePrint" class="btn btn-primary btn-sm">
          {{ t('app.export') }}
        </button>
        <div class="toolbar-spacer"></div>
        <button @click="refreshPreview" class="btn btn-secondary btn-sm">
          {{ t('preview.refresh') }}
        </button>
        <label class="toggle-label auto-refresh-label">
          <input type="checkbox" v-model="autoRefresh" />
          <span>{{ t('preview.autoRefresh') }}</span>
        </label>
      </div>
      <div ref="previewContainer" class="preview-container">
        <iframe
          ref="previewIframe"
          class="preview-iframe"
          :srcdoc="cvHtml"
          title="CV Preview"
          @load="onIframeLoad"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import { renderCV } from '~/utils/cvTemplate'
import { printCV } from '~/utils/printCV'
import { useCVData } from '~/composables/useCVData'

const { t, locale } = useI18n()
const { cvData, clearData, exportToJSON, importFromJSON } = useCVData()

const collapsed = ref(false)
const previewIframe = ref<HTMLIFrameElement | null>(null)
const previewContainer = ref<HTMLDivElement | null>(null)
const qrReplaced = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Auto-refresh toggle (default OFF)
const autoRefresh = ref(false)

// Snapshot for manual refresh mode
const renderKey = ref(0)
const snapshotData = ref(structuredClone(toRaw(cvData.value)))
const snapshotLocale = ref(locale.value)

// The HTML used in the iframe
const cvHtml = computed(() => {
  void renderKey.value
  qrReplaced.value = false
  if (autoRefresh.value) {
    // Live mode: recompute on every cvData / locale change
    return renderCV(cvData.value, locale.value)
  }
  // Manual mode: only recompute when renderKey changes (snapshot taken)
  return renderCV(snapshotData.value, snapshotLocale.value)
})

// Take initial snapshot on mount
onMounted(() => {
  snapshotData.value = structuredClone(toRaw(cvData.value))
  snapshotLocale.value = locale.value
})

// When turning off auto-refresh, capture current live state as snapshot
watch(autoRefresh, (newVal) => {
  if (!newVal) {
    snapshotData.value = structuredClone(toRaw(cvData.value))
    snapshotLocale.value = locale.value
    renderKey.value++
  }
})

// In auto-refresh mode, the watch on cvHtml handles QR replacement
watch(cvHtml, async () => {
  await nextTick()
  setTimeout(async () => {
    await replaceQRPlaceholders()
  }, 500)
})

// Manual refresh: capture current data/locale and bump render key
function refreshPreview() {
  snapshotData.value = structuredClone(toRaw(cvData.value))
  snapshotLocale.value = locale.value
  renderKey.value++
}

// After the iframe loads, replace QR placeholders with real QR SVGs
async function replaceQRPlaceholders() {
  const iframe = previewIframe.value
  if (!iframe || !iframe.contentDocument) return

  const svgPlaceholders = iframe.contentDocument.querySelectorAll('[id^="qr-svg-"]')
  if (svgPlaceholders.length === 0) return

  for (const placeholder of svgPlaceholders) {
    const id = placeholder.id
    const itemId = id.replace('qr-svg-', '')
    const item = cvData.value.qrCode.items.find(q => q.id === itemId)
    if (!item || !item.url) continue

    try {
      const qrSvg = await QRCode.toString(item.url, {
        type: 'svg',
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      })
      const svgMatch = qrSvg.match(/<svg[\s\S]*?<\/svg>/)
      if (svgMatch) {
        const realSvg = svgMatch[0].replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')
        placeholder.outerHTML = realSvg
      }
    } catch (e) {
      console.error('Failed to generate QR code for preview:', e)
    }
  }
  qrReplaced.value = true
}

function onIframeLoad() {
  replaceQRPlaceholders()
}

// ── Export / Import ──

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
      // Update snapshot so manual mode shows the imported data
      snapshotData.value = structuredClone(toRaw(cvData.value))
      snapshotLocale.value = locale.value
      renderKey.value++
    } catch {
      alert("Error loading file. Please make sure it's a valid JSON file.")
    }
    if (target) target.value = ''
  }
}

const handleClear = () => {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    clearData()
    snapshotData.value = structuredClone(toRaw(cvData.value))
    snapshotLocale.value = locale.value
    renderKey.value++
  }
}

const handlePrint = () => {
  if (!cvData.value.personal.name || !cvData.value.personal.email) {
    alert('Please fill in at least Name and Email before exporting.')
    return
  }
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
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-spacer {
  flex: 1;
  min-width: 8px;
}

.auto-refresh-label {
  font-size: 13px;
  color: #475569;
  user-select: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.auto-refresh-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
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
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
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

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}
</style>
