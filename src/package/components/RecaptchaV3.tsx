/**
 * RecaptchaV3 Component
 * Provides Google reCAPTCHA v3 functionality
 * V3 is invisible and provides a score-based verification
 */

import { defineComponent, ref, computed, onMounted, onBeforeUnmount, inject, watch } from 'vue'
import type { PropType } from 'vue'
import type { RecaptchaBadgePosition, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript } from '../utils/script-loader'

export const RecaptchaV3 = defineComponent({
  name: 'RecaptchaV3',

  props: {
    siteKey: {
      type: String,
      default: undefined
    },
    action: {
      type: String,
      default: 'submit'
    },
    badge: {
      type: String as PropType<RecaptchaBadgePosition>,
      default: 'bottomright' as RecaptchaBadgePosition
    },
    hideBadge: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: String,
      default: ''
    }
  },

  emits: {
    'update:modelValue': (token: string) => typeof token === 'string',
    verify: (token: string) => typeof token === 'string',
    error: (err: Error) => err instanceof Error,
    load: null
  },

  setup(props, { emit, expose }) {
    const isLoaded = ref(false)
    const isLoading = ref(false)
    const error = ref<Error | null>(null)
    let tokenExpiryTimer: number | undefined

    const context = inject<RecaptchaContext | undefined>(RECAPTCHA_INJECTION_KEY, undefined)
    const siteKey = computed<string>(() => props.siteKey ?? context?.siteKey ?? '')

    if (!siteKey.value) {
      console.error('[vue3-recaptcha] Site key is required for RecaptchaV3')
    }

    function updateBadgeVisibility(): void {
      if (typeof document === 'undefined') return
      const badge = document.querySelector<HTMLElement>('.grecaptcha-badge')
      if (badge) {
        badge.style.visibility = props.hideBadge ? 'hidden' : 'visible'
      }
    }

    async function load(): Promise<void> {
      if (isLoaded.value || isLoading.value) return

      isLoading.value = true
      error.value = null

      try {
        await loadRecaptchaScript({
          siteKey: siteKey.value,
          version: 'v3',
          onLoad: () => {
            isLoaded.value = true
            emit('load')
          },
          onError: (err) => {
            error.value = err
            emit('error', err)
          }
        })

        isLoaded.value = true
      } catch (err) {
        const loadError = err instanceof Error ? err : new Error(String(err))
        error.value = loadError
        emit('error', loadError)
      } finally {
        isLoading.value = false
      }
    }

    async function execute(action?: string): Promise<string> {
      if (!isLoaded.value) {
        await load()
      }

      if (typeof window.grecaptcha === 'undefined') {
        const err = new Error('[vue3-recaptcha] grecaptcha is not available')
        emit('error', err)
        throw err
      }

      const key = siteKey.value
      const actionName = action ?? props.action ?? 'submit'

      try {
        const token = await window.grecaptcha.execute(key, { action: actionName })

        emit('update:modelValue', token)
        emit('verify', token)

        if (tokenExpiryTimer !== undefined) {
          clearTimeout(tokenExpiryTimer as number)
        }

        // V3 tokens expire after 2 minutes — clear slightly before
        tokenExpiryTimer = setTimeout(() => {
          emit('update:modelValue', '')
        }, 110000) as unknown as number

        return token
      } catch (err) {
        const executeError = err instanceof Error ? err : new Error(String(err))
        error.value = executeError
        emit('error', executeError)
        emit('update:modelValue', '')
        throw executeError
      }
    }

    watch(() => props.hideBadge, updateBadgeVisibility)

    onMounted(() => {
      void load().then(() => {
        updateBadgeVisibility()
      })
    })

    onBeforeUnmount(() => {
      if (tokenExpiryTimer !== undefined) {
        clearTimeout(tokenExpiryTimer as number)
      }
    })

    expose({
      load,
      loadRecaptcha: load,
      execute,
      isLoaded,
      isLoading,
      error
    })

    return () => <div class="vue3-recaptcha-v3" style={{ display: 'none' }} />
  }
})

export default RecaptchaV3
