# Vue3 Recaptcha

[![npm version](https://badge.fury.io/js/@anilkumarthakur%2Fvue3-recaptcha.svg)](https://www.npmjs.com/package/@anilkumarthakur/vue3-recaptcha)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-anilkumarthakur/vue3--recaptcha-blue)](https://github.com/anilkumarthakur/vue3-recaptcha)

A fully-typed Vue 3 plugin for seamless Google reCAPTCHA v2 and v3 integration. Supports reCAPTCHA v2 (checkbox & invisible) and v3 (score-based) with TypeScript first approach.

> **Note:** This package requires Vue 3.4.0 or higher

## ✨ Features

**Full reCAPTCHA Support**
- ✅ reCAPTCHA v2 Checkbox
- ✅ reCAPTCHA v2 Invisible  
- ✅ reCAPTCHA v3 (Score-based)

**Developer Experience**
- 🎯 TypeScript first - Fully typed components and composables
- 🚀 Vue 3 Composition API compatible
- 📦 Easy to use with v-model binding
- ⚙️ Global plugin configuration with component-level overrides
- 🔒 SSR-safe implementation

**Advanced Features**
- 🔄 Automatic script loading with caching
- ⚡ Error handling and retry logic
- ⏱️ Token expiration management
- 📦 Multiple output formats (ES, UMD, CommonJS)
- 🎨 Full TypeScript support with IntelliSense

## 📦 Installation

```bash
npm install @anilkumarthakur/vue3-recaptcha
```

### Requirements

- Vue 3.4.0 or higher
- Node.js 18.0.0 or higher

## 🚀 Quick Start

### 1. Register the Plugin

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { VueRecaptchaPlugin } from '@anilkumarthakur/vue3-recaptcha'

const app = createApp(App)

app.use(VueRecaptchaPlugin, {
  siteKey: 'your-recaptcha-site-key',
  version: 'v3' // 'v2' or 'v3' (default: 'v3')
})

app.mount('#app')
```

### 2. Use in Components

#### reCAPTCHA v3 (Recommended)

```vue
<template>
  <button @click="handleSubmit" :disabled="isLoading">
    {{ isLoading ? 'Submitting...' : 'Submit Form' }}
  </button>
  <p v-if="error" class="error">{{ error.message }}</p>
</template>

<script setup lang="ts">
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const { execute, token, error, isLoading } = useRecaptchaV3({ action: 'submit' })

async function handleSubmit() {
  try {
    const token = await execute()
    // Send token to your backend for verification
    console.log('Token:', token)
  } catch (err) {
    console.error('reCAPTCHA failed:', err)
  }
}
</script>
```

#### reCAPTCHA v2 Checkbox

```vue
<template>
  <form @submit.prevent="submitForm">
    <div class="form-group">
      <input v-model="formData" placeholder="Enter your data" />
    </div>
    <RecaptchaV2Checkbox 
      v-model="captchaToken"
      theme="light"
      size="normal"
      @verify="onVerified"
      @error="onError"
    />
    <button type="submit" :disabled="!captchaToken">Submit</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RecaptchaV2Checkbox } from '@anilkumarthakur/vue3-recaptcha'

const formData = ref('')
const captchaToken = ref('')

function submitForm() {
  if (!captchaToken.value) {
    alert('Please verify the reCAPTCHA')
    return
  }
  // Submit form with token to backend
  console.log('Token:', captchaToken.value)
}

function onVerified(token: string) {
  console.log('Verified with token:', token)
}

function onError(error: Error) {
  console.error('Verification error:', error)
}
</script>
```

#### reCAPTCHA v2 Invisible

```vue
<template>
  <form @submit.prevent="submitForm" ref="formRef">
    <input v-model="formData" placeholder="Enter data" />
    <RecaptchaV2Invisible 
      ref="captcha" 
      @verify="onVerified"
      badge="bottomright"
    />
    <button type="submit">Submit</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RecaptchaV2Invisible } from '@anilkumarthakur/vue3-recaptcha'

const formRef = ref()
const captcha = ref()
const formData = ref('')

async function submitForm() {
  try {
    const token = await captcha.value.execute()
    // Handle successful verification
    console.log('Verified with token:', token)
  } catch (error) {
    console.error('Verification failed:', error)
  }
}

function onVerified(token: string) {
  console.log('Verified with token:', token)
}
</script>
```

## 📚 API Reference

### Plugin Options

```typescript
interface RecaptchaPluginOptions {
  // Your Google reCAPTCHA site key (required)
  siteKey: string

