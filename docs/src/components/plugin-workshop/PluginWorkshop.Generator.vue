<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useClipboard } from '@vueuse/core'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css';

const author = ref('YourName')
const version = ref('1.0.0')
const name = ref('MyPlugin')
const description = ref('A cool new plugin.')
const pluginType = ref('Carbon')
const codeBlock = ref<HTMLElement | null>(null)

const isVersionValid = computed(() => {
  return /^\d+\.\d+(\.\d+)?$/.test(version.value)
})

const isNameValid = computed(() => {
  if (name.value.includes('"')) return false;
  // A valid name, after sanitization, must not be empty.
  return sanitizeName(name.value).length > 0;
})

const isAuthorValid = computed(() => {
  return !author.value.includes('"');
})

const isDescriptionValid = computed(() => {
  return !description.value.includes('"');
})

const { copy, copied } = useClipboard({ source: name })

const generatedCode = computed(() => {
  const sanitizedName = sanitizeName(name.value) || 'MyPlugin'
  const info = `[Info("${name.value}", "${author.value}", "${version.value}")]`
  const desc = description.value && `[Description("${description.value}")]`
  const baseClass = pluginType.value === 'Carbon' ? 'CarbonPlugin' : 'RustPlugin'
  const namespace = pluginType.value === 'Carbon' ? 'Carbon.Plugins' : 'Oxide.Plugins'
  const using = ''

  const rawCode = (using && `using ${using};

`) + `namespace ${namespace};

${info}${desc && `\n${desc}`}
public class ${sanitizedName} : ${baseClass}
{
    // Code goes here
}
`
  return rawCode
})

const codeToHighlight = computed(() => {
    return generatedCode.value.substring(generatedCode.value.indexOf('using'));
});

function sanitizeName(name: string) {
  // Replace any character that is not a letter, number, or underscore with an underscore.
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');

  // If the first character is a number, prepend an underscore.
  if (/^[0-9]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  
  // Collapse multiple consecutive underscores into a single one.
  sanitized = sanitized.replace(/__+/g, '_');
     
  return sanitized;
}

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
  <div class="vp-raw grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="space-y-4 rounded-lg bg-slate-800/50 p-6">
      <div class="r-settings-input-group">
        <label class="r-settings-input-label">Author</label>
        <input v-model="author" type="text" class="r-settings-custom-input" :class="{ '!border-red-500 focus:!border-red-500': !isAuthorValid }" />
        <p v-if="!isAuthorValid" class="text-xs text-red-400 mt-2">
          Author cannot contain double quotes.
        </p>
      </div>
      <div class="r-settings-input-group">
        <label class="r-settings-input-label">Version</label>
        <input v-model="version" type="text" class="r-settings-custom-input" :class="{ '!border-red-500 focus:!border-red-500': !isVersionValid }" />
        <p v-if="!isVersionValid" class="text-xs text-red-400 mt-2">
          Must be in semantic versioning format, e.g., <code>1.2.3</code>
        </p>
      </div>
      <div class="r-settings-input-group">
        <label class="r-settings-input-label">Name</label>
        <input v-model="name" type="text" class="r-settings-custom-input" :class="{ '!border-red-500 focus:!border-red-500': !isNameValid }" />
        <p v-if="!isNameValid" class="text-xs text-red-400 mt-2">
          Name cannot contain double quotes and must have at least one valid character (A-Z, 0-9, _).
        </p>
      </div>
      <div class="r-settings-input-group">
        <label class="r-settings-input-label">Description</label>
        <textarea v-model="description" class="r-settings-custom-input" rows="3" :class="{ '!border-red-500 focus:!border-red-500': !isDescriptionValid }"></textarea>
        <p v-if="!isDescriptionValid" class="text-xs text-red-400 mt-2">
          Description cannot contain double quotes.
        </p>
      </div>
      <div class="r-settings-input-group">
        <label class="r-settings-input-label">Plugin Type</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="pluginType" value="Carbon" name="plugin_type" class="radio" />
            Carbon
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="pluginType" value="Oxide" name="plugin_type" class="radio" />
            Oxide
          </label>
        </div>
      </div>
    </div>
    <div class="relative">
      <div class="absolute top-4 right-4 z-10">
        <button @click="copyCode" class="r-button text-xs !bg-slate-700/50">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <pre class="hljs language-csharp" style="margin: 0; height: 100%; padding: 1.5rem; border-radius: 0.5rem;"><code ref="codeBlock" class="language-csharp"></code></pre>
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

.hljs {
  padding: 1.5rem;
}

.radio {
  accent-color: var(--vp-c-brand-1);
}

.prose {
    max-width: none;
}
</style>
<style scoped>
:deep(.hljs) {
  background-color: transparent !important;
}
</style>