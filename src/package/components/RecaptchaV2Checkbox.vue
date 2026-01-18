<template>
  <div ref="containerRef" class="vue3-recaptcha-v2-checkbox"></div>
</template>

<script setup lang="ts">
/**
 * RecaptchaV2Checkbox Component
 * Renders Google reCAPTCHA v2 checkbox widget
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, inject } from 'vue'
import type { RecaptchaV2CheckboxProps, RecaptchaContext, RecaptchaTheme } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript, isRecaptchaLoaded } from '../utils/script-loader'

const props = withDefaults(defineProps<RecaptchaV2CheckboxProps>(), {
  theme: 'light',
  size: 'normal',
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

const siteKey = computed(() => props.siteKey || context?.siteKey || '')

// Validate site key
if (!siteKey.value) {
  console.error('[vue3-recaptcha] Site key is required for RecaptchaV2Checkbox')
}

/**
 * Handle successful verification
 */
function onVerify(token: string): void {
  emit('update:modelValue', token)
  emit('verify', token)
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
      theme: props.theme as RecaptchaTheme,
      size: props.size,
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
 * Reset the widget
 */
function reset(): void {
  if (widgetId.value !== null && window.grecaptcha) {
    window.grecaptcha.reset(widgetId.value)
    emit('update:modelValue', '')
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

// Watch for theme/size changes - need to re-render
watch(
  () => [props.theme, props.size],
  () => {
    if (isLoaded.value && containerRef.value) {
      // Clear container and re-render
      containerRef.value.innerHTML = ''
      widgetId.value = null
      renderWidget()
    }
  }
)

onMounted(() => {
  renderWidget()
})

onBeforeUnmount(() => {
  widgetId.value = null
})

// Expose methods for parent components
defineExpose({
  reset,
  getResponse,
  widgetId
})
</script>

<style scoped>
.vue3-recaptcha-v2-checkbox {
  display: inline-block;
}
</style>
