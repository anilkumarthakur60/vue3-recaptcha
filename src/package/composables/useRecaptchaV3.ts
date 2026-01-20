/**
 * useRecaptchaV3 Composable
 * Provides reactive reCAPTCHA v3 functionality for Vue 3
 */

import { ref, readonly, inject, onUnmounted } from 'vue'
import type { UseRecaptchaV3Options, UseRecaptchaV3Return, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript, isRecaptchaLoaded } from '../utils/script-loader'

export function useRecaptchaV3(options: UseRecaptchaV3Options = {}): UseRecaptchaV3Return {
  const context = inject<RecaptchaContext | undefined>(RECAPTCHA_INJECTION_KEY, undefined)

  const siteKeyValue = options.siteKey || context?.siteKey
  if (!siteKeyValue) {
    throw new Error(
      '[vue3-recaptcha] Site key is required. Provide it via plugin options or composable options.'
    )
  }
  const siteKey: string = siteKeyValue

  const token = ref('')
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Load the reCAPTCHA script if not already loaded
   */
  async function ensureLoaded(): Promise<void> {
    if (isRecaptchaLoaded()) {
      isReady.value = true
      return
    }

    isLoading.value = true
    error.value = null

    try {
      await loadRecaptchaScript({
        siteKey,
        version: 'v3',
        onError: (err) => {
          error.value = err
        }
      })
      isReady.value = true
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Execute reCAPTCHA v3 and get a token
   * @param action - Action name for analytics (overrides default)
   * @returns Promise resolving to the token
   */
  async function execute(action?: string): Promise<string> {
    await ensureLoaded()

    const actionName = action || options.action || 'submit'

    isLoading.value = true
    error.value = null

    try {
      const responseToken = await window.grecaptcha.execute(siteKey, { action: actionName })
      token.value = responseToken

      // V3 tokens expire after 2 minutes, set up refresh warning
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
      }
      tokenRefreshTimer = setTimeout(() => {
        token.value = ''
      }, 110000) // Clear token after ~110 seconds (tokens valid for 2 min)

      return responseToken
    } catch (err) {
      const executeError = err instanceof Error ? err : new Error(String(err))
      error.value = executeError
      token.value = ''
      throw executeError
    } finally {
      isLoading.value = false
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer)
    }
    token.value = ''
  })

  return {
    token: readonly(token),
    isReady: readonly(isReady),
    isLoading: readonly(isLoading),
    error: readonly(error),
    execute
  }
}
