<script setup>
import { onMounted } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import ChatPanel from '../components/ChatPanel.vue'
import SidebarHistory from '../components/SidebarHistory.vue'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'

const chatStore = useChatStore()
const userStore = useUserStore()

onMounted(async () => {
  if (!chatStore.loading) {
    chatStore.restoreMessages()
  }
  await chatStore.loadHistory()
})

async function handleSubmit() {
  await chatStore.submitPrompt(chatStore.draft)
}

function reusePrompt(prompt) {
  chatStore.draft = prompt
  chatStore.clearError()
}
</script>

<template>
  <AppLayout>
    <div class="home-grid">
      <SidebarHistory :items="chatStore.combinedHistory" @select="reusePrompt" />
      <ChatPanel
        :draft="chatStore.draft"
        :loading="chatStore.loading"
        :messages="chatStore.messages"
        :error-message="chatStore.errorMessage"
        :is-logged-in="userStore.isLoggedIn"
        :username="userStore.user?.username || ''"
        :selected-file-name="chatStore.selectedFileName"
        @update:draft="chatStore.draft = $event; chatStore.clearError()"
        @submit="handleSubmit"
        @select-file="chatStore.setSelectedFile($event)"
        @clear-file="chatStore.clearSelectedFile()"
        @delete="chatStore.deleteImage($event)"
        @reuse="reusePrompt"
      />
    </div>
  </AppLayout>
</template>

<style scoped>
.home-grid {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  padding-bottom: 28px;
}

@media (max-width: 1024px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
}
</style>
