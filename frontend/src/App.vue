<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppToast from './components/AppToast.vue'
import FloatingExternalNav from './components/FloatingExternalNav.vue'
import { useThemeStore } from './stores/theme'
import { useI18nStore } from './stores/i18n'

const themeStore = useThemeStore()
useI18nStore()

onMounted(() => {
  document.documentElement.setAttribute('data-theme', themeStore.theme)
})
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page-fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
  <FloatingExternalNav />
  <AppToast />
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
