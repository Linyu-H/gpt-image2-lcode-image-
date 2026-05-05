<script setup>
import { computed } from 'vue'
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

const links = computed(() => [
  { label: i18n.t('github'), href: 'https://github.com/Linyu-H/gpt-image2-lcode-image-.git' },
  { label: i18n.t('donate'), href: 'https://money.lcode.space' },
])
</script>

<template>
  <nav class="floating-external-nav card" aria-label="外部链接">
    <a
      v-for="link in links"
      :key="link.href"
      class="floating-external-link"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ link.label }}
    </a>
  </nav>
</template>

<style scoped>
.floating-external-nav {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
}

.floating-external-link {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.floating-external-link:hover {
  color: var(--color-text-soft);
  background: var(--color-primary-soft);
}

@media (max-width: 768px) {
  .floating-external-nav {
    top: 12px;
    right: 12px;
  }

  .floating-external-link {
    min-height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }
}
</style>
