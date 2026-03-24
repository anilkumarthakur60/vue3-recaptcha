<script setup lang="ts">
import { RecaptchaV2Checkbox } from '../package/components'
import type { RecaptchaV2CheckboxInstance } from '../package/types'
import { ref } from 'vue'
import axios from 'axios'

const recaptchaComponent = ref<RecaptchaV2CheckboxInstance | null>(null)
const loading = ref<boolean>(false)
const recaptchaToken = ref<string>('')
const formData = ref<string>('')

const handleTokenVerify = (token: string) => {
    recaptchaToken.value = token
    showMessage('reCAPTCHA verified successfully!')
    console.log('Verified token:', token)
}

const handleTokenError = (error: Error) => {
    showMessage(`reCAPTCHA Error: ${error.message}`, 2000)
    console.error('reCAPTCHA error:', error)
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
    messageDiv.style.zIndex = '10000'
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

const handleReset = () => {
    recaptchaComponent.value?.reset()
    recaptchaToken.value = ''
    formData.value = ''
    showMessage('Form reset successfully!')
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

const handleSubmit = async () => {
    if (!recaptchaToken.value) {
        showMessage('Please verify reCAPTCHA first!', 2000)
        return
    }

    loading.value = true
    showMessage('Form submitted with reCAPTCHA token!')

    // Simulate form submission
    setTimeout(() => {
        loading.value = false
        formData.value = ''
        showMessage('Form submitted successfully!')
    }, 1000)
}
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY_V2 // Replace with your actual reCAPTCHA site key
</script>

<template>
    <div class="v2-container">
        <div class="header">
            <h1>reCAPTCHA v2 Checkbox Example</h1>
            <p class="subtitle">Click the checkbox to verify your identity</p>
        </div>

        <div class="demo-section">
            <form @submit.prevent="handleSubmit" class="form-wrapper">
                <div class="form-group">
                    <label for="message">Message:</label>
                    <textarea id="message" v-model="formData" placeholder="Enter your message here..."
                        required></textarea>
                </div>

                <div class="recaptcha-wrapper">
                    <RecaptchaV2Checkbox v-model="recaptchaToken" ref="recaptchaComponent" theme="light" size="normal"
                        :site-key="siteKey" @verify="handleTokenVerify" @error="handleTokenError" />
                </div>

                <div class="button-group">
                    <button type="submit" class="btn btn-primary" :disabled="!recaptchaToken || loading">
                        <i class="fa fa-send"></i>
                        {{ loading ? 'Submitting...' : 'Submit Form' }}
                    </button>
                    <button type="button" class="btn btn-secondary" @click="handleReset" :disabled="loading">
                        <i class="fa fa-refresh"></i>
                        Reset
                    </button>
                </div>
            </form>

            <div class="token-section">
                <h3>Token Information</h3>
                <div class="token-display">
                    <div class="token-status">
                        <span v-if="recaptchaToken" class="status-verified">✓ Verified</span>
                        <span v-else class="status-pending">⊘ Pending Verification</span>
                    </div>
                    <div v-if="recaptchaToken" class="token-box">
                        <p class="token-label">Current Token:</p>
                        <p class="token-value">{{ recaptchaToken }}</p>
                        <button class="btn btn-copy" @click="copyToken('Token copied to clipboard!')">
                            <i class="fa fa-copy"></i>
                            Copy Token
                        </button>
                    </div>
                </div>

                <button v-if="recaptchaToken" class="btn btn-verify" @click="verifyRecaptcha" :disabled="loading">
                    <i class="fa fa-check"></i>
                    {{ loading ? 'Verifying...' : 'Verify with Backend' }}
                </button>
            </div>

            <div v-if="verifyResponse" class="verify-response">
                <h3>Backend Verification Response</h3>
                <pre>{{ JSON.stringify(verifyResponse, null, 2) }}</pre>
            </div>
        </div>

        <div class="example-section">
            <h3>Code Example</h3>
            <pre><code>&lt;template&gt;
  &lt;form @submit.prevent="handleSubmit"&gt;
    &lt;input v-model="formData" placeholder="Enter data" /&gt;
    &lt;RecaptchaV2Checkbox 
      v-model="captchaToken"
      theme="light"
      size="normal"
      @verify="onVerified"
      @error="onError"
    /&gt;
    &lt;button type="submit" :disabled="!captchaToken"&gt;
      Submit
    &lt;/button&gt;
  &lt;/form&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
import { ref } from 'vue'
import { RecaptchaV2Checkbox } from '@anilkumarthakur/vue3-recaptcha'

const formData = ref('')
const captchaToken = ref('')

function onVerified(token: string) {
  console.log('Verified:', token)
}

function onError(error: Error) {
  console.error('Error:', error)
}
&lt;/script&gt;</code></pre>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');

.v2-container {
    max-width: 750px;
    margin: 0 auto;
    padding: 40px 20px;
    background: #f5f7fa;
    min-height: 100vh;
}

.header {
    text-align: center;
    margin-bottom: 30px;
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

.demo-section {
    background: white;
    border-radius: 8px;
    padding: 25px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 25px;
    border: 1px solid #e0e0e0;
}

.form-wrapper {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.form-group {
    margin-bottom: 20px;

    label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
        font-size: 0.95em;
    }

    textarea {
        width: 100%;
        min-height: 80px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: inherit;
        font-size: 1em;
        resize: vertical;
        transition: border-color 0.2s;

        &:focus {
            outline: none;
            border-color: #2c3e50;
            box-shadow: 0 0 0 2px rgba(44, 62, 80, 0.05);
        }
    }
}

.recaptcha-wrapper {
    margin: 20px 0;
    padding: 15px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    padding: 10px 18px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;

    i {
        font-size: 0.9em;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
}

.btn-primary {
    background: #2c3e50;
    color: white;
    flex: 1;
}

.btn-primary:hover:not(:disabled) {
    background: #1a252f;
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #7f8c8d;
}

.btn-verify {
    background: #27ae60;
    color: white;
    width: 100%;
    justify-content: center;
    margin-top: 15px;
}

.btn-verify:hover:not(:disabled) {
    background: #229954;
}

.btn-copy {
    background: #3498db;
    color: white;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
}

.btn-copy:hover:not(:disabled) {
    background: #2980b9;
}

.token-section {
    margin-top: 20px;

    h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #1a1a1a;
        font-size: 1.05em;
        font-weight: 600;
    }
}

.token-display {
    background: #fafbfc;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 15px;
    border: 1px solid #e0e0e0;
}

.token-status {
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 0.95em;

    .status-verified {
        color: #27ae60;
    }

    .status-pending {
        color: #f39c12;
    }
}

.token-box {
    background: white;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;

    .token-label {
        color: #666;
        font-size: 0.85em;
        margin: 0 0 8px 0;
        font-weight: 500;
    }

    .token-value {
        font-family: 'Monaco', 'Menlo', monospace;
        word-break: break-all;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        margin: 0 0 10px 0;
        font-size: 0.8em;
        color: #333;
        border: 1px solid #e0e0e0;
    }
}

.verify-response {
    margin-top: 20px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #1a1a1a;
        font-size: 1.05em;
        font-weight: 600;
    }

    pre {
        background: #f5f5f5;
        color: #333;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.8em;
        margin: 0;
        border: 1px solid #e0e0e0;
    }
}

.example-section {
    background: white;
    border-radius: 8px;
    padding: 25px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e0e0;

    h3 {
        color: #1a1a1a;
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 1.05em;
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
        margin: 0;
        border: 1px solid #e0e0e0;

        code {
            font-family: 'Monaco', 'Menlo', monospace;
        }
    }
}

.custom-message-div {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #27ae60;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    font-size: 0.95em;
}

@keyframes slideIn {
    from {
        transform: translate(-50%, -60%);
        opacity: 0;
    }

    to {
        transform: translate(-50%, -50%);
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .v2-container {
        padding: 20px 15px;
    }

    .header {
        margin-bottom: 25px;

        h1 {
            font-size: 1.6em;
        }

        .subtitle {
            font-size: 0.95em;
        }
    }

    .demo-section,
    .example-section {
        padding: 20px;
    }

    .button-group {
        flex-direction: column;
    }

    .btn-primary,
    .btn-copy {
        width: 100%;
    }
}
</style>
