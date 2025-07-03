<script setup lang="ts">
import { ref, computed } from 'vue'
import PluginMetaInfo from './PluginWorkshop.MetaInfo.vue'
import PluginLayout from './PluginWorkshop.Layout.vue'
import CodeResult from './PluginWorkshop.CodeResult.vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'

const { pluginData } = usePluginWorkshop()
const selectedTab = ref(0)

// Dynamic tab configuration
const tabsConfig = [
  {
    id: 'meta-info',
    name: 'Meta Info',
    description: 'Create a default plugin layout from provided basic data.',
    component: PluginMetaInfo
  },
  {
    id: 'layout',
    name: 'Layout',
    description: 'Design layouts and have the code generated for you.',
    component: PluginLayout,
    isDisabled: () => pluginData.value.pluginType === 'Oxide',
    disabledTooltip: 'Layout builder is not yet supported for Oxide plugins'
  }
]

// Computed properties for easy access
const tabs = computed(() => tabsConfig.map(tab => ({
  name: tab.name,
  description: tab.description
})))

const currentTabConfig = computed(() => tabsConfig[selectedTab.value])

function selectTab(index: number) {
  const tab = tabsConfig[index]
  // Don't allow selecting disabled tabs
  if (tab.isDisabled?.() ?? false) {
    return
  }
  selectedTab.value = index
}

function isTabDisabled(index: number) {
  return tabsConfig[index].isDisabled?.() ?? false
}

function getTabTooltip(index: number) {
  const tab = tabsConfig[index]
  return (tab.isDisabled?.() ?? false) ? (tab.disabledTooltip || '') : ''
}
</script>

<template>
  <div class="mx-auto max-w-screen-lg px-4 py-8 space-y-6">
    <div class="mb-4 flex flex-col gap-4">
      <h1 class="text-2xl font-bold">Plugin Workshop</h1>
      <p>Tools to help you create and edit plugins for Carbon.</p>
    </div>

    <div class="r-settings">
      <div class="mb-5 flex border-b border-white/10 pb-5">
        <button
          v-for="(tab, index) in tabs"
          :key="tabsConfig[index].id"
          class="r-button"
          @click="selectTab(index)"
          :class="{ 
            toggled: selectedTab == index,
            disabled: isTabDisabled(index)
          }"
          :disabled="isTabDisabled(index)"
          :title="getTabTooltip(index)"
        >
          {{ tab.name }}
        </button>
      </div>

      <div>
        <div class="mb-4 text-sm text-slate-400">
          <p>{{ tabs[selectedTab].description }}</p>
        </div>

        <div>
          <component :is="currentTabConfig.component" />
        </div>

        <div class="mb-5 flex border-b border-white/10 pb-5"></div>

        <CodeResult />
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

.r-button.disabled {
  opacity: 25%;
  cursor: not-allowed;
}

.r-button.disabled:hover {
  opacity: 25%;
  background-color: var(--vp-code-copy-code-bg);
}

.r-settings {
  background-color: var(--vp-code-copy-code-bg);
  padding: 1.5rem;
  border-radius: 0.5rem;
}
</style>
