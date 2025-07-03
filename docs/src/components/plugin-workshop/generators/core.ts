import type { PluginData } from '../PluginWorkshop.Store'
import { sanitizeName, escapeDescription } from '../PluginWorkshop.Store'
import { generateUsings } from './usings'
import { generateLayoutCode } from './layout'
import { generateSettingsCode } from './settings'
import { wrapRegion, joinSections } from './utils'

export function generateCoreCode(data: PluginData): string {
  const sanitizedName = sanitizeName(data.name) || 'MyPlugin'
  const info = `[Info("${data.name}", "${data.author}", "${data.version}")]`
  const escapedDescription = escapeDescription(data.description)
  const desc = data.description && `[Description("${escapedDescription}")]`
  
  let baseClass: string
  let namespace: string
  
  switch (data.pluginType) {
    case 'Carbon':
      baseClass = 'CarbonPlugin'
      namespace = 'Carbon.Plugins'
      break
    case 'Oxide':
      baseClass = 'RustPlugin'
      namespace = 'Oxide.Plugins'
      break
    case 'Hybrid':
      baseClass = 'RustPlugin'
      namespace = 'Oxide.Plugins'
      break
  }

  const usings = generateUsings(data)
  const settings = generateSettingsCode(data)
  const layout = generateLayoutCode(data)

  const classSections = joinSections(
    wrapRegion(settings, 'Settings'),
    wrapRegion(layout, 'Layout')
  )

  return `${usings}

namespace ${namespace};

${info}${desc && `\n${desc}`}
public class ${sanitizedName} : ${baseClass}
{
${classSections}
}`.trimStart()
}
