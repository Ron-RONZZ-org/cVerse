import { ref, computed, watch } from 'vue'

export type LayoutMode = 'split' | 'preview' | 'form'

const STORAGE_KEY = 'cv-layout'

export interface LayoutState {
  mode: LayoutMode
  splitRatio: number
  toggleExpanded: boolean
  isDragging: boolean
  leftFlex: number
  rightFlex: number
}

export function useLayoutState() {
  const mode = useState<LayoutMode>('layoutMode', () => 'split')
  const splitRatio = useState<number>('layoutSplitRatio', () => 0.6)
  const isDragging = ref(false)
  const toggleExpanded = ref(false)

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  const leftFlex = computed(() => {
    if (mode.value === 'form') return 1
    if (mode.value === 'preview') return 0
    return splitRatio.value
  })

  const rightFlex = computed(() => {
    if (mode.value === 'form') return 0
    if (mode.value === 'preview') return 1
    return 1 - splitRatio.value
  })

  function setMode(newMode: LayoutMode) {
    mode.value = newMode
    toggleExpanded.value = false
  }

  function setSplitRatio(value: number) {
    splitRatio.value = clamp(value, 0.2, 0.8)
  }

  function toggleMenu() {
    toggleExpanded.value = !toggleExpanded.value
  }

  function closeMenu() {
    toggleExpanded.value = false
  }

  // Persistence
  function loadFromStorage() {
    if (process.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.mode && ['split', 'preview', 'form'].includes(parsed.mode)) {
            mode.value = parsed.mode
          }
          if (typeof parsed.splitRatio === 'number') {
            splitRatio.value = clamp(parsed.splitRatio, 0.2, 0.8)
          }
        } catch {
          // ignore corrupt data
        }
      }
    }
  }

  function saveToStorage() {
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: mode.value,
        splitRatio: splitRatio.value
      }))
    }
  }

  // Auto-save on changes
  watch([mode, splitRatio], () => {
    saveToStorage()
  })

  return {
    mode,
    splitRatio,
    isDragging,
    toggleExpanded,
    leftFlex,
    rightFlex,
    setMode,
    setSplitRatio,
    toggleMenu,
    closeMenu,
    loadFromStorage
  }
}
