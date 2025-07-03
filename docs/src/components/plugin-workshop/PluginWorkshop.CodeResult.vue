<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useClipboard } from '@vueuse/core'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { usePluginWorkshop } from './PluginWorkshop.Store'

const { generatedCode, codeToHighlight } = usePluginWorkshop()
const codeBlock = ref<HTMLElement | null>(null)

const { copy, copied } = useClipboard({ source: generatedCode })

function copyCode() {
  copy(generatedCode.value)
}

function highlightCode() {
  if (codeBlock.value) {
    codeBlock.value.innerHTML = hljs.highlight(codeToHighlight.value, { language: 'csharp' }).value
  }
}

watch(codeToHighlight, highlightCode)
onMounted(highlightCode)
</script>

<template>
  <div class="relative mt-5 bg-zinc-900/50 p-6">
    <div class="absolute top-4 right-4 z-10">
      <button @click="copyCode" class="r-button text-xs !bg-slate-700/50">
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre class="hljs language-csharp" style="margin: 0; padding: 1.5rem; border-radius: 0.5rem;"><code ref="codeBlock" class="language-csharp"></code></pre>
  </div>
</template>

<style>
.hljs {
  padding: 1.5rem;
}
</style>

<style scoped>
:deep(.hljs) {
  background-color: transparent !important;
}
</style> 