  // reCAPTCHA version: 'v2' or 'v3' (default: 'v3')
  version?: 'v2' | 'v3'

  // Auto-load the reCAPTCHA script (default: true)
  autoLoad?: boolean

  // Language code (e.g., 'en', 'fr', 'de')
  // @see https://developers.google.com/recaptcha/docs/language
  language?: string

  // Custom script URL for enterprise/self-hosted
  scriptUrl?: string

  // Action name for reCAPTCHA v3 analytics (default: 'submit')
  action?: string

  // Callback when script is loaded
  onLoad?: () => void

  // Callback when script fails to load
  onError?: (error: Error) => void
}
```

## 🎮 Components

### RecaptchaV2Checkbox

Renders a visible reCAPTCHA v2 checkbox widget.

```typescript
interface RecaptchaV2CheckboxProps {
  // Override global siteKey
  siteKey?: string
  
  // Widget theme: 'light' | 'dark' (default: 'light')
  theme?: 'light' | 'dark'
  
  // Widget size: 'normal' | 'compact' (default: 'normal')
  size?: 'normal' | 'compact'
  
  // Accessibility tabindex (default: 0)
  tabindex?: number
  
  // v-model binding for token
  modelValue?: string
}

// Events
@verify="(token: string) => void"      // Fired when verified
@expire="() => void"                   // Fired when token expires
@error="(error: Error) => void"        // Fired on error
@load="() => void"                     // Fired when ready
@update:modelValue="(token: string) => void"

// Methods (via ref)
reset(): void                          // Reset the widget
getResponse(): string                  // Get current token
```

### RecaptchaV2Invisible

Renders an invisible reCAPTCHA v2 widget that triggers automatically on form submission.

```typescript
interface RecaptchaV2InvisibleProps {
  siteKey?: string
  
  // Badge position: 'bottomright' | 'bottomleft' | 'inline' (default: 'bottomright')
  badge?: 'bottomright' | 'bottomleft' | 'inline'
  
  tabindex?: number
  modelValue?: string
}

// Events (same as checkbox)
@verify="(token: string) => void"
@expire="() => void"
@error="(error: Error) => void"
@load="() => void"

// Methods (via ref)
execute(): Promise<string>             // Manually trigger verification
reset(): void                          // Reset the widget
getResponse(): string                  // Get current token
```

### RecaptchaV3

Renders a hidden reCAPTCHA v3 widget. The badge must be visible per Google's terms.

```typescript
interface RecaptchaV3Props {
  siteKey?: string
  
  // Action name for analytics (default: 'submit')
  action?: string
  
  // Badge position (default: 'bottomright')
  badge?: 'bottomright' | 'bottomleft' | 'inline'
  
  // Hide the reCAPTCHA badge (not recommended - check Google's ToS)
  hideBadge?: boolean
  
  modelValue?: string
}

// Events
@verify="(token: string) => void"      // When token is obtained
@error="(error: Error) => void"        // On error
@load="() => void"                     // When ready
@update:modelValue="(token: string) => void"

// Methods (via ref)
execute(action?: string): Promise<string>  // Execute and get token
load(): Promise<void>                  // Load the script
```

## 🪝 Composables

### useRecaptchaV2

For programmatic v2 control with full state management.

```typescript
const {
  token,           // Readonly Ref<string> - Current token
  isReady,         // Readonly Ref<boolean> - Widget ready state
  isLoading,       // Readonly Ref<boolean> - Loading state
  error,           // Readonly Ref<Error | null> - Error object
  widgetId,        // Readonly Ref<number | null> - Widget ID
  
  render,          // (container: HTMLElement | string) => Promise<number>
  execute,         // () => Promise<string> - For invisible mode
  reset,           // () => void
  getResponse      // () => string
} = useRecaptchaV2({
  siteKey: 'override-key',     // Optional: override plugin key
  theme: 'dark',               // Optional: 'light' | 'dark'
  size: 'compact',             // Optional: 'normal' | 'compact'
  badge: 'bottomright'         // Optional: position
})
```

### useRecaptchaV3

For programmatic v3 control with automatic token refresh.

```typescript
const {
  token,           // Readonly Ref<string> - Current token
  isReady,         // Readonly Ref<boolean> - Script ready state
  isLoading,       // Readonly Ref<boolean> - Loading state
  error,           // Readonly Ref<Error | null> - Error object
  
  execute          // (action?: string) => Promise<string>
} = useRecaptchaV3({
  siteKey: 'override-key',     // Optional: override plugin key
  action: 'login'              // Optional: action name
})
```

## 💡 Usage Examples

### Complete Form with v3 reCAPTCHA

```vue
<template>
  <form @submit.prevent="handleSubmit" class="contact-form">
    <div>
      <label for="email">Email:</label>
      <input id="email" v-model="email" type="email" required />
    </div>
    
    <div>
      <label for="message">Message:</label>
      <textarea id="message" v-model="message" required></textarea>
    </div>
    
    <button 
      type="submit" 
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Sending...' : 'Send Message' }}
    </button>
    
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">Message sent successfully!</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const email = ref('')
const message = ref('')
const isSubmitting = ref(false)
const error = ref('')
const success = ref(false)

