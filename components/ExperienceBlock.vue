<template>
  <div class="block">
    <div class="block-header">
      <h3>{{ t('experience.title') }} #{{ index + 1 }}</h3>
      <div class="block-actions">
        <button 
          v-if="index > 0" 
          @click="$emit('moveUp')" 
          class="btn-icon"
          :title="t('experience.moveUp')"
        >
          ↑
        </button>
        <button 
          v-if="index < total - 1" 
          @click="$emit('moveDown')" 
          class="btn-icon"
          :title="t('experience.moveDown')"
        >
          ↓
        </button>
        <button 
          @click="$emit('remove')" 
          class="btn-icon btn-danger"
          :title="t('experience.remove')"
        >
          ✕
        </button>
      </div>
    </div>
    
    <div class="form-group">
      <label>{{ t('experience.jobTitle') }}</label>
      <input 
        v-model="experience.title" 
        type="text" 
        :placeholder="t('experience.jobTitlePlaceholder')"
      />
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>{{ t('experience.startDate') }}</label>
        <input 
          v-model="experience.startDate" 
          type="text" 
          placeholder="YYYY-MM"
          pattern="[0-9]{4}-[0-9]{2}"
        />
      </div>
      
      <div class="form-group">
        <label>{{ t('experience.endDate') }}</label>
        <input 
          v-model="experience.endDate" 
          type="text" 
          placeholder="YYYY-MM"
          pattern="[0-9]{4}-[0-9]{2}"
        />
      </div>
    </div>
    
    <div class="form-group">
      <label>{{ t('experience.location') }}</label>
      <input 
        v-model="experience.location" 
        type="text" 
        :placeholder="t('experience.locationPlaceholder')"
      />
    </div>
    
    <div class="form-group">
      <label>{{ t('experience.description') }}</label>
      <textarea 
        v-model="experience.description" 
        :placeholder="t('experience.descriptionPlaceholder')"
        rows="5"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ExperienceBlock } from '~/types/cv'

interface Props {
  experience: ExperienceBlock
  index: number
  total: number
}

defineProps<Props>()
defineEmits<{
  remove: []
  moveUp: []
  moveDown: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.block {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.block-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
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

.btn-danger:hover {
  background: #e74c3c;
  border-color: #e74c3c;
}

.form-group {
  margin-bottom: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #34495e;
  font-size: 14px;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

textarea {
  resize: vertical;
}
</style>
