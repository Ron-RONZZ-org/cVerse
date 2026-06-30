/**
 * useTheme — reactive dark/light theme with localStorage persistence.
 *
 * - Toggles `html.dark` class for global CSS variable switching.
 * - Defaults to system preference via `prefers-color-scheme`.
 * - SSR-safe (no-op on server).
 */
import { computed, watchEffect } from 'vue'

const STORAGE_KEY = 'cverse-theme'

export function useTheme() {
  const theme = useState<'light' | 'dark'>('cv-theme', () => {
    if (import.meta.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(mode: 'light' | 'dark') {
    theme.value = mode
  }

  // Apply the class + persist on every change
  watchEffect(() => {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', isDark.value)
      localStorage.setItem(STORAGE_KEY, theme.value)
    }
  })

  return { theme, isDark, toggleTheme, setTheme }
}
