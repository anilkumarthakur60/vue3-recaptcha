/// <reference types="vite/client" />



interface ImportMetaEnv {
  readonly VITE_RECAPTCHA_SITE_KEY_V3: string
  readonly VITE_RECAPTCHA_SITE_KEY_V2: string
  readonly VITE_API_VERIFY_CAPTCHA_V3: string
  readonly VITE_API_VERIFY_CAPTCHA_V2: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
