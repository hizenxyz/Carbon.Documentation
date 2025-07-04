import { ref, computed, watch } from 'vue'
import { generateCode } from './generators'

export type CSharpType = 
  | 'string' 
  | 'int' 
  | 'float' 
  | 'double' 
  | 'bool' 
  | 'decimal' 
  | 'byte' 
  | 'short' 
  | 'long' 
  | 'uint' 
  | 'ushort' 
  | 'ulong' 
  | 'char'

export interface SettingType {
  id: string
  name: string
  type: CSharpType
  description: string
  defaultValue: string
}

export interface PluginData {
  author: string
  version: string
  name: string
  description: string
  pluginType: 'Hybrid' | 'Carbon' | 'Oxide'
  layout: LayoutData
  settings: SettingType[]
}

export interface LayoutData {
  active: boolean
}

export const csharpTypeValidators: Record<CSharpType, RegExp> = {
  string: /^.*$/,
  int: /^-?\d+$/,
  float: /^-?\d+(\.\d+)?[fF]?$/,
  double: /^-?\d+(\.\d+)?[dD]?$/,
  bool: /^(true|false)$/i,
  decimal: /^-?\d+(\.\d+)?[mM]?$/,
  byte: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  short: /^-?(3276[0-8]|327[0-5][0-9]|32[0-6][0-9]{2}|3[01][0-9]{3}|[12][0-9]{4}|[1-9][0-9]{0,3}|0)$/,
  long: /^-?\d+[lL]?$/,
  uint: /^\d+[uU]?$/,
  ushort: /^(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{0,3}|0)$/,
  ulong: /^\d+([uU][lL]|[lL][uU])?$/,
  char: /^(\\(?:['"\\0abfnrtv]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{1,4})|[^\\])$/
}

export const csharpTypeDefaults: Record<CSharpType, string> = {
  string: '',
  int: '0',
  float: '0.0',
  double: '0.0',
  bool: 'false',
  decimal: '0.0',
  byte: '0',
  short: '0',
  long: '0',
  uint: '0',
  ushort: '0',
  ulong: '0',
  char: ''
}

const defaultPluginData: PluginData = {
  author: 'YourName',
  version: '1.0.0',
  name: 'MyPlugin',
  description: 'A cool new plugin.',
  pluginType: 'Hybrid',
  layout: {
    active: false,
  },
  settings: []
}

const STORAGE_KEY = 'carbon-plugin-workshop-data'

const loadPluginData = (): PluginData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...defaultPluginData,
        ...parsed,
        layout: { ...defaultPluginData.layout, ...parsed.layout },
        settings: parsed.settings || []
      }
    }
  } catch (error) {
    console.warn('Failed to load plugin data from localStorage:', error)
  }
  return { ...defaultPluginData }
}

const savePluginData = (data: PluginData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save plugin data to localStorage:', error)
  }
}

export const pluginData = ref<PluginData>(loadPluginData())

watch(
  pluginData,
  (newData) => {
    savePluginData(newData)
  },
  { deep: true }
)

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
  const validateSettingValue = (type: CSharpType, value: string): boolean => {
    return csharpTypeValidators[type].test(value)
  }

  const clearStoredData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      Object.assign(pluginData.value, { ...defaultPluginData })
    } catch (error) {
      console.warn('Failed to clear stored plugin data:', error)
    }
  }

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
    escapeDescription,
    validateSettingValue,
    clearStoredData,
    csharpTypeValidators,
    csharpTypeDefaults
  }
}
