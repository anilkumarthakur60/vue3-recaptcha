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
const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js'

let loadPromise: Promise<void> | null = null
let isLoaded = false

/**
 * Check if reCAPTCHA script is already loaded and ready
 */
export function isRecaptchaLoaded(): boolean {
  return isLoaded && typeof window !== 'undefined' && typeof window.grecaptcha !== 'undefined'
}

/**
 * Get existing script element by id
 */
export function getExistingScript(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(`#${SCRIPT_ID}`)
}

/**
 * Remove existing script and reset load state
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
 * Build the reCAPTCHA script URL from options
 */
export function buildScriptUrl(options: ScriptLoaderOptions): string {
  const { siteKey, version, language, scriptUrl } = options

  if (scriptUrl) {
    return scriptUrl
  }

  const params = new URLSearchParams()

  if (version === 'v3') {
    params.set('render', siteKey)
  } else {
    params.set('render', 'explicit')
    if (typeof window !== 'undefined') {
      window.___grecaptcha_cfg = window.___grecaptcha_cfg ?? {}
      window.___grecaptcha_cfg.explicit = true
    }
  }

  if (language) {
    params.set('hl', language)
  }

  return `${RECAPTCHA_SCRIPT_URL}?${params.toString()}`
}

/**
 * Load the reCAPTCHA script. Returns a shared promise if loading is already in progress.
 */
export function loadRecaptchaScript(options: ScriptLoaderOptions): Promise<void> {
  if (loadPromise) {
    return loadPromise
  }

  if (isRecaptchaLoaded()) {
    return Promise.resolve()
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = getExistingScript()

    if (existingScript) {
      if (isRecaptchaLoaded()) {
        resolve()
        return
      }

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

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = buildScriptUrl(options)
    script.async = true
    script.defer = true

    script.onload = () => {
      if (options.version === 'v3') {
        window.grecaptcha.ready(() => {
          isLoaded = true
          options.onLoad?.()
          resolve()
        })
      } else {
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
 * Wait for grecaptcha to become available, with a 10-second timeout.
 */
export function waitForRecaptcha(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (isRecaptchaLoaded()) {
      resolve()
      return
    }

    const timeout = window.setTimeout(() => {
      window.clearInterval(checkInterval)
      reject(new Error('Timeout waiting for reCAPTCHA to load'))
    }, 10000)

    const checkInterval = window.setInterval(() => {
      if (typeof window.grecaptcha !== 'undefined') {
        window.clearInterval(checkInterval)
        window.clearTimeout(timeout)

        if (typeof window.grecaptcha.ready === 'function') {
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
