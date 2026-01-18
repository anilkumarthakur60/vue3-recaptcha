<template>
  <div ref="containerRef" class="vue3-recaptcha-v2-invisible"></div>
</template>

<script setup lang="ts">
/**
 * RecaptchaV2Invisible Component
 * Renders Google reCAPTCHA v2 invisible widget
 */

import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import type { RecaptchaV2InvisibleProps, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript, isRecaptchaLoaded } from '../utils/script-loader'

const props = withDefaults(defineProps<RecaptchaV2InvisibleProps>(), {
  badge: 'bottomright',
  tabindex: 0,
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', token: string): void
  (e: 'verify', token: string): void
  (e: 'expire'): void
  (e: 'error', error: Error): void
  (e: 'load'): void
}>()

const context = inject<RecaptchaContext | undefined>(RECAPTCHA_INJECTION_KEY, undefined)

const containerRef = ref<HTMLElement | null>(null)
const widgetId = ref<number | null>(null)
const isLoaded = ref(false)
const pendingResolve = ref<((token: string) => void) | null>(null)
const pendingReject = ref<((error: Error) => void) | null>(null)

const siteKey = computed(() => props.siteKey || context?.siteKey || '')

// Validate site key
if (!siteKey.value) {
  console.error('[vue3-recaptcha] Site key is required for RecaptchaV2Invisible')
}

/**
 * Handle successful verification
 */
function onVerify(token: string): void {
  emit('update:modelValue', token)
  emit('verify', token)

  if (pendingResolve.value) {
    pendingResolve.value(token)
    pendingResolve.value = null
    pendingReject.value = null
  }
}

/**
 * Handle token expiration
 */
function onExpire(): void {
  emit('update:modelValue', '')
  emit('expire')
}

/**
 * Handle verification error
 */
function onError(error: Error): void {
  emit('update:modelValue', '')
  emit('error', error)

  if (pendingReject.value) {
    pendingReject.value(error)
    pendingResolve.value = null
    pendingReject.value = null
  }
}

/**
 * Render the widget
 */
async function renderWidget(): Promise<void> {
  if (!containerRef.value || !siteKey.value) return

  try {
    if (!isRecaptchaLoaded()) {
      await loadRecaptchaScript({
        siteKey: siteKey.value,
        version: 'v2'
      })
    }

    // Wait for grecaptcha to be available
    if (typeof window.grecaptcha?.render !== 'function') {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (typeof window.grecaptcha?.render === 'function') {
            clearInterval(check)
            resolve()
          }
        }, 50)
      })
    }

    widgetId.value = window.grecaptcha.render(containerRef.value, {
      sitekey: siteKey.value,
      size: 'invisible',
      tabindex: props.tabindex,
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onError
    })

    isLoaded.value = true
    emit('load')
  } catch (error) {
    console.error('[vue3-recaptcha] Failed to render widget:', error)
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Execute the invisible reCAPTCHA
 * @returns Promise resolving to the token
 */
async function execute(): Promise<string> {
  if (!isLoaded.value) {
    await renderWidget()
  }

  if (widgetId.value === null) {
    throw new Error('[vue3-recaptcha] Widget not initialized')
  }

  return new Promise<string>((resolve, reject) => {
    pendingResolve.value = resolve
    pendingReject.value = reject

    // Set timeout
    const timeout = setTimeout(() => {
      if (pendingReject.value) {
        pendingReject.value(new Error('[vue3-recaptcha] Verification timeout'))
        pendingResolve.value = null
        pendingReject.value = null
      }
    }, 60000)

    try {
      window.grecaptcha.execute(widgetId.value!)

      // Clear timeout when resolved
      const originalResolve = pendingResolve.value
      pendingResolve.value = (token: string) => {
        clearTimeout(timeout)
        originalResolve(token)
      }
    } catch (error) {
      clearTimeout(timeout)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/**
 * Reset the widget
 */
function reset(): void {
  if (widgetId.value !== null && window.grecaptcha) {
    window.grecaptcha.reset(widgetId.value)
    emit('update:modelValue', '')
    pendingResolve.value = null
    pendingReject.value = null
  }
}

/**
 * Get current response token
 */
function getResponse(): string {
  if (widgetId.value !== null && window.grecaptcha) {
    return window.grecaptcha.getResponse(widgetId.value)
  }
  return ''
}

onMounted(() => {
  renderWidget()
})

onBeforeUnmount(() => {
  widgetId.value = null
  pendingResolve.value = null
  pendingReject.value = null
})

// Expose methods for parent components
defineExpose({
  execute,
  reset,
  getResponse,
  widgetId
})
</script>

<style scoped>
.vue3-recaptcha-v2-invisible {
  display: none;
}
</style>
