<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'
import type { ComponentData, ComponentType, AnchorPreset, EditingMode, AspectRatio } from './PluginWorkshop.Store'
import type { OffsetPreset } from './layout/LayoutEditModal.vue'

// Import subcomponents
import LayoutViewport from './layout/LayoutViewport.vue'
import LayoutComponentsList from './layout/LayoutComponentsList.vue'
import LayoutSettings from './layout/LayoutSettings.vue'
import LayoutEditModal from './layout/LayoutEditModal.vue'
import LayoutContextMenu from './layout/LayoutContextMenu.vue'

const { 
  pluginData,
  getComponentChildren,
  setComponentParent,
  reorderComponents
} = usePluginWorkshop()

const isOxide = computed(() => pluginData.value.pluginType === 'Oxide')

// Component management
const components = computed({
  get: () => pluginData.value.layout.components,
  set: (value) => {
    pluginData.value.layout.components = value
  }
})

const viewport = computed(() => pluginData.value.layout.viewport)
const gridSettings = computed(() => pluginData.value.layout.grid)
const editingMode = computed({
  get: () => pluginData.value.layout.editingMode,
  set: (value) => {
    pluginData.value.layout.editingMode = value
  }
})

// Viewport dimensions using proper Unity UI pixel grids
const viewportDimensions = computed(() => {
  const aspectRatio = viewport.value.aspectRatio
  const virtualWidth = 1280
  
  // Calculate virtual height: Virtual Height = 1280 / Aspect Ratio
  const aspectRatioValues = {
    '16:9': 16/9,
    '16:10': 16/10, 
    '4:3': 4/3
  }
  
  const virtualHeight = Math.round(virtualWidth / aspectRatioValues[aspectRatio])
  
  // Scale for display (keeping aspect ratio)
  const displayScale = 0.4
  
  return {
    width: virtualWidth * displayScale,
    height: virtualHeight * displayScale,
    virtualWidth,
    virtualHeight
  }
})

// === ANCHOR PRESET SYSTEM ===

const anchorPresets: Record<AnchorPreset, { anchorMin: { x: number; y: number }, anchorMax: { x: number; y: number } }> = {
  'none': { anchorMin: { x: 0, y: 0 }, anchorMax: { x: 0, y: 0 } },
  'full': { anchorMin: { x: 0, y: 0 }, anchorMax: { x: 1, y: 1 } },
  'upper-left': { anchorMin: { x: 0, y: 1 }, anchorMax: { x: 0, y: 1 } },
  'upper-center': { anchorMin: { x: 0.5, y: 1 }, anchorMax: { x: 0.5, y: 1 } },
  'upper-right': { anchorMin: { x: 1, y: 1 }, anchorMax: { x: 1, y: 1 } },
  'middle-left': { anchorMin: { x: 0, y: 0.5 }, anchorMax: { x: 0, y: 0.5 } },
  'middle-center': { anchorMin: { x: 0.5, y: 0.5 }, anchorMax: { x: 0.5, y: 0.5 } },
  'middle-right': { anchorMin: { x: 1, y: 0.5 }, anchorMax: { x: 1, y: 0.5 } },
  'lower-left': { anchorMin: { x: 0, y: 0 }, anchorMax: { x: 0, y: 0 } },
  'lower-center': { anchorMin: { x: 0.5, y: 0 }, anchorMax: { x: 0.5, y: 0 } },
  'lower-right': { anchorMin: { x: 1, y: 0 }, anchorMax: { x: 1, y: 0 } },
  'custom': { anchorMin: { x: 0, y: 0 }, anchorMax: { x: 0, y: 0 } } // Will be set manually
}

