import { className } from '../PluginWorkshop.Store'

export function generateSettingsCode(): string {
  return ''

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
    }
  `
}
