import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { RecaptchaV2Invisible } from '../src/package/components/RecaptchaV2Invisible'

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

type RenderParams = {
  sitekey?: string
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
      return 7
    }),
    reset: vi.fn(),
    getResponse: vi.fn(() => 'invisible-response')
  }
}

const waitForRender = () => new Promise<void>((r) => setTimeout(r, 120))

// ─── tests ───────────────────────────────────────────────────────────────────

describe('RecaptchaV2Invisible', () => {
  beforeEach(() => {
    capturedRenderParams = {}
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()

    delete (window as any).grecaptcha
  })

  describe('default props', () => {
    it('has correct default values', () => {
      const wrapper = mount(RecaptchaV2Invisible)

      expect(wrapper.props('badge')).toBe('bottomright')
      expect(wrapper.props('tabindex')).toBe(0)
      expect(wrapper.props('modelValue')).toBe('')
    })
  })

  describe('rendering', () => {
    it('renders a hidden div', () => {
      const wrapper = mount(RecaptchaV2Invisible)
      const div = wrapper.find('.vue3-recaptcha-v2-invisible')

      expect(div.exists()).toBe(true)
      expect((div.element as HTMLElement).style.display).toBe('none')
    })

    it('renders widget with size=invisible on mount', async () => {
      mount(RecaptchaV2Invisible, {
        props: { siteKey: 'my-key', tabindex: 3 }
      })

      await waitForRender()

      expect(window.grecaptcha.render).toHaveBeenCalledOnce()
      expect(capturedRenderParams.size).toBe('invisible')
      expect(capturedRenderParams.sitekey).toBe('my-key')
      expect(capturedRenderParams.tabindex).toBe(3)
    })

    it('emits load after successful render', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()
      expect(wrapper.emitted('load')).toBeTruthy()
    })
  })

  describe('emits', () => {
    it('emits verify and update:modelValue when callback fires', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()
      capturedRenderParams.callback?.('invisible-token')

      expect(wrapper.emitted('verify')).toEqual([['invisible-token']])
      expect(wrapper.emitted('update:modelValue')).toEqual([['invisible-token']])
    })

    it('emits expire and clears modelValue', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()
      capturedRenderParams['expired-callback']?.()

      expect(wrapper.emitted('expire')).toBeTruthy()
      const updates = wrapper.emitted('update:modelValue') as string[][]
      expect(updates.at(-1)).toEqual([''])
    })

    it('emits error on error-callback', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()
      capturedRenderParams['error-callback']?.()

      const errorEvents = wrapper.emitted('error') as Error[][]
      expect(errorEvents[0]?.[0]).toBeInstanceOf(Error)
    })
  })

  describe('execute()', () => {
    it('resolves with token when grecaptcha calls back', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()

      window.grecaptcha.execute = vi.fn((_widgetId?: number) => {
        setTimeout(() => capturedRenderParams.callback?.('exec-token'), 10)
        return undefined
      }) as unknown as typeof window.grecaptcha.execute


      const promise = (wrapper.vm as any).execute() as Promise<string>
      await new Promise((r) => setTimeout(r, 50))
      const token = await promise

      expect(token).toBe('exec-token')
    })

    it('rejects when error-callback fires during execute', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()

      window.grecaptcha.execute = vi.fn((_widgetId?: number) => {
        setTimeout(() => capturedRenderParams['error-callback']?.(), 10)
        return undefined
      }) as unknown as typeof window.grecaptcha.execute

      // Attach rejection handler immediately to avoid unhandled-rejection warning

      const rejection = expect(
        (wrapper.vm as any).execute() as Promise<string>
      ).rejects.toBeInstanceOf(Error)
      await new Promise((r) => setTimeout(r, 50))
      await rejection
    })

    it('rejects after 60 second timeout', async () => {
      vi.useFakeTimers()

      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      vi.useRealTimers()
      await waitForRender()
      vi.useFakeTimers()


      const promise = (wrapper.vm as any).execute() as Promise<string>
      const rejection = expect(promise).rejects.toThrow('Verification timeout')
      await vi.runAllTimersAsync()

      await rejection
      vi.useRealTimers()
    })
  })

  describe('exposed methods', () => {
    it('exposes execute, reset, getResponse, widgetId', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()

      const vm = wrapper.vm as any

      expect(typeof vm.execute).toBe('function')
      expect(typeof vm.reset).toBe('function')
      expect(typeof vm.getResponse).toBe('function')
      expect(vm.widgetId).toBe(7)
    })

    it('reset calls grecaptcha.reset and emits empty modelValue', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()

        ; (wrapper.vm as any).reset()

      expect(window.grecaptcha.reset).toHaveBeenCalledWith(7)
      const updates = wrapper.emitted('update:modelValue') as string[][]
      expect(updates.at(-1)).toEqual([''])
    })

    it('getResponse calls grecaptcha.getResponse', async () => {
      const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

      await waitForRender()

      const response = (wrapper.vm as any).getResponse()

      expect(window.grecaptcha.getResponse).toHaveBeenCalledWith(7)
      expect(response).toBe('invisible-response')
    })
  })

  it('clears widgetId on unmount', async () => {
    const wrapper = mount(RecaptchaV2Invisible, { props: { siteKey: 'my-key' } })

    await waitForRender()
    wrapper.unmount()


    expect((wrapper.vm as any).widgetId).toBeFalsy()
  })
})
