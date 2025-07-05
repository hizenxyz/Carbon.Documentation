import { pluginData } from '../PluginWorkshop.Store'

export function generateUsings(): string {
  const basicUsings: string[] = []
  const conditionalBlocks: string[] = []
  
  if (pluginData.value.settings.length > 0) {
    basicUsings.push('using Newtonsoft.Json;')
    basicUsings.push('using System;')
  }

  switch (pluginData.value.pluginType) {
    case 'Hybrid':
      if (pluginData.value.layout.components.length > 0) {
        // Keep preprocessor directives as a block - don't sort these
        conditionalBlocks.push('#if CARBON')
        conditionalBlocks.push('using Carbon.Components;')
        conditionalBlocks.push('#else')
        conditionalBlocks.push('using Oxide.Game.Rust.Cui;')
        conditionalBlocks.push('#endif')
      }
      break
    case 'Carbon':
      if (pluginData.value.layout.components.length > 0) {
        basicUsings.push('using Carbon.Components;')
      }
      break
    case 'Oxide':
      if (pluginData.value.layout.components.length > 0) {
        basicUsings.push('using Oxide.Game.Rust.Cui;')
      }
      break
  }
  
  // Only sort and deduplicate the basic using statements
  const uniqueBasicUsings = [...new Set(basicUsings)].sort()
  
  // Combine all parts
  const allLines = [...uniqueBasicUsings, ...conditionalBlocks]

  return allLines.length > 0 ? allLines.join('\n') : ''
}