// Helper to apply anchor preset to component
const applyAnchorPreset = (component: ComponentData, preset: AnchorPreset) => {
  if (preset !== 'custom') {
    // Save current position before changing anchors
    const currentPixels = offsetsToPixels(component)
    
    const presetData = anchorPresets[preset]
    component.anchorMin = { ...presetData.anchorMin }
    component.anchorMax = { ...presetData.anchorMax }
    
    // Try to maintain the same visual position by recalculating offsets
    pixelsToOffsets(currentPixels.x, currentPixels.y, currentPixels.width, currentPixels.height, component)
    
    // Ensure component stays within bounds
    const updatedPixels = offsetsToPixels(component)
    const maxX = viewportDimensions.value.virtualWidth - updatedPixels.width
    const maxY = viewportDimensions.value.virtualHeight - updatedPixels.height
    
    if (updatedPixels.x < 0 || updatedPixels.x > maxX || updatedPixels.y < 0 || updatedPixels.y > maxY) {
      // If out of bounds, clamp to viewport
      const clampedX = Math.max(0, Math.min(maxX, updatedPixels.x))
      const clampedY = Math.max(0, Math.min(maxY, updatedPixels.y))
      pixelsToOffsets(clampedX, clampedY, updatedPixels.width, updatedPixels.height, component)
    }
  }
  component.anchorPreset = preset
}

// Helper to convert between pixels and anchor/offset for editing
const pixelsToOffsets = (pixelX: number, pixelY: number, pixelWidth: number, pixelHeight: number, component: ComponentData) => {
  const { virtualWidth, virtualHeight } = viewportDimensions.value
  
  if (component.anchorPreset === 'custom') {
    // For custom, treat as normalized anchors
    component.anchorMin.x = pixelX / virtualWidth
    component.anchorMin.y = 1 - ((pixelY + pixelHeight) / virtualHeight)
    component.anchorMax.x = (pixelX + pixelWidth) / virtualWidth  
    component.anchorMax.y = 1 - (pixelY / virtualHeight)
    component.offsetMin = { x: 0, y: 0 }
    component.offsetMax = { x: 0, y: 0 }
  } else {
    // For presets, calculate offsets from anchor points
    // Unity coordinates: Y=0 is bottom, Y=1 is top
    // Web coordinates: Y=0 is top, increases downward
    
    const anchorMinPixelX = component.anchorMin.x * virtualWidth
    const anchorMinPixelY = (1 - component.anchorMin.y) * virtualHeight // Convert Unity Y to web Y
    const anchorMaxPixelX = component.anchorMax.x * virtualWidth
    const anchorMaxPixelY = (1 - component.anchorMax.y) * virtualHeight // Convert Unity Y to web Y
    
    // Calculate offsets relative to anchor positions
    // Unity offset system: 
    // - OffsetMin is relative to AnchorMin position
    // - OffsetMax is relative to AnchorMax position
    // - Positive Y goes DOWN from anchor, negative Y goes UP
    
    component.offsetMin.x = pixelX - anchorMinPixelX
    component.offsetMin.y = -(pixelY + pixelHeight - anchorMinPixelY)
    component.offsetMax.x = (pixelX + pixelWidth) - anchorMaxPixelX  
    component.offsetMax.y = -(pixelY - anchorMaxPixelY)
  }
}

const offsetsToPixels = (component: ComponentData) => {
  const { virtualWidth, virtualHeight } = viewportDimensions.value
  
  if (component.anchorPreset === 'custom') {
    // For custom, anchors define the rectangle directly
    const width = (component.anchorMax.x - component.anchorMin.x) * virtualWidth
    const height = (component.anchorMax.y - component.anchorMin.y) * virtualHeight
    const x = component.anchorMin.x * virtualWidth
    const y = virtualHeight - (component.anchorMin.y * virtualHeight) - height
    return { x, y, width, height }
  } else {
    // For presets, calculate from anchors + offsets
    // Convert Unity coordinates back to web coordinates
    const anchorMinPixelX = component.anchorMin.x * virtualWidth
    const anchorMinPixelY = (1 - component.anchorMin.y) * virtualHeight // Convert Unity Y to web Y
    const anchorMaxPixelX = component.anchorMax.x * virtualWidth
    const anchorMaxPixelY = (1 - component.anchorMax.y) * virtualHeight // Convert Unity Y to web Y
    
    // Calculate final position from anchors and offsets
    // Unity: OffsetMin.y negative = above anchor, OffsetMax.y negative = above anchor
    const x = anchorMinPixelX + component.offsetMin.x
    const y = anchorMinPixelY - component.offsetMin.y
    const maxX = anchorMaxPixelX + component.offsetMax.x
    const maxY = anchorMaxPixelY - component.offsetMax.y
    
    const width = maxX - x
    const height = maxY - y
    
    return { x, y, width, height }
  }
}

