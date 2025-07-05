<script setup lang="ts">
import { computed } from 'vue'
import { Info } from 'lucide-vue-next'
import { usePluginWorkshop } from '../PluginWorkshop.Store'
import type { ComponentData, GridSettings } from '../PluginWorkshop.Store'

interface Props {
  selectedComponent: string | null
  components: ComponentData[]
  viewportDimensions: {
    width: number
    height: number
    virtualWidth: number
    virtualHeight: number
  }
  gridSettings: GridSettings
  hoverTarget: string | null
  editingMode: string
  isShiftPressed: boolean
  isAltPressed: boolean
  offsetsToPixels: (component: ComponentData) => { x: number; y: number; width: number; height: number }
}

interface Emits {
  (e: 'update:selectedComponent', value: string | null): void
  (e: 'update:editingMode', value: string): void
  (e: 'update:aspectRatio', value: string): void
  (e: 'component:mousedown', event: MouseEvent, componentId: string): void
  (e: 'component:rightclick', event: MouseEvent, componentId: string): void
  (e: 'component:doubleclick', componentId: string): void
  (e: 'viewport:click', event: MouseEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { 
  pluginData,
  getComponentChildren,
  getComponentDepth
} = usePluginWorkshop()

const viewport = computed(() => pluginData.value.layout.viewport)

// Background styles based on parent container and defaults
const backgroundStyles = computed(() => {
  const { parentContainer, defaults } = viewport.value
  
  // Use placecats.com for background
  const backgroundImage = `url(https://placecats.com/${props.viewportDimensions.virtualWidth}/${props.viewportDimensions.virtualHeight})`
  
  const styles: Record<string, any> = {
    backgroundColor: defaults.backgroundColor,
    backgroundImage: backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '2px solid #444',
    position: 'relative'
  }
  
  // All parent containers consume entire viewport as requested
  switch (parentContainer) {
    case 'Overall':
      styles.borderColor = '#3b82f6'
      break
    case 'Overlay':
      styles.borderColor = '#10b981'
      break
    case 'Inventory':
      styles.borderColor = '#f59e0b'
      break
  }
  
  return styles
})

// Grid styles
const gridStyles = computed(() => {
  if (!props.gridSettings.enabled) return {}
  
  const { size } = props.gridSettings
  const scaledSize = size * (props.viewportDimensions.width / props.viewportDimensions.virtualWidth)
  
  return {
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
    `,
    backgroundSize: `${scaledSize}px ${scaledSize}px`,
    backgroundPosition: '0 0'
  }
})

// Component rendering
const componentStyles = (component: ComponentData) => {
  const isSelected = props.selectedComponent === component.id
  const isHoverTarget = props.hoverTarget === component.id
  const pixels = props.offsetsToPixels(component)
  
  let backgroundColor = 'rgba(100, 100, 100, 0.3)'
  
  if (component.type === 'Panel') {
    const baseColor = component.panelColor || viewport.value.defaults.backgroundColor
    const opacity = component.panelOpacity || viewport.value.defaults.backgroundOpacity || 1
    backgroundColor = hexToRgba(baseColor, opacity)
  } else if (component.type === 'Text') {
    backgroundColor = 'transparent'
  }
  
  // Scale pixels to display size
  const scale = props.viewportDimensions.width / props.viewportDimensions.virtualWidth
  const scaledPixels = {
    x: pixels.x * scale,
    y: pixels.y * scale,
    width: pixels.width * scale,
    height: pixels.height * scale
  }
  
  const zIndex = getComponentDepth(component.id) + 1
  
  return {
    position: 'absolute' as const,
    left: `${scaledPixels.x}px`,
    top: `${scaledPixels.y}px`,
    width: `${scaledPixels.width}px`,
    height: `${scaledPixels.height}px`,
    backgroundColor,
    border: isSelected ? '2px solid #fff' : 
      isHoverTarget ? '2px solid #f59e0b' :
      component.parentId ? '2px solid rgba(255,255,255,0.5)' : 
      getComponentChildren(component.id).length > 0 ? '2px dashed rgba(255,255,255,0.5)' :
      '2px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none' as const,
    overflow: 'hidden',
    zIndex: zIndex,
    transition: 'border-color 0.2s ease'
  }
}

const getComponentContent = (component: ComponentData) => {
  if (component.type === 'Text') {
    return component.label || 'Sample Text'
  }
  return component.name
}

const getTextStyles = (component: ComponentData) => {
  if (component.type !== 'Text') return {}
  
  const baseColor = component.fontColor || viewport.value.defaults.fontColor
  const opacity = component.fontOpacity || viewport.value.defaults.fontOpacity || 1
  const fontSize = component.fontSize || viewport.value.defaults.fontSize
  
  // Scale font size to display size
  const scale = props.viewportDimensions.width / props.viewportDimensions.virtualWidth
  const scaledFontSize = fontSize * scale
  
  return {
    color: hexToRgba(baseColor, opacity),
    fontSize: `${scaledFontSize}px`,
    fontFamily: component.fontFamily || viewport.value.defaults.fontFamily,
    textAlign: getTextAlign(component.fontAnchor || viewport.value.defaults.fontAnchor),
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: getVerticalAlign(component.fontAnchor || viewport.value.defaults.fontAnchor),
    justifyContent: getHorizontalAlign(component.fontAnchor || viewport.value.defaults.fontAnchor)
  }
}

const getTextAlign = (anchor: string): 'left' | 'center' | 'right' => {
  if (anchor.includes('Left')) return 'left'
  if (anchor.includes('Right')) return 'right'
  return 'center'
}

const getVerticalAlign = (anchor: string): 'flex-start' | 'center' | 'flex-end' => {
  if (anchor.includes('Upper')) return 'flex-start'
  if (anchor.includes('Lower')) return 'flex-end'
  return 'center'
}

const getHorizontalAlign = (anchor: string): 'flex-start' | 'center' | 'flex-end' => {
  if (anchor.includes('Left')) return 'flex-start'
  if (anchor.includes('Right')) return 'flex-end'
  return 'center'
}

// Event handlers
const handleComponentMouseDown = (event: MouseEvent, componentId: string) => {
  emit('component:mousedown', event, componentId)
}

const handleComponentRightClick = (event: MouseEvent, componentId: string) => {
  emit('component:rightclick', event, componentId)
}

const handleComponentDoubleClick = (componentId: string) => {
  emit('component:doubleclick', componentId)
}

const handleViewportClick = (event: MouseEvent) => {
  emit('viewport:click', event)
}

const handleEditingModeToggle = () => {
  const newMode = props.editingMode === 'relative' ? 'absolute' : 'relative'
  emit('update:editingMode', newMode)
}

const handleAspectRatioChange = (aspectRatio: string) => {
  emit('update:aspectRatio', aspectRatio)
}

// Helper function to convert hex color and opacity to rgba
const hexToRgba = (hex: string, opacity: number = 1): string => {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(3)})`
}

// Sort components by depth to prevent z-index blocking
const sortedComponents = computed(() => {
  return [...props.components].sort((a, b) => getComponentDepth(a.id) - getComponentDepth(b.id))
})

// Get anchor points for visualization
const getAnchorVisualization = (component: ComponentData) => {
  if (props.selectedComponent !== component.id || component.anchorPreset === 'custom') return null
  
  const scale = props.viewportDimensions.width / props.viewportDimensions.virtualWidth
  
  // Calculate anchor positions in web coordinates
  const anchorMinX = component.anchorMin.x * props.viewportDimensions.virtualWidth * scale
  const anchorMinY = (1 - component.anchorMin.y) * props.viewportDimensions.virtualHeight * scale
  const anchorMaxX = component.anchorMax.x * props.viewportDimensions.virtualWidth * scale  
  const anchorMaxY = (1 - component.anchorMax.y) * props.viewportDimensions.virtualHeight * scale
  
  const pixels = props.offsetsToPixels(component)
  const scaledPixels = {
    x: pixels.x * scale,
    y: pixels.y * scale,
    width: pixels.width * scale,
    height: pixels.height * scale
  }
  
  return {
    anchorMin: { x: anchorMinX, y: anchorMinY },
    anchorMax: { x: anchorMaxX, y: anchorMaxY },
    component: scaledPixels,
    offsetMin: component.offsetMin,
    offsetMax: component.offsetMax
  }
}

// Helper to get anchor preset display name
const getAnchorPresetName = (preset: string): string => {
  const presetNames: Record<string, string> = {
    'none': 'None',
    'full': 'Full',
    'upper-left': 'Upper Left',
    'upper-center': 'Upper Center',
    'upper-right': 'Upper Right',
    'middle-left': 'Middle Left',
    'middle-center': 'Middle Center',
    'middle-right': 'Middle Right',
    'lower-left': 'Lower Left',
    'lower-center': 'Lower Center',
    'lower-right': 'Lower Right',
    'custom': 'Custom'
  }
  return presetNames[preset] || preset
}
</script>

<template>
  <div class="w-full">
    <div class="rounded-lg bg-slate-800/50 p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-white">Viewport</h3>
                  <div class="flex items-center gap-3">
            <!-- Aspect Ratio Toggle -->
            <div class="flex gap-1">
              <button
                @click="handleAspectRatioChange('16:9')"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  viewport.aspectRatio === '16:9'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                ]"
              >
                16:9
              </button>
              <button
                @click="handleAspectRatioChange('16:10')"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  viewport.aspectRatio === '16:10'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                ]"
              >
                16:10
              </button>
              <button
                @click="handleAspectRatioChange('4:3')"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  viewport.aspectRatio === '4:3'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                ]"
              >
                4:3
              </button>
            </div>
            
