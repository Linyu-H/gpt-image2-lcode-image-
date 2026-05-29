<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'

const fileInput = ref(null)
const selectedFile = ref(null)
const originalUrl = ref('')
const resultUrl = ref('')
const isDragging = ref(false)
const isLoading = ref(false)
const isCaptchaReady = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const canSubmit = computed(() => selectedFile.value && !isLoading.value)
const fileMeta = computed(() => {
  if (!selectedFile.value) return ''

  const size = selectedFile.value.size / 1024 / 1024
  return `${selectedFile.value.name} · ${size.toFixed(2)} MB`
})

function revokeUrl(url) {
  if (url) URL.revokeObjectURL(url)
}

function resetResult() {
  revokeUrl(resultUrl.value)
  resultUrl.value = ''
  successMessage.value = ''
}

function setFile(file) {
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择 PNG、JPG、WebP 等图片文件。'
    return
  }

  revokeUrl(originalUrl.value)
  resetResult()
  selectedFile.value = file
  originalUrl.value = URL.createObjectURL(file)
  errorMessage.value = ''
}

function handleFileChange(event) {
  setFile(event.target.files?.[0])
}

function handleDrop(event) {
  isDragging.value = false
  setFile(event.dataTransfer.files?.[0])
}

async function submitCutout() {
  if (!selectedFile.value) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  resetResult()

  try {
    await waitForCaptchaReady()

    const captchaCode = getCaptchaCode()
    if (!captchaCode) {
      throw new Error('行为码还未初始化，请移动鼠标后重试。')
    }

    const formData = new FormData()
    formData.append('image', selectedFile.value)
    formData.append('captchacode', captchaCode)

    const response = await fetch('/api/cutout', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.message || `抠图失败：HTTP ${response.status}`)
    }

    const blob = await response.blob()
    resultUrl.value = URL.createObjectURL(blob)
    successMessage.value = '抠图完成，可以预览或下载结果。'
  } catch (error) {
    errorMessage.value = error.message || '抠图请求失败，请检查代理服务和上游接口配置。'
  } finally {
    isLoading.value = false
  }
}

function downloadResult() {
  if (!resultUrl.value) return

  const link = document.createElement('a')
  link.href = resultUrl.value
  link.download = 'cutout-result.png'
  link.click()
}

let cleanupInteractionTracking = () => {}
let captchaScriptLoadPromise = null
let captchaReadyPromise = null

function loadCaptchaScript() {
  if (window.leshemModule?.ccall) return Promise.resolve()
  if (captchaScriptLoadPromise) return captchaScriptLoadPromise

  const existingScript = document.querySelector('script[data-captcha-script="recaptcha"]')
  if (existingScript) {
    captchaScriptLoadPromise = new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', reject, { once: true })
    })
    return captchaScriptLoadPromise
  }

  captchaScriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      captchaScriptLoadPromise = null
      script.remove()
      reject(new Error('行为码脚本加载超时，请刷新页面后重试。'))
    }, 10000)

    script.src = '/captcha/reCAPTCHA.js'
    script.async = true
    script.dataset.captchaScript = 'recaptcha'
    script.addEventListener('load', () => {
      window.clearTimeout(timer)
      resolve()
    }, { once: true })
    script.addEventListener('error', () => {
      window.clearTimeout(timer)
      captchaScriptLoadPromise = null
      reject(new Error('行为码脚本加载失败，请刷新页面后重试。'))
    }, { once: true })
    document.head.appendChild(script)
  })

  return captchaScriptLoadPromise
}

function waitForCaptchaReady() {
  if (markCaptchaReady()) return Promise.resolve()
  if (captchaReadyPromise) return captchaReadyPromise

  captchaReadyPromise = loadCaptchaScript().then(() => new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (markCaptchaReady()) {
        window.clearInterval(timer)
        resolve()
        return
      }

      if (Date.now() - startedAt > 10000) {
        window.clearInterval(timer)
        captchaReadyPromise = null
        reject(new Error('行为码初始化超时，请刷新页面后重试。'))
      }
    }, 250)
  }))

  return captchaReadyPromise
}

function getCaptchaCode() {
  return window.leshemModule?.ccall?.('get_code', 'string', [], []) || ''
}

function markCaptchaReady() {
  isCaptchaReady.value = Boolean(window.leshemModule?.ccall)
  return isCaptchaReady.value
}

