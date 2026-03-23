/**
 * RecaptchaV2Checkbox Component
 * Renders Google reCAPTCHA v2 checkbox widget
 */

import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, inject } from 'vue'
import type { PropType } from 'vue'
import type { RecaptchaTheme, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript, isRecaptchaLoaded } from '../utils/script-loader'

export const RecaptchaV2Checkbox = defineComponent({
  name: 'RecaptchaV2Checkbox',

  props: {
    siteKey: {
      type: String,
      default: undefined
    },
    theme: {
      type: String as PropType<RecaptchaTheme>,
      default: 'light' as RecaptchaTheme
    },
    size: {
      type: String as PropType<'normal' | 'compact'>,
      default: 'normal' as 'normal' | 'compact'
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

    const context = inject<RecaptchaContext | undefined>(RECAPTCHA_INJECTION_KEY, undefined)
    const siteKey = computed<string>(() => props.siteKey ?? context?.siteKey ?? '')

    if (!siteKey.value) {
      console.error('[vue3-recaptcha] Site key is required for RecaptchaV2Checkbox')
    }

    function onVerify(token: string): void {
      emit('update:modelValue', token)
      emit('verify', token)
    }

    function onExpire(): void {
      emit('update:modelValue', '')
      emit('expire')
    }

    function onError(err: Error): void {
      emit('update:modelValue', '')
      emit('error', err)
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
          theme: props.theme,
          size: props.size,
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

    function reset(): void {
      const currentWidgetId = widgetId.value
      if (currentWidgetId !== null) {
        window.grecaptcha.reset(currentWidgetId)
        emit('update:modelValue', '')
      }
    }

    function getResponse(): string {
      const currentWidgetId = widgetId.value
      if (currentWidgetId !== null) {
        return window.grecaptcha.getResponse(currentWidgetId)
      }
      return ''
    }

    watch(
      () => [props.theme, props.size] as const,
      () => {
        const container = containerRef.value
        if (isLoaded.value && container) {
          container.innerHTML = ''
          widgetId.value = null
          isLoaded.value = false
          void renderWidget()
        }
      }
    )

    onMounted(() => {
      void renderWidget()
    })

    onBeforeUnmount(() => {
      widgetId.value = null
    })

    expose({ reset, getResponse, widgetId })

    return () => (
      <div
        ref={containerRef}
        class="vue3-recaptcha-v2-checkbox"
        style={{ display: 'inline-block' }}
      />
    )
  }
})

export default RecaptchaV2Checkbox
