/**
 * Vue3 Recaptcha
 * A Vue 3 plugin for Google reCAPTCHA v2 and v3
 *
 * @packageDocumentation
 */

import type { App, Plugin } from 'vue'
import { ref } from 'vue'
import type { RecaptchaPluginOptions, RecaptchaContext, RecaptchaVersion } from './types'
import { RECAPTCHA_INJECTION_KEY } from './types'
import { loadRecaptchaScript } from './utils/script-loader'

// Components
import { RecaptchaV2Checkbox } from './components/RecaptchaV2Checkbox'
import { RecaptchaV2Invisible } from './components/RecaptchaV2Invisible'
import { RecaptchaV3 } from './components/RecaptchaV3'

// Composables
import { useRecaptchaV2 } from './composables/useRecaptchaV2'
import { useRecaptchaV3 } from './composables/useRecaptchaV3'

/**
 * Vue 3 Recaptcha Plugin
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { VueRecaptchaPlugin } from '@anilkumarthakur/vue3-recaptcha'
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

    const version: RecaptchaVersion = options.version ?? 'v3'
    const isLoaded = ref(false)

    app.component('RecaptchaV2Checkbox', RecaptchaV2Checkbox)
    app.component('RecaptchaV2Invisible', RecaptchaV2Invisible)
    app.component('RecaptchaV2', RecaptchaV2Checkbox)
    app.component('RecaptchaV3', RecaptchaV3)
    app.component('Recaptcha', RecaptchaV3)

    const loadScript = async (): Promise<void> => {
      await loadRecaptchaScript({
        siteKey: options.siteKey,
        version,
        language: options.language,
        scriptUrl: options.scriptUrl,
        onLoad: () => {
          isLoaded.value = true
          options.onLoad?.()
        }
        // onError is intentionally omitted — errors propagate as rejections
        // and are handled once in the .catch below
      })
      isLoaded.value = true
    }

    const context: RecaptchaContext = {
      siteKey: options.siteKey,
      version,
      isLoaded,
      loadScript
    }

    app.provide(RECAPTCHA_INJECTION_KEY, context)

    if (options.autoLoad !== false) {
      loadScript().catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err))
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
  RecaptchaPluginOptions,
  RecaptchaContext,
  RecaptchaVersion,

  RecaptchaV2CheckboxProps,
  RecaptchaV2CheckboxEmits,

  RecaptchaV2InvisibleProps,
  RecaptchaV2InvisibleEmits,

  RecaptchaV3Props,
  RecaptchaV3Emits,

  UseRecaptchaV2Options,
  UseRecaptchaV2Return,
  UseRecaptchaV3Options,
  UseRecaptchaV3Return,

  RecaptchaTheme,
  RecaptchaSize,
  RecaptchaBadgePosition,

  Grecaptcha,
  GrecaptchaV2,
  GrecaptchaV3,
  GrecaptchaV2RenderParameters,

  RecaptchaV2CheckboxInstance,
  RecaptchaV2InvisibleInstance,
  RecaptchaV3Instance
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