function recordBrowserInfo() {
  const timer = window.setInterval(() => {
    if (!markCaptchaReady()) return

    window.clearInterval(timer)
    window.leshemModule.ccall('record_browser_info', 'void', ['string'], [JSON.stringify({
      ua: navigator.userAgent,
      lang: navigator.language,
      w: window.innerWidth,
      h: window.innerHeight,
      tz: new Date().getTimezoneOffset(),
    })])
  }, 1000)

  return () => window.clearInterval(timer)
}

function recordMouseEvent(type, event) {
  window.leshemModule?.ccall?.('add_mouse_event', 'void', ['number', 'number', 'number', 'number'], [
    type,
    event.clientX,
    event.clientY,
    Math.round(Date.now() / 1000),
  ])
}

onMounted(() => {
  loadCaptchaScript().catch((error) => {
    errorMessage.value = error.message || '行为码脚本加载失败，请刷新页面后重试。'
  })

  const stopBrowserTimer = recordBrowserInfo()
  const move = (event) => recordMouseEvent(1, event)
  const down = (event) => recordMouseEvent(2, event)
  const up = (event) => recordMouseEvent(3, event)

  document.addEventListener('mousemove', move)
  document.addEventListener('mousedown', down)
  document.addEventListener('mouseup', up)

  cleanupInteractionTracking = () => {
    stopBrowserTimer()
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mousedown', down)
    document.removeEventListener('mouseup', up)
  }
})

onBeforeUnmount(() => {
  cleanupInteractionTracking()
  revokeUrl(originalUrl.value)
  revokeUrl(resultUrl.value)
})
</script>

<template>
  <AppLayout>
    <div class="cutout-shell">
      <section class="card cutout-hero">
        <div class="cutout-copy">
          <p class="info-eyebrow">透明背景实验室</p>
          <h1>上传图片，一键生成干净的透明背景结果。</h1>
          <p class="muted hero-text">
            单独的抠图页面会通过本地后端代理上传图片、创建抠图任务并轮询结果，适合快速测试商品图、人像图和素材图。
          </p>
          <div class="hero-points muted">
            <span>支持 PNG / JPG / WebP</span>
            <span>本地代理转发</span>
            <span>结果可直接下载</span>
          </div>
        </div>

        <div class="upload-card card">
          <div
            class="dropzone"
            :class="{ 'is-dragging': isDragging }"
            role="button"
            tabindex="0"
            aria-label="选择或拖拽图片上传"
            @click="fileInput?.click()"
            @keydown.enter.prevent="fileInput?.click()"
            @keydown.space.prevent="fileInput?.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              class="sr-only"
              type="file"
              accept="image/*"
              @change="handleFileChange"
            />
            <svg class="upload-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 16V4m0 0 4.5 4.5M12 4 7.5 8.5" />
              <path d="M20 16.5v1.75A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25V16.5" />
            </svg>
            <h2>拖拽图片到这里</h2>
            <p class="muted">或点击选择文件，准备好后开始抠图。</p>
            <span v-if="fileMeta" class="file-meta">{{ fileMeta }}</span>
          </div>

          <p class="helper-text" aria-live="polite">
            {{ isCaptchaReady ? '行为码已就绪，可以开始抠图。' : '选择图片后可开始抠图，行为码会自动初始化。' }}
          </p>

          <button class="button-primary action-button" type="button" :disabled="!canSubmit" @click="submitCutout">
            <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
            {{ isLoading ? '正在抠图...' : '开始抠图' }}
          </button>

          <p v-if="errorMessage" class="feedback error" role="alert">{{ errorMessage }}</p>
          <p v-if="successMessage" class="feedback success" aria-live="polite">{{ successMessage }}</p>
        </div>
      </section>

      <section class="preview-grid">
        <article class="card preview-card">
          <div class="card-headline">
            <div>
              <p class="info-eyebrow">Original</p>
              <h2>原图预览</h2>
            </div>
            <span class="muted">上传后显示</span>
          </div>
          <div class="image-stage">
            <img v-if="originalUrl" :src="originalUrl" alt="上传的原始图片预览" />
            <p v-else class="muted">上传图片后会显示原图预览。</p>
          </div>
        </article>

        <article class="card preview-card">
          <div class="card-headline">
            <div>
              <p class="info-eyebrow">Transparent</p>
              <h2>透明背景结果</h2>
            </div>
            <button class="button-secondary download-button" type="button" :disabled="!resultUrl" @click="downloadResult">
              下载结果
            </button>
          </div>
          <div class="image-stage checkerboard">
            <img v-if="resultUrl" :src="resultUrl" alt="抠图后的透明背景结果" />
            <p v-else class="muted">{{ isLoading ? '正在等待接口返回结果...' : '抠图完成后会显示透明背景图片。' }}</p>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.cutout-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 28px;
}