            <div class="text-sm text-slate-400">
              {{ viewport.parentContainer }}
              <span v-if="gridSettings.enabled" class="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                Grid {{ gridSettings.size }}px
              </span>
            </div>
            
            <!-- Editing Mode Toggle -->
            <div class="flex gap-1">
              <button
                @click="handleEditingModeToggle"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  editingMode === 'relative'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                ]"
              >
                Relative
              </button>
              <button
                @click="handleEditingModeToggle"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  editingMode === 'absolute'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                ]"
              >
                Absolute
              </button>
            </div>
            
            <!-- Keyboard Modifiers Status -->
            <div class="flex gap-1">
              <span
                v-if="isShiftPressed"
                class="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs font-medium"
              >
                SHIFT
              </span>
              <span
                v-if="isAltPressed"
                class="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs font-medium"
              >
                ALT
              </span>
            </div>
          </div>
      </div>
      
      <!-- Viewport Estimation Notice -->
      <div class="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div class="flex items-start gap-2">
          <Info class="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div class="text-sm text-blue-300">
            <p class="text-xs opacity-90 mt-1">
              This is an estimation of how your UI will appear in-game. Actual results may vary due to screen resolution, UI scale settings, and game updates.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Viewport Container -->
      <div class="flex justify-center p-8 bg-slate-900/50">
        <div
          class="relative overflow-hidden select-none"
          :style="{
            width: viewportDimensions.width + 'px',
            height: viewportDimensions.height + 'px',
            ...backgroundStyles,
            ...gridStyles
          }"
          @click="handleViewportClick"
        >
          <!-- Anchor and Offset Visualization -->
          <template v-for="component in sortedComponents" :key="`anchor-viz-${component.id}`">
            <div 
              v-if="getAnchorVisualization(component)" 
              class="absolute pointer-events-none"
              :data-anchor-viz="component.id"
            >
              <!-- Anchor Min Point -->
              <div
                :style="{
                  position: 'absolute',
                  left: getAnchorVisualization(component)!.anchorMin.x + 'px',
                  top: getAnchorVisualization(component)!.anchorMin.y + 'px',
                  width: '8px',
                  height: '8px',
                  background: '#10b981',
                  border: '2px solid white',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000
                }"
                title="Anchor Min"
              ></div>
              
              <!-- Anchor Min Label -->
              <div
                :style="{
                  position: 'absolute',
                  left: (getAnchorVisualization(component)!.anchorMin.x + 15) + 'px',
                  top: (getAnchorVisualization(component)!.anchorMin.y - 12) + 'px',
                  background: 'rgba(16, 185, 129, 0.95)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  zIndex: 1001
                }"
              >
                MIN
              </div>
              
              <!-- Anchor Max Point (if different from min) -->
              <div
                v-if="getAnchorVisualization(component)!.anchorMax.x !== getAnchorVisualization(component)!.anchorMin.x || getAnchorVisualization(component)!.anchorMax.y !== getAnchorVisualization(component)!.anchorMin.y"
                :style="{
                  position: 'absolute',
                  left: getAnchorVisualization(component)!.anchorMax.x + 'px',
                  top: getAnchorVisualization(component)!.anchorMax.y + 'px',
                  width: '8px',
                  height: '8px',
                  background: '#3b82f6',
                  border: '2px solid white',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000
                }"
                title="Anchor Max"
              ></div>
              
              <!-- Anchor Max Label (if different from min) -->
              <div
                v-if="getAnchorVisualization(component)!.anchorMax.x !== getAnchorVisualization(component)!.anchorMin.x || getAnchorVisualization(component)!.anchorMax.y !== getAnchorVisualization(component)!.anchorMin.y"
                :style="{
                  position: 'absolute',
                  left: (getAnchorVisualization(component)!.anchorMax.x + 15) + 'px',
                  top: (getAnchorVisualization(component)!.anchorMax.y - 12) + 'px',
                  background: 'rgba(59, 130, 246, 0.95)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  zIndex: 1001
                }"
              >
                MAX
              </div>
              
              <!-- Guide Lines from Anchors to Component -->
              <svg
                :style="{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 999
                }"
              >
                <!-- Line from anchor min to component top-left -->
                <line
                  :x1="getAnchorVisualization(component)!.anchorMin.x"
                  :y1="getAnchorVisualization(component)!.anchorMin.y"
                  :x2="getAnchorVisualization(component)!.component.x"
                  :y2="getAnchorVisualization(component)!.component.y"
                  stroke="#10b981"
                  stroke-width="1"
                  stroke-dasharray="4,4"
                  opacity="0.7"
                />
                
                <!-- Line from anchor max to component bottom-right (if different anchors) -->
                <line
                  v-if="getAnchorVisualization(component)!.anchorMax.x !== getAnchorVisualization(component)!.anchorMin.x || getAnchorVisualization(component)!.anchorMax.y !== getAnchorVisualization(component)!.anchorMin.y"
                  :x1="getAnchorVisualization(component)!.anchorMax.x"
                  :y1="getAnchorVisualization(component)!.anchorMax.y"
                  :x2="getAnchorVisualization(component)!.component.x + getAnchorVisualization(component)!.component.width"
                  :y2="getAnchorVisualization(component)!.component.y + getAnchorVisualization(component)!.component.height"
                  stroke="#3b82f6"
                  stroke-width="1"
                  stroke-dasharray="4,4"
                  opacity="0.7"
                />
              </svg>
              
              <!-- Offset Labels -->
              <div
                v-if="editingMode === 'absolute'"
                :style="{
                  position: 'absolute',
                  left: getAnchorVisualization(component)!.component.x + 'px',
                  top: (getAnchorVisualization(component)!.component.y - 25) + 'px',
                  background: 'rgba(0, 0, 0, 0.85)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  zIndex: 1001
                }"
              >
                Unity Offset: Min({{ getAnchorVisualization(component)!.offsetMin.x.toFixed(1) }}, {{ getAnchorVisualization(component)!.offsetMin.y.toFixed(1) }}) Max({{ getAnchorVisualization(component)!.offsetMax.x.toFixed(1) }}, {{ getAnchorVisualization(component)!.offsetMax.y.toFixed(1) }})
              </div>
            </div>
          </template>

          <!-- Components - render in reverse depth order so higher z-index components don't block lower ones -->
          <div
            v-for="component in sortedComponents"
            :key="component.id"
            :style="componentStyles(component)"
            :data-component-id="component.id"
            @mousedown="handleComponentMouseDown($event, component.id)"
            @contextmenu="handleComponentRightClick($event, component.id)"
            @dblclick="handleComponentDoubleClick(component.id)"
            class="component-element"
          >
            <div
              :style="getTextStyles(component)"
              class="component-content"
            >
              {{ getComponentContent(component) }}
            </div>
            
            <!-- Resize Handle -->
            <div
              v-if="selectedComponent === component.id"
              class="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-white border-2 border-gray-600 cursor-se-resize hover:bg-blue-100 transition-colors"
              style="margin: -2px; border-radius: 2px;"
              title="Drag to resize"
            ></div>
          </div>
          
          <!-- Empty state -->
          <div v-if="components.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-white text-sm text-center opacity-50">
              <p>No components</p>
              <p class="text-xs">Add components to see them here</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Component Info -->
      <div class="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <div class="text-sm text-slate-300">
          <p><strong>Selected:</strong> {{ components.find(c => c.id === selectedComponent)?.name || 'None' }}</p>
          <div v-if="selectedComponent" class="text-xs text-slate-500 mt-1">
            <p>Anchor: {{ getAnchorPresetName(components.find(c => c.id === selectedComponent)?.anchorPreset || '') }}</p>
            <p>Drag to move • Right-click for options • Drag corner to resize • Hold over Panel to nest</p>
            <p>Shortcuts: <span class="text-yellow-400">Shift</span>=lock ratio • <span class="text-orange-400">Alt</span>=mirror • <span class="text-red-400">Del</span>=delete</p>
            <p><span class="text-green-400">Green</span>=anchor min • <span class="text-blue-400">Blue</span>=anchor max • Dotted lines show offset relationships</p>
          </div>
          <p v-else class="text-xs text-slate-500 mt-1">
            Double-click to edit • Right-click for options • Select to drag/resize<br>
            Shortcuts: <span class="text-yellow-400">Shift</span>=lock ratio • <span class="text-orange-400">Alt</span>=mirror • <span class="text-red-400">Del</span>=delete
          </p>
          
          <!-- Editing Mode Info -->
          <div class="mt-2 pt-2 border-t border-slate-700">
            <p class="text-xs text-slate-400">
              <strong>{{ editingMode === 'relative' ? 'Relative' : 'Absolute' }} Mode:</strong>
              <span v-if="editingMode === 'relative'">
                Drag/resize modifies anchor positions (% of parent)
              </span>
              <span v-else>
                Drag/resize modifies offset distances (pixels from anchors)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-element {
  transition: transform 0.1s ease, border-color 0.2s ease;
}

.component-element:hover {
  transform: scale(1.02);
}

.component-content {
  pointer-events: none;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
</style> 