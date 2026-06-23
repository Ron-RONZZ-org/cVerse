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
          @load="onIframeLoad"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import { renderCV } from '~/utils/cvTemplate'
import { printCV } from '~/utils/printCV'
import { useCVData } from '~/composables/useCVData'

const { t, locale } = useI18n()
const { cvData } = useCVData()

const collapsed = ref(false)
const previewIframe = ref<HTMLIFrameElement | null>(null)
const previewContainer = ref<HTMLDivElement | null>(null)
const renderKey = ref(0)
const qrReplaced = ref(false)

const cvHtml = computed(() => {
  // Force re-computation when renderKey changes
  void renderKey.value
  qrReplaced.value = false
  return renderCV(cvData.value, locale.value)
})

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
      console.error(`Failed to generate QR code for preview:`, e)
    }
  }
  qrReplaced.value = true
}

// Watch for iframe content changes (a new srcdoc will reload the iframe)
watch(cvHtml, async () => {
  await nextTick()
  // Wait for iframe to load its new srcdoc
  setTimeout(async () => {
    await replaceQRPlaceholders()
  }, 500)
})

// Also try replacing when iframe loads
function onIframeLoad() {
  replaceQRPlaceholders()
}

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
