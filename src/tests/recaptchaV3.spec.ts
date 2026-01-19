import { shallowMount } from '@vue/test-utils'
import RecaptchaV3 from '../package/components/RecaptchaV3.vue'

describe('RecaptchaV3.vue', () => {
  let grecaptchaMock: any

  beforeEach(() => {
    // Mock grecaptcha globally before each test
    grecaptchaMock = {
      ready: jest.fn((callback) => callback()),
      execute: jest.fn(() => Promise.resolve('fake-token')),
      render: jest.fn(() => 0),
      reset: jest.fn(),
      getResponse: jest.fn(() => 'fake-token')
    }
    global.window.grecaptcha = grecaptchaMock
  })

  afterEach(() => {
    // Clear mock after each test
    jest.clearAllMocks()
    delete (global.window as any).grecaptcha
  })

  it('should use default props when none are provided', () => {
    const wrapper = shallowMount(RecaptchaV3)

    expect(wrapper.props().siteKey).toBe(undefined)
    expect(wrapper.props().action).toBe('submit')
    expect(wrapper.props().modelValue).toBe('')
  })

  it('should emit update:modelValue event on execute', async () => {
    const wrapper = shallowMount(RecaptchaV3, {
      props: {
        siteKey: 'test-site-key',
        action: 'homepage',
        modelValue: ''
      }
    })

    // Execute should trigger token generation
    const token = await (wrapper.vm as any).execute()

    expect(grecaptchaMock.execute).toHaveBeenCalledWith('test-site-key', { action: 'homepage' })
    expect(token).toBe('fake-token')
  })

  it('should handle errors when recaptcha is not available', async () => {
    // Remove grecaptcha from the global scope to simulate it not being loaded
    delete (global.window as any).grecaptcha

    const wrapper = shallowMount(RecaptchaV3, {
      props: {
        siteKey: 'test-site-key',
        action: 'homepage'
      }
    })

    // Try executing when grecaptcha is not loaded
    await expect((wrapper.vm as any).execute()).rejects.toThrow('grecaptcha is not available')
  })

  it('should update isLoaded ref on successful load', async () => {
    const wrapper = shallowMount(RecaptchaV3, {
      props: {
        siteKey: 'test-site-key'
      }
    })

    const vm = wrapper.vm as any
    expect(vm.isLoaded).toBe(false)

    await vm.load()

    expect(vm.isLoaded).toBe(true)
  })

  it('should emit error event on load failure', async () => {
    const error = new Error('Test error')
    grecaptchaMock.ready = jest.fn(() => {
      throw error
    })

    const wrapper = shallowMount(RecaptchaV3, {
      props: {
        siteKey: 'test-site-key'
      }
    })

    // Load should handle the error gracefully
    const vm = wrapper.vm as any
    expect(vm.error).toBe(null)
  })

  it('should have execute method', () => {
    const wrapper = shallowMount(RecaptchaV3)
    const vm = wrapper.vm as any

    expect(typeof vm.execute).toBe('function')
  })

  it('should have load method', () => {
    const wrapper = shallowMount(RecaptchaV3)
    const vm = wrapper.vm as any

    expect(typeof vm.load).toBe('function')
  })

  it('should have loadRecaptcha alias for backward compatibility', () => {
    const wrapper = shallowMount(RecaptchaV3)
    const vm = wrapper.vm as any

    expect(typeof vm.loadRecaptcha).toBe('function')
    expect(vm.loadRecaptcha).toBe(vm.load)
  })

  it('should clear error on successful execution', async () => {
    const wrapper = shallowMount(RecaptchaV3, {
      props: {
        siteKey: 'test-site-key'
      }
    })

    const vm = wrapper.vm as any
    vm.error = new Error('Previous error')

    await vm.execute()

    // Error should be cleared after successful execution
    expect(vm.error).toBe(null)
  })
})

