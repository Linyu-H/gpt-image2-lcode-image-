<script setup>
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <aside class="sidebar card">
    <div class="sidebar-header">
      <div>
        <h3>{{ i18n.t('recentImages') }}</h3>
        <p class="muted">{{ i18n.t('recentImagesCopy') }}</p>
      </div>
      <span class="sidebar-chip">{{ i18n.t('lightweightHistory') }}</span>
    </div>

    <div class="history-list">
      <button
        v-for="item in items.slice(0, 6)"
        :key="item.id"
        type="button"
        class="history-item"
        @click="emit('select', item.prompt)"
      >
        <img :src="item.imageUrl" :alt="item.prompt" loading="lazy" />
        <span>{{ item.prompt }}</span>
      </button>
    </div>

    <p v-if="!items.length" class="muted empty-note">{{ i18n.t('emptyRecent') }}</p>
  </aside>
</template>

<style scoped>
.sidebar {
  padding: 18px;
  position: sticky;
  top: 124px;
}

.sidebar-header {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.sidebar-header h3,
.sidebar-header p {
  margin: 0;
}

.sidebar-header p {
  margin-top: 4px;
  line-height: 1.55;
}

.sidebar-chip {
  min-height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  white-space: nowrap;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  width: 100%;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-card-muted);
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.history-item img {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
}

.history-item span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  color: var(--color-text-soft);
}

.empty-note {
  margin: 0;
}

@media (max-width: 1024px) {
  .sidebar {
    position: static;
  }
}
</style>