// === GRID & SNAP SYSTEM ===

const snapToGrid = (value: number) => {
  if (!gridSettings.value.snapToGrid) return value
  const gridSize = gridSettings.value.size
  return Math.round(value / gridSize) * gridSize
}

// === COMPONENT MANAGEMENT ===

// Current tab and selected component
const currentTab = ref<'components' | 'settings'>('components')
const selectedComponent = ref<string | null>(null)

// Drag and resize state
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartPixels = ref({ x: 0, y: 0, width: 0, height: 0 })
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartPixels = ref({ x: 0, y: 0, width: 0, height: 0 })

// Hover to nest system
const hoverTarget = ref<string | null>(null)
const hoverStartTime = ref<number | null>(null)
const HOVER_NEST_DELAY = 1500 // 1.5 seconds

// Context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  componentId: null as string | null
})

// Component editing modal
const editingComponent = ref<ComponentData | null>(null)
const showEditModal = ref(false)

// Keyboard modifiers state
const isShiftPressed = ref(false)
const isAltPressed = ref(false)

// Helper to force component reactivity
const forceComponentUpdate = (component: ComponentData) => {
  const componentIndex = components.value.findIndex(c => c.id === component.id)
  if (componentIndex !== -1) {
    components.value[componentIndex] = { ...component }
  }
}

// Generate unique component name
const generateUniqueComponentName = (components: ComponentData[], type: ComponentType): string => {
  const baseName = type
  let uniqueName = baseName
  let counter = 1
  
  while (components.some(component => component.name === uniqueName)) {
    uniqueName = baseName + counter.toString()
    counter++
  }
  
  return uniqueName
}

// Component creation
const addComponent = (type: ComponentType) => {
  // Start with pixel coordinates for easier setup
  const pixelX = snapToGrid(50)
  const pixelY = snapToGrid(50)
  const pixelWidth = snapToGrid(type === 'Text' ? 200 : 150)
  const pixelHeight = snapToGrid(type === 'Text' ? 30 : 100)
  
  const newComponent: ComponentData = {
    id: crypto.randomUUID(),
    name: generateUniqueComponentName(components.value, type),
    type,
    anchorPreset: 'upper-left',
    anchorMin: { x: 0, y: 1 },
    anchorMax: { x: 0, y: 1 },
    offsetMin: { x: 0, y: 0 },
    offsetMax: { x: 0, y: 0 }
  }
  
  // Apply anchor preset and convert pixels to offsets
  applyAnchorPreset(newComponent, 'upper-left')
  pixelsToOffsets(pixelX, pixelY, pixelWidth, pixelHeight, newComponent)
  
  // Apply defaults based on type
  if (type === 'Panel') {
    newComponent.panelColor = viewport.value.defaults.backgroundColor
    newComponent.panelOpacity = viewport.value.defaults.backgroundOpacity
  } else if (type === 'Text') {
    newComponent.label = 'Sample Text'
    newComponent.fontColor = viewport.value.defaults.fontColor
    newComponent.fontOpacity = viewport.value.defaults.fontOpacity
    newComponent.fontSize = viewport.value.defaults.fontSize
    newComponent.fontFamily = viewport.value.defaults.fontFamily
    newComponent.fontAnchor = viewport.value.defaults.fontAnchor
  }
  
  components.value = [...components.value, newComponent]
}

const removeComponent = (componentId: string) => {
  const component = components.value.find(c => c.id === componentId)
  if (component && confirm(`Delete "${component.name}"?`)) {
    // Move children to root
    const children = getComponentChildren(componentId)
    children.forEach(child => {
      setComponentParent(child.id, undefined)
    })
    
    components.value = components.value.filter(c => c.id !== componentId)
    if (selectedComponent.value === componentId) {
      selectedComponent.value = null
    }
  }
}

const selectComponent = (componentId: string) => {
  selectedComponent.value = selectedComponent.value === componentId ? null : componentId
}

const openEditModal = (componentId: string) => {
  const component = components.value.find(c => c.id === componentId)
  if (component) {
    editingComponent.value = { ...component }
    showEditModal.value = true
  }
}

