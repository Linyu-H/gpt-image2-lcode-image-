<script setup>
import MessageList from './MessageList.vue'
import PromptInput from './PromptInput.vue'
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

defineProps({
  draft: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  messages: {
    type: Array,
    default: () => [],
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    default: '',
  },
  selectedFileName: {
    type: String,
    default: '',
  },
  tokenSource: {
    type: String,
    default: 'auto',
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

const emit = defineEmits([
  'update:draft',
  'submit',
  'delete',
  'reuse',
  'select-file',
  'clear-file',
  'update:tokenSource',
])

const promptChips = [
  '把普通自拍变成电影海报质感',
  '生成一张柔和光影的产品主图',
  '做一只雨后花园里的橘猫',
  '参考图保持构图，换成赛博霓虹风',
]
</script>

<template>
  <section class="chat-panel">
    <div class="chat-scroll-area">
      <div class="chat-topbar">
        <div>
          <p class="chat-kicker">Lcode Image</p>
          <h1>照片生成</h1>
        </div>
        <div class="account-chip">
          <span class="status-dot" />
          <span>{{ isLoggedIn ? username : '游客模式' }}</span>
        </div>
      </div>

      <div v-if="loading" class="status-banner status-loading">
        <span class="mini-spinner" aria-hidden="true" />
        {{ i18n.t('generatingWait') }}
      </div>
      <div v-if="errorMessage" class="status-banner status-error" role="alert">
        {{ errorMessage }}
      </div>

      <div v-if="!messages.length" class="empty-state">
        <div class="assistant-mark" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M12 3 14.6 9.4 21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z" />
          </svg>
        </div>
        <h2>今天想生成什么照片？</h2>
        <p>像和豆包聊天一样，把想要的画面、风格、比例或参考图直接发给我。</p>
        <div class="suggestion-grid">
          <button v-for="chip in promptChips" :key="chip" type="button" @click="emit('update:draft', chip)">
            {{ chip }}
          </button>
        </div>
      </div>

      <MessageList
        v-else
        :messages="messages"
        @delete="emit('delete', $event)"
        @reuse="emit('reuse', $event)"
      />
    </div>

    <div class="input-dock">
      <PromptInput
        :model-value="draft"
        :loading="loading"
        :is-logged-in="isLoggedIn"
        :selected-file-name="selectedFileName"
        :token-source="tokenSource"
        :contributors="contributors"
        :has-own-token="hasOwnToken"
        @update:model-value="emit('update:draft', $event)"
        @submit="emit('submit')"
        @select-file="emit('select-file', $event)"
        @clear-file="emit('clear-file')"
        @update:token-source="emit('update:tokenSource', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.chat-panel {
  position: relative;
  min-height: calc(100dvh - 112px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 32px;
  background:
    radial-gradient(circle at 50% 0%, rgba(57, 168, 107, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.46));
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--backdrop-blur);
}

[data-theme='eye'] .chat-panel {
  background:
    radial-gradient(circle at 50% 0%, rgba(118, 168, 255, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(18, 28, 46, 0.84), rgba(14, 23, 38, 0.7));
}

.chat-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 26px clamp(18px, 4vw, 58px) 180px;
  scroll-behavior: smooth;
}

.chat-topbar {
  position: sticky;
  top: -26px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: -26px clamp(-58px, -4vw, -18px) 24px;
  padding: 22px clamp(18px, 4vw, 58px) 16px;
  background: linear-gradient(180deg, var(--color-card-strong), rgba(255, 255, 255, 0.68));
  border-bottom: 1px solid var(--color-divider);
  backdrop-filter: var(--backdrop-blur);
}

[data-theme='eye'] .chat-topbar {
  background: linear-gradient(180deg, var(--color-card-strong), rgba(18, 28, 46, 0.72));
}

.chat-kicker {
  margin: 0 0 3px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chat-topbar h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(22px, 2.2vw, 30px);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.account-chip {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-card);
  color: var(--color-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 0 4px var(--color-success-soft);
}

.status-banner {
  width: min(860px, 100%);
  margin: 0 auto 16px;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 16px;
  line-height: 1.55;
  font-size: 14px;
}

.status-loading {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border: 1px solid rgba(57, 168, 107, 0.22);
}

.status-error {
  background: var(--color-danger-soft);
  border: 1px solid rgba(213, 91, 91, 0.24);
  color: var(--color-danger);
}

.mini-spinner {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: spinner-rotate 780ms linear infinite;
}

.empty-state {
  width: min(840px, 100%);
  min-height: 58vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.assistant-mark {
  width: 76px;
  height: 76px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 26px;
  background: linear-gradient(135deg, var(--color-card-strong), var(--color-primary-soft));
  color: var(--color-primary);
  box-shadow: var(--shadow-soft);
}

.empty-state h2 {
  margin: 24px 0 12px;
  color: var(--color-text);
  font-size: clamp(30px, 5vw, 56px);
  line-height: 1.06;
  letter-spacing: -0.055em;
}

.empty-state p {
  max-width: 600px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 17px;
  line-height: 1.8;
}

.suggestion-grid {
  width: min(760px, 100%);
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.suggestion-grid button {
  min-height: 52px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-card);
  color: var(--color-text);
  text-align: left;
  line-height: 1.45;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.suggestion-grid button:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: var(--shadow-soft);
}

.input-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 18px clamp(16px, 4vw, 56px) 24px;
  background: linear-gradient(180deg, transparent, var(--color-bg) 28%, var(--color-bg) 100%);
}

[data-theme='eye'] .input-dock {
  background: linear-gradient(180deg, transparent, rgba(14, 23, 38, 0.96) 28%, rgba(14, 23, 38, 0.98) 100%);
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .chat-panel {
    min-height: calc(100dvh - 96px);
    border-radius: 24px;
  }

  .chat-scroll-area {
    padding: 20px 14px 222px;
  }

  .chat-topbar {
    top: -20px;
    margin: -20px -14px 20px;
    padding: 18px 14px 14px;
  }

  .account-chip {
    display: none;
  }

  .empty-state {
    min-height: 52vh;
  }

  .empty-state h2 {
    font-size: 34px;
  }

  .empty-state p {
    font-size: 15px;
  }

  .suggestion-grid {
    grid-template-columns: 1fr;
  }

  .input-dock {
    padding: 14px 12px 16px;
  }
}
</style>
