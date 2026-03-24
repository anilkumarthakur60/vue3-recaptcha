import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { recaptchaPlugin } from './package'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(recaptchaPlugin, {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  action: 'login'
})

app.mount('#app')
