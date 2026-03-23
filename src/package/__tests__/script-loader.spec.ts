import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  buildScriptUrl,
  isRecaptchaLoaded,
  getExistingScript,
  loadRecaptchaScript,
  removeScript,
  waitForRecaptcha
} from '../utils/script-loader'
import type { ScriptLoaderOptions } from '../utils/script-loader'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeOptions(overrides: Partial<ScriptLoaderOptions> = {}): ScriptLoaderOptions {
  return { siteKey: 'test-key', version: 'v3', ...overrides }
}

function makeGrecaptchaMock() {
  return {
    ready: vi.fn((cb: () => void) => cb()),
    execute: vi.fn((_siteKey: string, _opts: { action: string }) =>
      Promise.resolve('mock-v3-token')
    ),
    render: vi.fn(() => 0),
    reset: vi.fn(),
    getResponse: vi.fn(() => '')
  }
}

/**
 * Mocks document.createElement so any created `<script>` element fires
 * its onload callback asynchronously on the next tick.
 */
function mockScriptAutoLoad() {
  const orig = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
    const el = orig(tag)
    if (tag === 'script') {
      setTimeout(() => (el as HTMLScriptElement).onload?.(new Event('load')), 0)
    }
    return el
  })
  vi.spyOn(document.head, 'appendChild').mockImplementation(() => document.head)
}

/**
 * Mocks document.createElement so any created `<script>` element fires
 * its onerror callback on the next tick.
 */
function mockScriptAutoError() {
  const orig = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
    const el = orig(tag)
    if (tag === 'script') {
      setTimeout(() => (el as HTMLScriptElement).onerror?.(new Event('error')), 0)
    }
    return el
  })
  vi.spyOn(document.head, 'appendChild').mockImplementation(() => document.head)
}

// ─── buildScriptUrl ──────────────────────────────────────────────────────────

describe('buildScriptUrl', () => {
  it('returns custom scriptUrl unchanged', () => {
    const url = buildScriptUrl(makeOptions({ scriptUrl: 'https://custom.cdn/api.js' }))
    expect(url).toBe('https://custom.cdn/api.js')
  })

  it('builds v3 url with render=siteKey', () => {
    const url = buildScriptUrl(makeOptions({ version: 'v3', siteKey: 'abc123' }))
    expect(url).toContain('render=abc123')
  })

  it('builds v2 url with render=explicit', () => {
    const url = buildScriptUrl(makeOptions({ version: 'v2', siteKey: 'abc123' }))
    expect(url).toContain('render=explicit')
    expect(url).not.toContain('abc123')
  })

  it('appends language param when provided', () => {
    const url = buildScriptUrl(makeOptions({ language: 'fr' }))
    expect(url).toContain('hl=fr')
  })

  it('omits language param when not provided', () => {
    const url = buildScriptUrl(makeOptions())
    expect(url).not.toContain('hl=')
  })

  it('sets window.___grecaptcha_cfg.explicit for v2', () => {
    buildScriptUrl(makeOptions({ version: 'v2' }))
    expect(window.___grecaptcha_cfg?.explicit).toBe(true)
  })
})

// ─── isRecaptchaLoaded ───────────────────────────────────────────────────────

describe('isRecaptchaLoaded', () => {
  beforeEach(() => removeScript())
  afterEach(() => {
    removeScript()
    vi.restoreAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha
  })

  it('returns false initially', () => {
    expect(isRecaptchaLoaded()).toBe(false)
  })

  it('returns true after successful script load', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    mockScriptAutoLoad()

    await loadRecaptchaScript(makeOptions())
    expect(isRecaptchaLoaded()).toBe(true)
  })

  it('returns false after removeScript()', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    mockScriptAutoLoad()

    await loadRecaptchaScript(makeOptions())
    removeScript()

    expect(isRecaptchaLoaded()).toBe(false)
  })
})

// ─── getExistingScript ───────────────────────────────────────────────────────

describe('getExistingScript', () => {
  afterEach(() => {
    document.querySelector('#vue3-recaptcha-script')?.remove()
  })

  it('returns null when no script present', () => {
    expect(getExistingScript()).toBeNull()
  })

  it('returns script element when it exists in the DOM', () => {
    const script = document.createElement('script')
    script.id = 'vue3-recaptcha-script'
    document.head.appendChild(script)

    expect(getExistingScript()).toBe(script)
  })
})

// ─── loadRecaptchaScript ─────────────────────────────────────────────────────

describe('loadRecaptchaScript', () => {
  beforeEach(() => {
    removeScript()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha
  })

  afterEach(() => {
    removeScript()
    vi.restoreAllMocks()
  })

  it('injects a <script> tag with async and defer', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha

    let injectedScript: HTMLScriptElement | undefined
    const orig = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
      const el = orig(tag) as HTMLScriptElement
      injectedScript = el
      setTimeout(() => el.onload?.(new Event('load')), 0)
      return el
    })
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => document.head)

    await loadRecaptchaScript(makeOptions())

    expect(injectedScript?.async).toBe(true)
    expect(injectedScript?.defer).toBe(true)
  })

  it('resolves and calls onLoad for v3', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    const onLoad = vi.fn()
    mockScriptAutoLoad()

    await loadRecaptchaScript(makeOptions({ onLoad }))
    expect(onLoad).toHaveBeenCalledOnce()
  })

  it('resolves and calls onLoad for v2', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    const onLoad = vi.fn()
    mockScriptAutoLoad()

    await loadRecaptchaScript(makeOptions({ version: 'v2', onLoad }))
    expect(onLoad).toHaveBeenCalledOnce()
  })

  it('rejects and calls onError when script fails', async () => {
    const onError = vi.fn()
    mockScriptAutoError()

    await expect(loadRecaptchaScript(makeOptions({ onError }))).rejects.toThrow(
      'Failed to load reCAPTCHA script'
    )
    expect(onError).toHaveBeenCalledOnce()
  })

  it('returns shared promise on concurrent calls', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    mockScriptAutoLoad()

    const p1 = loadRecaptchaScript(makeOptions())
    const p2 = loadRecaptchaScript(makeOptions())
    expect(p1).toBe(p2)

    await p1
  })

  it('resolves immediately on second call when already loaded', async () => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    mockScriptAutoLoad()

    await loadRecaptchaScript(makeOptions())
    expect(isRecaptchaLoaded()).toBe(true)

    // The second call must resolve in the same microtask tick (no async I/O)
    let resolved = false
    loadRecaptchaScript(makeOptions()).then(() => {
      resolved = true
    })
    await Promise.resolve() // flush microtasks
    expect(resolved).toBe(true)
  })
})

// ─── waitForRecaptcha ────────────────────────────────────────────────────────

describe('waitForRecaptcha', () => {
  beforeEach(() => {
    removeScript()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha
    vi.useFakeTimers()
  })

  afterEach(() => {
    removeScript()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('rejects after 10 second timeout', async () => {
    const promise = waitForRecaptcha()
    vi.advanceTimersByTime(10001)
    await expect(promise).rejects.toThrow('Timeout waiting for reCAPTCHA to load')
  })

  it('resolves when grecaptcha becomes available during polling', async () => {
    const promise = waitForRecaptcha()

    vi.advanceTimersByTime(200)
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    vi.advanceTimersByTime(200)

    await expect(promise).resolves.toBeUndefined()
  })

  it('resolves immediately when already loaded', async () => {
    vi.useRealTimers()
    removeScript()
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
    mockScriptAutoLoad()

    await loadRecaptchaScript(makeOptions())
    await expect(waitForRecaptcha()).resolves.toBeUndefined()
  })
})
