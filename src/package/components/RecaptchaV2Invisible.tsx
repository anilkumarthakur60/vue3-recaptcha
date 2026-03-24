/**
 * RecaptchaV2Invisible Component
 * Renders Google reCAPTCHA v2 invisible widget
 */

import { defineComponent, ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import type { PropType } from 'vue'
import type { RecaptchaBadgePosition, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript, isRecaptchaLoaded } from '../utils/script-loader'

export const RecaptchaV2Invisible = defineComponent({
  name: 'RecaptchaV2Invisible',

  props: {
    siteKey: {
      type: String,
      default: undefined
    },
    badge: {
      type: String as PropType<RecaptchaBadgePosition>,
      default: 'bottomright' as RecaptchaBadgePosition
    },
    tabindex: {
      type: Number,
      default: 0
    },
    modelValue: {
      type: String,
      default: ''
    }
  },

  emits: {
    'update:modelValue': (token: string) => typeof token === 'string',
    verify: (token: string) => typeof token === 'string',
    expire: null,
    error: (err: Error) => err instanceof Error,
    load: null
  },

  setup(props, { emit, expose }) {
    const containerRef = ref<HTMLElement | null>(null)
    const widgetId = ref<number | null>(null)
    const isLoaded = ref(false)

    const pendingResolve = ref<((token: string) => void) | null>(null)
    const pendingReject = ref<((error: Error) => void) | null>(null)

    const context = inject<RecaptchaContext | undefined>(RECAPTCHA_INJECTION_KEY, undefined)
    const siteKey = computed<string>(() => props.siteKey ?? context?.siteKey ?? '')

    if (!siteKey.value) {
      console.error('[vue3-recaptcha] Site key is required for RecaptchaV2Invisible')
    }

    function onVerify(token: string): void {
      emit('update:modelValue', token)
      emit('verify', token)

      const resolve = pendingResolve.value
      if (resolve) {
        pendingResolve.value = null
        pendingReject.value = null
        resolve(token)
      }
    }

    function onExpire(): void {
      emit('update:modelValue', '')
      emit('expire')
    }

    function onError(err: Error): void {
      emit('update:modelValue', '')
      emit('error', err)

      const reject = pendingReject.value
      if (reject) {
        pendingResolve.value = null
        pendingReject.value = null
        reject(err)
      }
    }

    async function renderWidget(): Promise<void> {
      const container = containerRef.value
      const key = siteKey.value
      if (!container || !key) return

      try {
        if (!isRecaptchaLoaded()) {
          await loadRecaptchaScript({ siteKey: key, version: 'v2' })
        }

        await new Promise<void>((resolve) => {
          const check = window.setInterval(() => {
            if (typeof window.grecaptcha?.render === 'function') {
              window.clearInterval(check)
              resolve()
            }
          }, 50)
        })

        widgetId.value = window.grecaptcha.render(container, {
          sitekey: key,
          size: 'invisible',
          tabindex: props.tabindex,
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': () => {
            onError(new Error('reCAPTCHA verification error'))
          }
        })

        isLoaded.value = true
        emit('load')
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    }

    async function execute(): Promise<string> {
      if (!isLoaded.value) {
        await renderWidget()
      }

      const currentWidgetId = widgetId.value
      if (currentWidgetId === null) {
        throw new Error('[vue3-recaptcha] Widget not initialized')
      }

      return new Promise<string>((resolve, reject) => {
        const timeoutHandle = window.setTimeout(() => {
          const rejectFn = pendingReject.value
          pendingResolve.value = null
          pendingReject.value = null
          rejectFn?.(new Error('[vue3-recaptcha] Verification timeout after 60 seconds'))
        }, 60000)

        pendingResolve.value = (token: string) => {
          window.clearTimeout(timeoutHandle)
          resolve(token)
        }

        pendingReject.value = (err: Error) => {
          window.clearTimeout(timeoutHandle)
          reject(err)
        }

        try {
          window.grecaptcha.execute(currentWidgetId)
        } catch (err) {
          window.clearTimeout(timeoutHandle)
          pendingResolve.value = null
          pendingReject.value = null
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      })
    }

    function reset(): void {
      const currentWidgetId = widgetId.value
      if (currentWidgetId !== null) {
        window.grecaptcha.reset(currentWidgetId)
        emit('update:modelValue', '')
        pendingResolve.value = null
        pendingReject.value = null
      }
    }

    function getResponse(): string {
      const currentWidgetId = widgetId.value
      if (currentWidgetId !== null) {
        return window.grecaptcha.getResponse(currentWidgetId)
      }
      return ''
    }

    onMounted(() => {
      void renderWidget()
    })

    onBeforeUnmount(() => {
      widgetId.value = null
      pendingResolve.value = null
      pendingReject.value = null
    })

    expose({ execute, reset, getResponse, widgetId })

    return () => (
      <div ref={containerRef} class="vue3-recaptcha-v2-invisible" style={{ display: 'none' }} />
    )
  }
})

export default RecaptchaV2Invisible
