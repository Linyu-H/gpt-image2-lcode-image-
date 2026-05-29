<script setup>
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

defineProps({
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
