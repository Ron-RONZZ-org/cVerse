<template>
  <div class="section">
    <h2>{{ t('personal.title') }}</h2>
    
    <!-- Photo Upload -->
    <div class="form-group">
      <label>{{ t('personal.photo') }}</label>
      <div class="photo-upload-container">
        <div v-if="cvData.personal.photo" class="photo-preview">
          <img :src="cvData.personal.photo" alt="Profile photo" />
          <button @click="removePhoto" class="btn btn-danger btn-small">
            {{ t('personal.removePhoto') }}
          </button>
        </div>
        <div v-else class="photo-upload-btn-wrapper">
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            style="display: none" 
            @change="handleFileSelect"
          />
          <button @click="triggerFileInput" class="btn btn-primary">
            {{ t('personal.uploadPhoto') }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="required">{{ t('personal.name') }}</label>
      <input 
        v-model="cvData.personal.name" 
        type="text" 
        :placeholder="t('personal.namePlaceholder')"
        required
      />
    </div>
    
    <div class="form-group">
      <label class="required">{{ t('personal.email') }}</label>
      <input 
        v-model="cvData.personal.email" 
        type="email" 
        :placeholder="t('personal.emailPlaceholder')"
        required
      />
    </div>
    
    <div class="form-group">
      <label>{{ t('personal.location') }}</label>
      <input 
        v-model="cvData.personal.location" 
        type="text" 
        :placeholder="t('personal.locationPlaceholder')"
      />
    </div>
    
    <div class="form-group">
      <label>{{ t('personal.phone') }}</label>
      <input 
        v-model="cvData.personal.phone" 
        type="tel" 
        :placeholder="t('personal.phonePlaceholder')"
      />
    </div>
    
    <div class="form-group">
      <label>{{ t('personal.website') }}</label>
      <input 
        v-model="cvData.personal.website" 
        type="url" 
        :placeholder="t('personal.websitePlaceholder')"
      />
    </div>
    
    <div class="form-group">
      <label>{{ t('personal.linkedin') }}</label>
      <input 
        v-model="cvData.personal.linkedin" 
        type="url" 
        :placeholder="t('personal.linkedinPlaceholder')"
      />
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>{{ t('personal.age') }}</label>
        <input 
          v-model="cvData.personal.age" 
          type="text" 
          :placeholder="t('personal.agePlaceholder')"
        />
      </div>
      
      <div class="form-group">
        <label>{{ t('personal.nationality') }}</label>
        <input 
          v-model="cvData.personal.nationality" 
          type="text" 
          :placeholder="t('personal.nationalityPlaceholder')"
        />
      </div>
    </div>
    
    <PhotoCropper 
      :show="showCropper" 
      :image-url="tempImageUrl" 
      @crop="handleCrop"
      @close="closeCropper"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PhotoCropper from './PhotoCropper.vue'

const { t } = useI18n()
const { cvData } = useCVData()

const fileInput = ref<HTMLInputElement | null>(null)
const showCropper = ref(false)
const tempImageUrl = ref('')

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      tempImageUrl.value = e.target?.result as string
      showCropper.value = true
    }
    reader.readAsDataURL(file)
    
    // Reset input
    if (target) target.value = ''
  }
}

const handleCrop = (croppedImage: string) => {
  cvData.value.personal.photo = croppedImage
  showCropper.value = false
  tempImageUrl.value = ''
}

const closeCropper = () => {
  showCropper.value = false
  tempImageUrl.value = ''
}

const removePhoto = () => {
  if (confirm(t('personal.removePhoto') + '?')) {
    cvData.value.personal.photo = undefined
  }
}
</script>

<style scoped>
.section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #34495e;
}

label.required::after {
  content: ' *';
  color: #e74c3c;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.photo-upload-container {
  margin-top: 10px;
}

.photo-preview {
  display: flex;
  align-items: center;
  gap: 15px;
}

.photo-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-small {
  padding: 8px 15px;
  font-size: 13px;
}
</style>
