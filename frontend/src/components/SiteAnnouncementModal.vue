<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  announcement: {
    type: Object,
    default: () => ({ title: '', content: '', updatedAt: '', isEnabled: false }),
  },
})

const emit = defineEmits(['close', 'dismiss-today'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="announcement-overlay" @click.self="emit('close')">
        <section class="announcement-modal card" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
          <div class="announcement-header">
            <div>
              <p class="announcement-eyebrow">站点公告</p>
              <h2 id="announcement-title">{{ announcement.title || '公告' }}</h2>
            </div>
            <button type="button" class="button-secondary icon-button" aria-label="关闭公告" @click="emit('close')">×</button>
          </div>
          <p class="announcement-content">{{ announcement.content || '当前暂无公告内容。' }}</p>
          <p v-if="announcement.updatedAt" class="muted announcement-meta">更新时间：{{ announcement.updatedAt }}</p>
          <div class="announcement-actions">
            <button type="button" class="button-secondary" @click="emit('close')">关闭</button>
            <button type="button" class="button-primary" @click="emit('dismiss-today')">今日不再提示</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.announcement-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(10px);
}

.announcement-modal {
  width: min(560px, 100%);
  padding: 22px;
  transform-origin: 50% 46%;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-active .announcement-modal,
.modal-fade-leave-active .announcement-modal {
  transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .announcement-modal,
.modal-fade-leave-to .announcement-modal {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.announcement-eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.announcement-header h2 {
  margin: 0;
}

.announcement-content {
  margin: 18px 0 0;
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--color-text-soft);
}

.announcement-meta {
  margin: 14px 0 0;
}

.announcement-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.icon-button {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}
</style>
