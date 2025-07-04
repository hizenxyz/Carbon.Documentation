import { className, pluginData, SettingType } from '../PluginWorkshop.Store'

export function generateSettingsCode(): string {
  if (!pluginData.value.settings || pluginData.value.settings.length === 0) {
    return ''
  }

  const settings = pluginData.value.settings

  const formatDefaultValue = (setting: SettingType): string => {
    if (setting.defaultValue === '') {
      return 'default'
    }

    const value = setting.defaultValue

    switch (setting.type) {
      case 'string':
        return `"${escapeString(value)}"`
      case 'char':
        return `'${escapeChar(value)}'`
      case 'float':
        return value.includes('f') || value.includes('F') ? value : `${value}f`
      case 'double':
        return value.includes('d') || value.includes('D') ? value : value
      case 'decimal':
        return value.includes('m') || value.includes('M') ? value : `${value}m`
      case 'long':
        return value.includes('L') || value.includes('l') ? value : `${value}L`
      case 'uint':
        return value.includes('u') || value.includes('U') ? value : `${value}u`
      case 'ulong':
        return value.includes('ul') || value.includes('UL') || value.includes('uL') || value.includes('Ul') ? value : `${value}ul`
      default:
        return value
    }
  }

  const escapeString = (str: string): string => {
    const validEscapeSequences = /\\(?:['"\\0abfnrtv]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{1,4})/g
    
    const placeholders: string[] = []
    let tempStr = str.replace(validEscapeSequences, (match) => {
      placeholders.push(match)
      return `__ESCAPE_${placeholders.length - 1}__`
    })
    
    tempStr = tempStr.replace(/\\/g, '\\\\')
    tempStr = tempStr.replace(/"/g, '\\"')
    
    placeholders.forEach((sequence, index) => {
      tempStr = tempStr.replace(`__ESCAPE_${index}__`, sequence)
    })
    
    return tempStr
  }

  const escapeChar = (char: string): string => {
    const validEscapeSequences = /\\(?:['"\\0abfnrtv]|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{1,4})/g
    
    if (validEscapeSequences.test(char)) {
      return char
    }
    
    return char.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  }

  const getDisplayName = (setting: SettingType): string => {
    return setting.description.trim() || setting.name
  }

  return `
    protected override void LoadConfig()
    {
        base.LoadConfig();

        Settings.Init(this);
    }

    protected override void LoadDefaultConfig()
    {
        base.LoadDefaultConfig();

        Settings.Init(this);
    }

    protected override void SaveConfig()
    {
        base.SaveConfig();

        Settings.Save(this);
    }

    private static class Settings
    {
        private static ${className.value}Config _config;

        ${settings.map(setting => `public static ${setting.type} ${setting.name} => _config.${setting.name};`).join('\n        ')}

        public static void Init(${className.value} plugin)
        {
            _config = ReadConfigOrCreateDefault(plugin);

            plugin.SaveConfig();
        }

        private static ${className.value}Config ReadConfigOrCreateDefault(${className.value} plugin)
        {
            try
            {
                return plugin.Config.ReadObject<${className.value}Config>()
                    ?? throw new Exception("Config is null");
            }
            catch (Exception ex)
            {
                plugin.Puts($"Error loading config: {ex.Message}");
                return CreateDefault();
            }
        }

        private static ${className.value}Config CreateDefault()
        {
            return new();
        }

        public static void Save(${className.value} plugin)
        {
            plugin.Config.WriteObject(_config, true);
        }
    }

    private class ${className.value}Config
    {
        ${settings.map(setting => {
          const defaultValue = formatDefaultValue(setting)
          const displayName = getDisplayName(setting)
          return `[JsonProperty("${displayName}")]
        public ${setting.type} ${setting.name} { get; set; } = ${defaultValue};`
        }).join('\n\n        ')}
    }
  `
}
