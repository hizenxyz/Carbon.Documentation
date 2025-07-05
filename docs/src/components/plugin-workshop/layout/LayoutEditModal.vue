<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePluginWorkshop } from '../PluginWorkshop.Store'
import type { ComponentData, FontFamily, FontAnchor, AnchorPreset } from '../PluginWorkshop.Store'

export type OffsetPreset = 'none' | 'square-small' | 'square-medium' | 'square-large' | 'rectangle-small' | 'rectangle-medium' | 'rectangle-large'

interface Props {
  show: boolean
  component: ComponentData | null
  anchorPresets: Record<AnchorPreset, { anchorMin: { x: number; y: number }, anchorMax: { x: number; y: number } }>
  applyAnchorPreset: (component: ComponentData, preset: AnchorPreset) => void
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'save', component: ComponentData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { pluginData, getPossibleParents } = usePluginWorkshop()

// Internal editing state
const editingComponent = ref<ComponentData | null>(null)

// Available options
const availableFontFamilies: { value: FontFamily; label: string }[] = [
  { value: 'PermanentMarker', label: 'Permanent Marker' },
  { value: 'NotoSansArabicBold', label: 'Noto Sans Arabic Bold' },
  { value: 'DroidSansMono', label: 'Droid Sans Mono' },
  { value: 'RobotoCondensedBold', label: 'Roboto Condensed Bold' },
  { value: 'RobotoCondensedRegular', label: 'Roboto Condensed Regular' }
]

const availableFontAnchors: { value: FontAnchor; label: string }[] = [
  { value: 'UpperLeft', label: 'Upper Left' },
  { value: 'UpperCenter', label: 'Upper Center' },
  { value: 'UpperRight', label: 'Upper Right' },
  { value: 'MiddleLeft', label: 'Middle Left' },
  { value: 'MiddleCenter', label: 'Middle Center' },
  { value: 'MiddleRight', label: 'Middle Right' },
  { value: 'LowerLeft', label: 'Lower Left' },
  { value: 'LowerCenter', label: 'Lower Center' },
  { value: 'LowerRight', label: 'Lower Right' }
]

const availableAnchorPresets: { value: AnchorPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'full', label: 'Full' },
  { value: 'upper-left', label: 'Upper Left' },
  { value: 'upper-center', label: 'Upper Center' },
  { value: 'upper-right', label: 'Upper Right' },
  { value: 'middle-left', label: 'Middle Left' },
  { value: 'middle-center', label: 'Middle Center' },
  { value: 'middle-right', label: 'Middle Right' },
  { value: 'lower-left', label: 'Lower Left' },
  { value: 'lower-center', label: 'Lower Center' },
  { value: 'lower-right', label: 'Lower Right' },
  { value: 'custom', label: 'Custom' }
]

const availableOffsetPresets: { value: OffsetPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'square-small', label: 'Square - Small' },
  { value: 'square-medium', label: 'Square - Medium' },
  { value: 'square-large', label: 'Square - Large' },
  { value: 'rectangle-small', label: 'Rectangle - Small' },
  { value: 'rectangle-medium', label: 'Rectangle - Medium' },
  { value: 'rectangle-large', label: 'Rectangle - Large' }
]

// Get possible parents for the component
const getPossibleParentsForComponent = computed(() => {
  if (!editingComponent.value) return []
  
  return [
    { id: '', name: 'No Parent (Root Level)' },
    ...getPossibleParents(editingComponent.value.id).map(c => ({ id: c.id, name: c.name }))
  ]
})

// Helper functions for relative/absolute conversion

// Watch for changes to the component prop
watch(
  () => props.component,
  (newComponent) => {
    if (newComponent) {
      editingComponent.value = { ...newComponent }
    }
  },
  { immediate: true }
)

// Handle anchor preset change
const handleAnchorPresetChange = (preset: AnchorPreset) => {
  if (!editingComponent.value) return
  
  // Apply the anchor preset which updates the anchor values
  props.applyAnchorPreset(editingComponent.value, preset)
}

// Handle offset preset change
const handleOffsetPresetChange = (preset: OffsetPreset) => {
  if (!editingComponent.value) return
  
  switch (preset) {
    case 'none':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 0
      editingComponent.value.offsetMax.y = 0
      break
    case 'square-small':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 100
      editingComponent.value.offsetMax.y = 100
      break
    case 'square-medium':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 200
      editingComponent.value.offsetMax.y = 200
      break
    case 'square-large':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 300
      editingComponent.value.offsetMax.y = 300
      break
    case 'rectangle-small':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 150
      editingComponent.value.offsetMax.y = 100
      break
    case 'rectangle-medium':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 250
      editingComponent.value.offsetMax.y = 150
      break
    case 'rectangle-large':
      editingComponent.value.offsetMin.x = 0
      editingComponent.value.offsetMin.y = 0
      editingComponent.value.offsetMax.x = 350
      editingComponent.value.offsetMax.y = 200
      break
  }
}

// Handle manual anchor changes - automatically switch to custom
const handleAnchorChange = () => {
  if (!editingComponent.value) return
  editingComponent.value.anchorPreset = 'custom'
}

// Handle modal close
const handleClose = () => {
  emit('update:show', false)
  editingComponent.value = null
}

// Handle save
const handleSave = () => {
  if (editingComponent.value) {
    emit('save', editingComponent.value)
    handleClose()
  }
}

