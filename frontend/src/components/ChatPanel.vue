<script setup>
import MessageList from './MessageList.vue'
import PromptInput from './PromptInput.vue'

const props = defineProps({
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
})

const emit = defineEmits(['update:draft', 'submit', 'delete', 'reuse', 'select-file', 'clear-file'])
</script>

<template>
  <section class="chat-panel">
    <div class="hero-strip card">
      <div>
        <p class="hero-eyebrow">公益图片实验室</p>
        <h1 class="section-title">把一句灵感，变成一张柔和的 AI 图像</h1>
        <p class="muted section-copy">支持后台共享身份令牌与个人身份令牌双模式，默认 3 天自动清理，适合快速创作、临时预览与轻量分享。</p>
      </div>
      <div class="hero-meta">
        <span v-if="isLoggedIn">当前账号：{{ username }}</span>
        <span v-else>当前以游客身份体验</span>
        <span>{{ isLoggedIn ? '个人配置优先，共享配置兜底' : '未登录时仅使用共享配置' }}</span>
        <span>3 天自动清理</span>
        <span>白天 / 深蓝护眼</span>
      </div>
    </div>

    <div class="chat-stream card">
      <div v-if="loading" class="status-banner status-loading">
        正在向上游服务请求图片，请稍等片刻…
      </div>
      <div v-if="errorMessage" class="status-banner status-error" role="alert">
        {{ errorMessage }}
      </div>

      <div v-if="!messages.length" class="empty-state">
        <div class="empty-orb" />
        <h2>欢迎来到 Lcode-image</h2>
        <p class="muted">输入一句自然语言描述，例如“生成一只在雨后花园里打盹的橘猫”，系统会以聊天方式返回图片结果。</p>
      </div>
      <MessageList
        v-else
        :messages="messages"
        @delete="emit('delete', $event)"
        @reuse="emit('reuse', $event)"
      />
    </div>

    <PromptInput
      :model-value="draft"
      :loading="loading"
      :is-logged-in="isLoggedIn"
      :selected-file-name="selectedFileName"
      @update:model-value="emit('update:draft', $event)"
      @submit="emit('submit')"
      @select-file="emit('select-file', $event)"
      @clear-file="emit('clear-file')"
    />
  </section>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-strip {
  padding: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
}

.hero-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.hero-meta span {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-text);
  font-size: 13px;
}

.chat-stream {
  min-height: 460px;
  padding: 22px;
}

.status-banner {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  line-height: 1.6;
}

.status-loading {
  background: var(--color-primary-soft);
  color: var(--color-text);
}

.status-error {
  background: rgba(213, 91, 91, 0.12);
  border: 1px solid rgba(213, 91, 91, 0.2);
  color: var(--color-danger);
}

.empty-state {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-orb {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  margin-bottom: 18px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), var(--color-primary-soft));
  box-shadow: var(--shadow-soft);
}

.empty-state h2 {
  margin-bottom: 12px;
}

.empty-state p {
  max-width: 560px;
  line-height: 1.8;
}

@media (max-width: 1024px) {
  .hero-strip {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .hero-meta {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .hero-strip,
  .chat-stream {
    padding: 18px;
  }

  .hero-meta span {
    font-size: 12px;
  }

  .chat-stream {
    min-height: 360px;
  }
}
</style>
