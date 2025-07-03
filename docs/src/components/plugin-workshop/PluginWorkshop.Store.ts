import { ref, computed } from 'vue'
import { generateCode } from './generators'

export interface PluginData {
  author: string
  version: string
  name: string
  description: string
  pluginType: 'Hybrid' | 'Carbon' | 'Oxide'
  layout: LayoutData
}

export interface LayoutData {
  active: boolean
}

export const pluginData = ref<PluginData>({
  author: 'YourName',
  version: '1.0.0',
  name: 'MyPlugin',
  description: 'A cool new plugin.',
  pluginType: 'Hybrid',
  layout: {
    active: false,
  },
})

export const className = computed(() => sanitizeName(pluginData.value.name) || 'MyPlugin')

export const isVersionValid = computed(() => {
  return /^\d+\.\d+(\.\d+)?$/.test(pluginData.value.version)
})

export const isNameValid = computed(() => {
  if (pluginData.value.name.includes('"')) return false
  return sanitizeName(pluginData.value.name).length > 0
})

export const isAuthorValid = computed(() => {
  return !pluginData.value.author.includes('"')
})

export const isDescriptionValid = computed(() => {
  // Placeholder for sanitization later
  return true
})

export const generatedCode = computed(() => {
  return generateCode()
})

export const codeToHighlight = computed(() => {
  return generatedCode.value.substring(generatedCode.value.indexOf('using'))
})

export function sanitizeName(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_')
  
  if (/^[0-9]/.test(sanitized)) {
    sanitized = '_' + sanitized
  }
  
  sanitized = sanitized.replace(/__+/g, '_')
     
  return sanitized
}

export function sanitizeDescription(description: string) {
  let sanitized = description.replace(/[\r\n\s]+/g, ' ')
  sanitized = sanitized.replace(/[\s]+/g, ' ')
  return sanitized
}

export function escapeDescription(description: string) {
  return description
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
}

export function usePluginWorkshop() {
  return {
    pluginData,
    className,
    isVersionValid,
    isNameValid,
    isAuthorValid,
    isDescriptionValid,
    generatedCode,
    codeToHighlight,
    sanitizeName,
    escapeDescription
  }
}
