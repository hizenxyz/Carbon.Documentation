import { pluginData, className, escapeDescription } from '../PluginWorkshop.Store'
import { generateUsings } from './usings'
import { generateLayoutCode } from './layout'
import { generateSettingsCode } from './settings'
import { wrapRegion, joinSections } from './utils'

export function generateCoreCode(): string {
  const info = `[Info("${pluginData.value.name}", "${pluginData.value.author}", "${pluginData.value.version}")]`
  const escapedDescription = escapeDescription(pluginData.value.description)
  const desc = pluginData.value.description && `[Description("${escapedDescription}")]`
  
  let baseClass: string
  let namespace: string
  
  switch (pluginData.value.pluginType) {
    case 'Carbon':
      baseClass = 'CarbonPlugin'
      namespace = 'Carbon.Plugins'
      break
    case 'Oxide':
    case 'Hybrid':
      baseClass = 'RustPlugin'
      namespace = 'Oxide.Plugins'
      break
  }

  const usings = generateUsings()
  const settings = generateSettingsCode()
  const layout = generateLayoutCode()

  const classSections = joinSections(
    wrapRegion(settings, 'Settings'),
    wrapRegion(layout, 'Layout')
  )

  return `${usings}

namespace ${namespace};

${info}${desc && `\n${desc}`}
public class ${className.value} : ${baseClass}
{
${classSections}
}`.trimStart()
}
