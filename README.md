# @anilkumarthakur/vue3-recaptcha

A fully-typed Vue 3 plugin for Google reCAPTCHA — supports **v2 checkbox**, **v2 invisible**, and **v3 score-based** out of the box.

[![npm version](https://img.shields.io/npm/v/@anilkumarthakur/vue3-recaptcha)](https://www.npmjs.com/package/@anilkumarthakur/vue3-recaptcha)
[![npm downloads](https://img.shields.io/npm/dm/@anilkumarthakur/vue3-recaptcha)](https://www.npmjs.com/package/@anilkumarthakur/vue3-recaptcha)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Features

- **Three reCAPTCHA modes** — v2 checkbox, v2 invisible, v3 score-based
- **Component + composable APIs** — use whichever fits your pattern
- **`v-model` support** — bind tokens reactively with no boilerplate
- **TypeScript-first** — full type coverage, component instance types included
- **Script caching** — loads the Google script once, shared across all instances
- **Token expiry management** — auto-clears v3 tokens before Google's 2-minute expiry
- **SSR-safe** — DOM checks guard all browser APIs
- **Lightweight** — Vue is a peer dep, zero other runtime dependencies

---

## Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Plugin Options](#plugin-options)
- [Components](#components)
  - [RecaptchaV3](#recaptchav3)
  - [RecaptchaV2Checkbox](#recaptchav2checkbox)
  - [RecaptchaV2Invisible](#recaptchav2invisible)
- [Composables](#composables)
  - [useRecaptchaV3](#userecaptchav3)
  - [useRecaptchaV2](#userecaptchav2)
- [TypeScript](#typescript)
- [Running Locally](#running-locally)
- [Building](#building)
- [Contributing](#contributing)

---

## Installation

```bash
npm install @anilkumarthakur/vue3-recaptcha
# or
pnpm add @anilkumarthakur/vue3-recaptcha
# or
yarn add @anilkumarthakur/vue3-recaptcha
```

**Requirements:** Vue >= 3.4, Node >= 18

---

## Quick Start

### 1. Register the plugin

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { VueRecaptchaPlugin } from '@anilkumarthakur/vue3-recaptcha'

const app = createApp(App)

app.use(VueRecaptchaPlugin, {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  version: 'v3', // 'v2' | 'v3'
})

app.mount('#app')
```

### 2. Use a component

```vue
<template>
  <form @submit.prevent="submit">
    <RecaptchaV3 v-model="token" @verify="onVerify" />
    <button type="submit">Submit</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const token = ref('')

function onVerify(t: string) {
  console.log('Token ready:', t)
}

async function submit() {
  // send token to your backend for server-side verification
}
</script>
```

> Components (`RecaptchaV3`, `RecaptchaV2Checkbox`, `RecaptchaV2Invisible`) are auto-registered globally when you install the plugin. No per-component import needed.

---

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `siteKey` | `string` | — | **Required.** Your Google reCAPTCHA site key |
| `version` | `'v2' \| 'v3'` | `'v3'` | Which reCAPTCHA version to load |
| `autoLoad` | `boolean` | `true` | Load the Google script immediately on install |
| `language` | `string` | — | Force a language (e.g. `'fr'`, `'de'`) |
| `scriptUrl` | `string` | — | Override the Google script URL entirely |
| `action` | `string` | `'submit'` | Default action name for v3 analytics |
| `onLoad` | `() => void` | — | Callback when script loads successfully |
| `onError` | `(e: Error) => void` | — | Callback when script fails to load |

---

## Components

### RecaptchaV3

Invisible, score-based reCAPTCHA. Does not render any UI — Google shows a badge in the corner.

```vue
<template>
  <RecaptchaV3
    v-model="token"
    action="login"
    badge="bottomright"
    @verify="onVerify"
    @error="onError"
    ref="recaptcha"
  />
  <button @click="recaptcha?.execute('checkout')">Pay Now</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RecaptchaV3Instance } from '@anilkumarthakur/vue3-recaptcha'

const token = ref('')
const recaptcha = ref<RecaptchaV3Instance>()

function onVerify(t: string) { /* verified */ }
function onError(e: Error) { /* handle error */ }
</script>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteKey` | `string` | plugin config | Override the site key per-instance |
| `action` | `string` | `'submit'` | Action label for Google Analytics |
| `badge` | `'bottomright' \| 'bottomleft' \| 'inline'` | `'bottomright'` | Badge position |
| `hideBadge` | `boolean` | `false` | Hide the reCAPTCHA badge |
| `modelValue` | `string` | — | v-model token binding |

**Emits:** `update:modelValue`, `verify(token)`, `error(Error)`, `load`

**Ref Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `execute(action?)` | `Promise<string>` | Generate a new token |
| `load()` | `Promise<void>` | Manually trigger script load |

**Ref State:** `isLoaded`, `isLoading`, `error`

---

### RecaptchaV2Checkbox

The classic "I'm not a robot" checkbox widget.

```vue
<template>
  <RecaptchaV2Checkbox
    v-model="token"
    theme="light"
    size="normal"
    @verify="onVerify"
    @expire="onExpire"
    ref="checkbox"
  />
  <button @click="checkbox?.reset()">Reset</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RecaptchaV2CheckboxInstance } from '@anilkumarthakur/vue3-recaptcha'

const token = ref('')
const checkbox = ref<RecaptchaV2CheckboxInstance>()

function onVerify(t: string) { /* user checked */ }
function onExpire() { token.value = '' }
</script>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteKey` | `string` | plugin config | Override the site key per-instance |
| `theme` | `'light' \| 'dark'` | `'light'` | Widget color theme |
| `size` | `'normal' \| 'compact'` | `'normal'` | Widget size |
| `tabindex` | `number` | `0` | Accessibility tabindex |
| `modelValue` | `string` | — | v-model token binding |

**Emits:** `update:modelValue`, `verify(token)`, `expire`, `error(Error)`, `load`

**Ref Methods:** `reset()`, `getResponse(): string`

**Ref State:** `widgetId`

---

### RecaptchaV2Invisible

Invisible v2 — no UI, fires on demand, returns a token via promise.

```vue
<template>
  <RecaptchaV2Invisible
    v-model="token"
    badge="bottomright"
    @verify="onVerify"
    ref="invisible"
  />
  <button @click="verify">Submit</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RecaptchaV2InvisibleInstance } from '@anilkumarthakur/vue3-recaptcha'

const token = ref('')
const invisible = ref<RecaptchaV2InvisibleInstance>()

async function verify() {
  const t = await invisible.value?.execute()
  // proceed with form submission
}

function onVerify(t: string) { /* token ready */ }
</script>
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteKey` | `string` | plugin config | Override the site key per-instance |
| `badge` | `'bottomright' \| 'bottomleft' \| 'inline'` | `'bottomright'` | Badge position |
| `tabindex` | `number` | `0` | Accessibility tabindex |
| `modelValue` | `string` | — | v-model token binding |

**Emits:** `update:modelValue`, `verify(token)`, `expire`, `error(Error)`, `load`

**Ref Methods:** `execute(): Promise<string>`, `reset()`, `getResponse(): string`

---

## Composables

Composables give you full programmatic control without mounting a component. Useful when you want to decouple token generation from your template entirely.

### useRecaptchaV3

```ts
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const { execute, token, isReady, isLoading, error } = useRecaptchaV3({
  action: 'checkout',
})

async function handleSubmit() {
  try {
    const t = await execute()          // generates a fresh token
    await api.post('/checkout', { recaptchaToken: t })
  } catch (e) {
    console.error('reCAPTCHA failed', e)
  }
}
```

| Option | Type | Description |
|--------|------|-------------|
| `siteKey` | `string` | Override plugin-level site key |
| `action` | `string` | Default action for `execute()` calls |

| Return | Type | Description |
|--------|------|-------------|
| `token` | `Readonly<Ref<string>>` | Current token (clears after 110s) |
| `isReady` | `Readonly<Ref<boolean>>` | Script has loaded |
| `isLoading` | `Readonly<Ref<boolean>>` | Token generation in progress |
| `error` | `Readonly<Ref<Error \| null>>` | Last error |
| `execute(action?)` | `Promise<string>` | Generate a token |

---

### useRecaptchaV2

```ts
import { ref, onMounted } from 'vue'
import { useRecaptchaV2 } from '@anilkumarthakur/vue3-recaptcha'

const container = ref<HTMLElement>()

const { render, execute, reset, token, error } = useRecaptchaV2({
  theme: 'dark',
  size: 'normal',
})

onMounted(async () => {
  await render(container.value!)
})

async function handleSubmit() {
  const t = await execute()
  // send token to backend
}
```

| Return | Type | Description |
|--------|------|-------------|
| `token` | `Readonly<Ref<string>>` | Current token |
| `widgetId` | `Readonly<Ref<number \| null>>` | Google widget ID |
| `isReady` | `Readonly<Ref<boolean>>` | Widget rendered |
| `isLoading` | `Readonly<Ref<boolean>>` | Execution in progress |
| `error` | `Readonly<Ref<Error \| null>>` | Last error |
| `render(el)` | `Promise<number>` | Mount widget into a DOM element |
| `execute()` | `Promise<string>` | Trigger invisible verification |
| `reset()` | `void` | Reset widget state |
| `getResponse()` | `string` | Get current token synchronously |

---

## TypeScript

All component instance types are exported for use with template refs:

```ts
import type {
  RecaptchaV3Instance,
  RecaptchaV2CheckboxInstance,
  RecaptchaV2InvisibleInstance,
} from '@anilkumarthakur/vue3-recaptcha'
```

Other exported types:

```ts
import type {
  RecaptchaVersion,       // 'v2' | 'v3'
  RecaptchaTheme,         // 'light' | 'dark'
  RecaptchaSize,          // 'normal' | 'compact' | 'invisible'
  RecaptchaBadgePosition, // 'bottomright' | 'bottomleft' | 'inline'
  VueRecaptchaPluginOptions,
} from '@anilkumarthakur/vue3-recaptcha'
```

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/anilkumarthakur60/vue3-recaptcha.git
cd vue3-recaptcha

# 2. Install dependencies
npm install

# 3. Set up your reCAPTCHA key
# Create a .env file in the project root:
echo "VITE_RECAPTCHA_SITE_KEY=your_key_here" > .env

# 4. Start the demo app
npm run dev
# Opens at http://localhost:3000
```

> Get a free site key at [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin). Add `localhost` as an allowed domain when creating the key.

---

## Building

### Build the npm package

```bash
npm run build
```

Outputs to `dist/` in multiple formats:

| File | Format | Use case |
|------|--------|----------|
| `dist/index.es.js` | ES Module | Vite / modern bundlers |
| `dist/index.cjs` | CommonJS | Node / older bundlers |
| `dist/index.iife.js` | IIFE | CDN / `<script>` tags |
| `dist/index.d.ts` | TypeScript | Type declarations |

### Build the demo app

```bash
npm run build:prod
```

Builds the interactive demo site. Preview the output locally:

```bash
npm run preview
```

### Other scripts

```bash
npm run type-check   # TypeScript validation only (no emit)
npm run test         # Run Vitest test suite
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
```

---

## Contributing

Contributions are welcome — whether it's a bug fix, a new feature, or improved docs.

### Getting Started

1. **Fork** the repo and create your branch from `main`

   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make changes** — keep them focused and well-scoped

3. **Add or update tests** in `tests/` (Vitest + Vue Test Utils)

4. **Run the checks** before pushing

   ```bash
   npm run type-check
   npm run lint
   npm run test
   ```

5. **Open a PR** against `main` with a clear description of what changed and why

### Project Layout

```
src/
├── package/           # Library source (published to npm)
│   ├── index.ts       # Plugin entry + all exports
│   ├── components/    # RecaptchaV3, RecaptchaV2Checkbox, RecaptchaV2Invisible
│   ├── composables/   # useRecaptchaV3, useRecaptchaV2
│   ├── types/         # TypeScript interfaces and types
│   └── utils/         # Script loader and helpers
└── views/             # Demo app (HomeView etc.) — not published

tests/                 # Vitest specs mirroring src/package/
vite.config.ts         # Dev server config (demo app)
vite.config.prod.ts    # Library build config (npm package)
```

### What to Work On

- Issues labeled `good first issue` or `help wanted`
- Nuxt module wrapper
- reCAPTCHA Enterprise support
- Additional composable test coverage
- Docs improvements

---

## License

[MIT](./LICENSE) © [Anil Kumar Thakur](https://github.com/anilkumarthakur60)
