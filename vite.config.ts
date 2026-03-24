import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      include: ['src/package/**/*'],
      exclude: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
    }),
  ],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/package/index.ts'),
      name: 'Vue3Recaptcha',
      formats: ['es', 'cjs', 'umd', 'iife'],
      fileName: (format) => {
        const names: Record<string, string> = {
          es: 'index.es.js',
          cjs: 'index.cjs',
          umd: 'index.umd.js',
          iife: 'index.iife.js',
        }
        return names[format] ?? `index.${format}.js`
      },
    },

    rollupOptions: {
      external: ['vue'],
      treeshake: { moduleSideEffects: false },
      output: {
        exports: 'named',
        globals: { vue: 'Vue' }, // used by umd + iife
      },
    },

    target: 'ES2022',
    minify: 'esbuild',
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: false,
    copyPublicDir: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
