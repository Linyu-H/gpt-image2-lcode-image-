<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()
const isLight = computed(() => themeStore.theme === 'light')
const label = computed(() => isLight.value ? '切换深蓝护眼' : '切换白天模式')
const icon = computed(() => isLight.value ? '◐' : '☀︎')
</script>

<template>
  <button class="button-secondary theme-toggle" type="button" @click="themeStore.toggleTheme()">
    <span class="theme-icon">{{ icon }}</span>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
}

.theme-icon {
  font-size: 14px;
  line-height: 1;
}
</style>
