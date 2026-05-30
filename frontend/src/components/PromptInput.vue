<script setup>
import { computed, ref } from 'vue'
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  selectedFileName: {
    type: String,
    default: '',
  },
  tokenSource: {
    type: String,
    default: 'auto',
  },
  imageSize: {
    type: String,
    default: '1024x1024',
  },
  imageQuality: {
    type: String,
    default: 'hd',
  },
  contributors: {
    type: Array,
    default: () => [],
  },
  hasOwnToken: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit', 'select-file', 'clear-file', 'update:tokenSource', 'update:imageSize', 'update:imageQuality'])
const sourceMenuOpen = ref(false)
const sizeMenuOpen = ref(false)
const qualityMenuOpen = ref(false)
const customSizeDialogOpen = ref(false)
const customWidth = ref('1024')
const customHeight = ref('1024')

const sourceOptions = computed(() => {
  const options = [
    { value: 'auto', label: '自动 · 个人→贡献者→共享', description: '失败时自动切换并关闭出错的贡献者' },
    { value: 'shared', label: '管理员共享', description: '使用站点配置的共享身份令牌' },
  ]
  if (props.hasOwnToken) {
    options.push({ value: 'own', label: '我自己的配置', description: '只使用你已绑定的个人身份令牌' })
  }
  props.contributors.forEach((item) => {
    options.push({
      value: `contributor:${item.contributorUserId}`,
      label: `贡献者 · ${item.username}`,
      description: '使用社区贡献者共享的个人 API',
    })
  })
  return options
})

const currentOption = computed(() => sourceOptions.value.find((option) => option.value === props.tokenSource) || sourceOptions.value[0])

const sizeOptions = [
  { value: '1024x1024', label: '1:1 正方形', icon: '□' },
  { value: '1792x1024', label: '16:9 横向', icon: '▭' },
  { value: '1024x1792', label: '9:16 竖向', icon: '▯' },
  { value: 'custom', label: '自定义尺寸', icon: '⚙' },
]

const qualityOptions = [
  { value: 'hd', label: '高清 HD', description: '更高质量，生成时间稍长' },
  { value: 'standard', label: '标准', description: '标准质量，生成速度快' },
]

const currentSize = computed(() => {
  const found = sizeOptions.find((option) => option.value === props.imageSize)
  if (found) return found
  // 如果是自定义尺寸，显示自定义
  if (props.imageSize && props.imageSize.includes('x')) {
    return { value: props.imageSize, label: props.imageSize, icon: '⚙' }
  }
  return sizeOptions[0]
})
const currentQuality = computed(() => qualityOptions.find((option) => option.value === props.imageQuality) || qualityOptions[0])

function pickSource(value) {
  emit('update:tokenSource', value)
  sourceMenuOpen.value = false
}

function pickSize(value) {
  if (value === 'custom') {
    // 打开自定义尺寸对话框
    sizeMenuOpen.value = false
    customSizeDialogOpen.value = true
    // 如果当前是自定义尺寸，解析出宽高
    if (props.imageSize && props.imageSize.includes('x') && !['1024x1024', '1792x1024', '1024x1792'].includes(props.imageSize)) {
      const [w, h] = props.imageSize.split('x')
      customWidth.value = w
      customHeight.value = h
    }
  } else {
    emit('update:imageSize', value)
    sizeMenuOpen.value = false
  }
}

function applyCustomSize() {
  const w = parseInt(customWidth.value) || 1024
  const h = parseInt(customHeight.value) || 1024
  // 限制范围 256-2048
  const width = Math.max(256, Math.min(2048, w))
  const height = Math.max(256, Math.min(2048, h))
  emit('update:imageSize', `${width}x${height}`)
  customSizeDialogOpen.value = false
}

function cancelCustomSize() {
  customSizeDialogOpen.value = false
}

function pickQuality(value) {
  emit('update:imageQuality', value)
  qualityMenuOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault()
    emit('submit')
  }
}

function onFileChange(event) {
  emit('select-file', event.target.files?.[0] || null)
  event.target.value = ''
}
</script>

