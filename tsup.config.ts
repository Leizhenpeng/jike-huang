import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'popup.min': 'src/pages/popup.ts',
    'options.min': 'src/pages/options.ts',

    'inject-fetch.min': 'src/contents/inject-fetch.ts',

    'toggle-icon.min': 'src/background/toggle-icon.ts',
    'background.min': 'src/background/main.ts',
    'web_accessible_resources.min': 'src/web_accessible_resources.ts',
    'notifications.min': 'src/notifications.ts',
  },

  outDir: './extension/scripts',

  minify: false,

  noExternal: ['@floating-ui/dom', 'webext-patterns', 'lucide'],

  esbuildOptions(options) {
    options.write = false
  },
})