const saveComponentEdit = (editedComponent: ComponentData) => {
  const index = components.value.findIndex(c => c.id === editedComponent.id)
  if (index !== -1) {
    components.value[index] = editedComponent
  }
  
  // Close modal and reset state
  showEditModal.value = false
  editingComponent.value = null
}

// Mouse interaction handlers
const handleMouseDown = (event: MouseEvent, componentId: string) => {
  if (event.button !== 0) return // Only left click
  
  event.preventDefault()
  event.stopPropagation()
  
  selectedComponent.value = componentId
  const component = components.value.find(c => c.id === componentId)
  if (!component) return
  
  const pixels = offsetsToPixels(component)
  
  // Check if clicking on resize handle (bottom-right corner)
  const target = event.target as HTMLElement
  const isResizeHandle = target.classList.contains('resize-handle') || 
                        target.closest('.resize-handle') !== null
  
  if (isResizeHandle) {
    isResizing.value = true
    resizeStartPos.value = { x: event.clientX, y: event.clientY }
    resizeStartPixels.value = { ...pixels }
  } else {
    isDragging.value = true
    dragStartPos.value = { x: event.clientX, y: event.clientY }
    dragStartPixels.value = { ...pixels }
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!selectedComponent.value) return
  
  const component = components.value.find(c => c.id === selectedComponent.value)
  if (!component) return
  
  if (isDragging.value) {
    // Calculate delta in display coordinates, then scale to virtual coordinates
    const displayScale = viewportDimensions.value.width / viewportDimensions.value.virtualWidth
    let deltaX = (event.clientX - dragStartPos.value.x) / displayScale
    let deltaY = (event.clientY - dragStartPos.value.y) / displayScale
    
    // Alt key: Mirror movement from center
    if (isAltPressed.value) {
      deltaX = -deltaX
      deltaY = -deltaY
    }
    
    let newX = snapToGrid(dragStartPixels.value.x + deltaX)
    let newY = snapToGrid(dragStartPixels.value.y + deltaY)
    
    // Calculate bounds
    const maxX = viewportDimensions.value.virtualWidth - dragStartPixels.value.width
    const maxY = viewportDimensions.value.virtualHeight - dragStartPixels.value.height
    
    newX = Math.max(0, Math.min(maxX, newX))
    newY = Math.max(0, Math.min(maxY, newY))
    
    pixelsToOffsets(newX, newY, dragStartPixels.value.width, dragStartPixels.value.height, component)
    forceComponentUpdate(component)
    
    // Check for hover-to-nest
    checkHoverNest(event, component.id)
    
  } else if (isResizing.value) {
    // Calculate delta in display coordinates, then scale to virtual coordinates
    const displayScale = viewportDimensions.value.width / viewportDimensions.value.virtualWidth
    let deltaX = (event.clientX - resizeStartPos.value.x) / displayScale
    let deltaY = (event.clientY - resizeStartPos.value.y) / displayScale
    
    let newWidth = Math.max(20, resizeStartPixels.value.width + deltaX)
    let newHeight = Math.max(20, resizeStartPixels.value.height + deltaY)
    
    // Shift key: Lock aspect ratio
    if (isShiftPressed.value) {
      const aspectRatio = resizeStartPixels.value.width / resizeStartPixels.value.height
      
      // Use the larger delta to determine which dimension drives the resize
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / aspectRatio
      } else {
        newWidth = newHeight * aspectRatio
      }
      
      // Ensure minimum sizes are still respected
      if (newWidth < 20) {
        newWidth = 20
        newHeight = newWidth / aspectRatio
      }
      if (newHeight < 20) {
        newHeight = 20
        newWidth = newHeight * aspectRatio
      }
    }
    
    // Alt key: Mirror resize (resize from center instead of corner)
    let newX = resizeStartPixels.value.x
    let newY = resizeStartPixels.value.y
    
    if (isAltPressed.value) {
      // Calculate size difference
      const widthDiff = newWidth - resizeStartPixels.value.width
      const heightDiff = newHeight - resizeStartPixels.value.height
      
      // Move position to center the resize
      newX = resizeStartPixels.value.x - widthDiff / 2
      newY = resizeStartPixels.value.y - heightDiff / 2
    }
    
    // Apply grid snapping
    newWidth = snapToGrid(newWidth)
    newHeight = snapToGrid(newHeight)
    if (isAltPressed.value) {
      newX = snapToGrid(newX)
      newY = snapToGrid(newY)
    }
    
    // Calculate bounds
    const maxWidth = viewportDimensions.value.virtualWidth - (isAltPressed.value ? newX : resizeStartPixels.value.x)
    const maxHeight = viewportDimensions.value.virtualHeight - (isAltPressed.value ? newY : resizeStartPixels.value.y)
    
    newWidth = Math.min(maxWidth, newWidth)
    newHeight = Math.min(maxHeight, newHeight)
    
    if (isAltPressed.value) {
      const maxX = viewportDimensions.value.virtualWidth - newWidth
      const maxY = viewportDimensions.value.virtualHeight - newHeight
      newX = Math.max(0, Math.min(maxX, newX))
      newY = Math.max(0, Math.min(maxY, newY))
    }
    
    pixelsToOffsets(newX, newY, newWidth, newHeight, component)
    forceComponentUpdate(component)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
  hoverTarget.value = null
  hoverStartTime.value = null
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Hover to nest functionality
const checkHoverNest = (event: MouseEvent, draggingComponentId: string) => {
  const target = document.elementFromPoint(event.clientX, event.clientY)
  const componentElement = target?.closest('.component-element')
  const targetComponentId = componentElement?.getAttribute('data-component-id')
  
  if (targetComponentId && targetComponentId !== draggingComponentId) {
    if (hoverTarget.value !== targetComponentId) {
      hoverTarget.value = targetComponentId
      hoverStartTime.value = Date.now()
    } else if (hoverStartTime.value && Date.now() - hoverStartTime.value > HOVER_NEST_DELAY) {
      // Move to parent
      const targetComponent = components.value.find(c => c.id === targetComponentId)
      if (targetComponent && targetComponent.type === 'Panel') {
        setComponentParent(draggingComponentId, targetComponentId)
        hoverTarget.value = null
        hoverStartTime.value = null
      }
    }
  } else {
    hoverTarget.value = null
    hoverStartTime.value = null
  }
}

// Right-click context menu
const handleRightClick = (event: MouseEvent, componentId: string) => {
  event.preventDefault()
  event.stopPropagation()
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    componentId
  }
}

