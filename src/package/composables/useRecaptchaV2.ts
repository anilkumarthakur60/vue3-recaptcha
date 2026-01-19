/**
 * useRecaptchaV2 Composable
 * Provides reactive reCAPTCHA v2 functionality for Vue 3
 */

import { ref, readonly, inject, onUnmounted } from 'vue'
import type { UseRecaptchaV2Options, UseRecaptchaV2Return, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript, isRecaptchaLoaded } from '../utils/script-loader'

export function useRecaptchaV2(options: UseRecaptchaV2Options = {}): UseRecaptchaV2Return {
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
  const widgetId = ref<number | null>(null)

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
        version: 'v2',
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
   * Render the reCAPTCHA widget in a container
   */
  async function render(container: HTMLElement | string): Promise<number> {
    await ensureLoaded()

    if (widgetId.value !== null) {
      // Already rendered, reset instead
      reset()
    }

    return new Promise((resolve, reject) => {
      try {
        const id = (window.grecaptcha as any).render(container, {
          sitekey: siteKey,
          theme: options.theme as any,
          size: options.size as any,
          tabindex: options.tabindex,
          callback: (responseToken: string) => {
            token.value = responseToken
          },
          'expired-callback': () => {
            token.value = ''
          },
          'error-callback': (err: Error) => {
            error.value = err
            token.value = ''
          }
        })

        widgetId.value = id
        resolve(id)
      } catch (err) {
        const renderError = err instanceof Error ? err : new Error(String(err))
        error.value = renderError
        reject(renderError)
      }
    })
  }

  /**
   * Execute invisible reCAPTCHA (for invisible mode)
   */
  async function execute(): Promise<string> {
    await ensureLoaded()

    if (widgetId.value === null) {
      throw new Error('[vue3-recaptcha] Widget not rendered. Call render() first.')
    }

    return new Promise((resolve, reject) => {
      try {
        // Set up a one-time callback to capture the token
        const originalCallback = token.value
        let timeoutToken: ReturnType<typeof setTimeout> | null = null

        const checkToken = setInterval(() => {
          if (token.value && token.value !== originalCallback) {
            clearInterval(checkToken)
            if (timeoutToken) clearTimeout(timeoutToken)
            resolve(token.value)
          }
        }, 100)

        // Timeout after 30 seconds
        timeoutToken = setTimeout(() => {
          clearInterval(checkToken as any)
          reject(new Error('[vue3-recaptcha] Execute timeout'))
        }, 30000) as any

        ;(window.grecaptcha as any).execute(widgetId.value ?? undefined)
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }

  /**
   * Reset the widget
   */
  function reset(): void {
    if (widgetId.value !== null && window.grecaptcha && 'reset' in window.grecaptcha) {
      ;(window.grecaptcha as any).reset(widgetId.value)
      token.value = ''
    }
  }

  /**
   * Get current response token
   */
  function getResponse(): string {
    if (widgetId.value !== null && window.grecaptcha && 'getResponse' in window.grecaptcha) {
      return (window.grecaptcha as any).getResponse(widgetId.value)
    }
    return token.value
  }

  // Cleanup on unmount
  onUnmounted(() => {
    widgetId.value = null
    token.value = ''
  })

  return {
    token: readonly(token),
    isReady: readonly(isReady),
    isLoading: readonly(isLoading),
    error: readonly(error),
    widgetId: readonly(widgetId),
    render,
    execute,
    reset,
    getResponse
  }
}
