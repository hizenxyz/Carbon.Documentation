<script setup lang="ts">
import { computed } from 'vue'
import { usePluginWorkshop } from '../PluginWorkshop.Store'
import type { ParentContainer, FontFamily, FontAnchor, GridSettings } from '../PluginWorkshop.Store'

interface Props {
  gridSettings: GridSettings
}

const props = defineProps<Props>()
const { pluginData } = usePluginWorkshop()

const viewport = computed({
  get: () => pluginData.value.layout.viewport,
  set: (value) => {
    pluginData.value.layout.viewport = value
  }
})

const grid = computed({
  get: () => pluginData.value.layout.grid,
  set: (value) => {
    pluginData.value.layout.grid = value
  }
})

// Available options
const availableParentContainers: { value: ParentContainer; label: string }[] = [
  { value: 'Overall', label: 'Overall' },
  { value: 'Overlay', label: 'Overlay' },
  { value: 'Inventory', label: 'Inventory' }
]

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

const gridSizeOptions = [5, 10, 15, 20, 25, 30]
</script>

<template>
  <div class="space-y-6">
    <!-- Grid Settings -->
    <div class="rounded-lg bg-slate-800/50 p-4">
      <h3 class="text-lg font-semibold text-white mb-4">Grid Settings</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Show Grid -->
        <div>
          <label class="r-settings-input-label">Show Grid</label>
          <div class="flex items-center h-10">
            <input
              v-model="grid.enabled"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-slate-300">Enable grid overlay</span>
          </div>
        </div>

        <!-- Grid Size -->
        <div>
          <label class="r-settings-input-label">Grid Size</label>
          <select
            v-model="grid.size"
            class="r-settings-custom-input"
            :disabled="!grid.enabled"
          >
            <option v-for="size in gridSizeOptions" :key="size" :value="size">
              {{ size }}px
            </option>
          </select>
        </div>

        <!-- Snap to Grid -->
        <div>
          <label class="r-settings-input-label">Snap to Grid</label>
          <div class="flex items-center h-10">
            <input
              v-model="grid.snapToGrid"
              type="checkbox"
              class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              :disabled="!grid.enabled"
            />
            <span class="ml-2 text-sm text-slate-300">Snap components to grid</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Viewport Settings -->
    <div class="rounded-lg bg-slate-800/50 p-4">
      <h3 class="text-lg font-semibold text-white mb-4">Viewport Settings</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Parent Container -->
        <div>
          <label class="r-settings-input-label">Parent Container</label>
          <select
            v-model="viewport.parentContainer"
            class="r-settings-custom-input"
          >
            <option v-for="parent in availableParentContainers" :key="parent.value" :value="parent.value">
              {{ parent.label }}
            </option>
          </select>
        </div>

        <!-- Background Color -->
        <div>
          <label class="r-settings-input-label">Background Color</label>
          <div class="flex gap-2">
            <input
              v-model="viewport.defaults.backgroundColor"
              type="color"
              class="r-settings-custom-input h-10 flex-1"
            />
            <div class="w-20">
              <input
                v-model.number="viewport.defaults.backgroundOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="w-full h-10"
                :title="`Opacity: ${(viewport.defaults.backgroundOpacity || 1) * 100}%`"
              />
            </div>
          </div>
        </div>
        
        <!-- Font Color -->
        <div>
          <label class="r-settings-input-label">Font Color</label>
          <div class="flex gap-2">
            <input
              v-model="viewport.defaults.fontColor"
              type="color"
              class="r-settings-custom-input h-10 flex-1"
            />
            <div class="w-20">
              <input
                v-model.number="viewport.defaults.fontOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="w-full h-10"
                :title="`Opacity: ${(viewport.defaults.fontOpacity || 1) * 100}%`"
              />
            </div>
          </div>
        </div>
        
        <!-- Font Size -->
        <div>
          <label class="r-settings-input-label">Font Size</label>
          <input
            v-model.number="viewport.defaults.fontSize"
            type="number"
            min="8"
            max="48"
            class="r-settings-custom-input"
          />
        </div>
        
        <!-- Font Family -->
        <div>
          <label class="r-settings-input-label">Font Family</label>
          <select
            v-model="viewport.defaults.fontFamily"
            class="r-settings-custom-input"
          >
            <option v-for="font in availableFontFamilies" :key="font.value" :value="font.value">
              {{ font.label }}
            </option>
          </select>
        </div>
        
        <!-- Font Anchor -->
        <div>
          <label class="r-settings-input-label">Font Anchor</label>
          <select
            v-model="viewport.defaults.fontAnchor"
            class="r-settings-custom-input"
          >
            <option v-for="anchor in availableFontAnchors" :key="anchor.value" :value="anchor.value">
              {{ anchor.label }}
            </option>
          </select>
        </div>
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

.r-settings-custom-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 