// Handle context menu actions
const handleContextAction = (action: string, componentId: string) => {
  contextMenu.value.show = false
  
  switch (action) {
    case 'select':
      selectComponent(componentId)
      break
    case 'edit':
      openEditModal(componentId)
      break
    case 'remove':
      removeComponent(componentId)
      break
    case 'duplicate': {
      const component = components.value.find(c => c.id === componentId)
      if (component) {
        const pixels = offsetsToPixels(component)
        const duplicate: ComponentData = {
          ...component,
          id: crypto.randomUUID(),
          name: generateUniqueComponentName(components.value, component.type),
        }
        
        // Offset the duplicate slightly
        pixelsToOffsets(
          pixels.x + 20, 
          pixels.y + 20, 
          pixels.width, 
          pixels.height, 
          duplicate
        )
        
        components.value = [...components.value, duplicate]
      }
      break
    }
  }
}

// Handle anchor preset from context menu
const handleContextAnchorPreset = (preset: AnchorPreset, componentId: string) => {
  const component = components.value.find(c => c.id === componentId)
  if (component) {
    applyAnchorPreset(component, preset)
    forceComponentUpdate(component)
  }
}

// Handle offset preset from context menu
const handleContextOffsetPreset = (preset: OffsetPreset, componentId: string) => {
  const component = components.value.find(c => c.id === componentId)
  if (component) {
    switch (preset) {
      case 'none':
        // No offset changes
        break
      case 'square-small':
        pixelsToOffsets(snapToGrid(50), snapToGrid(50), snapToGrid(100), snapToGrid(100), component)
        break
      case 'square-medium':
        pixelsToOffsets(snapToGrid(100), snapToGrid(100), snapToGrid(200), snapToGrid(200), component)
        break
      case 'square-large':
        pixelsToOffsets(snapToGrid(150), snapToGrid(150), snapToGrid(300), snapToGrid(300), component)
        break
      case 'rectangle-small':
        pixelsToOffsets(snapToGrid(50), snapToGrid(50), snapToGrid(150), snapToGrid(75), component)
        break
      case 'rectangle-medium':
        pixelsToOffsets(snapToGrid(100), snapToGrid(100), snapToGrid(300), snapToGrid(150), component)
        break
      case 'rectangle-large':
        pixelsToOffsets(snapToGrid(150), snapToGrid(150), snapToGrid(450), snapToGrid(225), component)
        break
    }
    forceComponentUpdate(component)
  }
}

