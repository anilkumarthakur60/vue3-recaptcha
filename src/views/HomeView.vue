<script setup lang="ts">
import { RecaptchaV3 } from '../package/components'
import { onMounted, ref, nextTick } from 'vue'
import axios from 'axios'

const recaptchaComponent = ref<InstanceType<typeof RecaptchaV3> | null>(null)
const loading = ref(false)
const recaptchaToken = ref('')

const showMessage = (message: string, duration: number = 1000) => {
  const existingMessageDiv = document.querySelector('.custom-message-div')
  if (existingMessageDiv) document.body.removeChild(existingMessageDiv)

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
    if (document.body.contains(messageDiv)) document.body.removeChild(messageDiv)
  }, duration)
}

const copyToken = async (message = 'Token has been copied to clipboard') => {
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
    await nextTick() // ✅ ensure template refs exist
    const token = await recaptchaComponent.value?.loadRecaptcha()
    if (token) recaptchaToken.value = token
  } catch (error) {
    console.error('Failed to regenerate token:', error)
    showMessage('Failed to regenerate token', 2000)
  } finally {
    loading.value = false
  }
}

const handleTokenUpdate = () => {
  copyToken('Token has been regenerated and copied to clipboard')
}

const verifyResponse = ref<any>(null)

const verifyRecaptcha = async () => {
  loading.value = true
  try {
    const response = await axios.post(
      'https://express-recaptcha-verify.vercel.app/verify-captcha',
      { captcha_token: recaptchaToken.value }
    )
    verifyResponse.value = response.data
  } catch (error) {
    verifyResponse.value = error
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // ✅ generate token on mount
  await handleRegenerate()
})
</script>

<template>
  <div class="recaptcha-container">
    <RecaptchaV3
      v-model="recaptchaToken"
      @update:model-value="handleTokenUpdate"
      ref="recaptchaComponent"
    />
    <div class="recaptcha-token-container">
      <div class="recaptcha-token-label">
        <span>Recaptcha Token:</span>
      </div>
      <div class="recaptcha-token-buttons">
        <button
          class="buttonload btn btn-primary"
          @click="() => copyToken('Token has been copied to clipboard')"
          :disabled="loading"
        >
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
  </div>
</template>

<style lang="scss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');

.recaptcha-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recaptcha-token-container {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.recaptcha-token-label {
  font-weight: bold;
  margin-bottom: 10px;
}

.recaptcha-token-buttons {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.buttonload {
  background-color: #007bff;
  border: none;
  color: white;
  padding: 5px 20px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.buttonload:hover {
  background-color: #0056b3;
}

.buttonload:disabled {
  background-color: #007bff;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-success {
  background-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-success:disabled {
  background-color: #28a745;
  cursor: not-allowed;
  opacity: 0.7;
}

.fa {
  margin-left: -12px;
  margin-right: 8px;
}

.recaptcha-token {
  color: #333;
  word-break: break-all;
  margin-top: 10px;
  padding: 10px;
  background-color: #f1f1f1;
  border-radius: 4px;
}

.grecaptcha-badges {
  display: none !important;
}
</style>
