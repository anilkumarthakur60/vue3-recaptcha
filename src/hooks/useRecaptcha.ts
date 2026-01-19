import { ref } from 'vue'

export default function useRecaptcha(
  siteKey = '6LfQNKUaAAAAAHSVAVcs7kuzv2ZjLcR5nxssKrg5',
  action = 'homepage'
) {
  const recaptchaToken = ref<string>('')
  const recaptchaKey = ref<string>(siteKey)
  const recaptchaAction = ref<string>(action)

  function initializeRecaptcha() {
    return new Promise<string>((resolve, reject) => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          executeRecaptcha().then(resolve).catch(reject)
        })
      } else {
        reject(new Error('Recaptcha is not loaded'))
      }
    })
  }

  async function executeRecaptcha() {
    return window.grecaptcha
      .execute(recaptchaKey.value, { action: recaptchaAction.value })
      .then((token: string) => {
        recaptchaToken.value = token
        return token
      })
  }

  async function loadRecaptcha() {
    return new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha) {
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
        script.async = true
        script.defer = true
        script.onload = () => {
          initializeRecaptcha().then(resolve).catch(reject)
        }
        document.head.appendChild(script)
      } else {
        initializeRecaptcha().then(resolve).catch(reject)
      }
    })
  }

  return {
    recaptchaToken,
    loadRecaptcha,
    executeRecaptcha
  }
}
