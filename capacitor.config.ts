import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.sd.calculator',
  appName: 'SD | Расчёты',
  webDir: 'out',
  android: {
    allowMixedContent: false,
  },
};

export default config;
