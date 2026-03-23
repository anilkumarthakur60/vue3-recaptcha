import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { RecaptchaV3 } from '../components/RecaptchaV3'

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

function makeGrecaptchaMock(token = 'v3-mock-token') {
  return {
    ready: vi.fn((cb: () => void) => cb()),
    execute: vi.fn((_siteKey: string, _opts: { action: string }) => Promise.resolve(token)),
    render: vi.fn(() => 0),
    reset: vi.fn(),
    getResponse: vi.fn(() => '')
  }
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0))

// ─── tests ───────────────────────────────────────────────────────────────────

describe('RecaptchaV3', () => {
  beforeEach(() => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha
  })

  describe('default props', () => {
    it('has correct default values', () => {
      const wrapper = mount(RecaptchaV3)

      expect(wrapper.props('action')).toBe('submit')
      expect(wrapper.props('badge')).toBe('bottomright')
      expect(wrapper.props('hideBadge')).toBe(false)
      expect(wrapper.props('modelValue')).toBe('')
      expect(wrapper.props('siteKey')).toBeUndefined()
    })
  })

  describe('rendering', () => {
    it('renders a hidden div with the correct class', () => {
      const wrapper = mount(RecaptchaV3)
      const div = wrapper.find('.vue3-recaptcha-v3')

      expect(div.exists()).toBe(true)
      expect((div.element as HTMLElement).style.display).toBe('none')
    })
  })

  describe('load()', () => {
    it('emits load event on successful script load', async () => {
      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.vm as any).load()

      expect(wrapper.emitted('load')).toBeTruthy()
    })

    it('sets isLoaded to true after load', async () => {
      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vm = wrapper.vm as any
      await vm.load()

      expect(vm.isLoaded).toBe(true)
    })

    it('is idempotent — does not reload when already loaded', async () => {
      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vm = wrapper.vm as any

      await vm.load()
      const firstCallCount = (window.grecaptcha.execute as ReturnType<typeof vi.fn>).mock.calls
        .length

      await vm.load() // second call should be no-op
      expect((window.grecaptcha.execute as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
        firstCallCount
      )
    })
  })

  describe('execute()', () => {
    it('calls grecaptcha.execute with siteKey and action', async () => {
      const wrapper = mount(RecaptchaV3, {
        props: { siteKey: 'test-key', action: 'homepage' }
      })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.vm as any).execute()

      expect(window.grecaptcha.execute).toHaveBeenCalledWith('test-key', { action: 'homepage' })
    })

    it('accepts action override at call time', async () => {
      const wrapper = mount(RecaptchaV3, {
        props: { siteKey: 'test-key', action: 'default' }
      })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.vm as any).execute('purchase')

      expect(window.grecaptcha.execute).toHaveBeenCalledWith('test-key', { action: 'purchase' })
    })

    it('emits verify and update:modelValue with token', async () => {
      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.vm as any).execute()

      expect(wrapper.emitted('verify')).toEqual([['v3-mock-token']])
      expect(wrapper.emitted('update:modelValue')).toEqual([['v3-mock-token']])
    })

    it('returns the token string', async () => {
      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = await (wrapper.vm as any).execute()

      expect(token).toBe('v3-mock-token')
    })

    it('emits error and throws when execute rejects', async () => {
      window.grecaptcha.execute = vi.fn(() =>
        Promise.reject(new Error('api error'))
      ) as typeof window.grecaptcha.execute

      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((wrapper.vm as any).execute()).rejects.toThrow('api error')

      const errorEvents = wrapper.emitted('error') as Error[][]
      expect(errorEvents[0]?.[0]?.message).toBe('api error')
    })

    it('throws when grecaptcha is not available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).grecaptcha

      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((wrapper.vm as any).execute()).rejects.toThrow('grecaptcha is not available')
    })
  })

  describe('token expiry', () => {
    it('emits empty update:modelValue after ~110s', async () => {
      vi.useFakeTimers()

      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      vi.useRealTimers()
      await tick()
      vi.useFakeTimers()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.vm as any).execute()

      await vi.advanceTimersByTimeAsync(110001)

      const updates = wrapper.emitted('update:modelValue') as string[][]
      expect(updates.at(-1)).toEqual([''])

      vi.useRealTimers()
    })
  })

  describe('badge visibility', () => {
    it('hides .grecaptcha-badge when hideBadge is true', async () => {
      const badge = document.createElement('div')
      badge.className = 'grecaptcha-badge'
      document.body.appendChild(badge)

      const wrapper = mount(RecaptchaV3, {
        props: { siteKey: 'test-key', hideBadge: true }
      })

      await tick()
      expect(badge.style.visibility).toBe('hidden')

      wrapper.unmount()
      badge.remove()
    })

    it('shows .grecaptcha-badge when hideBadge is false', async () => {
      const badge = document.createElement('div')
      badge.className = 'grecaptcha-badge'
      badge.style.visibility = 'hidden'
      document.body.appendChild(badge)

      const wrapper = mount(RecaptchaV3, {
        props: { siteKey: 'test-key', hideBadge: false }
      })

      await tick()
      expect(badge.style.visibility).toBe('visible')

      wrapper.unmount()
      badge.remove()
    })

    it('toggles badge visibility when hideBadge prop changes', async () => {
      const badge = document.createElement('div')
      badge.className = 'grecaptcha-badge'
      document.body.appendChild(badge)

      const wrapper = mount(RecaptchaV3, {
        props: { siteKey: 'test-key', hideBadge: false }
      })

      await tick()
      expect(badge.style.visibility).toBe('visible')

      await wrapper.setProps({ hideBadge: true })
      expect(badge.style.visibility).toBe('hidden')

      wrapper.unmount()
      badge.remove()
    })
  })

  describe('exposed API', () => {
    it('exposes load, loadRecaptcha, execute, isLoaded, isLoading, error', async () => {
      const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

      await tick()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vm = wrapper.vm as any

      expect(typeof vm.load).toBe('function')
      expect(typeof vm.loadRecaptcha).toBe('function')
      expect(vm.loadRecaptcha).toBe(vm.load)
      expect(typeof vm.execute).toBe('function')
      expect(typeof vm.isLoaded).toBe('boolean')
      expect(typeof vm.isLoading).toBe('boolean')
      expect(vm.error).toBeNull()
    })
  })

  it('clears expiry timer on unmount without throwing', async () => {
    vi.useFakeTimers()

    const wrapper = mount(RecaptchaV3, { props: { siteKey: 'test-key' } })

    vi.useRealTimers()
    await tick()
    vi.useFakeTimers()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (wrapper.vm as any).execute()
    wrapper.unmount()

    expect(() => vi.advanceTimersByTime(200000)).not.toThrow()
    vi.useRealTimers()
  })
})
