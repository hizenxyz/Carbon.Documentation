import { pluginData } from '../PluginWorkshop.Store'

export function generateUsings(): string {
  const usings: string[] = []
  
  switch (pluginData.value.pluginType) {
    case 'Carbon':
      usings.push('using Carbon.Components;')
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
  
  return usings.length > 0 ? usings.join('\n') + '\n' : ''
}
