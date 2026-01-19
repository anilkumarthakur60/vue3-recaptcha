import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

/**
 * Vite configuration for building vue3-recaptcha as an npm package
 * Supports both ES modules and UMD builds
 */
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      include: ['src/package'],
      rollupTypes: true,
      strictOutput: true,
    })
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/package/index.ts'),
      name: 'Vue3Recaptcha',
      fileName: (format) => {
        const formatMap: Record<string, string> = {
          es: 'index.es.js',
          umd: 'index.umd.js',
          cjs: 'index.cjs'
        }
        return formatMap[format] || `index.${format}.js`
      },
      formats: ['es', 'umd', 'cjs']
    },

    rollupOptions: {
      // Externalize Vue to avoid duplication in consuming apps
      external: ['vue'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.es.js',
          dir: 'dist',
          exports: 'named'
        },
        {
          format: 'umd',
          entryFileNames: 'index.umd.js',
          name: 'Vue3Recaptcha',
          globals: {
            vue: 'Vue'
          },
          dir: 'dist',
          exports: 'named'
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          dir: 'dist',
          exports: 'named'
        }
      ]
    },

    // Build optimizations
    minify: 'esbuild', // Use esbuild instead of terser (lighter weight)
    sourcemap: false, // Disable for production npm package (reduces size by ~150 KB)
    emptyOutDir: true,
    cssCodeSplit: false,
    target: 'ES2020',
    outDir: 'dist',
    copyPublicDir: false, // Prevent favicon.ico from being copied to dist
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
