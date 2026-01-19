/**
 * Vue3 Recaptcha - Type Definitions
 * Supports Google reCAPTCHA v2 (checkbox, invisible) and v3
 */

// ============================================================================
// Core Types
// ============================================================================

export type RecaptchaVersion = 'v2' | 'v3'
export type RecaptchaV2Type = 'checkbox' | 'invisible'
export type RecaptchaTheme = 'light' | 'dark'
export type RecaptchaSize = 'normal' | 'compact' | 'invisible'
export type RecaptchaBadgePosition = 'bottomright' | 'bottomleft' | 'inline'

// ============================================================================
// Plugin Options
// ============================================================================

export interface RecaptchaPluginOptions {
  /**
   * Your reCAPTCHA site key from Google Console
   */
  siteKey: string

  /**
   * Version of reCAPTCHA to use
   * @default 'v3'
   */
  version?: RecaptchaVersion

  /**
   * Whether to load the script automatically
   * @default true
   */
  autoLoad?: boolean

  /**
   * Language code for reCAPTCHA widget
   * @see https://developers.google.com/recaptcha/docs/language
   */
  language?: string

  /**
   * Custom script URL (for enterprise or self-hosted)
   */
  scriptUrl?: string

  /**
   * Callback when script is loaded
   */
  onLoad?: () => void

  /**
   * Callback when script fails to load
   */
  onError?: (error: Error) => void
}

// ============================================================================
// V2 Checkbox Props
// ============================================================================

export interface RecaptchaV2CheckboxProps {
  /**
   * Site key (overrides plugin config)
   */
  siteKey?: string

  /**
   * Color theme of the widget
   * @default 'light'
   */
  theme?: RecaptchaTheme

  /**
   * Size of the widget
   * @default 'normal'
   */
  size?: 'normal' | 'compact'

  /**
   * Tabindex for accessibility
   * @default 0
   */
  tabindex?: number

  /**
   * v-model binding for token
   */
  modelValue?: string
}

export interface RecaptchaV2CheckboxEmits {
  (e: 'update:modelValue', token: string): void
  (e: 'verify', token: string): void
  (e: 'expire'): void
  (e: 'error', error: Error): void
  (e: 'load'): void
}

// ============================================================================
// V2 Invisible Props
// ============================================================================

export interface RecaptchaV2InvisibleProps {
  /**
   * Site key (overrides plugin config)
   */
  siteKey?: string

  /**
   * Badge position
   * @default 'bottomright'
   */
  badge?: RecaptchaBadgePosition

  /**
   * Tabindex for accessibility
   * @default 0
   */
  tabindex?: number

  /**
   * v-model binding for token
   */
  modelValue?: string
}

export interface RecaptchaV2InvisibleEmits {
  (e: 'update:modelValue', token: string): void
  (e: 'verify', token: string): void
  (e: 'expire'): void
  (e: 'error', error: Error): void
  (e: 'load'): void
}

// ============================================================================
// V3 Props
// ============================================================================

export interface RecaptchaV3Props {
  /**
   * Site key (overrides plugin config)
   */
  siteKey?: string

  /**
   * Action name for analytics (e.g., 'login', 'signup', 'submit')
   */
  action?: string

  /**
   * Badge position
   * @default 'bottomright'
   */
  badge?: RecaptchaBadgePosition

  /**
   * Whether to hide the badge
   * @default false
   */
  hideBadge?: boolean

  /**
   * v-model binding for token
   */
  modelValue?: string
}

export interface RecaptchaV3Emits {
  (e: 'update:modelValue', token: string): void
  (e: 'verify', token: string): void
  (e: 'error', error: Error): void
  (e: 'load'): void
}

// ============================================================================
// Composable Types
// ============================================================================

export interface UseRecaptchaV2Options {
  siteKey?: string
  theme?: RecaptchaTheme
  size?: RecaptchaSize
  badge?: RecaptchaBadgePosition
  tabindex?: number
}

export interface UseRecaptchaV3Options {
  siteKey?: string
  action?: string
}

export interface UseRecaptchaV2Return {
  token: Readonly<import('vue').Ref<string>>
  isReady: Readonly<import('vue').Ref<boolean>>
  isLoading: Readonly<import('vue').Ref<boolean>>
  error: Readonly<import('vue').Ref<Error | null>>
  widgetId: Readonly<import('vue').Ref<number | null>>
  render: (container: HTMLElement | string) => Promise<number>
  execute: () => Promise<string>
  reset: () => void
  getResponse: () => string
}

export interface UseRecaptchaV3Return {
  token: Readonly<import('vue').Ref<string>>
  isReady: Readonly<import('vue').Ref<boolean>>
  isLoading: Readonly<import('vue').Ref<boolean>>
  error: Readonly<import('vue').Ref<Error | null>>
  execute: (action?: string) => Promise<string>
}

// ============================================================================
// Global Window Types
// ============================================================================

export interface GrecaptchaV2 {
  render: (
    container: HTMLElement | string,
    parameters: {
      sitekey: string
      theme?: RecaptchaTheme
      size?: RecaptchaSize
      tabindex?: number
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: (error: Error) => void
    }
  ) => number
  execute: (widgetId?: number) => void
  reset: (widgetId?: number) => void
  getResponse: (widgetId?: number) => string
}

export interface GrecaptchaV3 {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

export type Grecaptcha = GrecaptchaV2 & GrecaptchaV3

declare global {
  interface Window {
    grecaptcha: Grecaptcha
    ___grecaptcha_cfg?: {
      explicit?: boolean
    }
  }
}

// ============================================================================
// Injection Keys
// ============================================================================

export const RECAPTCHA_INJECTION_KEY = Symbol(
  'vue3-recaptcha'
) as import('vue').InjectionKey<RecaptchaContext>

export interface RecaptchaContext {
  siteKey: string
  version: RecaptchaVersion
  isLoaded: import('vue').Ref<boolean>
  loadScript: () => Promise<void>
}
