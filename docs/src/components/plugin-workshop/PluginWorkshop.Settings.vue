<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'
import type { CSharpType, SettingType } from './PluginWorkshop.Store'

const { 
  pluginData, 
  addSetting, 
  removeSetting, 
  updateSettingType, 
  validateSettingValue,
  reorderSettings
} = usePluginWorkshop()

const validationResults = ref<Record<string, { isValid: boolean; isDuplicate: boolean; hasInvalidValue: boolean }>>({})
let validationTimeout: ReturnType<typeof setTimeout> | null = null

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const availableTypes: { value: CSharpType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'int', label: 'int' },
  { value: 'float', label: 'float' },
  { value: 'double', label: 'double' },
  { value: 'bool', label: 'bool' },
  { value: 'decimal', label: 'decimal' },
  { value: 'byte', label: 'byte' },
  { value: 'short', label: 'short' },
  { value: 'long', label: 'long' },
  { value: 'uint', label: 'uint' },
  { value: 'ushort', label: 'ushort' },
  { value: 'ulong', label: 'ulong' },
  { value: 'char', label: 'char' }
]

const getInputType = (type: CSharpType): string => {
  switch (type) {
    case 'int':
    case 'float':
    case 'double':
    case 'decimal':
    case 'byte':
    case 'short':
    case 'long':
    case 'uint':
    case 'ushort':
    case 'ulong':
      return 'number'
    case 'bool':
      return 'checkbox'
    default:
      return 'text'
  }
}

const getPlaceholder = (type: CSharpType): string => {
  switch (type) {
    case 'string': return 'Ex: Hello World or \\u0041'
    case 'int': return 'Ex: 42'
    case 'float': return 'Ex: 3.14'
    case 'double': return 'Ex: 3.14159'
    case 'bool': return 'Ex: true'
    case 'decimal': return 'Ex: 99.99'
    case 'byte': return 'Ex: 255'
    case 'short': return 'Ex: 1000'
    case 'long': return 'Ex: 1000'
    case 'uint': return 'Ex: 100'
    case 'ushort': return 'Ex: 1000'
    case 'ulong': return 'Ex: 1000'
    case 'char': return 'Ex: A or \\n'
    default: return ''
  }
}

const runValidation = () => {
  const results: Record<string, { isValid: boolean; isDuplicate: boolean; hasInvalidValue: boolean }> = {}
  
  pluginData.value.settings.forEach((setting) => {
    const nameExists = pluginData.value.settings.filter((s: SettingType) => s.name === setting.name).length > 1
    const hasInvalidValue = setting.defaultValue !== '' && !validateSettingValue(setting.type, setting.defaultValue)
    const isValid = setting.name.trim() !== '' && !nameExists && !hasInvalidValue
    
    results[setting.id] = {
      isValid,
      isDuplicate: nameExists,
      hasInvalidValue
    }
  })
  
  validationResults.value = results
}

watchEffect(() => {
  if (validationTimeout) {
    clearTimeout(validationTimeout)
  }
  
  validationTimeout = setTimeout(runValidation, 300)
})

const isValidSetting = (setting: SettingType): boolean => {
  const result = validationResults.value[setting.id]
  return result ? result.isValid : true
}

const isDuplicateName = (setting: SettingType): boolean => {
  const result = validationResults.value[setting.id]
  return result ? result.isDuplicate : false
}

const hasInvalidValue = (setting: SettingType): boolean => {
  const result = validationResults.value[setting.id]
  return result ? result.hasInvalidValue : false
}

const handleTypeChange = (setting: SettingType, newType: CSharpType) => {
  updateSettingType(setting.id, newType)
}

const handleBooleanChange = (setting: SettingType, checked: boolean) => {
  setting.defaultValue = checked.toString()
}

const handleRemoveSetting = (setting: SettingType) => {
  const displayName = setting.description || setting.name || 'this setting'
  
  if (confirm(`Are you sure you want to delete "${displayName}"?\n\nThis action cannot be undone. This will also remove the setting from the plugin.`)) {
    removeSetting(setting.id)
  }
}

const handleDragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragOverIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}

