import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { RecaptchaV2Checkbox } from '../components/RecaptchaV2Checkbox'

vi.mock('../utils/script-loader', () => ({
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
    execute: vi.fn(),
    render: vi.fn((_container: HTMLElement | string, params: RenderParams) => {
      capturedRenderParams = params
      return 42
    }),
    reset: vi.fn(),
    getResponse: vi.fn(() => 'checkbox-response-token')
  }
}

/** Wait long enough for the 50ms setInterval in renderWidget to fire. */
const waitForRender = () => new Promise<void>((r) => setTimeout(r, 120))

// ─── tests ───────────────────────────────────────────────────────────────────

describe('RecaptchaV2Checkbox', () => {
  beforeEach(() => {
    capturedRenderParams = {}
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
  })

  afterEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha
  })

  describe('default props', () => {
    it('has correct default values', () => {
      const wrapper = mount(RecaptchaV2Checkbox)

      expect(wrapper.props('theme')).toBe('light')
      expect(wrapper.props('size')).toBe('normal')
      expect(wrapper.props('tabindex')).toBe(0)
      expect(wrapper.props('modelValue')).toBe('')
      expect(wrapper.props('siteKey')).toBeUndefined()
    })
  })

  describe('rendering', () => {
    it('renders a div with the correct class', () => {
      const wrapper = mount(RecaptchaV2Checkbox)
      expect(wrapper.find('.vue3-recaptcha-v2-checkbox').exists()).toBe(true)
    })

    it('calls grecaptcha.render on mount with provided props', async () => {
      mount(RecaptchaV2Checkbox, {
        props: { siteKey: 'my-key', theme: 'dark', size: 'compact', tabindex: 1 }
      })

      await waitForRender()

      expect(window.grecaptcha.render).toHaveBeenCalledOnce()
      expect(capturedRenderParams.sitekey).toBe('my-key')
      expect(capturedRenderParams.theme).toBe('dark')
      expect(capturedRenderParams.size).toBe('compact')
      expect(capturedRenderParams.tabindex).toBe(1)
    })

    it('emits load after successful render', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      expect(wrapper.emitted('load')).toBeTruthy()
    })

    it('re-renders when theme prop changes', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, {
        props: { siteKey: 'my-key', theme: 'light' }
      })

      await waitForRender()
      expect(window.grecaptcha.render).toHaveBeenCalledOnce()

      await wrapper.setProps({ theme: 'dark' })
      await waitForRender()

      expect(window.grecaptcha.render).toHaveBeenCalledTimes(2)
    })

    it('re-renders when size prop changes', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, {
        props: { siteKey: 'my-key', size: 'normal' }
      })

      await waitForRender()
      expect(window.grecaptcha.render).toHaveBeenCalledOnce()

      await wrapper.setProps({ size: 'compact' })
      await waitForRender()

      expect(window.grecaptcha.render).toHaveBeenCalledTimes(2)
    })
  })

  describe('emits', () => {
    it('emits verify and update:modelValue when callback fires', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      capturedRenderParams.callback?.('verify-token')

      expect(wrapper.emitted('verify')).toEqual([['verify-token']])
      expect(wrapper.emitted('update:modelValue')).toEqual([['verify-token']])
    })

    it('emits expire and clears modelValue on expired-callback', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      capturedRenderParams.callback?.('a-token')
      capturedRenderParams['expired-callback']?.()

      expect(wrapper.emitted('expire')).toBeTruthy()
      const updates = wrapper.emitted('update:modelValue') as string[][]
      expect(updates.at(-1)).toEqual([''])
    })

    it('emits error on error-callback', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      capturedRenderParams['error-callback']?.()

      const errorEvents = wrapper.emitted('error') as Error[][]
      expect(errorEvents[0]?.[0]).toBeInstanceOf(Error)
    })
  })

  describe('exposed methods', () => {
    it('reset calls grecaptcha.reset with widgetId', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(wrapper.vm as any).reset()

      expect(window.grecaptcha.reset).toHaveBeenCalledWith(42)
    })

    it('getResponse calls grecaptcha.getResponse', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = (wrapper.vm as any).getResponse()

      expect(window.grecaptcha.getResponse).toHaveBeenCalledWith(42)
      expect(response).toBe('checkbox-response-token')
    })

    it('getResponse returns empty string before render', () => {
      const wrapper = mount(RecaptchaV2Checkbox)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((wrapper.vm as any).getResponse()).toBe('')
    })

    it('exposes widgetId ref with correct value after render', async () => {
      const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

      await waitForRender()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((wrapper.vm as any).widgetId).toBe(42)
    })
  })

  it('sets widgetId to null on unmount', async () => {
    const wrapper = mount(RecaptchaV2Checkbox, { props: { siteKey: 'my-key' } })

    await waitForRender()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((wrapper.vm as any).widgetId).toBe(42)

    wrapper.unmount()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((wrapper.vm as any).widgetId).toBeNull()
  })
})
