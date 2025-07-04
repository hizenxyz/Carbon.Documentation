import { pluginData } from '../PluginWorkshop.Store'

export function generateUsings(): string {
  const usings: string[] = []
  
  if (pluginData.value.settings.length > 0) {
    usings.push('using Newtonsoft.Json;')
    usings.push('using System;')
  }

  switch (pluginData.value.pluginType) {
    case 'Carbon':
      if (pluginData.value.layout.active) {
        usings.push('using Carbon.Components;')
      }
      break
    case 'Hybrid':
      if (pluginData.value.layout.active) {
        usings.push('#if CARBON')
        usings.push('using Carbon.Components;')
        usings.push('#else')
        usings.push('using Oxide.Ext.CarbonAliases;')
        usings.push('#endif')
      }
      break
  }
  
  const uniqueUsings = [...new Set(usings)].sort()

  return uniqueUsings.length > 0 ? uniqueUsings.join('\n') : ''
}
