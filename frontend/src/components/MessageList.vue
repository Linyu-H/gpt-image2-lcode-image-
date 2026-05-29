<script setup>
import ImageCard from './ImageCard.vue'

defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['delete', 'reuse'])
</script>

<template>
  <div class="message-list">
    <template v-for="item in messages" :key="item.id">
      <div v-if="item.type === 'text'" class="message-row user-row message-enter">
        <div class="message-stack">
          <div class="message-bubble message-user">
            <div>{{ item.content || '已上传参考图' }}</div>
            <div v-if="item.attachmentName" class="message-attachment">参考图：{{ item.attachmentName }}</div>
          </div>
        </div>
        <div class="avatar user-avatar">我</div>
      </div>

      <div v-else-if="item.type === 'pending'" class="message-row assistant-row message-enter">
        <div class="avatar assistant-avatar">AI</div>
        <div class="message-stack">
          <div class="message-bubble message-assistant" :class="item.status === 'failed' ? 'message-failed' : 'message-pending'">
            <template v-if="item.status === 'failed'">
              <div class="message-title">这次生成没有完成</div>
              <div>{{ item.errorMessage || '生成失败，请稍后重试。' }}</div>
              <div v-if="item.stale" class="message-hint">页面离开前这次请求的结果无法继续跟踪，你可以去历史记录查看是否已生成成功。</div>
              <div v-else class="message-hint">你可以换个描述，或者重新发送一次。</div>
            </template>
            <template v-else>
              <div class="message-title">正在生成图片</div>
              <div class="message-loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div class="message-hint">图片生成完成后会在这里直接显示。</div>
            </template>
            <div v-if="item.prompt" class="message-prompt">提示词：{{ item.prompt }}</div>
            <div v-if="item.attachmentName" class="message-attachment">参考图：{{ item.attachmentName }}</div>
          </div>
        </div>
      </div>

      <div v-else class="message-row assistant-row image-row message-enter">
        <div class="avatar assistant-avatar">AI</div>
        <div class="message-stack image-stack">
          <ImageCard
            :item="item"
            @delete="emit('delete', $event)"
            @reuse="emit('reuse', $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.message-list {
  width: min(920px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.message-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.user-row {
  grid-template-columns: minmax(0, 1fr) 42px;
}

.avatar {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.02em;
  box-shadow: var(--shadow-soft);
}

.user-avatar {
  background: var(--color-card-strong);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.assistant-avatar {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
}

.message-stack {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-row .message-stack {
  align-items: flex-end;
}

.message-bubble {
  max-width: min(720px, 100%);
  padding: 15px 17px;
  border-radius: 22px;
  line-height: 1.7;
  font-size: 15px;
}

.message-user {
  border-top-right-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 12px 28px rgba(57, 168, 107, 0.18);
}

.message-assistant {
  border: 1px solid var(--color-border);
  border-top-left-radius: 8px;
  background: var(--color-card-strong);
  color: var(--color-text);
  box-shadow: var(--shadow-soft);
}

.message-pending {
  min-width: min(380px, 100%);
}

.message-failed {
  background: var(--color-danger-soft);
  border-color: rgba(213, 91, 91, 0.26);
  color: var(--color-danger);
}

.message-title {
  margin-bottom: 6px;
  font-weight: 800;
}

.message-hint,
.message-attachment,
.message-prompt {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.message-user .message-attachment {
  color: rgba(255, 255, 255, 0.72);
}

.message-loading-dots {
  display: inline-flex;
  gap: 7px;
  margin-top: 8px;
}

.message-loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: dot-pulse 1s infinite ease-in-out;
}

.message-loading-dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.message-loading-dots span:nth-child(3) {
  animation-delay: 0.32s;
}

.image-stack {
  width: min(520px, 100%);
}

.message-enter {
  animation: message-enter 220ms ease-out;
}

@keyframes dot-pulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .message-list {
    gap: 18px;
  }

  .message-row,
  .user-row {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 9px;
  }

  .user-row .avatar {
    order: 1;
  }

  .user-row .message-stack {
    order: 2;
    align-items: flex-start;
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    font-size: 12px;
  }

  .message-bubble {
    padding: 13px 14px;
    border-radius: 18px;
  }

  .message-user {
    border-top-left-radius: 6px;
    border-top-right-radius: 18px;
  }
}
</style>
