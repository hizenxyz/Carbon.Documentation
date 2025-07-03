<script setup lang="ts">
import CodeBlock from '@/components/common/CodeBlock.vue'
import ButtonIconCopy from '@/components/common/ButtonIconCopy.vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'
import type { Highlighter } from 'shiki'
import { getSingletonHighlighter } from 'shiki'
import { shallowRef, provide, readonly, onMounted } from 'vue'

const { pluginData, generatedCode } = usePluginWorkshop()

const highlighter = shallowRef<Highlighter | null>(null)
provide('highlighter', readonly(highlighter))

const isCodeExpanded = shallowRef<boolean>(true)

const pluginTypes = [
  { id: 'Hybrid', name: 'Carbon + Oxide', description: 'Carbon plugin, but with Carbon Aliases requirement for Oxide servers.' },
  { id: 'Carbon', name: 'Carbon-exclusive', description: 'Carbon-only plugin' },
  { id: 'Oxide', name: 'Oxide-targeted', description: 'Oxide plugin (works with Carbon, but no layout)' }
] as const

function selectPluginType(type: 'Hybrid' | 'Carbon' | 'Oxide') {
  pluginData.value.pluginType = type
}

async function tryLoadHighlighter() {
  try {
    highlighter.value = await getSingletonHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['csharp'],
    })
  } catch (err) {
    console.error('Failed to load highlighter:', err)
  }
}

onMounted(async () => {
  await tryLoadHighlighter()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex">
          <button
            v-for="type in pluginTypes"
            :key="type.id"
            class="r-button text-xs"
            @click="selectPluginType(type.id)"
            :class="{ 'toggled': pluginData.pluginType === type.id }"
            :title="type.description"
          >
            {{ type.name }}
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          class="r-button text-xs"
          @click="() => (isCodeExpanded = !isCodeExpanded)"
        >
          {{ isCodeExpanded ? 'Hide Code' : 'Show Code' }}
        </button>
        <ButtonIconCopy 
          :getTextToCopy="() => generatedCode" 
          class="r-button text-xs"
        />
      </div>
    </div>

    <Transition name="expand">
      <CodeBlock 
        v-if="isCodeExpanded" 
        :code="generatedCode" 
      />
    </Transition>
  </div>
</template>

<style scoped>
.r-button {
  opacity: 50%;
  background-color: var(--vp-code-copy-code-bg);
  padding: 7.5px 15px;
  align-items: flex-start;
  text-align: left;
  display: ruby;
  transition-duration: 0s;
  border-bottom: 2px solid transparent;
}

.r-button:hover {
  opacity: 75%;
  background-color: var(--docsearch-text-color);
}

.r-button.toggled {
  opacity: 100%;
  background-color: var(--vp-button-alt-bg);
  border-bottom: 2px solid #ffffff29;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.44, 1.1, 0.91, 0.94);
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.expand-enter-active {
  transition-duration: 0.25s;
}

.expand-leave-active {
  transition-duration: 0.2s;
}
</style> 