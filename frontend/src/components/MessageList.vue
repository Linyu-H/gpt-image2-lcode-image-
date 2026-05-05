<script setup>
import ImageCard from './ImageCard.vue'

const props = defineProps({
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
      <div v-if="item.type === 'text'" class="message-bubble message-user message-enter">
        <div>{{ item.content }}</div>
        <div v-if="item.attachmentName" class="message-attachment muted">参考图：{{ item.attachmentName }}</div>
      </div>

      <div v-else-if="item.type === 'pending'" class="message-bubble message-assistant message-enter" :class="item.status === 'failed' ? 'message-failed' : 'message-pending'">
        <template v-if="item.status === 'failed'">
          <div class="message-title">这次生成没有完成</div>
          <div>{{ item.errorMessage || '生成失败，请稍后重试。' }}</div>
          <div v-if="item.stale" class="message-hint muted">页面离开前这次请求的结果无法继续跟踪，你可以去历史记录查看是否已生成成功。</div>
          <div v-else class="message-hint muted">你可以直接复用左侧历史提示词，或者重新发送一次。</div>
        </template>
        <template v-else>
          <div class="message-title">正在生成图片</div>
          <div class="message-loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div class="message-hint muted">图片生成完成后会在这里直接显示，刷新页面后这条记录也会保留。</div>
        </template>
        <div v-if="item.prompt" class="message-prompt">提示词：{{ item.prompt }}</div>
        <div v-if="item.attachmentName" class="message-attachment muted">参考图：{{ item.attachmentName }}</div>
      </div>

      <ImageCard
        v-else
        :item="item"
        @delete="emit('delete', $event)"
        @reuse="emit('reuse', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-bubble {
  max-width: min(720px, 100%);
  padding: 14px 16px;
  border-radius: 16px;
  line-height: 1.6;
}

.message-enter {
  animation: message-enter 220ms ease-out;
}

.message-user {
  align-self: flex-end;
  background: var(--color-primary-soft);
  border: 1px solid rgba(118, 168, 255, 0.2);
  color: var(--color-text-soft);
}

.message-assistant {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.message-pending {
  box-shadow: var(--shadow-soft);
}

.message-failed {
  background: rgba(213, 91, 91, 0.08);
  border-color: rgba(213, 91, 91, 0.22);
  color: var(--color-danger);
}

.message-title {
  margin-bottom: 6px;
  font-weight: 600;
}

.message-hint,
.message-attachment,
.message-prompt {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.message-loading-dots {
  display: inline-flex;
  gap: 6px;
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
</style>
