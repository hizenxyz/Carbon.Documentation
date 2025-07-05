<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trash2, Edit3, Plus, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { VueDraggable } from 'vue-draggable-plus'
import { usePluginWorkshop } from '../PluginWorkshop.Store'
import type { ComponentData, ComponentType } from '../PluginWorkshop.Store'

interface Props {
  selectedComponent: string | null
  components: ComponentData[]
}

interface Emits {
  (e: 'update:selectedComponent', value: string | null): void
  (e: 'component:add', type: ComponentType): void
  (e: 'component:edit', componentId: string): void
  (e: 'component:remove', componentId: string): void
  (e: 'component:select', componentId: string): void
  (e: 'components:reorder', newOrder: ComponentData[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { 
  getComponentChildren,
  getComponentDepth,
  getHierarchicalComponents,
  reorderComponents
} = usePluginWorkshop()

// Available component types
const availableComponentTypes: { value: ComponentType; label: string }[] = [
  { value: 'Panel', label: 'Panel' },
  { value: 'Text', label: 'Text' }
]

// Collapsed state for hierarchical view
const collapsedComponents = ref<Set<string>>(new Set())

// Hierarchical components for display (respecting collapsed state)
const hierarchicalComponents = computed({
  get: () => {
    const allComponents = getHierarchicalComponents()
    const visibleComponents: ComponentData[] = []
    
    const isParentCollapsed = (componentId: string): boolean => {
      let current = props.components.find(c => c.id === componentId)?.parentId
      while (current) {
        if (collapsedComponents.value.has(current)) {
          return true
        }
        const parent = props.components.find(c => c.id === current)
        current = parent?.parentId
      }
      return false
    }
    
    allComponents.forEach(component => {
      if (!isParentCollapsed(component.id)) {
        visibleComponents.push(component)
      }
    })
    
    return visibleComponents
  },
  set: (newOrder: ComponentData[]) => {
    emit('components:reorder', newOrder)
  }
})

const toggleComponentCollapsed = (componentId: string) => {
  if (collapsedComponents.value.has(componentId)) {
    collapsedComponents.value.delete(componentId)
  } else {
    collapsedComponents.value.add(componentId)
  }
}

// Drag and drop handlers for VueDraggable
const handleDragStart = (event: any) => {
  console.log('Drag started:', event)
}

const handleDragEnd = () => {
  // VueDraggable automatically updates the model, we just need to sync
  reorderComponents(hierarchicalComponents.value)
}

// Event handlers
const addComponent = (type: ComponentType) => {
  emit('component:add', type)
}

const selectComponent = (componentId: string) => {
  emit('component:select', componentId)
}

const editComponent = (componentId: string) => {
  emit('component:edit', componentId)
}

const removeComponent = (componentId: string) => {
  emit('component:remove', componentId)
}


</script>

<template>
  <div class="rounded-lg bg-slate-800/50 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Components</h3>
      <div class="flex gap-1">
        <button
          v-for="type in availableComponentTypes"
          :key="type.value"
          @click="addComponent(type.value)"
          class="bg-slate-700 hover:bg-slate-600 rounded-md px-3 py-1 text-xs text-white transition-colors"
          :title="`Add ${type.label}`"
        >
          <Plus class="h-3 w-3 inline mr-1" />{{ type.label }}
        </button>
      </div>
    </div>
    
    <!-- Components List -->
    <VueDraggable
      v-model="hierarchicalComponents"
      :animation="150"
      ghostClass="ghost"
      handle=".drag-handle"
      class="space-y-1"
      @start="handleDragStart"
      @end="handleDragEnd"
    >
      <div
        v-for="component in hierarchicalComponents"
        :key="component.id"
        class="component-item"
        :style="{ paddingLeft: `${getComponentDepth(component.id) * 16 + 8}px` }"
        :class="{ 
          'ring-2 ring-blue-500': selectedComponent === component.id
        }"
      >
        <div class="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
          <!-- Collapse Toggle -->
          <button
            v-if="getComponentChildren(component.id).length > 0"
            @click="toggleComponentCollapsed(component.id)"
            class="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <ChevronDown v-if="!collapsedComponents.has(component.id)" class="h-3 w-3 text-slate-400" />
            <ChevronRight v-else class="h-3 w-3 text-slate-400" />
          </button>
          <div v-else class="w-5 h-5"></div>
          
          <!-- Drag Handle -->
          <div class="flex-shrink-0 cursor-grab active:cursor-grabbing drag-handle">
            <div class="w-4 h-4 grid grid-cols-2 gap-px">
              <div class="w-1 h-1 bg-slate-500 rounded-full"></div>
              <div class="w-1 h-1 bg-slate-500 rounded-full"></div>
              <div class="w-1 h-1 bg-slate-500 rounded-full"></div>
              <div class="w-1 h-1 bg-slate-500 rounded-full"></div>
            </div>
          </div>
          

          
          <!-- Component Info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate text-sm">{{ component.name }}</div>
            <div class="text-xs text-slate-400">{{ component.type }}</div>
          </div>
          
          <!-- Actions -->
          <button
            @click="selectComponent(component.id)"
            class="p-1 hover:bg-slate-700 rounded transition-colors"
            :class="{ 'bg-blue-600': selectedComponent === component.id }"
            title="Select in Viewport"
          >
            <div class="w-3 h-3 border border-current rounded"></div>
          </button>
          
          <button
            @click="editComponent(component.id)"
            class="p-1 hover:bg-slate-700 rounded transition-colors"
            title="Edit Properties"
          >
            <Edit3 class="h-3 w-3 text-slate-400" />
          </button>
          
          <button
            @click="removeComponent(component.id)"
            class="p-1 hover:bg-red-900/50 rounded transition-colors"
            title="Delete Component"
          >
            <Trash2 class="h-3 w-3 text-red-400" />
          </button>
        </div>
      </div>
      
      <div v-if="components.length === 0" class="text-center py-8 text-slate-500">
        <p>No components yet</p>
        <p class="text-xs mt-1">Use the buttons above to add components</p>
      </div>
    </VueDraggable>
  </div>
</template>