// Handle clicking outside modal
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <div
    v-if="show && editingComponent"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="handleBackdropClick"
  >
    <div class="bg-slate-800 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h3 class="text-lg font-semibold text-white mb-4">Edit {{ editingComponent.name }}</h3>
      
      <div class="space-y-4">
        <!-- Name and Parent Component -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="r-settings-input-label">Name</label>
            <input
              v-model="editingComponent.name"
              type="text"
              class="r-settings-custom-input"
              required
            />
          </div>
          <div>
            <label class="r-settings-input-label">Parent Component</label>
            <select
              v-model="editingComponent.parentId"
              class="r-settings-custom-input"
            >
              <option
                v-for="parent in getPossibleParentsForComponent"
                :key="parent.id"
                :value="parent.id || undefined"
              >
                {{ parent.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Positioning -->
        <div class="bg-slate-900/50 p-3 rounded-lg">
          <p class="text-sm text-slate-400 mb-3 font-medium">Positioning</p>
          
          <!-- Presets -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="r-settings-input-label">Anchor Preset</label>
              <select
                v-model="editingComponent.anchorPreset"
                class="r-settings-custom-input"
                @change="handleAnchorPresetChange(editingComponent.anchorPreset)"
              >
                <option v-for="preset in availableAnchorPresets" :key="preset.value" :value="preset.value">
                  {{ preset.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="r-settings-input-label">Offset Preset</label>
              <select
                v-model="editingComponent.offsetPreset"
                class="r-settings-custom-input"
                @change="handleOffsetPresetChange(editingComponent.offsetPreset as OffsetPreset)"
              >
                <option v-for="preset in availableOffsetPresets" :key="preset.value" :value="preset.value">
                  {{ preset.label }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Anchors and Offsets side by side -->
          <div class="grid grid-cols-2 gap-6">
            <!-- Anchors -->
            <div>
              <p class="text-xs text-slate-500 mb-2">Anchors (0-1 normalized)</p>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="r-settings-input-label">Min X</label>
                    <input
                      v-model.number="editingComponent.anchorMin.x"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                  <div>
                    <label class="r-settings-input-label">Min Y</label>
                    <input
                      v-model.number="editingComponent.anchorMin.y"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="r-settings-input-label">Max X</label>
                    <input
                      v-model.number="editingComponent.anchorMax.x"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                  <div>
                    <label class="r-settings-input-label">Max Y</label>
                    <input
                      v-model.number="editingComponent.anchorMax.y"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Offsets -->
            <div>
              <p class="text-xs text-slate-500 mb-2">Offsets (pixel distances)</p>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="r-settings-input-label">Min X</label>
                    <input
                      v-model.number="editingComponent.offsetMin.x"
                      type="number"
                      step="0.1"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                  <div>
                    <label class="r-settings-input-label">Min Y</label>
                    <input
                      v-model.number="editingComponent.offsetMin.y"
                      type="number"
                      step="0.1"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="r-settings-input-label">Max X</label>
                    <input
                      v-model.number="editingComponent.offsetMax.x"
                      type="number"
                      step="0.1"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                  <div>
                    <label class="r-settings-input-label">Max Y</label>
                    <input
                      v-model.number="editingComponent.offsetMax.y"
                      type="number"
                      step="0.1"
                      class="r-settings-custom-input"
                      @input="handleAnchorChange"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel Properties -->
        <div v-if="editingComponent.type === 'Panel'">
          <label class="r-settings-input-label">Panel Color</label>
          <div class="flex gap-2">
            <input
              v-model="editingComponent.panelColor"
              type="color"
              class="r-settings-custom-input h-10 flex-1"
            />
            <div class="w-20">
              <input
                v-model.number="editingComponent.panelOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="w-full h-10"
                :title="`Opacity: ${(editingComponent.panelOpacity || 1) * 100}%`"
              />
            </div>
          </div>
        </div>
        
        <!-- Text Properties -->
        <template v-if="editingComponent.type === 'Text'">
          <div>
            <label class="r-settings-input-label">Label</label>
            <input
              v-model="editingComponent.label"
              type="text"
              class="r-settings-custom-input"
            />
          </div>
          
          <div>
            <label class="r-settings-input-label">Font Color</label>
            <div class="flex gap-2">
              <input
                v-model="editingComponent.fontColor"
                type="color"
                class="r-settings-custom-input h-10 flex-1"
              />
              <div class="w-20">
                <input
                  v-model.number="editingComponent.fontOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="w-full h-10"
                  :title="`Opacity: ${(editingComponent.fontOpacity || 1) * 100}%`"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label class="r-settings-input-label">Font Size</label>
            <input
              v-model.number="editingComponent.fontSize"
              type="number"
              min="8"
              max="48"
              class="r-settings-custom-input"
            />
          </div>
          
          <div>
            <label class="r-settings-input-label">Font Family</label>
            <select
              v-model="editingComponent.fontFamily"
              class="r-settings-custom-input"
            >
              <option v-for="font in availableFontFamilies" :key="font.value" :value="font.value">
                {{ font.label }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="r-settings-input-label">Font Anchor</label>
            <select
              v-model="editingComponent.fontAnchor"
              class="r-settings-custom-input"
            >
              <option v-for="anchor in availableFontAnchors" :key="anchor.value" :value="anchor.value">
                {{ anchor.label }}
              </option>
            </select>
          </div>
        </template>
      </div>
      
      <!-- Modal Actions -->
      <div class="flex gap-2 mt-6">
        <button
          @click="handleSave"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Save Changes
        </button>
        <button
          @click="handleClose"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.r-settings-input-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.05em;
  display: block;
}

.r-settings-custom-input {
  background-color: #1a1a1a;
  color: white;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease-in-out;
  width: 100%;
}

.r-settings-custom-input:focus {
  border-color: #888;
}
</style> 