.cutout-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  gap: 24px;
  padding: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(57, 168, 107, 0.12), transparent 28%),
    linear-gradient(180deg, var(--color-card) 0%, var(--color-card-strong) 100%);
}

.cutout-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.info-eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  width: fit-content;
  margin: 0;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.cutout-hero h1 {
  max-width: 13ch;
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 1.12;
}

.hero-text {
  max-width: 680px;
  margin: 0;
  line-height: 1.8;
}

.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-points span {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-card-muted);
}

.upload-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(180deg, var(--color-card) 0%, var(--color-card-strong) 100%);
}

.dropzone {
  display: grid;
  min-height: 300px;
  place-items: center;
  padding: 26px 18px;
  border: 1.5px dashed var(--color-border);
  border-radius: 22px;
  background: var(--color-card-muted);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.dropzone.is-dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: var(--shadow-soft);
  transform: translateY(-2px);
}

.dropzone:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.upload-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 18px;
  color: var(--color-primary);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.dropzone h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
}

.dropzone p {
  margin: 0 0 12px;
  line-height: 1.7;
}

.file-meta {
  display: inline-flex;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.88rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.helper-text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.action-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 700;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 999px;
  animation: spin 800ms linear infinite;
}

.feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 0.94rem;
  font-weight: 650;
  line-height: 1.5;
}

.error {
  background: rgba(213, 91, 91, 0.12);
  color: var(--color-danger);
}

.success {
  background: var(--color-primary-soft);
  color: var(--color-success);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.preview-card {
  padding: 22px;
}

.card-headline {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.card-headline h2 {
  margin: 8px 0 0;
  line-height: 1.2;
}

.card-headline span {
  font-size: 13px;
}

.download-button {
  border-radius: 999px;
  white-space: nowrap;
}

.image-stage {
  display: grid;
  min-height: 430px;
  place-items: center;
  padding: 16px;
  border-radius: 22px;
  background: var(--color-card-muted);
  overflow: hidden;
}

.image-stage img {
  display: block;
  max-width: 100%;
  max-height: 540px;
  border-radius: 16px;
  object-fit: contain;
  box-shadow: var(--shadow-soft);
}

.image-stage p {
  max-width: 260px;
  margin: 0;
  line-height: 1.7;
  text-align: center;
}

.checkerboard {
  background-color: var(--color-card-strong);
  background-image: linear-gradient(45deg, rgba(127, 140, 127, 0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(127, 140, 127, 0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(127, 140, 127, 0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(127, 140, 127, 0.18) 75%);
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  background-size: 20px 20px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

[data-theme='eye'] .cutout-hero {
  background:
    radial-gradient(circle at top right, rgba(118, 168, 255, 0.16), transparent 28%),
    linear-gradient(180deg, var(--color-card) 0%, var(--color-card-strong) 100%);
}

[data-theme='eye'] .checkerboard {
  background-color: var(--color-card-strong);
  background-image: linear-gradient(45deg, rgba(207, 224, 255, 0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(207, 224, 255, 0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(207, 224, 255, 0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(207, 224, 255, 0.12) 75%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .cutout-hero,
  .preview-grid {
    grid-template-columns: 1fr;
  }

  .cutout-hero h1 {
    max-width: 14ch;
  }
}

@media (max-width: 768px) {
  .cutout-shell {
    gap: 16px;
  }

  .cutout-hero,
  .preview-card {
    padding: 18px;
  }

  .upload-card {
    padding: 12px;
  }

  .cutout-hero h1 {
    max-width: none;
    font-size: clamp(1.8rem, 9vw, 2.7rem);
  }

  .dropzone {
    min-height: 240px;
  }

  .card-headline {
    flex-direction: column;
    align-items: flex-start;
  }

  .download-button {
    width: 100%;
  }

  .image-stage {
    min-height: 320px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
