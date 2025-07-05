import { pluginData } from '../PluginWorkshop.Store'
import type { ComponentData, FontAnchor } from '../PluginWorkshop.Store'

// === TYPES ===

interface ViewportDimensions {
  width: number
  height: number
}

// === HELPER FUNCTIONS ===

function getViewportDimensions(): ViewportDimensions {
  const aspectRatio = pluginData.value.layout.viewport.aspectRatio
  const virtualWidth = 1280
  
  // Calculate virtual height: Virtual Height = 1280 / Aspect Ratio
  const aspectRatioValues = {
    '16:9': 16/9,
    '16:10': 16/10,
    '4:3': 4/3
  }
  
  const virtualHeight = Math.round(virtualWidth / aspectRatioValues[aspectRatio])
  
  return {
    width: virtualWidth,
    height: virtualHeight
  }
}

function getMainPanelName(): string {
  const firstComponent = pluginData.value.layout.components[0]
  return firstComponent?.name || 'MainPanel'
}

function resolveParentName(component: ComponentData, index: number): string {
  if (component.parentId) {
    const parent = pluginData.value.layout.components.find(c => c.id === component.parentId)
    return parent?.name || 'Overlay'
  }
  return index === 0 ? 'Overlay' : getMainPanelName()
}

function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${opacity.toFixed(3)}`
}

function convertFontAnchorToCui(anchor: FontAnchor): string {
  const anchorMap: Record<FontAnchor, string> = {
    'UpperLeft': 'TextAnchor.UpperLeft',
    'UpperCenter': 'TextAnchor.UpperCenter', 
    'UpperRight': 'TextAnchor.UpperRight',
    'MiddleLeft': 'TextAnchor.MiddleLeft',
    'MiddleCenter': 'TextAnchor.MiddleCenter',
    'MiddleRight': 'TextAnchor.MiddleRight',
    'LowerLeft': 'TextAnchor.LowerLeft',
    'LowerCenter': 'TextAnchor.LowerCenter',
    'LowerRight': 'TextAnchor.LowerRight'
  }
  
  return anchorMap[anchor] || 'TextAnchor.MiddleCenter'
}

function formatAnchorMin(component: ComponentData): string {
  return `${component.anchorMin.x.toFixed(3)} ${component.anchorMin.y.toFixed(3)}`
}

function formatAnchorMax(component: ComponentData): string {
  return `${component.anchorMax.x.toFixed(3)} ${component.anchorMax.y.toFixed(3)}`
}

function formatOffsetMin(component: ComponentData): string {
  return `${component.offsetMin.x.toFixed(1)} ${component.offsetMin.y.toFixed(1)}`
}

function formatOffsetMax(component: ComponentData): string {
  return `${component.offsetMax.x.toFixed(1)} ${component.offsetMax.y.toFixed(1)}`
}

// === COMPONENT GENERATORS ===

function generatePanelComponent(component: ComponentData, parentName: string, defaults: any): string {
  const { name } = component
  
  const panelColor = component.panelColor || defaults.backgroundColor
  const panelOpacity = component.panelOpacity || defaults.backgroundOpacity || 1
  const colorValues = hexToRgba(panelColor, panelOpacity)
  
  // Build RectTransform based on anchor preset
  let rectTransform = ''
  if (component.anchorPreset === 'custom') {
    // For custom, use both anchors and offsets
    rectTransform = `AnchorMin = "${formatAnchorMin(component)}", AnchorMax = "${formatAnchorMax(component)}", OffsetMin = "${formatOffsetMin(component)}", OffsetMax = "${formatOffsetMax(component)}"`
  } else {
    // For presets, use anchors + offsets
    rectTransform = `AnchorMin = "${formatAnchorMin(component)}", AnchorMax = "${formatAnchorMax(component)}", OffsetMin = "${formatOffsetMin(component)}", OffsetMax = "${formatOffsetMax(component)}"`
  }
  
  return `            // ${name} (Panel) - ${component.anchorPreset}
            elements.Add(new CuiPanel
            {
                Image = { Color = "${colorValues}" },
                RectTransform = { ${rectTransform} },
                CursorEnabled = true
            }, "${parentName}", "${name}");

`
}

function generateTextComponent(component: ComponentData, parentName: string, defaults: any): string {
  const { name } = component
  
  const label = component.label || 'Sample Text'
  const fontColor = component.fontColor || defaults.fontColor
  const fontOpacity = component.fontOpacity || defaults.fontOpacity || 1
  const fontSize = component.fontSize || defaults.fontSize
  const fontFamily = component.fontFamily || defaults.fontFamily
  const fontAnchor = component.fontAnchor || defaults.fontAnchor
  
  const colorValues = hexToRgba(fontColor, fontOpacity)
  const textAnchor = convertFontAnchorToCui(fontAnchor)
  
  // Build RectTransform based on anchor preset
  let rectTransform = ''
  if (component.anchorPreset === 'custom') {
    // For custom, use both anchors and offsets
    rectTransform = `AnchorMin = "${formatAnchorMin(component)}", AnchorMax = "${formatAnchorMax(component)}", OffsetMin = "${formatOffsetMin(component)}", OffsetMax = "${formatOffsetMax(component)}"`
  } else {
    // For presets, use anchors + offsets
    rectTransform = `AnchorMin = "${formatAnchorMin(component)}", AnchorMax = "${formatAnchorMax(component)}", OffsetMin = "${formatOffsetMin(component)}", OffsetMax = "${formatOffsetMax(component)}"`
  }
  
  return `            // ${name} (Text) - ${component.anchorPreset}
            elements.Add(new CuiElement
            {
                Parent = "${parentName}",
                Name = "${name}",
                Components =
                {
                    new CuiTextComponent
                    {
                        Text = "${label.replace(/"/g, '\\"')}",
                        FontSize = ${fontSize},
                        Font = "${fontFamily}",
                        Color = "${colorValues}",
                        Align = ${textAnchor}
                    },
                    new CuiRectTransformComponent { ${rectTransform} }
                }
            });

`
}

// === MAIN EXPORT FUNCTION ===

export function generateLayoutCode(): string {
  const { layout } = pluginData.value
  
  if (layout.components.length === 0) {
    return ''
  }

  const components = layout.components
  const { aspectRatio, parentContainer, defaults } = layout.viewport
  const dimensions = getViewportDimensions()

  let code = `
        // UI Layout - ${aspectRatio} (${dimensions.width}x${dimensions.height}) ${parentContainer}
        private void CreateUI(BasePlayer player)
        {
            var elements = new CuiElementContainer();

`

  // Generate components
  components.forEach((component, index) => {
    const parentName = resolveParentName(component, index)
    
    switch (component.type) {
      case 'Panel':
        code += generatePanelComponent(component, parentName, defaults)
        break
      case 'Text':
        code += generateTextComponent(component, parentName, defaults)
        break
    }
  })

  code += `            CuiHelper.AddUi(player, elements);
        }

        private void DestroyUI(BasePlayer player)
        {
            CuiHelper.DestroyUi(player, "${getMainPanelName()}");
        }
`

  return code
}
