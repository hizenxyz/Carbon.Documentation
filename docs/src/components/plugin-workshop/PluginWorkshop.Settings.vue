<script setup lang="ts">
import { computed } from 'vue'
import { usePluginWorkshop } from './PluginWorkshop.Store'
import type { CSharpType, SettingType } from './PluginWorkshop.Store'
import MultiPropertyEditor from '../common/MultiPropertyEditor.vue'
import type { MultiPropertyConfig } from '../common/MultiPropertyEditor.vue'

const { 
  pluginData, 
  validateSettingValue,
} = usePluginWorkshop()

const availableTypes: { value: CSharpType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'int', label: 'int' },
  { value: 'float', label: 'float' },
  { value: 'double', label: 'double' },
  { value: 'bool', label: 'bool' },
  { value: 'decimal', label: 'decimal' },
  { value: 'byte', label: 'byte' },
  { value: 'short', label: 'short' },
  { value: 'long', label: 'long' },
  { value: 'uint', label: 'uint' },
  { value: 'ushort', label: 'ushort' },
  { value: 'ulong', label: 'ulong' },
  { value: 'char', label: 'char' }
]

const generateUniqueName = (settings: SettingType[]): string => {
  const baseName = 'MySetting'
  let uniqueName = baseName
  let counter = 1
  
  while (settings.some(setting => setting.name === uniqueName)) {
    uniqueName = `${baseName}${counter}`
    counter++
  }
  
  return uniqueName
}

const getPlaceholder = (type: CSharpType): string => {
  switch (type) {
    case 'string': return 'Ex: Hello World or \\u0041'
    case 'int': return 'Ex: 42'
    case 'float': return 'Ex: 3.14'
    case 'double': return 'Ex: 3.14159'
    case 'bool': return 'Ex: true'
    case 'decimal': return 'Ex: 99.99'
    case 'byte': return 'Ex: 255'
    case 'short': return 'Ex: 1000'
    case 'long': return 'Ex: 1000'
    case 'uint': return 'Ex: 100'
    case 'ushort': return 'Ex: 1000'
    case 'ulong': return 'Ex: 1000'
    case 'char': return 'Ex: A or \\n'
    default: return ''
  }
}

const settingsConfig: MultiPropertyConfig<SettingType> = {
  fields: [
    {
      key: 'name',
      label: 'Property Name',
      type: 'text',
      placeholder: 'MySetting',
      required: true,
      colSpan: 3
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: availableTypes,
      required: true,
      colSpan: 2
    },
    {
      key: 'description',
      label: 'Display Name',
      type: 'text',
      placeholder: 'Config-Friendly Name',
      required: false,
      colSpan: 3
    },
    {
      key: 'defaultValue',
      label: 'Default Value',
      type: 'text',
      placeholder: '',
      dynamicPlaceholder: (item: unknown) => getPlaceholder((item as SettingType).type),
      required: false,
      colSpan: 3
    }
  ],
  createItem: (): SettingType => ({
    id: crypto.randomUUID(),
    name: generateUniqueName(pluginData.value.settings),
    type: 'string',
    description: '',
    defaultValue: ''
  }),
  getDisplayName: (item: SettingType): string => {
    return item.description.trim() || item.name || 'Unnamed Setting'
  },
  validateItem: (item: SettingType): boolean => {
    if (item.defaultValue && item.defaultValue.trim() !== '') {
      return validateSettingValue(item.type, item.defaultValue)
    }
    return true
  },
  duplicateCheck: (item: SettingType, items: SettingType[]): boolean => {
    return items.filter(s => s.name === item.name).length > 1
  }
}

const settings = computed({
  get: () => pluginData.value.settings,
  set: (value) => {
    pluginData.value.settings = value
  }
})
</script>

<template>
  <MultiPropertyEditor
    v-model="settings"
    :config="settingsConfig"
    add-button-text="Add Setting"
    empty-state-text="No settings configured yet"
    :show-summary="true"
  />
</template>