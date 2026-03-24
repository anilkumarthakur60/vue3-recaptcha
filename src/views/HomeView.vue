<script setup lang="ts">
import { RecaptchaV3 } from '../package/components'
import type { RecaptchaV3Instance } from '../package/types'
import { onMounted, ref } from 'vue'
import axios from 'axios'

const recaptchaComponent = ref<RecaptchaV3Instance | null>(null)
const loading = ref<boolean>(false)
const recaptchaToken = ref<string>('')

const handleTokenUpdate = (token: string) => {
  copyToken('Token has been regenerated and copied to clipboard')
  console.log('Token updated:', token)
}

const showMessage = (message: string, duration: number = 1000) => {
  const existingMessageDiv = document.querySelector('.custom-message-div')
  if (existingMessageDiv) {
    document.body.removeChild(existingMessageDiv)
  }

  const messageDiv = document.createElement('div')
  messageDiv.className = 'custom-message-div'
  messageDiv.textContent = message
  messageDiv.style.position = 'fixed'
  messageDiv.style.top = '50%'
  messageDiv.style.left = '50%'
  messageDiv.style.transform = 'translate(-50%, -50%)'
  messageDiv.style.backgroundColor = '#4caf50'
  messageDiv.style.color = '#fff'
  messageDiv.style.padding = '10px 20px'
  messageDiv.style.borderRadius = '5px'
  messageDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
  document.body.appendChild(messageDiv)
  setTimeout(() => {
    document.body.removeChild(messageDiv)
  }, duration)
}

const copyToken = async (message: string = 'Token has been copied to clipboard') => {
  try {
    await navigator.clipboard.writeText(recaptchaToken.value)
    showMessage(message)
  } catch (err) {
    console.error('Failed to copy token: ', err)
  }
}

const handleRegenerate = async () => {
  loading.value = true
  try {
    await recaptchaComponent.value?.execute()
  } catch (err) {
    console.error('Failed to generate recaptcha token:', err)
  } finally {
    loading.value = false
  }
}

const verifyResponse = ref<unknown>(null)

const verifyRecaptcha = async () => {
  loading.value = true
  try {
    const response = await axios.post(
      'https://express-recaptcha-verify.vercel.app/verify-captcha',
      {
        captcha_token: recaptchaToken.value
      }
    )
    verifyResponse.value = response.data
  } catch (error) {
    verifyResponse.value = error
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Wait for component to be loaded, then generate initial token
  setTimeout(() => {
    handleRegenerate()
  }, 500)
})
</script>

<template>
  <div class="recaptcha-container">
    <div class="header">
      <h1>reCAPTCHA v3 Example</h1>
      <p class="subtitle">Score-based invisible verification</p>
    </div>

    <RecaptchaV3 v-model="recaptchaToken" @update:model-value="handleTokenUpdate" ref="recaptchaComponent" />
    <div class="recaptcha-token-container">
      <div class="recaptcha-token-label">
        <span>Recaptcha Token:</span>
      </div>
      <div class="recaptcha-token-buttons">
        <button class="buttonload btn btn-primary" @click="() => copyToken('Token has been copied to clipboard')"
          :disabled="loading">
          <i class="fa fa-copy" :class="{ 'fa-spin': loading }"></i>
          {{ loading ? 'Loading...' : 'Copy' }}
        </button>
        <button class="buttonload btn btn-success" @click="handleRegenerate" :disabled="loading">
          <i class="fa fa-refresh" :class="{ 'fa-spin': loading }"></i>
          {{ loading ? 'Loading...' : 'Regenerate' }}
        </button>
        <button class="buttonload btn btn-warning" @click="verifyRecaptcha" :disabled="loading">
          <i class="fa fa-check" :class="{ 'fa-spin': loading }"></i>
          {{ loading ? 'Loading...' : 'Verify Recaptcha' }}
        </button>
      </div>
      <div class="recaptcha-token">{{ recaptchaToken }}</div>
    </div>
    <div class="recaptcha-verify-response">
      <pre>{{ verifyResponse }}</pre>
    </div>

    <div class="example-section">
      <h3>Using RecaptchaV3 Component</h3>
      <div class="example-code">
        <pre v-pre><code>&lt;template&gt;
  &lt;RecaptchaV3 
    v-model="token"
    action="submit"
    @update:model-value="handleTokenUpdate"
    ref="recaptcha"
  /&gt;
  &lt;button @click="regenerateToken"&gt;Regenerate Token&lt;/button&gt;
  &lt;p v-if="token"&gt;Token: {{ token }}&lt;/p&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
