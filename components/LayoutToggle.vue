<template>
  <div class="layout-toggle" ref="toggleRef">
    <!-- Trigger button (hamburger icon) -->
    <button
      class="toggle-trigger"
      :class="{ expanded: layout.toggleExpanded.value }"
      :title="t('layout.toggleMenu')"
      @click="layout.toggleMenu()"
      @keydown.escape="layout.closeMenu()"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="hamburger-icon">
        <rect y="2" width="16" height="2" rx="1" />
        <rect y="7" width="16" height="2" rx="1" />
        <rect y="12" width="16" height="2" rx="1" />
      </svg>
    </button>

    <!-- Overlay menu (horizontal) -->
    <Teleport to="body">
      <div v-if="layout.toggleExpanded.value" class="menu-backdrop" @click="layout.closeMenu()" />
      <div
        v-if="layout.toggleExpanded.value"
        class="menu-panel"
        :style="menuStyle"
      >
        <button
          v-for="item in modeItems"
          :key="item.mode"
          class="mode-btn"
          :class="{ active: layout.mode.value === item.mode }"
          @click="layout.setMode(item.mode)"
        >
          <span v-html="item.icon" class="mode-icon" />
          <span class="mode-label">{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLayoutState, type LayoutMode } from '~/composables/useLayoutState'

const { t } = useI18n()
const layout = useLayoutState()
const toggleRef = ref<HTMLElement | null>(null)

interface ModeItem {
  mode: LayoutMode
  icon: string
  label: string
}

const modeItems = computed<ModeItem[]>(() => [
  {
    mode: 'split',
    icon: '&#x229E;',  // ⊞ squared plus / split icon
    label: t('layout.modeSplit')
  },
  {
    mode: 'preview',
    icon: '&#x25A3;',  // ▣ squared square / fullscreen
    label: t('layout.modePreview')
  },
  {
    mode: 'form',
    icon: '&#x2630;',  // ☰ hamburger / form only
    label: t('layout.modeForm')
  }
])

// Position the menu panel below the trigger button
const menuStyle = computed(() => {
  if (!toggleRef.value) return {}
  const rect = toggleRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`
  }
})
</script>

<style scoped>
.layout-toggle {
  position: relative;
  display: inline-flex;
}

/* ── Trigger Button ── */

.toggle-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s;
  padding: 0;
}

.toggle-trigger:hover,
.toggle-trigger.expanded {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #334155;
}

.hamburger-icon {
  display: block;
}

/* ── Backdrop ── */

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: transparent;
}

/* ── Menu Panel ── */

.menu-panel {
  position: fixed;
  z-index: 1001;
  display: flex;
  gap: 2px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: inherit;
}

.mode-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.mode-btn.active {
  background: #3498db;
  color: white;
}

.mode-icon {
  font-size: 16px;
  line-height: 1;
}

.mode-label {
  line-height: 1;
}
</style>
