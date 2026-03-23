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

  const resolvedSiteKey = options.siteKey ?? context?.siteKey
  if (!resolvedSiteKey) {
    throw new Error(
      '[vue3-recaptcha] Site key is required. Provide it via plugin options or composable options.'
    )
  }
  const siteKey: string = resolvedSiteKey

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
      reset()
    }

    return new Promise<number>((resolve, reject) => {
      try {
        const id = window.grecaptcha.render(container, {
          sitekey: siteKey,
          theme: options.theme,
          size: options.size,
          tabindex: options.tabindex,
          callback: (responseToken: string) => {
            token.value = responseToken
          },
          'expired-callback': () => {
            token.value = ''
          },
          'error-callback': () => {
            error.value = new Error('reCAPTCHA verification error')
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
   * Execute invisible reCAPTCHA (for invisible size mode)
   */
  async function execute(): Promise<string> {
    await ensureLoaded()

    const currentWidgetId = widgetId.value
    if (currentWidgetId === null) {
      throw new Error('[vue3-recaptcha] Widget not rendered. Call render() first.')
    }

    return new Promise<string>((resolve, reject) => {
      const previousToken = token.value
      let intervalId: number | undefined
      let timeoutId: number | undefined

      intervalId = window.setInterval(() => {
        if (token.value && token.value !== previousToken) {
          window.clearInterval(intervalId)
          window.clearTimeout(timeoutId)
          resolve(token.value)
        }
      }, 100)

      timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId)
        reject(new Error('[vue3-recaptcha] Execute timeout after 30 seconds'))
      }, 30000)

      try {
        window.grecaptcha.execute(currentWidgetId)
      } catch (err) {
        window.clearInterval(intervalId)
        window.clearTimeout(timeoutId)
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }

  /**
   * Reset the widget
   */
  function reset(): void {
    const currentWidgetId = widgetId.value
    if (currentWidgetId !== null) {
      window.grecaptcha.reset(currentWidgetId)
      token.value = ''
    }
  }

  /**
   * Get the current response token from the widget
   */
  function getResponse(): string {
    const currentWidgetId = widgetId.value
    if (currentWidgetId !== null) {
      return window.grecaptcha.getResponse(currentWidgetId)
    }
    return token.value
  }

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
