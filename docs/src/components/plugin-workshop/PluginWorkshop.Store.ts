import { ref, computed } from 'vue'

export interface PluginData {
  author: string
  version: string
  name: string
  description: string
  pluginType: 'Carbon' | 'Oxide'
}

// Shared reactive data
export const pluginData = ref<PluginData>({
  author: 'YourName',
  version: '1.0.0',
  name: 'MyPlugin',
  description: 'A cool new plugin.',
  pluginType: 'Carbon'
})

// Validation computed properties
export const isVersionValid = computed(() => {
  return /^\d+\.\d+(\.\d+)?$/.test(pluginData.value.version)
})

export const isNameValid = computed(() => {
  if (pluginData.value.name.includes('"')) return false
  // A valid name, after sanitization, must not be empty.
  return sanitizeName(pluginData.value.name).length > 0
})

export const isAuthorValid = computed(() => {
  return !pluginData.value.author.includes('"')
})

export const isDescriptionValid = computed(() => {
  return !pluginData.value.description.includes('"')
})

// Code generation
export const generatedCode = computed(() => {
  const sanitizedName = sanitizeName(pluginData.value.name) || 'MyPlugin'
  const info = `[Info("${pluginData.value.name}", "${pluginData.value.author}", "${pluginData.value.version}")]`
  const desc = pluginData.value.description && `[Description("${pluginData.value.description}")]`
  const baseClass = pluginData.value.pluginType === 'Carbon' ? 'CarbonPlugin' : 'RustPlugin'
  const namespace = pluginData.value.pluginType === 'Carbon' ? 'Carbon.Plugins' : 'Oxide.Plugins'
  const using = ''

  const rawCode = (using && `using ${using};

`) + `namespace ${namespace};

${info}${desc && `\n${desc}`}
public class ${sanitizedName} : ${baseClass}
{
    // Code goes here
}
`
  return rawCode
})

export const codeToHighlight = computed(() => {
  return generatedCode.value.substring(generatedCode.value.indexOf('using'))
})

// Utility functions
export function sanitizeName(name: string) {
  // Replace any character that is not a letter, number, or underscore with an underscore.
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_')

  // If the first character is a number, prepend an underscore.
  if (/^[0-9]/.test(sanitized)) {
    sanitized = '_' + sanitized
  }
  
  // Collapse multiple consecutive underscores into a single one.
  sanitized = sanitized.replace(/__+/g, '_')
     
  return sanitized
}

// Composable hook
export function usePluginWorkshop() {
  return {
    pluginData,
    isVersionValid,
    isNameValid,
    isAuthorValid,
    isDescriptionValid,
    generatedCode,
    codeToHighlight,
    sanitizeName
  }
} 