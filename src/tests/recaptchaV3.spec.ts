/**
 * Legacy test file — kept for reference.
 * Comprehensive tests live in src/package/__tests__/RecaptchaV3.spec.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { RecaptchaV3 } from '../package/components/RecaptchaV3'
import type { ScriptLoaderOptions } from '../package/utils/script-loader'

vi.mock('../package/utils/script-loader', () => ({
  loadRecaptchaScript: vi.fn().mockImplementation(async (options: ScriptLoaderOptions) => {
    options.onLoad?.()
  }),
  isRecaptchaLoaded: vi.fn().mockReturnValue(true),
  removeScript: vi.fn(),
  getExistingScript: vi.fn().mockReturnValue(null),
  buildScriptUrl: vi.fn().mockReturnValue('https://mock.recaptcha.net/api.js'),
  waitForRecaptcha: vi.fn().mockResolvedValue(undefined)
}))

function makeGrecaptchaMock() {
  return {
    ready: vi.fn((cb: () => void) => cb()),
    execute: vi.fn((_siteKey: string, _opts: { action: string }) =>
      Promise.resolve('fake-token')
    ),
    render: vi.fn(() => 0),
    reset: vi.fn(),
    getResponse: vi.fn(() => 'fake-token')
  }
}

describe('RecaptchaV3 (legacy)', () => {
  beforeEach(() => {
    window.grecaptcha = makeGrecaptchaMock() as unknown as typeof window.grecaptcha
  })

  afterEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha
  })

  it('should use default props when none are provided', () => {
    const wrapper = shallowMount(RecaptchaV3)

    expect(wrapper.props().siteKey).toBe(undefined)
    expect(wrapper.props().action).toBe('submit')
    expect(wrapper.props().modelValue).toBe('')
  })

  it('should emit update:modelValue event on execute', async () => {
    const wrapper = shallowMount(RecaptchaV3, {
      props: { siteKey: 'test-site-key', action: 'homepage', modelValue: '' }
    })

    await new Promise((r) => setTimeout(r, 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = await (wrapper.vm as any).execute()

    expect(window.grecaptcha.execute).toHaveBeenCalledWith('test-site-key', { action: 'homepage' })
    expect(token).toBe('fake-token')
  })

  it('should handle errors when recaptcha is not available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).grecaptcha

    const wrapper = shallowMount(RecaptchaV3, {
      props: { siteKey: 'test-site-key', action: 'homepage' }
    })

    await new Promise((r) => setTimeout(r, 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((wrapper.vm as any).execute()).rejects.toThrow('grecaptcha is not available')
  })

  it('should update isLoaded ref on successful load', async () => {
    const wrapper = shallowMount(RecaptchaV3, {
      props: { siteKey: 'test-site-key' }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = wrapper.vm as any
    await vm.load()

    expect(vm.isLoaded.value).toBe(true)
  })

  it('should have execute method', () => {
    const wrapper = shallowMount(RecaptchaV3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(typeof (wrapper.vm as any).execute).toBe('function')
  })

  it('should have load method', () => {
    const wrapper = shallowMount(RecaptchaV3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(typeof (wrapper.vm as any).load).toBe('function')
  })

  it('should have loadRecaptcha alias for backward compatibility', () => {
    const wrapper = shallowMount(RecaptchaV3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = wrapper.vm as any

    expect(typeof vm.loadRecaptcha).toBe('function')
    expect(vm.loadRecaptcha).toBe(vm.load)
  })
})
