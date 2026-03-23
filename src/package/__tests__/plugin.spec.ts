import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp } from 'vue'
import { VueRecaptchaPlugin, RECAPTCHA_INJECTION_KEY } from '../index'
import type { RecaptchaContext, ScriptLoaderOptions } from '../types'

// The mock calls onLoad so the plugin's isLoaded/onLoad callbacks fire properly
vi.mock('../utils/script-loader', () => ({
  loadRecaptchaScript: vi.fn().mockImplementation(async (options: ScriptLoaderOptions) => {
    options.onLoad?.()
  }),
  isRecaptchaLoaded: vi.fn().mockReturnValue(false),
  removeScript: vi.fn(),
  getExistingScript: vi.fn().mockReturnValue(null),
  buildScriptUrl: vi.fn().mockReturnValue('https://mock.recaptcha.net/api.js'),
  waitForRecaptcha: vi.fn().mockResolvedValue(undefined)
}))

import { loadRecaptchaScript } from '../utils/script-loader'

// ─── helpers ────────────────────────────────────────────────────────────────

function createTestApp() {
  return createApp({ template: '<div />' })
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('VueRecaptchaPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs error and returns early when siteKey is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const app = createTestApp()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use(VueRecaptchaPlugin, {} as any)

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Site key is required'))
  })

  it('registers all components globally', () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'test-key', autoLoad: false })

    const names = ['RecaptchaV2Checkbox', 'RecaptchaV2Invisible', 'RecaptchaV2', 'RecaptchaV3', 'Recaptcha']
    for (const name of names) {
      expect(app.component(name)).toBeDefined()
    }
  })

  it('provides RecaptchaContext with correct siteKey and version', () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', version: 'v3', autoLoad: false })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    expect(ctx.siteKey).toBe('my-key')
    expect(ctx.version).toBe('v3')
  })

  it('defaults version to v3', () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', autoLoad: false })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    expect(ctx.version).toBe('v3')
  })

  it('provides v2 version when specified', () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', version: 'v2', autoLoad: false })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    expect(ctx.version).toBe('v2')
  })

  it('exposes a loadScript function in context', () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', autoLoad: false })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    expect(typeof ctx.loadScript).toBe('function')
  })

  it('calls onLoad callback when loadScript is called', async () => {
    const onLoad = vi.fn()
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', autoLoad: false, onLoad })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    await ctx.loadScript()

    expect(onLoad).toHaveBeenCalledOnce()
  })

  it('sets isLoaded to true after loadScript', async () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', autoLoad: false })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    expect(ctx.isLoaded.value).toBe(false)

    await ctx.loadScript()
    expect(ctx.isLoaded.value).toBe(true)
  })

  it('does not call loadRecaptchaScript when autoLoad is false', () => {
    createTestApp().use(VueRecaptchaPlugin, { siteKey: 'my-key', autoLoad: false })
    expect(loadRecaptchaScript).not.toHaveBeenCalled()
  })

  it('calls loadRecaptchaScript automatically when autoLoad is true (default)', async () => {
    createTestApp().use(VueRecaptchaPlugin, { siteKey: 'my-key' })

    await new Promise((r) => setTimeout(r, 0))
    expect(loadRecaptchaScript).toHaveBeenCalledOnce()
  })

  it('calls onError callback once and logs when auto-load fails', async () => {
    const onError = vi.fn()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    // Override the mock to reject this time
    vi.mocked(loadRecaptchaScript).mockRejectedValueOnce(new Error('script failed'))

    createTestApp().use(VueRecaptchaPlugin, { siteKey: 'my-key', onError })

    await new Promise((r) => setTimeout(r, 0))

    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to auto-load script'),
      expect.any(Error)
    )
  })

  it('isLoaded ref starts as false', () => {
    const app = createTestApp()
    app.use(VueRecaptchaPlugin, { siteKey: 'my-key', autoLoad: false })

    const ctx = app._context.provides[RECAPTCHA_INJECTION_KEY as symbol] as RecaptchaContext
    expect(ctx.isLoaded.value).toBe(false)
  })
})
