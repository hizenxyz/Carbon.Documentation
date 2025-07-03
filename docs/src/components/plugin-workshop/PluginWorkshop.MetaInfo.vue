<script setup lang="ts">
import { usePluginWorkshop } from './PluginWorkshop.Store'

const { 
  pluginData, 
  isVersionValid, 
  isNameValid, 
  isAuthorValid, 
  isDescriptionValid 
} = usePluginWorkshop()
</script>

<template>
  <div class="space-y-4 rounded-lg bg-slate-800/50 p-6">
    <div class="r-settings-input-group">
      <label class="r-settings-input-label">Author</label>
      <input v-model="pluginData.author" type="text" class="r-settings-custom-input" :class="{ '!border-red-500 focus:!border-red-500': !isAuthorValid }" />
      <p v-if="!isAuthorValid" class="text-xs text-red-400 mt-2">
        Author cannot contain double quotes.
      </p>
    </div>
    <div class="r-settings-input-group">
      <label class="r-settings-input-label">Version</label>
      <input v-model="pluginData.version" type="text" class="r-settings-custom-input" :class="{ '!border-red-500 focus:!border-red-500': !isVersionValid }" />
      <p v-if="!isVersionValid" class="text-xs text-red-400 mt-2">
        Must be in semantic versioning format, e.g., <code>1.2.3</code>
      </p>
    </div>
    <div class="r-settings-input-group">
      <label class="r-settings-input-label">Name</label>
      <input v-model="pluginData.name" type="text" class="r-settings-custom-input" :class="{ '!border-red-500 focus:!border-red-500': !isNameValid }" />
      <p v-if="!isNameValid" class="text-xs text-red-400 mt-2">
        Name cannot contain double quotes and must have at least one valid character (A-Z, 0-9, _).
      </p>
    </div>
    <div class="r-settings-input-group">
      <label class="r-settings-input-label">Description</label>
      <textarea v-model="pluginData.description" class="r-settings-custom-input" rows="3" :class="{ '!border-red-500 focus:!border-red-500': !isDescriptionValid }"></textarea>
      <p v-if="!isDescriptionValid" class="text-xs text-red-400 mt-2">
        Description cannot contain double quotes.
      </p>
    </div>
    <div class="r-settings-input-group">
      <label class="r-settings-input-label">Plugin Type</label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="pluginData.pluginType" value="Carbon" name="plugin_type" class="radio" />
          Carbon
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="pluginData.pluginType" value="Oxide" name="plugin_type" class="radio" />
          Oxide
        </label>
      </div>
    </div>
  </div>
</template>

<style>
.r-settings-input-group {
  display: flex;
  flex-direction: column;
}

.r-settings-input-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.05em;
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
}

.r-settings-custom-input:focus {
  border-color: #888;
}

.radio {
  accent-color: var(--vp-c-brand-1);
}
</style>