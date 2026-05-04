<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
const { items } = storeToRefs(toastStore)
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast-fade">
      <div
        v-for="item in items"
        :key="item.id"
        class="toast-card"
        :class="[`toast-${item.type}`, `toast-theme-${item.theme}`]"
      >
        {{ item.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 120;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-card {
  min-width: min(320px, calc(100vw - 32px));
  max-width: min(420px, calc(100vw - 32px));
  padding: 13px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
  line-height: 1.6;
  color: var(--color-text);
  backdrop-filter: blur(12px);
}

.toast-success.toast-theme-light {
  background: rgba(228, 246, 234, 0.96);
  border-color: rgba(104, 176, 126, 0.22);
}

.toast-success.toast-theme-eye {
  background: rgba(218, 234, 255, 0.96);
  border-color: rgba(104, 150, 226, 0.24);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .toast-stack {
    top: 14px;
    right: 14px;
    left: 14px;
  }

  .toast-card {
    min-width: 100%;
    max-width: 100%;
  }
}
</style>
