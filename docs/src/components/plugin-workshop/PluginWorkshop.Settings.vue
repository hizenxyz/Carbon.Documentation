<script setup lang="ts">
import { usePluginWorkshop } from './PluginWorkshop.Store'

const { pluginData } = usePluginWorkshop()
</script>

<template>
  <div class="space-y-4 rounded-lg bg-slate-800/50 p-6">
    <div class="text-center py-8">
      <div class="text-sm text-slate-500">
        <p>This feature is under development</p>
      </div>
    </div>
  </div>
</template>