// Double-click to edit
const handleDoubleClick = (componentId: string) => {
  openEditModal(componentId)
}

// Viewport click (deselect)
const handleViewportClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    selectedComponent.value = null
  }
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Shift') {
    isShiftPressed.value = true
  } else if (event.key === 'Alt') {
    isAltPressed.value = true
  } else if (event.key === 'Delete' && selectedComponent.value) {
    removeComponent(selectedComponent.value)
  }
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Shift') {
    isShiftPressed.value = false
  } else if (event.key === 'Alt') {
    isAltPressed.value = false
  }
}

// Event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  document.addEventListener('click', () => {
    contextMenu.value.show = false
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
    <div class="space-y-4">
      <!-- Layout Grid -->
      <div class="space-y-6">
        <!-- Viewport (Full Width) -->
        <LayoutViewport
          :selectedComponent="selectedComponent"
          :components="components"
          :viewportDimensions="viewportDimensions"
          :gridSettings="gridSettings"
          :hoverTarget="hoverTarget"
          :editingMode="editingMode"
          :isShiftPressed="isShiftPressed"
          :isAltPressed="isAltPressed"
          :offsetsToPixels="offsetsToPixels"
          @update:selectedComponent="selectedComponent = $event"
          @update:editingMode="editingMode = $event as EditingMode"
          @update:aspectRatio="pluginData.layout.viewport.aspectRatio = $event as AspectRatio"
          @component:mousedown="handleMouseDown"
          @component:rightclick="handleRightClick"
          @component:doubleclick="handleDoubleClick"
          @viewport:click="handleViewportClick"
        />

        <div class="space-y-4">
          <!-- Tab Navigation -->
          <div class="flex gap-2 border-b border-slate-700">
            <button
              :class="[
                'px-4 py-2 text-sm font-medium transition-colors',
                currentTab === 'components'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              ]"
              @click="currentTab = 'components'"
            >
              Components
            </button>
            <button
              :class="[
                'px-4 py-2 text-sm font-medium transition-colors',
                currentTab === 'settings'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              ]"
              @click="currentTab = 'settings'"
            >
              Settings
            </button>
          </div>

          <!-- Tab Content -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Components List -->
            <LayoutComponentsList
              v-if="currentTab === 'components'"
              :selectedComponent="selectedComponent"
              :components="components"
              @update:selectedComponent="selectedComponent = $event"
              @component:add="addComponent"
              @component:edit="openEditModal"
              @component:remove="removeComponent"
              @component:select="selectComponent"
              @components:reorder="reorderComponents"
            />

            <!-- Settings -->
            <LayoutSettings
              v-if="currentTab === 'settings'"
              :gridSettings="gridSettings"
            />
          </div>
        </div>

      <!-- Context Menu -->
      <LayoutContextMenu
        v-if="contextMenu.show"
        :contextMenu="contextMenu"
        @update:contextMenu="contextMenu = $event"
        @action="handleContextAction"
        @anchor-preset="handleContextAnchorPreset"
        @offset-preset="handleContextOffsetPreset"
      />

      <!-- Edit Modal -->
      <LayoutEditModal
        v-if="showEditModal && editingComponent"
        :show="showEditModal"
        :component="editingComponent"
        :anchorPresets="anchorPresets"
        :applyAnchorPreset="applyAnchorPreset"
        @update:show="showEditModal = $event"
        @save="saveComponentEdit"
      />
    </div>
  </div>
</template>