import { createApp } from 'vue'
import App from './App.vue'
import { recaptchaPlugin, } from '@anilkumarthakur/vue3-recaptcha'

const app = createApp(App)

app.use(recaptchaPlugin,{
    siteKey: '6Ld22VYrAAAAACjAgqRWwYzzJhZNmL4FzWYpak1b',
    siteAction:'login',
})

app.mount('#app')