import { ref } from 'vue'
import { RecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'
import type { RecaptchaV3Instance } from '@anilkumarthakur/vue3-recaptcha'

const token = ref('')
const recaptcha = ref&lt;RecaptchaV3Instance | null&gt;(null)

function handleTokenUpdate(newToken: string) {
  console.log('Token updated:', newToken)
}

async function regenerateToken() {
  try {
    await recaptcha.value?.execute()
  } catch (error) {
    console.error('Failed to generate token:', error)
  }
}
&lt;/script&gt;</code></pre>
      </div>
    </div>

    <div class="example-section">
      <h3>Using useRecaptchaV3 Composable</h3>
      <div class="example-code">
        <pre v-pre><code>&lt;template&gt;
  &lt;div&gt;
    &lt;button @click="handleSubmit" :disabled="isLoading"&gt;
      {{ isLoading ? 'Submitting...' : 'Submit Form' }}
    &lt;/button&gt;
    &lt;p v-if="error"&gt;Error: {{ error.message }}&lt;/p&gt;
    &lt;p v-if="token"&gt;Token: {{ token }}&lt;/p&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
import { useRecaptchaV3 } from '@anilkumarthakur/vue3-recaptcha'

const { execute, token, error, isLoading } = useRecaptchaV3({
  action: 'submit'
})

async function handleSubmit() {
  try {
    const newToken = await execute()
    console.log('Token:', newToken)
    
    // Send token to your backend
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: newToken })
    })
    
    const result = await response.json()
    console.log('Verification result:', result)
  } catch (err) {
    console.error('reCAPTCHA failed:', err)
  }
}
&lt;/script&gt;</code></pre>
      </div>
    </div>

    <div class="setup-section">
      <h3>Setup Instructions</h3>
      <div class="setup-content">
        <h4>1. Install Package</h4>
        <pre v-pre><code>npm install @anilkumarthakur/vue3-recaptcha</code></pre>

        <h4>2. Register Plugin in main.ts</h4>
        <pre v-pre><code>import { createApp } from 'vue'
import { VueRecaptchaPlugin } from '@anilkumarthakur/vue3-recaptcha'
import App from './App.vue'

const app = createApp(App)

app.use(VueRecaptchaPlugin, {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3,
  version: 'v3',
  action: 'submit'
})

app.mount('#app')</code></pre>

        <h4>3. Create .env File</h4>
        <pre v-pre><code>VITE_RECAPTCHA_SITE_KEY_V3=your_site_key_here</code></pre>

        <h4>4. Verify Token on Backend</h4>
        <pre v-pre><code>import axios from 'axios'

app.post('/api/verify', async (req, res) => {
  const { token } = req.body
  
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    )
    
    if (response.data.success) {
      const score = response.data.score
      console.log('Score:', score)
      
      if (score > 0.5) {
        res.json({ verified: true })
      } else {
        res.status(403).json({ verified: false })
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' })
  }
})</code></pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');

.recaptcha-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 0;
  background: none;

  h1 {
    margin: 0 0 8px 0;
    font-size: 2.2em;
    font-weight: 700;
    color: #1a1a1a;
  }

  .subtitle {
    margin: 0;
    font-size: 1em;
    color: #666;
    font-weight: 400;
  }
}

.recaptcha-token-container {
  margin-top: 20px;
  padding: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 750px;
}

.recaptcha-token-label {
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
  font-size: 0.95em;
}

.recaptcha-token-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.buttonload {
  background-color: #2c3e50;
  border: none;
  color: white;
  padding: 10px 18px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.buttonload:hover {
  background-color: #1a252f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.buttonload:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 1;
}

.btn-success {
  background-color: #27ae60;
}

.btn-success:hover {
  background-color: #229954;
}

.btn-success:disabled {
  background-color: #bdc3c7;
}

.btn-warning {
  background-color: #f39c12;
}

.btn-warning:hover {
  background-color: #e67e22;
}

.btn-warning:disabled {
  background-color: #bdc3c7;
}

.fa {
  margin-left: 0;
  margin-right: 6px;
  font-size: 0.9em;
}

.recaptcha-token {
  color: #555;
  word-break: break-all;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 6px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', monospace;
  border: 1px solid #e0e0e0;
}

.recaptcha-verify-response {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 750px;

  pre {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
    max-height: 250px;
    overflow-y: auto;
    font-size: 0.85em;
    line-height: 1.4;
    border: 1px solid #e0e0e0;
    margin: 0;
  }
}

.grecaptcha-badges {
  display: none !important;
}

.example-section {
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-top: 25px;
  width: 100%;
  max-width: 750px;
  border: 1px solid #e0e0e0;

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #1a1a1a;
    font-size: 1.1em;
    font-weight: 600;
  }
}

.example-code {
  margin-top: 0;
  background: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;

  pre {
    background: #f5f5f5;
    color: #333;
    padding: 15px;
    margin: 0;
    overflow-x: auto;
    font-size: 0.8em;
    line-height: 1.5;

    code {
      font-family: 'Monaco', 'Menlo', monospace;
    }
  }
}

.setup-section {
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-top: 25px;
  margin-bottom: 40px;
  width: 100%;
  max-width: 750px;
  border: 1px solid #e0e0e0;

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #1a1a1a;
    font-size: 1.1em;
    font-weight: 600;
  }
}

.setup-content {
  h4 {
    color: #2c3e50;
    font-size: 0.95em;
    margin-top: 18px;
    margin-bottom: 10px;
    border-left: 3px solid #2c3e50;
    padding-left: 12px;
    font-weight: 600;
  }

  pre {
    background: #f5f5f5;
    color: #333;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.8em;
    line-height: 1.4;
    margin: 0 0 15px 0;
    border: 1px solid #e0e0e0;

    code {
      font-family: 'Monaco', 'Menlo', monospace;
    }
  }
}

@media (max-width: 768px) {
  .recaptcha-container {
    padding: 20px 15px;
  }

  .header {
    margin-bottom: 30px;

    h1 {
      font-size: 1.6em;
    }

    .subtitle {
      font-size: 0.95em;
    }
  }

  .recaptcha-token-container,
  .recaptcha-verify-response,
  .example-section,
  .setup-section {
    padding: 20px;
    max-width: 100%;
  }

  .recaptcha-token-buttons {
    flex-direction: column;
  }

  .buttonload {
    width: 100%;
    justify-content: center;
  }
}
</style>
