# Vue3 Recaptcha

[![npm version](https://badge.fury.io/js/@anilkumarthakur%2Fvue3-recaptcha.svg)](https://badge.fury.io/js/@anilkumarthakur%2Fvue3-recaptcha)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Vue 3 plugin for seamless Google reCAPTCHA v2 and v3 integration. Supports both checkbox and invisible reCAPTCHA v2, as well as the score-based reCAPTCHA v3.

## Features

✨ **Full reCAPTCHA Support**

- reCAPTCHA v2 Checkbox
- reCAPTCHA v2 Invisible
- reCAPTCHA v3 (Score-based)

🎯 **Developer Experience**

- TypeScript first - Fully typed components and composables
- Vue 3 Composition API compatible
- Easy to use with v-model binding
- Global plugin configuration
- Component-level overrides

⚙️ **Advanced Features**

- Automatic script loading with caching
- Error handling and retry logic
- Token expiration management
- SSR-safe implementation
- Multiple output formats (ES, UMD, CommonJS)

## Installation

```bash
npm install @anilkumarthakur/vue3-recaptcha
```

## Quick Start

### 1. Register the Plugin

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { VueRecaptchaPlugin } from '@anilkumarthakur/vue3-recaptcha'

const app = createApp(App)

app.use(VueRecaptchaPlugin, {
  siteKey: 'your-recaptcha-site-key',
  version: 'v3' // 'v2' or 'v3'
})

app.mount('#app')
```

### 2. Use in Components

#### reCAPTCHA v3

```vue
<template>
  <button @click="handleSubmit">Submit Form</button>
</template>

<script setup lang="ts">
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const { execute, token, error } = useRecaptchaV3({ action: 'submit' })

async function handleSubmit() {
  try {
    const token = await execute()
    // Send token to your backend for verification
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
    <RecaptchaV2Checkbox v-model="captchaToken" />
    <button type="submit">Submit</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RecaptchaV2Checkbox } from '@anilkumarthakur/vue3-recaptcha'

const captchaToken = ref('')

function submitForm() {
  if (!captchaToken.value) {
    alert('Please verify the reCAPTCHA')
    return
  }
  // Submit form with token
}
</script>
```

#### reCAPTCHA v2 Invisible

```vue
<template>
  <form @submit.prevent="submitForm" ref="formRef">
    <input v-model="formData" placeholder="Enter data" />
    <RecaptchaV2Invisible ref="captcha" @verify="onVerified" />
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
  } catch (error) {
    console.error('Verification failed:', error)
  }
}

function onVerified(token: string) {
  console.log('Verified with token:', token)
}
</script>
```

## API Reference

### Plugin Options

```typescript
interface RecaptchaPluginOptions {
  // Your Google reCAPTCHA site key
  siteKey: string

  // reCAPTCHA version: 'v2' or 'v3' (default: 'v3')
  version?: RecaptchaVersion

  // Auto-load the reCAPTCHA script (default: true)
  autoLoad?: boolean

  // Language code (e.g., 'en', 'fr', 'de')
  language?: string

  // Custom script URL for enterprise/self-hosted
  scriptUrl?: string

  // Callback when script is loaded
  onLoad?: () => void

  // Callback when script fails to load
  onError?: (error: Error) => void
}
```

### Components

#### RecaptchaV2Checkbox

```typescript
interface RecaptchaV2CheckboxProps {
  siteKey?: string           // Override plugin siteKey
  theme?: 'light' | 'dark'   // Default: 'light'
  size?: 'normal' | 'compact' // Default: 'normal'
  tabindex?: number
  modelValue?: string        // v-model
}

// Events
@verify="(token: string) => void"
@expire="() => void"
@error="(error: Error) => void"
@load="() => void"
@update:modelValue="(token: string) => void"

// Methods
reset()                      // Reset the widget
getResponse(): string        // Get current token
```

#### RecaptchaV2Invisible

```typescript
interface RecaptchaV2InvisibleProps {
  siteKey?: string           // Override plugin siteKey
  badge?: RecaptchaBadgePosition  // 'bottomright' | 'bottomleft' | 'inline'
  tabindex?: number
  modelValue?: string        // v-model
}

// Events (same as checkbox)
@verify="(token: string) => void"
@expire="() => void"
@error="(error: Error) => void"
@load="() => void"

// Methods
execute(): Promise<string>   // Trigger verification
reset()                      // Reset the widget
getResponse(): string        // Get current token
```

#### RecaptchaV3

```typescript
interface RecaptchaV3Props {
  siteKey?: string           // Override plugin siteKey
  action?: string            // Analytics action name (default: 'submit')
  badge?: RecaptchaBadgePosition
  hideBadge?: boolean        // Hide the badge
  modelValue?: string        // v-model
}

// Events
@verify="(token: string) => void"
@error="(error: Error) => void"
@load="() => void"
@update:modelValue="(token: string) => void"

// Methods
execute(action?: string): Promise<string>  // Get token
load(): Promise<void>       // Load the script
```

### Composables

#### useRecaptchaV2

```typescript
const {
  token,          // Readonly Ref<string> - Current token
  isReady,        // Readonly Ref<boolean> - Widget ready state
  isLoading,      // Readonly Ref<boolean> - Loading state
  error,          // Readonly Ref<Error | null> - Error if any
  widgetId,       // Readonly Ref<number | null> - Widget ID
  render,         // (container: HTMLElement | string) => Promise<number>
  execute,        // () => Promise<string> - For invisible mode
  reset,          // () => void
  getResponse     // () => string
} = useRecaptchaV2({
  siteKey: 'override-key',
  theme: 'dark',
  size: 'compact'
})
```

#### useRecaptchaV3

```typescript
const {
  token,          // Readonly Ref<string> - Current token
  isReady,        // Readonly Ref<boolean> - Ready state
  isLoading,      // Readonly Ref<boolean> - Loading state
  error,          // Readonly Ref<Error | null> - Error if any
  execute         // (action?: string) => Promise<string>
} = useRecaptchaV3({
  siteKey: 'override-key',
  action: 'login'
})
```

## Examples

### Form Validation with v3

```vue
<template>
  <form @submit.prevent="submitForm">
    <input v-model="email" type="email" placeholder="Enter email" />
    <button :disabled="isSubmitting">
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const email = ref('')
const isSubmitting = ref(false)
const { execute } = useRecaptchaV3({ action: 'submit_form' })

async function submitForm() {
  isSubmitting.value = true
  try {
    const token = await execute()
    // Verify with backend
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email: email.value })
    })
    // Handle response
  } catch (error) {
    console.error('Submission failed:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

### Multiple Actions with v3

```typescript
const { execute } = useRecaptchaV3()

// Different actions for different user interactions
await execute('login')
await execute('signup')
await execute('checkout')
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Node.js: 18.0.0 or higher

## TypeScript Support

Full TypeScript support included. All components and composables are fully typed.

```typescript
import type {
  RecaptchaPluginOptions,
  RecaptchaV2CheckboxProps,
  RecaptchaV3Props,
  UseRecaptchaV2Options,
  UseRecaptchaV3Options
} from '@anilkumarthakur/vue3-recaptcha'
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Support

- 🐛 [Report Issues](https://github.com/anilkumarthakur/vue3-recaptcha/issues)
- 💬 [Discussions](https://github.com/anilkumarthakur/vue3-recaptcha/discussions)
- 📖 [Documentation](https://github.com/anilkumarthakur/vue3-recaptcha)

## Changelog

### v0.1.0

- Complete rewrite with v2 and v3 support
- Added composables for flexible usage
- Improved TypeScript support
- Better error handling
- Multiple output formats

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Vue 3 Documentation](https://vuejs.org/)
- [GitHub Repository](https://github.com/anilkumarthakur/vue3-recaptcha)
