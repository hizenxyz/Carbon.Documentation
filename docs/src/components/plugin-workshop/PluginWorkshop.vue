<script setup lang="ts">
import { ref } from 'vue'
import PluginGenerator from './PluginWorkshop.Generator.vue'
import LayoutBuilder from './PluginWorkshop.LayoutBuilder.vue'

const selectedTab = ref(0)
const tabs = [
  { name: 'Plugin Generator', description: 'Create a default plugin layout from provided basic data.' },
  { name: 'Layout Builder', description: 'Design layouts and have the code generated for you.' }
]
</script>

<template>
  <div class="mx-auto max-w-screen-lg px-4 py-8 space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Plugin Workshop</h1>
      <p class="text-lg text-slate-500 dark:text-slate-400">
        Tools to help you create and edit plugins for Carbon.
      </p>
    </div>

    <div class="r-settings">
      <div class="mb-5 flex border-b border-white/10 pb-5">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          class="r-button"
          @click="selectedTab = index"
          :class="{ toggled: selectedTab == index }"
        >
          {{ tab.name }}
        </button>
      </div>

      <div>
        <div class="mb-4 text-sm text-slate-400">
          <p>{{ tabs[selectedTab].description }}</p>
        </div>

        <div>
          <div v-if="selectedTab === 0">
            <PluginGenerator />
          </div>
          <div v-else-if="selectedTab === 1">
            <LayoutBuilder />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
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

.r-settings {
  background-color: var(--vp-code-copy-code-bg);
  padding: 1.5rem;
  border-radius: 0.5rem;
}
</style>
