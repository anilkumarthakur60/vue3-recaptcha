/**
 * Vue3 Recaptcha
 * A Vue 3 plugin for Google reCAPTCHA v2 and v3
 *
 * @packageDocumentation
 */

import type { App, Plugin } from 'vue'
import type { RecaptchaPluginOptions, RecaptchaContext, RecaptchaVersion } from './types'
import { RECAPTCHA_INJECTION_KEY } from './types'
import { loadRecaptchaScript } from './utils/script-loader'
import { ref } from 'vue'

// Components
import RecaptchaV2Checkbox from './components/RecaptchaV2Checkbox.vue'
import RecaptchaV2Invisible from './components/RecaptchaV2Invisible.vue'
import RecaptchaV3 from './components/RecaptchaV3.vue'

// Composables
import { useRecaptchaV2 } from './composables/useRecaptchaV2'
import { useRecaptchaV3 } from './composables/useRecaptchaV3'

/**
 * Vue 3 Recaptcha Plugin
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { VueRecaptchaPlugin } from 'vue3-recaptcha'
 *
 * const app = createApp(App)
 * app.use(VueRecaptchaPlugin, {
 *   siteKey: 'your-site-key',
 *   version: 'v3'
 * })
 * ```
 */
export const VueRecaptchaPlugin: Plugin = {
  install(app: App, options: RecaptchaPluginOptions) {
    if (!options?.siteKey) {
      console.error('[vue3-recaptcha] Site key is required')
      return
    }

    const version: RecaptchaVersion = options.version || 'v3'
    const isLoaded = ref(false)

    // Register components globally
    app.component('RecaptchaV2Checkbox', RecaptchaV2Checkbox)
    app.component('RecaptchaV2Invisible', RecaptchaV2Invisible)
    app.component('RecaptchaV2', RecaptchaV2Checkbox) // Alias
    app.component('RecaptchaV3', RecaptchaV3)
    app.component('Recaptcha', RecaptchaV3) // Alias

    // Load script function
    const loadScript = async (): Promise<void> => {
      await loadRecaptchaScript({
        siteKey: options.siteKey,
        version,
        language: options.language,
        scriptUrl: options.scriptUrl,
        onLoad: () => {
          isLoaded.value = true
          options.onLoad?.()
        },
        onError: options.onError
      })
      isLoaded.value = true
    }

    // Create context
    const context: RecaptchaContext = {
      siteKey: options.siteKey,
      version,
      isLoaded,
      loadScript
    }

    // Provide context
    app.provide(RECAPTCHA_INJECTION_KEY, context)

    // Auto-load if enabled (default: true)
    if (options.autoLoad !== false) {
      loadScript().catch((error) => {
        console.error('[vue3-recaptcha] Failed to auto-load script:', error)
        options.onError?.(error)
      })
    }
  }
}

// Legacy alias for backward compatibility
export const recaptchaPlugin = VueRecaptchaPlugin

// ============================================================================
// Export Components
// ============================================================================

export { RecaptchaV2Checkbox, RecaptchaV2Invisible, RecaptchaV3 }

// Component Aliases
export { RecaptchaV2Checkbox as RecaptchaV2 }
export { RecaptchaV3 as Recaptcha }

// ============================================================================
// Export Composables
// ============================================================================

export { useRecaptchaV2, useRecaptchaV3 }

// ============================================================================
// Export Types
// ============================================================================

export type {
  // Plugin
  RecaptchaPluginOptions,
  RecaptchaContext,
  RecaptchaVersion,

  // V2 Checkbox
  RecaptchaV2CheckboxProps,
  RecaptchaV2CheckboxEmits,

  // V2 Invisible
  RecaptchaV2InvisibleProps,
  RecaptchaV2InvisibleEmits,

  // V3
  RecaptchaV3Props,
  RecaptchaV3Emits,

  // Composables
  UseRecaptchaV2Options,
  UseRecaptchaV2Return,
  UseRecaptchaV3Options,
  UseRecaptchaV3Return,

  // Common Types
  RecaptchaTheme,
  RecaptchaSize,
  RecaptchaBadgePosition,

  // Global Types
  Grecaptcha,
  GrecaptchaV2,
  GrecaptchaV3
} from './types'

export { RECAPTCHA_INJECTION_KEY } from './types'

// ============================================================================
// Export Utilities
// ============================================================================

export {
  loadRecaptchaScript,
  isRecaptchaLoaded,
  removeScript,
  waitForRecaptcha
} from './utils/script-loader'

// ============================================================================
// Default Export
// ============================================================================

export default VueRecaptchaPlugin
