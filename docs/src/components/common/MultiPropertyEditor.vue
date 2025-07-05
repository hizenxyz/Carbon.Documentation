<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, watch, computed } from 'vue'
import { GripVertical, Trash2 } from 'lucide-vue-next'
import { VueDraggable } from 'vue-draggable-plus'

export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'checkbox' | 'textarea'
  placeholder?: string
  dynamicPlaceholder?: (item: unknown) => string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validator?: (value: unknown) => boolean
  colSpan?: number
}

export interface MultiPropertyConfig<T> {
  fields: FieldConfig[]
  createItem: () => T
  getDisplayName: (item: T) => string
  validateItem?: (item: T) => boolean
  duplicateCheck?: (item: T, items: T[]) => boolean
}

interface Props<T> {
  modelValue: T[]
  config: MultiPropertyConfig<T>
  addButtonText?: string
  emptyStateText?: string
  showSummary?: boolean
}

const props = defineProps<Props<T>>()
const emit = defineEmits<{
  'update:modelValue': [value: T[]]
}>()

const validationResults = ref<Record<string, { isValid: boolean; errors: string[] }>>({})
let validationTimeout: ReturnType<typeof setTimeout> | null = null

const items = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const addItem = () => {
  const newItem = props.config.createItem()
  items.value = [...items.value, newItem]
}

const removeItem = (index: number) => {
  const item = items.value[index]
  const displayName = props.config.getDisplayName(item)
  
  if (confirm(`Are you sure you want to delete "${displayName}"?\n\nThis action cannot be undone.`)) {
    const newItems = [...items.value]
    newItems.splice(index, 1)
    items.value = newItems
  }
}

const runValidation = () => {
  const results: Record<string, { isValid: boolean; errors: string[] }> = {}
  
  items.value.forEach((item, index) => {
    const errors: string[] = []
    
    props.config.fields.forEach(field => {
      if (field.required && (!item[field.key] || String(item[field.key]).trim() === '')) {
        errors.push(`${field.label} is required`)
      }
      
      if (field.validator && item[field.key] && !field.validator(item[field.key])) {
        errors.push(`Invalid ${field.label.toLowerCase()}`)
      }
    })
    
    if (props.config.duplicateCheck && props.config.duplicateCheck(item, items.value)) {
      errors.push('Duplicate entry detected')
    }
    
    if (props.config.validateItem && !props.config.validateItem(item)) {
      errors.push('Invalid item')
    }
    
    results[String(index)] = {
      isValid: errors.length === 0,
      errors
    }
  })
  
  validationResults.value = results
}

watch(
  () => items.value,
  () => {
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }
    
    validationTimeout = setTimeout(runValidation, 300)
  },
  { deep: true, immediate: true }
)

const isValidItem = (index: number): boolean => {
  const result = validationResults.value[String(index)]
  return result ? result.isValid : true
}

const getValidationErrors = (index: number): string[] => {
  const result = validationResults.value[String(index)]
  return result ? result.errors : []
}

const updateField = (index: number, fieldKey: string, value: unknown) => {
  const newItems = [...items.value]
  newItems[index] = { ...newItems[index], [fieldKey]: value }
  items.value = newItems
}

const getFieldPlaceholder = (field: FieldConfig, item: unknown): string => {
  return field.dynamicPlaceholder ? field.dynamicPlaceholder(item) : (field.placeholder || '')
}

const getColSpanClass = (field: FieldConfig): string => {
  const span = field.colSpan || 3
  switch (span) {
    case 1: return 'col-span-1'
    case 2: return 'col-span-2'
    case 3: return 'col-span-3'
    case 4: return 'col-span-4'
    case 5: return 'col-span-5'
    case 6: return 'col-span-6'
    case 7: return 'col-span-7'
    case 8: return 'col-span-8'
    case 9: return 'col-span-9'
    case 10: return 'col-span-10'
    case 11: return 'col-span-11'
    case 12: return 'col-span-12'
    default: return 'col-span-3'
  }
}
</script>

<template>
  <div class="space-y-4">
    <button
      @click="addItem"
      class="bg-slate-800/50 rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/70 transition-colors"
    >
      {{ addButtonText || 'Add Item' }}
    </button>

    <div v-if="items.length === 0" class="text-center py-8 rounded-lg bg-slate-800/50">
      <div class="text-sm text-slate-500">
        <p>{{ emptyStateText || 'No items configured yet' }}</p>
        <p>Click "{{ addButtonText || 'Add Item' }}" to create your first item</p>
      </div>
    </div>

    <VueDraggable
      v-model="items"
      :animation="150"
      ghostClass="ghost"
      handle=".drag-handle"
      class="space-y-4"
    >
      <div
        v-for="(item, index) in items"
        :key="`item-${index}`"
        class="group relative rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all duration-200"
        :class="{ 
          'border-red-500': !isValidItem(index)
        }"
      >
        <div 
          class="drag-handle absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical class="h-5 w-5 text-slate-400" />
        </div>

        <div class="grid grid-cols-12 gap-2 items-start ml-4">
          <div
            v-for="field in config.fields"
            :key="field.key"
            :class="getColSpanClass(field)"
          >
            <label class="r-settings-input-label">
              {{ field.label }}
              <span v-if="field.required" class="text-red-400">*</span>
            </label>
            
            <input
              v-if="field.type === 'text'"
              :value="item[field.key]"
              @input="updateField(index, field.key, ($event.target as HTMLInputElement).value)"
              type="text"
              :placeholder="getFieldPlaceholder(field, item)"
              class="r-settings-custom-input"
              :class="{ '!border-red-500 focus:!border-red-500': !isValidItem(index) }"
            />
            
            <select
              v-else-if="field.type === 'select'"
              :value="item[field.key]"
              @change="updateField(index, field.key, ($event.target as HTMLSelectElement).value)"
              class="r-settings-custom-input"
            >
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            
            <div v-else-if="field.type === 'checkbox'" class="flex items-center pt-2">
              <input
                :checked="item[field.key]"
                @change="updateField(index, field.key, ($event.target as HTMLInputElement).checked)"
                type="checkbox"
                class="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                style="background-color: #1a1a1a;"
              />
              <span class="ml-2 text-sm text-slate-300">{{ item[field.key] ? 'Yes' : 'No' }}</span>
            </div>
            
            <textarea
              v-else-if="field.type === 'textarea'"
              :value="item[field.key]"
              @input="updateField(index, field.key, ($event.target as HTMLTextAreaElement).value)"
              :placeholder="getFieldPlaceholder(field, item)"
              class="r-settings-custom-input"
              rows="3"
            ></textarea>
          </div>

          <div class="col-span-1 flex justify-end">
            <button
              @click="removeItem(index)"
              class="mt-6 rounded-md p-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
              title="Remove item"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div v-if="!isValidItem(index)" class="mt-2 text-sm text-red-400 ml-6">
          <div v-for="error in getValidationErrors(index)" :key="error">
            {{ error }}
          </div>
        </div>
      </div>
    </VueDraggable>

    <div v-if="showSummary && items.length > 0" class="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
      <h4 class="text-sm font-medium text-slate-300 mb-2">Summary</h4>
      <div class="text-sm text-slate-400">
        <p>{{ items.length }} item(s) configured</p>
        <p>{{ Object.values(validationResults).filter(r => r.isValid).length }} valid, {{ Object.values(validationResults).filter(r => !r.isValid).length }} invalid</p>
      </div>
    </div>
  </div>
</template>

<style>
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

.ghost {
  opacity: 0.5;
  background: #1e293b;
}
</style> 