<template>
  <div class="prompt-composer" :class="{ 'is-loading': loading }">
    <div v-if="!isLoggedIn" class="guest-notice">
      <span>{{ i18n.t('guestNotice') }}</span>
      <RouterLink to="/login" class="guest-link">{{ i18n.t('guestLoginHint') }}</RouterLink>
    </div>

    <div v-if="selectedFileName" class="attachment-pill">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>{{ selectedFileName }}</span>
      <button type="button" @click="emit('clear-file')">{{ i18n.t('clearImage') }}</button>
    </div>

    <div class="composer-shell">
      <textarea
        :value="modelValue"
        class="composer-textarea"
        :placeholder="i18n.t('promptPlaceholder')"
        rows="1"
        @input="emit('update:modelValue', $event.target.value)"
        @keydown="onKeydown"
      />

      <div class="composer-actions">
        <div class="size-picker" :class="{ open: sizeMenuOpen }">
          <button
            type="button"
            class="size-trigger"
            :title="currentSize?.label"
            @click="sizeMenuOpen = !sizeMenuOpen"
          >
            <span class="size-icon">{{ currentSize?.icon }}</span>
            <span class="size-label">{{ currentSize?.label }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div v-if="sizeMenuOpen" class="size-menu" role="listbox">
            <button
              v-for="option in sizeOptions"
              :key="option.value"
              type="button"
              class="size-option"
              :class="{ active: option.value === imageSize }"
              role="option"
              :aria-selected="option.value === imageSize"
              @click="pickSize(option.value)"
            >
              <span class="size-icon-large">{{ option.icon }}</span>
              <strong>{{ option.label }}</strong>
              <span class="size-value">{{ option.value }}</span>
            </button>
          </div>
        </div>

        <div class="quality-picker" :class="{ open: qualityMenuOpen }">
          <button
            type="button"
            class="quality-trigger"
            :title="currentQuality?.description"
            @click="qualityMenuOpen = !qualityMenuOpen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z" />
            </svg>
            <span class="quality-label">{{ currentQuality?.label }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div v-if="qualityMenuOpen" class="quality-menu" role="listbox">
            <button
              v-for="option in qualityOptions"
              :key="option.value"
              type="button"
              class="quality-option"
              :class="{ active: option.value === imageQuality }"
              role="option"
              :aria-selected="option.value === imageQuality"
              @click="pickQuality(option.value)"
            >
              <strong>{{ option.label }}</strong>
              <span>{{ option.description }}</span>
            </button>
          </div>
        </div>

        <div class="source-picker" :class="{ open: sourceMenuOpen }">
          <button
            type="button"
            class="source-trigger"
            :title="currentOption?.description"
            @click="sourceMenuOpen = !sourceMenuOpen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 6h16" />
              <path d="M4 12h10" />
              <path d="M4 18h7" />
              <path d="m17 14 4 4-4 4" />
            </svg>
            <span class="source-label">{{ currentOption?.label || '自动' }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div v-if="sourceMenuOpen" class="source-menu" role="listbox">
            <button
              v-for="option in sourceOptions"
              :key="option.value"
              type="button"
              class="source-option"
              :class="{ active: option.value === tokenSource }"
              role="option"
              :aria-selected="option.value === tokenSource"
              @click="pickSource(option.value)"
            >
              <strong>{{ option.label }}</strong>
              <span>{{ option.description }}</span>
            </button>
          </div>
        </div>

        <label class="icon-button" for="prompt-file-input" :aria-label="i18n.t('uploadReference')">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 1 1 5.66 5.66L9.64 17.2a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </label>
        <input id="prompt-file-input" class="file-input" type="file" accept="image/*" @change="onFileChange" />

        <button class="send-button" type="button" :disabled="loading || (!modelValue.trim() && !selectedFileName)" :aria-label="loading ? i18n.t('generatingImage') : i18n.t('generateImage')" @click="emit('submit')">
          <span v-if="loading" class="send-spinner" aria-hidden="true" />
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>

    <div class="composer-meta">
      <span>{{ i18n.t('enterTip') }}</span>
      <span>{{ isLoggedIn ? i18n.t('privateFirst') : i18n.t('sharedOnly') }}</span>
    </div>

    <!-- 自定义尺寸对话框 -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="customSizeDialogOpen" class="dialog-overlay" @click="cancelCustomSize">
          <div class="dialog-box" @click.stop>
            <div class="dialog-header">
              <h3>自定义图片尺寸</h3>
              <button type="button" class="dialog-close" @click="cancelCustomSize">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div class="dialog-body">
              <div class="custom-size-inputs">
                <div class="input-group">
                  <label for="custom-width">宽度 (px)</label>
                  <input
                    id="custom-width"
                    v-model="customWidth"
                    type="number"
                    min="256"
                    max="2048"
                    step="64"
                    placeholder="1024"
                  />
                </div>
                <span class="input-separator">×</span>
                <div class="input-group">
                  <label for="custom-height">高度 (px)</label>
                  <input
                    id="custom-height"
                    v-model="customHeight"
                    type="number"
                    min="256"
                    max="2048"
                    step="64"
                    placeholder="1024"
                  />
                </div>
              </div>
              <p class="dialog-hint">尺寸范围：256-2048 像素</p>
            </div>
            <div class="dialog-footer">
              <button type="button" class="dialog-button dialog-button-secondary" @click="cancelCustomSize">
                取消
              </button>
              <button type="button" class="dialog-button dialog-button-primary" @click="applyCustomSize">
                确定
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.prompt-composer {
  width: min(900px, 100%);
  margin: 0 auto;
}

.guest-notice {
  margin-bottom: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-card);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.guest-link {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-weight: 700;
}

.attachment-pill {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-card);
  color: var(--color-text-secondary);
  font-size: 13px;
}

.attachment-pill span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-pill button {
  min-height: 28px;
  padding: 0 9px;
  border: 0;
  border-radius: 999px;
  background: var(--color-card-muted);
  color: var(--color-primary);
  font-weight: 700;
}

.composer-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-border-strong);
  border-radius: 28px;
  background: var(--color-card-strong);
  box-shadow: 0 18px 46px rgba(34, 72, 41, 0.12);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

[data-theme='eye'] .composer-shell {
  box-shadow: 0 18px 46px rgba(2, 6, 23, 0.36);
}

.composer-shell:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft), 0 18px 46px rgba(34, 72, 41, 0.12);
}