const handleDrop = (event: DragEvent, dropIndex: number) => {
  event.preventDefault()
  
  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    reorderSettings(draggedIndex.value, dropIndex)
  }
  
  draggedIndex.value = null
  dragOverIndex.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="space-y-4">
    <button
      @click="addSetting"
      class="bg-slate-800/50 px-4 py-2 text-md text-slate-300 hover:bg-slate-800/70 transition-colors"
    >
      Add Setting
    </button>

    <div v-if="pluginData.settings.length === 0" class="text-center py-8 rounded-lg bg-slate-800/50">
      <div class="text-sm text-slate-500">
        <p>No settings configured yet</p>
        <p>Click "Add Setting" to create your first plugin setting</p>
      </div>
    </div>

    <div
      v-for="(setting, index) in pluginData.settings"
      :key="setting.id"
      class="group relative rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all duration-200"
      :class="{ 
        'border-red-500': !isValidSetting(setting),
        'border-blue-500 bg-slate-800/70': dragOverIndex === index,
        'opacity-50': draggedIndex === index
      }"
      @dragover="handleDragOver($event, index)"
      @dragleave="handleDragLeave"
      @drop="handleDrop($event, index)"
    >
      <div 
        class="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        draggable="true"
        @dragstart="handleDragStart($event, index)"
        @dragend="handleDragEnd"
        @mousedown="$event.stopPropagation()"
      >
        <svg class="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
        </svg>
      </div>

      <div class="grid grid-cols-12 gap-4 items-start ml-6">
        <div class="col-span-3">
          <label class="r-settings-input-label">Property Name</label>
          <input
            v-model="setting.name"
            type="text"
            placeholder="MySetting"
            class="r-settings-custom-input"
            :class="{ '!border-red-500 focus:!border-red-500': setting.name.trim() === '' || isDuplicateName(setting) }"
          />
        </div>

        <div class="col-span-2">
          <label class="r-settings-input-label">Type</label>
          <select
            :value="setting.type"
            @change="handleTypeChange(setting, ($event.target as HTMLSelectElement).value as CSharpType)"
            class="r-settings-custom-input"
          >
            <option v-for="type in availableTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="col-span-3">
          <label class="r-settings-input-label">Display Name <span class="text-slate-500">(optional)</span></label>
          <input
            v-model="setting.description"
            type="text"
            placeholder="Friendly display name"
            class="r-settings-custom-input"
          />
        </div>

        <div class="col-span-3">
          <label class="r-settings-input-label">Default Value</label>
          <div v-if="setting.type === 'bool'" class="flex items-center pt-2">
            <input
              :checked="setting.defaultValue === 'true'"
              @change="handleBooleanChange(setting, ($event.target as HTMLInputElement).checked)"
              type="checkbox"
              class="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              style="background-color: #1a1a1a;"
            />
            <span class="ml-2 text-sm text-slate-300">{{ setting.defaultValue === 'true' ? 'true' : 'false' }}</span>
          </div>
          <input
            v-else
            v-model="setting.defaultValue"
            :type="getInputType(setting.type)"
            :placeholder="getPlaceholder(setting.type)"
            class="r-settings-custom-input"
            :class="{ '!border-red-500 focus:!border-red-500': setting.defaultValue !== '' && !validateSettingValue(setting.type, setting.defaultValue) }"
          />
        </div>

        <div class="col-span-1 flex justify-end">
          <button
            @click="handleRemoveSetting(setting)"
            class="mt-6 rounded-md p-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            title="Remove setting"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="!isValidSetting(setting)" class="mt-2 text-sm text-red-400">
        <span v-if="setting.name.trim() === ''">Property name is required</span>
        <span v-else-if="isDuplicateName(setting)">Property name must be unique</span>
        <span v-else-if="hasInvalidValue(setting)">
          Invalid {{ setting.type }} value
        </span>
      </div>
    </div>

    <div v-if="pluginData.settings.length > 0" class="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
      <h4 class="text-sm font-medium text-slate-300 mb-2">Summary</h4>
      <div class="text-sm text-slate-400">
        <p>{{ pluginData.settings.length }} setting(s) configured</p>
        <p>{{ pluginData.settings.filter(isValidSetting).length }} valid, {{ pluginData.settings.filter(s => !isValidSetting(s)).length }} invalid</p>
      </div>
    </div>
  </div>
</template>

<style>
.r-settings-input-group {
  display: flex;
  flex-direction: column;
}

.r-settings-input-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.r-settings-custom-input {
  background-color: #1a1a1a;
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease-in-out;
  width: 100%;
}

.r-settings-custom-input:focus {
  border-color: #888;
}
</style>