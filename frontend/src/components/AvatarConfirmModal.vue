<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  previewUrl: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open && previewUrl" class="avatar-overlay" @click.self="emit('close')">
        <section class="avatar-modal card" role="dialog" aria-modal="true" aria-labelledby="avatar-confirm-title">
          <div class="avatar-header">
            <div>
              <p class="avatar-eyebrow">头像预览</p>
              <h2 id="avatar-confirm-title">确认使用这张头像？</h2>
            </div>
            <button type="button" class="button-secondary icon-button" aria-label="关闭头像预览" @click="emit('close')">×</button>
          </div>

          <div class="avatar-preview-wrap">
            <img class="avatar-preview" :src="previewUrl" alt="头像预览" />
          </div>

          <div class="avatar-actions">
            <button type="button" class="button-secondary" @click="emit('close')">取消</button>
            <button type="button" class="button-primary" :disabled="loading" @click="emit('confirm')">
              {{ loading ? '保存中...' : '确认保存' }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.avatar-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(10px);
}

.avatar-modal {
  width: min(440px, 100%);
  padding: 22px;
  transform-origin: 50% 46%;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-active .avatar-modal,
.modal-fade-leave-active .avatar-modal {
  transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .avatar-modal,
.modal-fade-leave-to .avatar-modal {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}

.avatar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.avatar-eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.avatar-header h2 {
  margin: 0;
}

.avatar-preview-wrap {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

.avatar-preview {
  width: 220px;
  height: 220px;
  border-radius: 28px;
  object-fit: cover;
  display: block;
  background: var(--color-card-muted);
}

.avatar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.icon-button {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}
</style>
