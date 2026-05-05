<script setup>
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
})

const emit = defineEmits(['update:modelValue', 'submit', 'select-file', 'clear-file'])

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
  <div class="prompt-box card" :class="{ 'prompt-box-loading': loading }">
    <div class="prompt-heading">
      <div>
        <h3>{{ i18n.t('promptTitle') }}</h3>
        <p class="muted">{{ isLoggedIn ? i18n.t('promptCopyLoggedIn') : i18n.t('promptCopyGuest') }}</p>
      </div>
      <span class="prompt-badge">{{ i18n.t('chatGeneration') }}</span>
    </div>

    <div v-if="!isLoggedIn" class="guest-notice">
      <span>{{ i18n.t('guestNotice') }}</span>
      <RouterLink to="/login" class="guest-link">{{ i18n.t('guestLoginHint') }}</RouterLink>
    </div>

    <textarea
      :value="modelValue"
      class="textarea"
      :placeholder="i18n.t('promptPlaceholder')"
      @input="emit('update:modelValue', $event.target.value)"
      @keydown="onKeydown"
    />

    <div class="upload-row">
      <label class="upload-button button-secondary" for="prompt-file-input">{{ i18n.t('uploadReference') }}</label>
      <input id="prompt-file-input" class="file-input" type="file" accept="image/*" @change="onFileChange" />
      <span v-if="selectedFileName" class="upload-file-name">{{ selectedFileName }}</span>
      <button v-if="selectedFileName" type="button" class="button-secondary upload-clear" @click="emit('clear-file')">{{ i18n.t('clearImage') }}</button>
    </div>

    <div class="prompt-footer">
      <span class="muted footer-tip">{{ i18n.t('enterTip') }}</span>
      <button class="button-primary submit-button" type="button" :disabled="loading" @click="emit('submit')">
        {{ loading ? i18n.t('generatingImage') : i18n.t('generateImage') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.prompt-box {
  padding: 18px;
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.prompt-box-loading {
  box-shadow: var(--shadow-soft);
}

.prompt-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.prompt-heading h3 {
  margin: 0 0 6px;
}

.prompt-heading p {
  margin: 0;
  line-height: 1.6;
}

.prompt-badge {
  min-height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  white-space: nowrap;
}

.guest-notice {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--color-card-muted);
  border: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  line-height: 1.6;
  color: var(--color-text);
}

.guest-link {
  color: var(--color-primary);
  font-weight: 600;
}

.upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.file-input {
  display: none;
}

.upload-button,
.upload-clear {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-file-name {
  line-height: 1.5;
  color: var(--color-text-soft);
  word-break: break-all;
}

.prompt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.footer-tip {
  line-height: 1.5;
}

.submit-button {
  min-width: 180px;
}

@media (max-width: 768px) {
  .prompt-box {
    padding: 16px;
  }

  .prompt-heading,
  .prompt-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .prompt-badge {
    align-self: flex-start;
  }

  .submit-button {
    width: 100%;
    min-width: 0;
  }
}
</style>
