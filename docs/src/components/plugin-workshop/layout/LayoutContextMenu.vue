<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import type { AnchorPreset } from '../PluginWorkshop.Store'
import type { OffsetPreset } from './LayoutEditModal.vue'

interface ContextMenuState {
  show: boolean
  x: number
  y: number
  componentId: string | null
}

interface Props {
  contextMenu: ContextMenuState
}

interface Emits {
  (e: 'update:contextMenu', value: ContextMenuState): void
  (e: 'action', action: string, componentId: string): void
  (e: 'anchor-preset', preset: AnchorPreset, componentId: string): void
  (e: 'offset-preset', preset: OffsetPreset, componentId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const contextMenuRef = ref<HTMLDivElement | null>(null)

// Handle context menu actions
const handleAction = (action: string) => {
  if (props.contextMenu.componentId) {
    emit('action', action, props.contextMenu.componentId)
  }
  closeContextMenu()
}

// Handle anchor preset selection
const handleAnchorPreset = (preset: AnchorPreset) => {
  if (props.contextMenu.componentId) {
    emit('anchor-preset', preset, props.contextMenu.componentId)
  }
  closeContextMenu()
}

// Handle offset preset selection
const handleOffsetPreset = (preset: OffsetPreset) => {
  if (props.contextMenu.componentId) {
    emit('offset-preset', preset, props.contextMenu.componentId)
  }
  closeContextMenu()
}

// Close context menu
const closeContextMenu = () => {
  emit('update:contextMenu', {
    show: false,
    x: 0,
    y: 0,
    componentId: null
  })
}

// Available presets
const anchorPresets: { value: AnchorPreset; label: string }[] = [
  { value: 'upper-left', label: 'Upper Left' },
  { value: 'upper-center', label: 'Upper Center' },
  { value: 'upper-right', label: 'Upper Right' },
  { value: 'middle-left', label: 'Middle Left' },
  { value: 'middle-center', label: 'Middle Center' },
  { value: 'middle-right', label: 'Middle Right' },
  { value: 'lower-left', label: 'Lower Left' },
  { value: 'lower-center', label: 'Lower Center' },
  { value: 'lower-right', label: 'Lower Right' },
  { value: 'full', label: 'Full' }
]

const offsetPresets: { value: OffsetPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'square-small', label: 'Square - Small' },
  { value: 'square-medium', label: 'Square - Medium' },
  { value: 'square-large', label: 'Square - Large' },
  { value: 'rectangle-small', label: 'Rectangle - Small' },
  { value: 'rectangle-medium', label: 'Rectangle - Medium' },
  { value: 'rectangle-large', label: 'Rectangle - Large' }
]

// Handle click outside to close
const handleClickOutside = (event: MouseEvent) => {
  if (contextMenuRef.value && !contextMenuRef.value.contains(event.target as Node)) {
    closeContextMenu()
  }
}

// Set up event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
  
  // Clear any pending timers
  if (anchorSubmenuTimer) {
    clearTimeout(anchorSubmenuTimer)
  }
  if (offsetSubmenuTimer) {
    clearTimeout(offsetSubmenuTimer)
  }
})

// Submenu state
const showAnchorSubmenu = ref(false)
const showOffsetSubmenu = ref(false)
let anchorSubmenuTimer: ReturnType<typeof setTimeout> | null = null
let offsetSubmenuTimer: ReturnType<typeof setTimeout> | null = null

// Submenu control functions
const showAnchorSubmenuDelayed = () => {
  if (anchorSubmenuTimer) {
    clearTimeout(anchorSubmenuTimer)
    anchorSubmenuTimer = null
  }
  showAnchorSubmenu.value = true
}

const hideAnchorSubmenuDelayed = () => {
  anchorSubmenuTimer = setTimeout(() => {
    showAnchorSubmenu.value = false
  }, 150) // 150ms delay
}

const showOffsetSubmenuDelayed = () => {
  if (offsetSubmenuTimer) {
    clearTimeout(offsetSubmenuTimer)
    offsetSubmenuTimer = null
  }
  showOffsetSubmenu.value = true
}

const hideOffsetSubmenuDelayed = () => {
  offsetSubmenuTimer = setTimeout(() => {
    showOffsetSubmenu.value = false
  }, 150) // 150ms delay
}

// Adjust position to prevent menu from going off-screen
const adjustedPosition = () => {
  if (!props.contextMenu.show) return { left: '0px', top: '0px' }
  
  const menuWidth = 200 // Approximate width
  const menuHeight = 300 // Approximate height (increased for submenus)
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  let x = props.contextMenu.x
  let y = props.contextMenu.y
  
  // Adjust if menu would go off right edge
  if (x + menuWidth > windowWidth) {
    x = windowWidth - menuWidth - 10
  }
  
  // Adjust if menu would go off bottom edge
  if (y + menuHeight > windowHeight) {
    y = windowHeight - menuHeight - 10
  }
  
  return {
    left: `${x}px`,
    top: `${y}px`
  }
}
</script>

<template>
  <div
    v-if="contextMenu.show"
    ref="contextMenuRef"
    class="fixed bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 py-1 min-w-[160px]"
    :style="adjustedPosition()"
  >
    <button
      @click="handleAction('edit')"
      class="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Edit Properties
    </button>
    
    <button
      @click="handleAction('duplicate')"
      class="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Duplicate
    </button>
    
    <hr class="border-slate-600 my-1">
    
    <!-- Anchor Presets -->
    <div class="relative">
      <button
        @mouseenter="showAnchorSubmenuDelayed"
        @mouseleave="hideAnchorSubmenuDelayed"
        class="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Anchor Presets
        </div>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <!-- Anchor Submenu -->
      <div
        v-if="showAnchorSubmenu"
        @mouseenter="showAnchorSubmenuDelayed"
        @mouseleave="hideAnchorSubmenuDelayed"
        class="absolute left-full top-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg py-1 min-w-[140px] ml-1"
      >
        <button
          v-for="preset in anchorPresets"
          :key="preset.value"
          @click="handleAnchorPreset(preset.value)"
          class="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    
    <!-- Offset Presets -->
    <div class="relative">
      <button
        @mouseenter="showOffsetSubmenuDelayed"
        @mouseleave="hideOffsetSubmenuDelayed"
        class="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Offset Presets
        </div>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <!-- Offset Submenu -->
      <div
        v-if="showOffsetSubmenu"
        @mouseenter="showOffsetSubmenuDelayed"
        @mouseleave="hideOffsetSubmenuDelayed"
        class="absolute left-full top-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg py-1 min-w-[140px] ml-1"
      >
        <button
          v-for="preset in offsetPresets"
          :key="preset.value"
          @click="handleOffsetPreset(preset.value)"
          class="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    
    <hr class="border-slate-600 my-1">
    
    <button
      @click="handleAction('delete')"
      class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </button>
  </div>
</template>

<style scoped>
/* Additional styling for context menu */
.context-menu-enter-active,
.context-menu-leave-active {
  transition: all 0.1s ease;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style> 