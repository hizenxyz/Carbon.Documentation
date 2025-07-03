import type { PluginData } from '../PluginWorkshop.Store'

export function generateUsings(data: PluginData): string {
  const usings: string[] = []
  
  switch (data.pluginType) {
    case 'Carbon':
      if (data.layout.active) {
        usings.push('using Carbon.Components;')
      }
      break
    case 'Hybrid':
      if (data.layout.active) {
        usings.push('#if CARBON')
        usings.push('using Carbon.Components;')
        usings.push('#else')
        usings.push('using Oxide.Ext.CarbonAliases;')
        usings.push('#endif')
      }
      break
  }
  
  return usings.length > 0 ? usings.join('\n') + '\n' : ''
}
