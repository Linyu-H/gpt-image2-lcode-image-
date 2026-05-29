<script setup>
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div>
        <h3>{{ i18n.t('recentImages') }}</h3>
        <p>{{ i18n.t('recentImagesCopy') }}</p>
      </div>
      <span>{{ items.length }}</span>
    </div>

    <div class="history-list">
      <button
        v-for="item in items.slice(0, 12)"
        :key="item.id"
        type="button"
        class="history-item"
        @click="emit('select', item.prompt)"
      >
        <img :src="item.imageUrl" :alt="item.prompt" loading="lazy" />
        <span>{{ item.prompt }}</span>
      </button>
    </div>

    <p v-if="!items.length" class="empty-note">{{ i18n.t('emptyRecent') }}</p>
  </aside>
</template>

<style scoped>
.sidebar {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-divider);
}

.sidebar-header h3 {
  margin: 0 0 5px;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 800;
}

.sidebar-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.sidebar-header span {
  min-width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
}

.history-list {
  min-height: 0;
  margin-top: 14px;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.history-item {
  width: 100%;
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  text-align: left;
  color: var(--color-text-secondary);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  border-color: var(--color-border);
  background: var(--color-card-muted);
  color: var(--color-text);
}

.history-item img {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--color-card-muted);
  border: 1px solid var(--color-border);
}

.history-item span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  font-size: 13px;
}

.empty-note {
  margin: 16px 0 0;
  padding: 26px 12px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}
</style>
