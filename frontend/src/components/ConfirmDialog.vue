<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '确认操作',
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: '确认',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  danger: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

function handleConfirm() {
  emit('confirm')
  emit('close')
}

function handleCancel() {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="open" class="dialog-overlay" @click="handleCancel">
        <div class="dialog-box" @click.stop>
          <div class="dialog-header">
            <h3>{{ title }}</h3>
            <button type="button" class="dialog-close" @click="handleCancel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div class="dialog-body">
            <p>{{ message }}</p>
          </div>
          <div class="dialog-footer">
            <button type="button" class="dialog-button dialog-button-secondary" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button type="button" class="dialog-button" :class="danger ? 'dialog-button-danger' : 'dialog-button-primary'" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
  width: min(440px, calc(100vw - 32px));
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

.dialog-body p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-soft);
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

.dialog-button-danger {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2);
}

.dialog-button-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(239, 68, 68, 0.25);
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
</style>
