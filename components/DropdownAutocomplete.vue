<template>
  <div class="autocomplete" ref="containerRef">
    <input
      ref="inputRef"
      :value="modelValue"
      @input="onInput"
      @focus="isOpen = true"
      @blur="onBlur"
      @keydown="onKeydown"
      :placeholder="placeholder"
      type="text"
      autocomplete="off"
      class="autocomplete-input"
    />
    <ul v-if="isOpen && filteredOptions.length > 0" class="autocomplete-menu">
      <li
        v-for="(opt, i) in filteredOptions"
        :key="opt.code"
        :class="{ highlighted: i === highlightIndex }"
        @mousedown.prevent="select(opt)"
        @mouseenter="highlightIndex = i"
        class="autocomplete-item"
      >
        {{ opt.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Country, Language } from '~/types/cv'

type Option = Country | Language

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isOpen = ref(false)
const highlightIndex = ref(-1)
const filterText = ref('')

const filteredOptions = computed(() => {
  if (!filterText.value) return []
  const q = filterText.value.toLowerCase()
  const matches = props.options.filter(o => o.name.toLowerCase().includes(q))
  return matches.slice(0, 50) // limit for performance
})

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  filterText.value = val
  emit('update:modelValue', val)
  isOpen.value = true
  highlightIndex.value = -1
}

function onBlur() {
  // Delay to allow click on menu items
  setTimeout(() => {
    isOpen.value = false
    highlightIndex.value = -1
  }, 150)
}

function select(opt: Option) {
  emit('update:modelValue', opt.name)
  filterText.value = ''
  isOpen.value = false
  highlightIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value || filteredOptions.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(highlightIndex.value + 1, filteredOptions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightIndex.value >= 0 && filteredOptions.value[highlightIndex.value]) {
      select(filteredOptions.value[highlightIndex.value])
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false
    highlightIndex.value = -1
  }
}
</script>

<style scoped>
.autocomplete {
  position: relative;
  width: 100%;
}

.autocomplete-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.autocomplete-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.autocomplete-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 250px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0;
  margin: 0;
}

.autocomplete-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #2c3e50;
}

.autocomplete-item:hover,
.autocomplete-item.highlighted {
  background: #3498db;
  color: white;
}
</style>
