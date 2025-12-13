<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ t('personal.cropPhoto') }}</h3>
        <button class="close-btn" @click="handleCancel">&times;</button>
      </div>
      
      <div class="crop-container">
        <div class="canvas-wrapper">
          <canvas ref="canvas" @mousedown="startDrag" @mousemove="drag" @mouseup="endDrag" @mouseleave="endDrag"></canvas>
        </div>
        <div class="crop-instructions">
          {{ t('personal.cropInstructions') }}
        </div>
      </div>
      
      <div class="modal-actions">
        <button @click="handleCancel" class="btn btn-secondary">{{ t('app.cancel') }}</button>
        <button @click="handleCrop" class="btn btn-primary">{{ t('app.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  show: boolean
  imageUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'crop', data: string): void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const image = ref<HTMLImageElement | null>(null)
const cropBox = ref({ x: 50, y: 50, size: 200 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Load and draw image when modal opens
watch(() => props.show, (newShow) => {
  if (newShow && props.imageUrl) {
    nextTick(() => {
      loadImage()
    })
  }
})

const loadImage = () => {
  const img = new Image()
  img.onload = () => {
    image.value = img
    initCanvas()
  }
  img.src = props.imageUrl
}

const initCanvas = () => {
  if (!canvas.value || !image.value) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  // Set canvas size
  const maxSize = 500
  let width = image.value.width
  let height = image.value.height
  
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height)
    width *= ratio
    height *= ratio
  }
  
  canvas.value.width = width
  canvas.value.height = height
  
  // Initialize crop box in center
  const cropSize = Math.min(width, height) * 0.6
  cropBox.value = {
    x: (width - cropSize) / 2,
    y: (height - cropSize) / 2,
    size: cropSize
  }
  
  drawCanvas()
}

const drawCanvas = () => {
  if (!canvas.value || !image.value) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // Draw image
  ctx.drawImage(image.value, 0, 0, canvas.value.width, canvas.value.height)
  
  // Draw overlay (darken outside crop area)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  
  // Clear crop area
  ctx.clearRect(cropBox.value.x, cropBox.value.y, cropBox.value.size, cropBox.value.size)
  ctx.drawImage(
    image.value,
    (cropBox.value.x / canvas.value.width) * image.value.width,
    (cropBox.value.y / canvas.value.height) * image.value.height,
    (cropBox.value.size / canvas.value.width) * image.value.width,
    (cropBox.value.size / canvas.value.height) * image.value.height,
    cropBox.value.x,
    cropBox.value.y,
    cropBox.value.size,
    cropBox.value.size
  )
  
  // Draw crop box border
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 2
  ctx.strokeRect(cropBox.value.x, cropBox.value.y, cropBox.value.size, cropBox.value.size)
  
  // Draw corner handles
  const handleSize = 10
  ctx.fillStyle = '#3498db'
  ctx.fillRect(cropBox.value.x - handleSize / 2, cropBox.value.y - handleSize / 2, handleSize, handleSize)
  ctx.fillRect(cropBox.value.x + cropBox.value.size - handleSize / 2, cropBox.value.y - handleSize / 2, handleSize, handleSize)
  ctx.fillRect(cropBox.value.x - handleSize / 2, cropBox.value.y + cropBox.value.size - handleSize / 2, handleSize, handleSize)
  ctx.fillRect(cropBox.value.x + cropBox.value.size - handleSize / 2, cropBox.value.y + cropBox.value.size - handleSize / 2, handleSize, handleSize)
}

const startDrag = (e: MouseEvent) => {
  if (!canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Check if click is inside crop box
  if (
    x >= cropBox.value.x &&
    x <= cropBox.value.x + cropBox.value.size &&
    y >= cropBox.value.y &&
    y <= cropBox.value.y + cropBox.value.size
  ) {
    isDragging.value = true
    dragOffset.value = {
      x: x - cropBox.value.x,
      y: y - cropBox.value.y
    }
  }
}

const drag = (e: MouseEvent) => {
  if (!isDragging.value || !canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left - dragOffset.value.x
  const y = e.clientY - rect.top - dragOffset.value.y
  
  // Constrain to canvas bounds
  cropBox.value.x = Math.max(0, Math.min(x, canvas.value.width - cropBox.value.size))
  cropBox.value.y = Math.max(0, Math.min(y, canvas.value.height - cropBox.value.size))
  
  drawCanvas()
}

const endDrag = () => {
  isDragging.value = false
}

const handleCrop = () => {
  if (!canvas.value || !image.value) return
  
  // Create a new canvas for the cropped image
  const cropCanvas = document.createElement('canvas')
  const size = 200 // Fixed square size for output
  cropCanvas.width = size
  cropCanvas.height = size
  
  const ctx = cropCanvas.getContext('2d')
  if (!ctx) return
  
  // Calculate source coordinates in original image
  const scaleX = image.value.width / canvas.value.width
  const scaleY = image.value.height / canvas.value.height
  
  const sx = cropBox.value.x * scaleX
  const sy = cropBox.value.y * scaleY
  const sWidth = cropBox.value.size * scaleX
  const sHeight = cropBox.value.size * scaleY
  
  // Draw cropped and resized image
  ctx.drawImage(image.value, sx, sy, sWidth, sHeight, 0, 0, size, size)
  
  // Convert to base64
  const croppedImage = cropCanvas.toDataURL('image/jpeg', 0.9)
  emit('crop', croppedImage)
}

const handleCancel = () => {
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #95a5a6;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #2c3e50;
}

.crop-container {
  padding: 20px;
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

canvas {
  max-width: 100%;
  border: 1px solid #ddd;
  cursor: move;
}

.crop-instructions {
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #ddd;
  justify-content: flex-end;
}
</style>
