<template>
  <div v-if="!hideBadge" class="vue3-recaptcha-v3"></div>
</template>

<script setup lang="ts">
/**
 * RecaptchaV3 Component
 * Provides Google reCAPTCHA v3 functionality
 * V3 is invisible and provides a score-based verification
 */

import { ref, computed, onMounted, onBeforeUnmount, inject, watch } from 'vue'
import type { RecaptchaV3Props, RecaptchaContext } from '../types'
import { RECAPTCHA_INJECTION_KEY } from '../types'
import { loadRecaptchaScript } from '../utils/script-loader'

const props = withDefaults(defineProps<RecaptchaV3Props>(), {
  action: 'submit',
  badge: 'bottomright',
  hideBadge: false,
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', token: string): void
  (e: 'verify', token: string): void
  (e: 'error', error: Error): void
  (e: 'load'): void
}>()

const context = inject<RecaptchaContext | undefined>(RECAPTCHA_INJECTION_KEY, undefined)

const isLoaded = ref(false)
const isLoading = ref(false)
const error = ref<Error | null>(null)
let tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null

const siteKey = computed(() => props.siteKey || context?.siteKey || '')

// Validate site key
if (!siteKey.value) {
  console.error('[vue3-recaptcha] Site key is required for RecaptchaV3')
}

/**
 * Load the reCAPTCHA v3 script
 */
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
    error.value = err instanceof Error ? err : new Error(String(err))
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

/**
 * Execute reCAPTCHA and get a verification token
 * @param action - Optional action name (overrides prop)
 * @returns Promise resolving to the token
 */
async function execute(action?: string): Promise<string> {
  if (!isLoaded.value) {
    await load()
  }

  if (!window.grecaptcha) {
    const err = new Error('[vue3-recaptcha] grecaptcha is not available')
    emit('error', err)
    throw err
  }

  const actionName = action || props.action || 'submit'

  try {
    const token = await window.grecaptcha.execute(siteKey.value, { action: actionName })

    emit('update:modelValue', token)
    emit('verify', token)

    // V3 tokens expire after 2 minutes
    if (tokenExpiryTimer) {
      clearTimeout(tokenExpiryTimer)
    }
    tokenExpiryTimer = setTimeout(() => {
      emit('update:modelValue', '')
    }, 110000) // Clear slightly before 2 min expiry

    return token
  } catch (err) {
    const executeError = err instanceof Error ? err : new Error(String(err))
    error.value = executeError
    emit('error', executeError)
    emit('update:modelValue', '')
    throw executeError
  }
}

/**
 * Handle badge visibility
 */
function updateBadgeVisibility(): void {
  if (typeof document === 'undefined') return

  const badge = document.querySelector('.grecaptcha-badge') as HTMLElement
  if (badge) {
    badge.style.visibility = props.hideBadge ? 'hidden' : 'visible'
  }
}

// Watch for hideBadge changes
watch(() => props.hideBadge, updateBadgeVisibility)

onMounted(() => {
  load().then(() => {
    updateBadgeVisibility()
  })
})

onBeforeUnmount(() => {
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer)
  }
})

// Expose methods for parent components
defineExpose({
  load,
  execute,
  isLoaded,
  isLoading,
  error
})
</script>

<style scoped>
.vue3-recaptcha-v3 {
  display: none;
}
</style>
