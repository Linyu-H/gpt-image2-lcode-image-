<script setup>
import { ref } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'
import ApiKeySettingModal from '../components/ApiKeySettingModal.vue'

const apiKeyModalOpen = ref(false)

function openApiKeyModal() {
  apiKeyModalOpen.value = true
}

function closeApiKeyModal() {
  apiKeyModalOpen.value = false
}
</script>

<template>
  <div class="shell">
    <div class="page">
      <HeaderBar :on-open-api-key="openApiKeyModal" />
      <main class="layout-main">
        <slot />
      </main>
      <footer class="layout-footer muted">
        <span>Lcode-image · 公益 AI 图片生成站</span>
        <span>图片默认仅保留 3 天，超期自动清理</span>
      </footer>
    </div>
    <ApiKeySettingModal :open="apiKeyModalOpen" @close="closeApiKeyModal" />
  </div>
</template>

<style scoped>
.layout-main {
  min-height: calc(100vh - 180px);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.layout-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 4px 6px;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .layout-footer {
    flex-direction: column;
    padding-top: 18px;
    font-size: 12px;
  }
}
</style>
