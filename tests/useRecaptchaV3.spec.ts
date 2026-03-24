import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useRecaptchaV3 } from '../src/package/composables/useRecaptchaV3'
import type { UseRecaptchaV3Options } from '../src/package/types'

vi.mock('../src/package/utils/script-loader', () => ({
  loadRecaptchaScript: vi.fn().mockImplementation(async (opts: any) => {
    opts.onLoad?.()
  }),
  isRecaptchaLoaded: vi.fn().mockReturnValue(true),
  removeScript: vi.fn(),
  getExistingScript: vi.fn().mockReturnValue(null),
  buildScriptUrl: vi.fn().mockReturnValue('https://mock.recaptcha.net/api.js'),
  waitForRecaptcha: vi.fn().mockResolvedValue(undefined)
}))

// ─── helpers ────────────────────────────────────────────────────────────────

function makeGrecaptchaMock(token = 'mock-v3-token') {
  return {
    ready: vi.fn((cb: () => void) => cb()),
    execute: vi.fn((_siteKey: string, _opts: { action: string }) => Promise.resolve(token)),
    render: vi.fn(() => 0),
    reset: vi.fn(),
    getResponse: vi.fn(() => '')
  }
}

function mountWithComposable(options: UseRecaptchaV3Options = {}) {
  let composableResult: ReturnType<typeof useRecaptchaV3> | undefined

  const Wrapper = defineComponent({
    setup() {
      composableResult = useRecaptchaV3(options)
      return composableResult
    },
    render() {
      return h('div')
    }
  })

  const wrapper = mount(Wrapper)
  return { wrapper, result: composableResult! }
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('useRecaptchaV3', () => {
  beforeEach(() => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()

    delete (window as any).grecaptcha
  })

  it('throws when no siteKey is provided', () => {
    expect(() => mountWithComposable()).toThrow('[vue3-recaptcha] Site key is required')
  })

  it('returns reactive refs in initial state', () => {
    const { result } = mountWithComposable({ siteKey: 'test-key' })

    expect(result.token.value).toBe('')
    expect(result.isReady.value).toBe(false)
    expect(result.isLoading.value).toBe(false)
    expect(result.error.value).toBeNull()
  })

  describe('execute()', () => {
    it('calls grecaptcha.execute with siteKey and default action', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      const token = await result.execute()

      expect(window.grecaptcha.execute).toHaveBeenCalledWith('test-key', { action: 'submit' })
      expect(token).toBe('mock-v3-token')
    })

    it('uses action from options', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key', action: 'login' })
      await result.execute()

      expect(window.grecaptcha.execute).toHaveBeenCalledWith('test-key', { action: 'login' })
    })

    it('overrides action at call time', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key', action: 'login' })
      await result.execute('signup')

      expect(window.grecaptcha.execute).toHaveBeenCalledWith('test-key', { action: 'signup' })
    })

    it('stores token in reactive ref', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.execute()

      expect(result.token.value).toBe('mock-v3-token')
    })

    it('sets isReady after first execute', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      expect(result.isReady.value).toBe(false)

      await result.execute()
      expect(result.isReady.value).toBe(true)
    })

    it('clears isLoading when done', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.execute()

      expect(result.isLoading.value).toBe(false)
    })

    it('sets error and throws when grecaptcha.execute rejects', async () => {
      window.grecaptcha.execute = vi.fn(() =>
        Promise.reject(new Error('network error'))
      ) as typeof window.grecaptcha.execute

      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await expect(result.execute()).rejects.toThrow('network error')

      expect(result.error.value?.message).toBe('network error')
      expect(result.token.value).toBe('')
    })

    it('clears error on subsequent successful execute', async () => {
      window.grecaptcha.execute = vi.fn(() =>
        Promise.reject(new Error('fail'))
      ) as typeof window.grecaptcha.execute

      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.execute().catch(() => undefined)
      expect(result.error.value).toBeInstanceOf(Error)

      window.grecaptcha.execute = vi.fn((_siteKey: string, _opts: { action: string }) =>
        Promise.resolve('ok-token')
      ) as unknown as typeof window.grecaptcha.execute

      await result.execute()
      expect(result.error.value).toBeNull()
    })
  })

  describe('token expiry timer', () => {
    it('clears token after ~110 seconds', async () => {
      vi.useFakeTimers()

      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.execute()
      expect(result.token.value).toBe('mock-v3-token')

      vi.advanceTimersByTime(110001)
      expect(result.token.value).toBe('')

      vi.useRealTimers()
    })

    it('resets expiry timer on re-execute', async () => {
      vi.useFakeTimers()

      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.execute()

      vi.advanceTimersByTime(100000)
      expect(result.token.value).toBe('mock-v3-token')

      // Re-execute resets the 110s timer
      await result.execute()
      vi.advanceTimersByTime(100000)
      expect(result.token.value).toBe('mock-v3-token')

      vi.useRealTimers()
    })
  })

  it('clears token and timer on unmount', async () => {
    vi.useFakeTimers()

    const { wrapper, result } = mountWithComposable({ siteKey: 'test-key' })
    await result.execute()
    expect(result.token.value).toBe('mock-v3-token')

    wrapper.unmount()
    expect(result.token.value).toBe('')

    expect(() => vi.advanceTimersByTime(200000)).not.toThrow()
    vi.useRealTimers()
  })
})
