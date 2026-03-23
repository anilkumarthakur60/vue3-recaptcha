import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useRecaptchaV2 } from '../composables/useRecaptchaV2'
import type { UseRecaptchaV2Options } from '../types'

// Mock the script loader so tests don't try to inject real <script> tags
vi.mock('../utils/script-loader', () => ({
  loadRecaptchaScript: vi.fn().mockResolvedValue(undefined),
  isRecaptchaLoaded: vi.fn().mockReturnValue(true),
  removeScript: vi.fn(),
  getExistingScript: vi.fn().mockReturnValue(null),
  buildScriptUrl: vi.fn().mockReturnValue('https://mock.recaptcha.net/api.js'),
  waitForRecaptcha: vi.fn().mockResolvedValue(undefined)
}))

// ─── helpers ────────────────────────────────────────────────────────────────

type RenderParams = {
  sitekey?: string
  theme?: string
  size?: string
  tabindex?: number
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

let capturedRenderParams: RenderParams = {}

function makeGrecaptchaMock() {
  return {
    ready: vi.fn((cb: () => void) => cb()),
    execute: vi.fn((_widgetId?: number) => undefined),
    render: vi.fn((_container: HTMLElement | string, params: RenderParams) => {
      capturedRenderParams = params
      return 1
    }),
    reset: vi.fn(),
    getResponse: vi.fn(() => 'v2-response-token')
  }
}

function mountWithComposable(options: UseRecaptchaV2Options = {}) {
  let composableResult: ReturnType<typeof useRecaptchaV2> | undefined

  const Wrapper = defineComponent({
    setup() {
      composableResult = useRecaptchaV2(options)
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

describe('useRecaptchaV2', () => {
  beforeEach(() => {
    capturedRenderParams = {}
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
  })

  afterEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    expect(result.widgetId.value).toBeNull()
  })

  describe('render()', () => {
    it('renders widget and returns widgetId', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      const container = document.createElement('div')

      const id = await result.render(container)

      expect(id).toBe(1)
      expect(result.widgetId.value).toBe(1)
      expect(result.isReady.value).toBe(true)
      expect(window.grecaptcha.render).toHaveBeenCalledWith(
        container,
        expect.objectContaining({ sitekey: 'test-key' })
      )
    })

    it('passes theme, size, tabindex to render', async () => {
      const { result } = mountWithComposable({
        siteKey: 'test-key',
        theme: 'dark',
        size: 'compact',
        tabindex: 2
      })

      await result.render(document.createElement('div'))

      expect(window.grecaptcha.render).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ theme: 'dark', size: 'compact', tabindex: 2 })
      )
    })

    it('updates token ref when callback fires', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      capturedRenderParams.callback?.('new-token')
      expect(result.token.value).toBe('new-token')
    })

    it('clears token on expired-callback', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      capturedRenderParams.callback?.('some-token')
      capturedRenderParams['expired-callback']?.()
      expect(result.token.value).toBe('')
    })

    it('sets error on error-callback', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      capturedRenderParams['error-callback']?.()
      expect(result.error.value).toBeInstanceOf(Error)
    })
  })

  describe('execute()', () => {
    it('throws when widget is not rendered first', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await expect(result.execute()).rejects.toThrow('Widget not rendered')
    })

    it('resolves when widget triggers callback after execute', async () => {
      vi.useFakeTimers()

      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      window.grecaptcha.execute = vi.fn((_widgetId?: number) => {
        window.setTimeout(() => capturedRenderParams.callback?.('execute-token'), 50)
        return undefined
      })

      const promise = result.execute()
      vi.advanceTimersByTime(500)
      vi.useRealTimers()

      const token = await promise
      expect(token).toBe('execute-token')
    })

    it('rejects after 30 second timeout', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      vi.useFakeTimers()
      const promise = result.execute()
      vi.advanceTimersByTime(30001)
      vi.useRealTimers()

      await expect(promise).rejects.toThrow('Execute timeout')
    })
  })

  describe('reset()', () => {
    it('calls grecaptcha.reset after render', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      result.reset()
      expect(window.grecaptcha.reset).toHaveBeenCalledWith(1)
    })

    it('does nothing when widgetId is null', () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      result.reset()
      expect(window.grecaptcha.reset).not.toHaveBeenCalled()
    })
  })

  describe('getResponse()', () => {
    it('returns empty string before render', () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      expect(result.getResponse()).toBe('')
    })

    it('calls grecaptcha.getResponse with widgetId after render', async () => {
      const { result } = mountWithComposable({ siteKey: 'test-key' })
      await result.render(document.createElement('div'))

      const response = result.getResponse()
      expect(window.grecaptcha.getResponse).toHaveBeenCalledWith(1)
      expect(response).toBe('v2-response-token')
    })
  })

  it('clears widgetId and token on unmount', async () => {
    const { wrapper, result } = mountWithComposable({ siteKey: 'test-key' })
    await result.render(document.createElement('div'))
    capturedRenderParams.callback?.('some-token')

    expect(result.widgetId.value).toBe(1)
    wrapper.unmount()

    expect(result.widgetId.value).toBeNull()
    expect(result.token.value).toBe('')
  })
})