.composer-textarea {
  width: 100%;
  max-height: 156px;
  min-height: 56px;
  padding: 14px 10px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.7;
}

.composer-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

.size-picker,
.quality-picker,
.source-picker {
  position: relative;
}

.size-trigger,
.quality-trigger,
.source-trigger {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.size-picker.open .size-trigger,
.size-trigger:hover,
.quality-picker.open .quality-trigger,
.quality-trigger:hover,
.source-picker.open .source-trigger,
.source-trigger:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.size-icon {
  font-size: 16px;
  line-height: 1;
}

.size-label,
.quality-label,
.source-label {
  max-width: 168px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size-menu,
.quality-menu,
.source-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: 200px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-card-strong);
  box-shadow: var(--shadow-popover);
  animation: source-menu-pop 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.quality-menu,
.source-menu {
  width: 280px;
}

.size-option,
.quality-option,
.source-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.size-option {
  align-items: center;
  text-align: center;
}

.size-option:hover,
.quality-option:hover,
.source-option:hover {
  background: var(--color-card-muted);
}

.size-option.active,
.quality-option.active,
.source-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.size-icon-large {
  font-size: 32px;
  line-height: 1;
  margin-bottom: 4px;
}

.size-option strong,
.quality-option strong,
.source-option strong {
  font-size: 13px;
  color: var(--color-text);
}

.size-value {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-family: monospace;
}

.quality-option span,
.source-option span {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

@keyframes source-menu-pop {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.file-input {
  display: none;
}

.icon-button,
.send-button {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.icon-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.icon-button:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.send-button {
  border: 0;
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 10px 20px rgba(57, 168, 107, 0.22);
}

.send-button:hover:not(:disabled),
.icon-button:hover {
  transform: translateY(-1px);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

.send-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: send-spinner 780ms linear infinite;
}

.composer-meta {
  margin-top: 9px;
  padding: 0 8px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

@keyframes send-spinner {
  to {
    transform: rotate(360deg);
  }
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 18, 0.6);
  backdrop-filter: blur(4px);
}

.dialog-box {
  width: min(480px, calc(100vw - 32px));
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-card-strong);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.dialog-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.dialog-close:hover {
  background: var(--color-card-muted);
  color: var(--color-text);
}

.dialog-body {
  padding: 24px;
}

.custom-size-inputs {
  display: flex;
  align-items: end;
  gap: 16px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.input-group input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-card);
  color: var(--color-text);
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-group input:focus {
  outline: 0;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.input-separator {
  font-size: 24px;
  font-weight: 300;
  color: var(--color-text-secondary);
  padding-bottom: 10px;
}

.dialog-hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
}

.dialog-button {
  min-height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.dialog-button-secondary {
  background: var(--color-card-muted);
  color: var(--color-text);
}

.dialog-button-secondary:hover {
  background: var(--color-border);
}

.dialog-button-primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 8px 16px rgba(57, 168, 107, 0.2);
}

.dialog-button-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(57, 168, 107, 0.25);
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 240ms ease;
}

.dialog-fade-enter-active .dialog-box,
.dialog-fade-leave-active .dialog-box {
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .dialog-box,
.dialog-fade-leave-to .dialog-box {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

@media (max-width: 768px) {
  .guest-notice,
  .composer-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .composer-shell {
    grid-template-columns: 1fr;
    gap: 4px;
    border-radius: 24px;
  }

  .composer-actions {
    width: 100%;
    justify-content: space-between;
  }

  .composer-textarea {
    min-height: 82px;
  }
}
</style>
