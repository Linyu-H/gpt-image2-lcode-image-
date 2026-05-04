<script setup>
import { onMounted, ref } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'
import ApiKeySettingModal from '../components/ApiKeySettingModal.vue'
import SiteAnnouncementModal from '../components/SiteAnnouncementModal.vue'
import { fetchAnnouncement } from '../api/image'

const apiKeyModalOpen = ref(false)
const announcementOpen = ref(false)
const announcement = ref({ title: '', content: '', isEnabled: false, updatedAt: '' })

function openApiKeyModal() {
  apiKeyModalOpen.value = true
}

function closeApiKeyModal() {
  apiKeyModalOpen.value = false
}

function openAnnouncement() {
  if (announcement.value.isEnabled) {
    announcementOpen.value = true
  }
}

function closeAnnouncement() {
  announcementOpen.value = false
}

function getAnnouncementDismissKey(payload) {
  const today = new Date().toISOString().slice(0, 10)
  return `lcode_announcement_dismissed_${today}_${payload.updatedAt || 'none'}`
}

function getAnnouncementSeenKey(payload) {
  return `lcode_announcement_seen_${payload.updatedAt || 'none'}`
}

function dismissAnnouncementToday() {
  if (announcement.value.isEnabled) {
    localStorage.setItem(getAnnouncementDismissKey(announcement.value), '1')
    sessionStorage.setItem(getAnnouncementSeenKey(announcement.value), '1')
  }
  announcementOpen.value = false
}

async function loadAnnouncement() {
  const result = await fetchAnnouncement()
  announcement.value = result
  if (!result.isEnabled) {
    announcementOpen.value = false
    return
  }

  const dismissed = localStorage.getItem(getAnnouncementDismissKey(result)) === '1'
  const seenInSession = sessionStorage.getItem(getAnnouncementSeenKey(result)) === '1'
  announcementOpen.value = !dismissed && !seenInSession
  if (announcementOpen.value) {
    sessionStorage.setItem(getAnnouncementSeenKey(result), '1')
  }
}

onMounted(loadAnnouncement)
</script>

<template>
  <div class="shell">
    <div class="page">
      <HeaderBar :on-open-api-key="openApiKeyModal" :on-open-announcement="openAnnouncement" :has-announcement="announcement.isEnabled" />
      <main class="layout-main">
        <slot />
      </main>
      <footer class="layout-footer muted">
        <span>Lcode-image · 公益 AI 图片生成站</span>
        <span>图片默认仅保留 3 天，超期自动清理</span>
      </footer>
    </div>
    <ApiKeySettingModal :open="apiKeyModalOpen" @close="closeApiKeyModal" />
    <SiteAnnouncementModal :open="announcementOpen" :announcement="announcement" @close="closeAnnouncement" @dismiss-today="dismissAnnouncementToday" />
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
