<template>
  <div class="section">
    <h2>{{ t('personal.title') }}</h2>
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
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { cvData } = useCVData()
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
</style>