const { execute } = useRecaptchaV3({ action: 'contact_form' })

async function handleSubmit() {
  isSubmitting.value = true
  error.value = ''
  success.value = false
  
  try {
    const token = await execute()
    
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        message: message.value,
        recaptchaToken: token
      })
    })
    
    if (response.ok) {
      success.value = true
      email.value = ''
      message.value = ''
    } else {
      error.value = 'Failed to send message'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.contact-form {
  max-width: 500px;
  margin: 0 auto;
}

.error {
  color: #d32f2f;
  margin-top: 1rem;
}

.success {
  color: #388e3c;
  margin-top: 1rem;
}
</style>
```

### Multiple Actions with v3

```typescript
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const { execute } = useRecaptchaV3()

// Different actions for different interactions
async function handleLogin() {
  const token = await execute('login')
  // Send to backend
}

async function handleSignup() {
  const token = await execute('signup')
  // Send to backend
}

async function handleCheckout() {
  const token = await execute('checkout')
  // Send to backend
}
```

### Dynamic Site Key Override

```vue
<template>
  <RecaptchaV3 
    :siteKey="selectedKey"
    action="custom_action"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const environment = 'production' // or 'staging'

const selectedKey = computed(() => {
  return environment === 'production'
    ? 'prod-site-key'
    : 'staging-site-key'
})
</script>
```

## 🔐 Backend Verification

After receiving a token from your frontend, verify it on your backend:

### Node.js/Express Example

```typescript
import axios from 'axios'

app.post('/api/verify-recaptcha', async (req, res) => {
  const { token } = req.body
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    )

    if (response.data.success) {
      const score = response.data.score // v3 only: 0.0 to 1.0
      if (score > 0.5) {
        // Proceed with action
        res.json({ verified: true })
      } else {
        res.status(403).json({ verified: false, reason: 'Low score' })
      }
    } else {
      res.status(403).json({ verified: false, reason: 'Invalid token' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' })
  }
})
```

## 📱 Browser Support

| Browser | Versions |
|---------|----------|
| Chrome/Edge | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Mobile | Modern versions |

## ✅ TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  RecaptchaPluginOptions,
  RecaptchaV2CheckboxProps,
  RecaptchaV2InvisibleProps,
  RecaptchaV3Props,
  UseRecaptchaV2Options,
  UseRecaptchaV2Return,
  UseRecaptchaV3Options,
  UseRecaptchaV3Return,
  RecaptchaContext
} from '@anilkumarthakur/vue3-recaptcha'
```

## 🆘 Troubleshooting

### "reCAPTCHA is not defined"

Make sure the reCAPTCHA script is loaded before using the plugin:

```typescript
app.use(VueRecaptchaPlugin, {
  siteKey: 'your-site-key',
  autoLoad: true  // Ensure this is true (default)
})
```

### Token not being updated

Ensure you're using `v-model` correctly on the component or watching the reactive token reference:

```typescript
const { token } = useRecaptchaV3()

// Watch for changes
watch(token, (newToken) => {
  console.log('New token:', newToken)
})
```

### CORS Issues

If you get CORS errors when verifying tokens on the backend, verify that:
1. Your backend is properly configured to make requests to Google's servers
2. You're using the correct secret key from your Google Console
3. Your backend URL is included in the authorized JavaScript origins in Google Console

## 📖 Documentation

- [Google reCAPTCHA Docs](https://developers.google.com/recaptcha)
- [Vue 3 Guide](https://vuejs.org/guide/introduction.html)
- [GitHub Repository](https://github.com/anilkumarthakur/vue3-recaptcha)

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs
- Suggest features
- Submit pull requests

[Submit an Issue](https://github.com/anilkumarthakur/vue3-recaptcha/issues)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ for the Vue 3 community.

---

**Questions?** Open a [GitHub Discussion](https://github.com/anilkumarthakur/vue3-recaptcha/discussions)
