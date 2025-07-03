<script setup lang="ts">
import { computed } from 'vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'

const { pluginData } = usePluginWorkshop()

const isOxide = computed(() => pluginData.value.pluginType === 'Oxide')
</script>

<template>
  <div class="space-y-4 rounded-lg bg-slate-800/50 p-6">
    <div v-if="isOxide" class="text-center py-8">
      <div class="text-sm text-slate-500">
        <p>This feature is not supported for Oxide-targeted plugins</p>
      </div>
    </div>
    <div v-else>
      <div class="text-center py-8">
        <div class="text-sm text-slate-500">
          <p>This feature is under development</p>
        </div>
      </div>
    </div>
  </div>
</template>