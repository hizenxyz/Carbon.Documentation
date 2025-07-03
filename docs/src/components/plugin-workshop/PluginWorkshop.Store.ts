import { ref, computed } from 'vue'

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

// Shared reactive data
export const pluginData = ref<PluginData>({
  author: 'YourName',
  version: '1.0.0',
  name: 'MyPlugin',
  description: 'A cool new plugin.',
  pluginType: 'Hybrid',
  layout: {
    active: false
  }
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
  // Placeholder for sanitization later
  // Currently, we're just escaping quotes and backslashes, and turning newlines into spaces
  return true
})

// Code generation
export const generatedCode = computed(() => {
  const sanitizedName = sanitizeName(pluginData.value.name) || 'MyPlugin'
  const info = `[Info("${pluginData.value.name}", "${pluginData.value.author}", "${pluginData.value.version}")]`
  const escapedDescription = escapeDescription(pluginData.value.description)
  const desc = pluginData.value.description && `[Description("${escapedDescription}")]`
  
  let baseClass: string
  let namespace: string
  let using = ``
  
  switch (pluginData.value.pluginType) {
    case 'Carbon':
      baseClass = 'CarbonPlugin'
      namespace = 'Carbon.Plugins'
      using += `using Carbon.Components;`
      break
    case 'Oxide':
      baseClass = 'RustPlugin'
      namespace = 'Oxide.Plugins'
      break
    case 'Hybrid':
      baseClass = 'RustPlugin'
      namespace = 'Oxide.Plugins'
      using += pluginData.value.layout.active ? `#if CARBON
using Carbon.Components;
#else
using Oxide.Ext.CarbonAliases;
#endif
` : ''
      break
  }

  const rawCode = `
${using}
using UnityEngine;

namespace ${namespace};

${info}${desc && `\n${desc}`}
public class ${sanitizedName} : ${baseClass}
{
    // Code goes here
}
`
  return rawCode.trimStart()
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

export function sanitizeDescription(description: string) {
  let sanitized = description.replace(/[\r\n\s]+/g, ' ')
  sanitized = sanitized.replace(/[\s]+/g, ' ')
  return sanitized
}

export function escapeDescription(description: string) {
  return description
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Then escape quotes
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
    sanitizeName,
    escapeDescription
  }
} 