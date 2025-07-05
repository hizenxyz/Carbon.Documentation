import { ref, computed, watch } from 'vue'
import { inBrowser } from 'vitepress'
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

export type ComponentType = 'Panel' | 'Text'

export type AspectRatio = '16:9' | '16:10' | '4:3'

export type ParentContainer = 'Overall' | 'Overlay' | 'Inventory'

export type FontFamily = 'PermanentMarker' | 'NotoSansArabicBold' | 'DroidSansMono' | 'RobotoCondensedBold' | 'RobotoCondensedRegular'

export type FontAnchor = 'UpperLeft' | 'UpperCenter' | 'UpperRight' | 'MiddleLeft' | 'MiddleCenter' | 'MiddleRight' | 'LowerLeft' | 'LowerCenter' | 'LowerRight'

export type AnchorPreset = 
  | 'none' | 'full' 
  | 'upper-left' | 'upper-center' | 'upper-right'
  | 'middle-left' | 'middle-center' | 'middle-right' 
  | 'lower-left' | 'lower-center' | 'lower-right'
  | 'custom'

export type EditingMode = 'relative' | 'absolute'

export interface ComponentData {
  id: string
  name: string
  type: ComponentType
  // Unity UI anchor system
  anchorPreset: AnchorPreset
  anchorMin: { x: number; y: number }
  anchorMax: { x: number; y: number }
  offsetMin: { x: number; y: number }
  offsetMax: { x: number; y: number }
  offsetPreset?: string
  parentId?: string
  // Panel-specific properties
  panelColor?: string
  panelOpacity?: number
  // Text-specific properties
  label?: string
  fontColor?: string
  fontOpacity?: number
  fontSize?: number
  fontFamily?: FontFamily
  fontAnchor?: FontAnchor
}

export interface GridSettings {
  enabled: boolean
  size: number
  snapToGrid: boolean
}

export interface DefaultStyling {
  backgroundColor: string
  backgroundOpacity: number
  fontColor: string
  fontOpacity: number
  fontSize: number
  fontFamily: FontFamily
  fontAnchor: FontAnchor
}

export interface ViewportSettings {
  aspectRatio: AspectRatio
  parentContainer: ParentContainer
  defaults: DefaultStyling
  backgroundImage?: string
}

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
  components: ComponentData[]
  viewport: ViewportSettings
  grid: GridSettings
  editingMode: EditingMode
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
    components: [],
    viewport: {
      aspectRatio: '16:9',
      parentContainer: 'Overall',
      defaults: {
        backgroundColor: '#000000',
        backgroundOpacity: 1,
        fontColor: '#ffffff',
        fontOpacity: 1,
        fontSize: 16,
        fontFamily: 'PermanentMarker',
        fontAnchor: 'UpperLeft'
      },
    },
    grid: {
      enabled: true,
      size: 100,
      snapToGrid: true
    },
    editingMode: 'relative'
  },
  settings: []
}

const STORAGE_KEY = 'carbon-plugin-workshop-data'

const loadPluginData = (): PluginData => {
  if (!inBrowser) {
    return { ...defaultPluginData }
  }
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
  if (!inBrowser) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save plugin data to localStorage:', error)
  }
}

export const pluginData = ref<PluginData>(loadPluginData())

if (inBrowser) {
  watch(
    pluginData,
    (newData) => {
      savePluginData(newData)
    },
    { deep: true }
  )
}

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
    if (!inBrowser) return
    try {
      localStorage.removeItem(STORAGE_KEY)
      Object.assign(pluginData.value, { ...defaultPluginData })
    } catch (error) {
      console.warn('Failed to clear stored plugin data:', error)
    }
  }

  // Component hierarchy helpers
  const getComponentChildren = (componentId: string): ComponentData[] => {
    return pluginData.value.layout.components.filter(c => c.parentId === componentId)
  }

  const getComponentParent = (componentId: string): ComponentData | null => {
    const component = pluginData.value.layout.components.find(c => c.id === componentId)
    if (!component?.parentId) return null
    return pluginData.value.layout.components.find(c => c.id === component.parentId) || null
  }

  const getComponentDepth = (componentId: string): number => {
    let depth = 0
    let currentComponent = pluginData.value.layout.components.find(c => c.id === componentId)
    
    while (currentComponent?.parentId) {
      depth++
      currentComponent = pluginData.value.layout.components.find(c => c.id === currentComponent!.parentId)
      // Prevent infinite loops
      if (depth > 10) break
    }
    
    return depth
  }

  const canNestComponent = (childId: string, parentId: string): boolean => {
    // Can't nest to itself
    if (childId === parentId) return false
    
    // Can't nest to a child (would create circular dependency)
    const isChildOfTarget = (currentId: string, targetId: string): boolean => {
      const children = getComponentChildren(currentId)
      if (children.some(c => c.id === targetId)) return true
      return children.some(c => isChildOfTarget(c.id, targetId))
    }
    
    return !isChildOfTarget(childId, parentId)
  }

  const setComponentParent = (componentId: string, parentId?: string) => {
    const componentIndex = pluginData.value.layout.components.findIndex(c => c.id === componentId)
    if (componentIndex !== -1) {
      if (parentId && canNestComponent(componentId, parentId)) {
        pluginData.value.layout.components[componentIndex].parentId = parentId
      } else {
        pluginData.value.layout.components[componentIndex].parentId = undefined
      }
    }
  }

  const getHierarchicalComponents = (): ComponentData[] => {
    const components = [...pluginData.value.layout.components]
    const result: ComponentData[] = []

    // Add root level components first
    const rootComponents = components.filter(c => !c.parentId)
    
    const addComponentAndChildren = (component: ComponentData) => {
      result.push(component)
      const children = components.filter(c => c.parentId === component.id)
      children.forEach(addComponentAndChildren)
    }

    rootComponents.forEach(addComponentAndChildren)
    
    return result
  }

  const reorderComponents = (newOrder: ComponentData[]) => {
    pluginData.value.layout.components = newOrder
  }

  const getPossibleParents = (componentId: string): ComponentData[] => {
    return pluginData.value.layout.components.filter(c => 
      c.id !== componentId && 
      canNestComponent(componentId, c.id) &&
      c.type === 'Panel' // Only Panel can have children
    )
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
    csharpTypeDefaults,
    // Component hierarchy functions
    getComponentChildren,
    getComponentParent,
    getComponentDepth,
    canNestComponent,
    setComponentParent,
    getHierarchicalComponents,
    reorderComponents,
    getPossibleParents
  }
}
