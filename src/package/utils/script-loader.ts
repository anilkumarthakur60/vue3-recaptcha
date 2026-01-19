/**
 * Script Loader Utility
 * Handles loading Google reCAPTCHA scripts
 */

import type { RecaptchaVersion } from '../types'

export interface ScriptLoaderOptions {
  siteKey: string
  version: RecaptchaVersion
  language?: string
  scriptUrl?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

const SCRIPT_ID = 'vue3-recaptcha-script'
const DEFAULT_V2_URL = 'https://www.google.com/recaptcha/api.js'
const DEFAULT_V3_URL = 'https://www.google.com/recaptcha/api.js'

let loadPromise: Promise<void> | null = null
let isLoaded = false

/**
 * Check if reCAPTCHA script is already loaded
 */
export function isRecaptchaLoaded(): boolean {
  return isLoaded && typeof window !== 'undefined' && !!window.grecaptcha
}

/**
 * Get existing script element
 */
export function getExistingScript(): HTMLScriptElement | null {
  return document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
}

/**
 * Remove existing script and reset state
 */
export function removeScript(): void {
  const existingScript = getExistingScript()
  if (existingScript) {
    existingScript.remove()
  }
  loadPromise = null
  isLoaded = false
}

/**
 * Build script URL based on options
 */
export function buildScriptUrl(options: ScriptLoaderOptions): string {
  const { siteKey, version, language, scriptUrl } = options

  if (scriptUrl) {
    return scriptUrl
  }

  const baseUrl = version === 'v3' ? DEFAULT_V3_URL : DEFAULT_V2_URL
  const params = new URLSearchParams()

  if (version === 'v3') {
    params.set('render', siteKey)
  } else {
    params.set('render', 'explicit')
    // For v2, we need explicit rendering
    if (typeof window !== 'undefined') {
      ;(window as any).___grecaptcha_cfg = (window as any).___grecaptcha_cfg || {}
      ;(window as any).___grecaptcha_cfg.explicit = true
    }
  }

  if (language) {
    params.set('hl', language)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Load the reCAPTCHA script
 */
export function loadRecaptchaScript(options: ScriptLoaderOptions): Promise<void> {
  // Return existing promise if loading is in progress
  if (loadPromise) {
    return loadPromise
  }

  // Return immediately if already loaded
  if (isRecaptchaLoaded()) {
    return Promise.resolve()
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    // Check if script already exists
    const existingScript = getExistingScript()
    if (existingScript) {
      if (isRecaptchaLoaded()) {
        resolve()
        return
      }
      // Script exists but not loaded, wait for it
      existingScript.addEventListener('load', () => {
        isLoaded = true
        options.onLoad?.()
        resolve()
      })
      existingScript.addEventListener('error', () => {
        const error = new Error('Failed to load reCAPTCHA script')
        options.onError?.(error)
        reject(error)
      })
      return
    }

    // Create new script element
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = buildScriptUrl(options)
    script.async = true
    script.defer = true

    script.onload = () => {
      if (options.version === 'v3') {
        // V3 requires waiting for grecaptcha.ready
        window.grecaptcha.ready(() => {
          isLoaded = true
          options.onLoad?.()
          resolve()
        })
      } else {
        // V2 is ready immediately after script load
        isLoaded = true
        options.onLoad?.()
        resolve()
      }
    }

    script.onerror = () => {
      const error = new Error('Failed to load reCAPTCHA script')
      loadPromise = null
      options.onError?.(error)
      reject(error)
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * Wait for grecaptcha to be ready
 */
export function waitForRecaptcha(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isRecaptchaLoaded()) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for reCAPTCHA to load'))
    }, 10000)

    const checkInterval = setInterval(() => {
      if (window.grecaptcha) {
        clearInterval(checkInterval)
        clearTimeout(timeout)

        if (window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            isLoaded = true
            resolve()
          })
        } else {
          isLoaded = true
          resolve()
        }
      }
    }, 100)
  })
}
