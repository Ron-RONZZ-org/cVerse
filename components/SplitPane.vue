<template>
  <div
    ref="containerRef"
    class="split-pane"
    :class="{
      'is-dragging': layout.isDragging.value,
      'mode-preview': layout.mode.value === 'preview',
      'mode-form': layout.mode.value === 'form',
      'mode-split': layout.mode.value === 'split'
    }"
    :style="gridStyle"
  >
    <!-- Left pane: form content -->
    <div class="left-pane" :class="{ 'pane-hidden': layout.mode.value === 'preview' }">
      <slot />
    </div>

    <!-- Resize handle (only in split mode) -->
    <div
      v-if="layout.mode.value === 'split'"
      class="resize-handle"
      @mousedown.prevent="onMouseDown"
      @touchstart.prevent="onTouchStart"
    >
      <div class="handle-dots" />
    </div>

    <!-- Right pane: preview -->
    <div class="right-pane" :class="{ 'pane-hidden': layout.mode.value === 'form' }">
      <slot name="preview" />
    </div>

    <!-- Drag overlay — captures mousemove/mouseup outside the handle -->
    <div
      v-if="layout.isDragging.value"
      class="drag-overlay"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLayoutState } from '~/composables/useLayoutState'

const layout = useLayoutState()

const containerRef = ref<HTMLElement | null>(null)
let startX = 0
let startRatio = 0
let rafId: number | null = null

// CSS Grid columns driven by layout state
const gridStyle = computed(() => {
  const left = layout.leftFlex.value
  const right = layout.rightFlex.value
  const handle = layout.mode.value === 'split' ? '8px' : '0px'
  return {
    gridTemplateColumns:
      layout.mode.value === 'form' ? '1fr' :
      layout.mode.value === 'preview' ? '1fr' :
      `${left}fr ${handle} ${right}fr`
  }
})

function getClientX(e: MouseEvent | TouchEvent): number {
  return 'touches' in e ? e.touches[0].clientX : e.clientX
}

function onMouseDown(e: MouseEvent) {
  startDrag(e.clientX)
}

function onTouchStart(e: TouchEvent) {
  startDrag(e.touches[0].clientX)
}

function startDrag(clientX: number) {
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  startX = clientX
  startRatio = layout.splitRatio.value
  layout.isDragging.value = true
}

function onMouseMove(e: MouseEvent) {
  doDrag(e.clientX)
}

function onTouchMove(e: TouchEvent) {
  doDrag(e.touches[0].clientX)
}

function doDrag(clientX: number) {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  rafId = requestAnimationFrame(() => {
    const container = containerRef.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    const deltaX = clientX - startX
    const ratioDelta = deltaX / rect.width
    // Resize the container style immediately for smooth visual feedback,
    // but only commit to the persistent splitRatio on mouseup
    const tempRatio = Math.min(Math.max(startRatio + ratioDelta, 0.2), 0.8)
    layout.setSplitRatio(tempRatio)
    rafId = null
  })
}

function onMouseUp() {
  endDrag()
}

function onTouchEnd() {
  endDrag()
}

function endDrag() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  layout.isDragging.value = false
  // splitRatio is already committed via setSplitRatio during drag;
  // the watch in useLayoutState auto-saves to localStorage
}
</script>

<style scoped>
.split-pane {
  display: grid;
  gap: 0;
  align-items: start;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  user-select: none;
}

.split-pane.is-dragging {
  cursor: col-resize;
}

/* ── Panes ── */

.left-pane {
  min-width: 0;
  overflow-y: auto;
}

.right-pane {
  min-width: 0;
  position: sticky;
  top: 20px;
}

.pane-hidden {
  display: none;
}

/* ── Resize Handle ── */

.resize-handle {
  width: 8px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  position: relative;
  transition: background 0.15s;
  margin: 0 -2px;
  z-index: 10;
}

.resize-handle::before {
  content: '';
  position: absolute;
  inset: 0 -4px; /* wider hit area */
}

.resize-handle:hover,
.split-pane.is-dragging .resize-handle {
  background: #e2e8f0;
}

.handle-dots {
  width: 2px;
  height: 32px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: #cbd5e1;
  border-radius: 1px;
  box-shadow:
    0 -10px 0 #cbd5e1,
    0 10px 0 #cbd5e1;
  transition: background 0.15s;
}

.resize-handle:hover .handle-dots {
  background: #64748b;
  box-shadow:
    0 -10px 0 #64748b,
    0 10px 0 #64748b;
}

/* ── Drag Overlay ── */

.drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  cursor: col-resize;
}

/* ── Responsive ── */

@media (max-width: 1024px) {
  .split-pane {
    grid-template-columns: 1fr !important;
  }

  .resize-handle {
    display: none !important;
  }

  .left-pane,
  .right-pane {
    display: block !important;
    position: static !important;
  }

  .pane-hidden {
    display: none !important;
  }
}
</style>
