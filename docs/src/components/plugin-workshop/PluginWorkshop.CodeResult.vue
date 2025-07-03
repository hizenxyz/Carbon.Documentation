<script setup lang="ts">
import CodeBlock from '@/components/common/CodeBlock.vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'
import type { Highlighter } from 'shiki'
import { getSingletonHighlighter } from 'shiki'
import { shallowRef, provide, readonly, onMounted } from 'vue'

const { generatedCode } = usePluginWorkshop()

const highlighter = shallowRef<Highlighter | null>(null)
provide('highlighter', readonly(highlighter))

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
  <div>
    <Transition name="expand">
      <CodeBlock :code="generatedCode" class="mt-2" />
    </Transition>
  </div>
</template> 