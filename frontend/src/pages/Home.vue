<script setup>
import { onMounted, ref } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import ChatPanel from '../components/ChatPanel.vue'
import SidebarHistory from '../components/SidebarHistory.vue'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'

const chatStore = useChatStore()
const userStore = useUserStore()
const sidebarOpen = ref(true)

onMounted(async () => {
  if (!chatStore.loading) {
    chatStore.restoreMessages()
  }
  await chatStore.loadHistory()

  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
})

async function handleSubmit() {
  await chatStore.submitPrompt(chatStore.draft)
}

function reusePrompt(prompt) {
  chatStore.draft = prompt
  chatStore.clearError()
  if (window.innerWidth < 768) {
    sidebarOpen.value = false
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function startNewConversation() {
  if (chatStore.loading) return
  chatStore.messages = []
  chatStore.draft = ''
  chatStore.clearSelectedFile()
  chatStore.clearError()
  if (window.innerWidth < 768) {
    sidebarOpen.value = false
  }
}
</script>

<template>
  <AppLayout immersive>
    <div class="chat-workspace" :class="{ 'history-open': sidebarOpen }">
      <div class="toggle-rail">
        <button class="history-toggle" type="button" :class="{ active: sidebarOpen }" :aria-label="sidebarOpen ? '收起历史栏' : '打开历史栏'" :aria-expanded="sidebarOpen" @click="toggleSidebar">
          <Transition name="toggle-icon" mode="out-in">
            <svg v-if="!sidebarOpen" key="menu" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
            <svg v-else key="close" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Transition>
        </button>
      </div>

      <Transition name="scrim">
        <div v-if="sidebarOpen" class="history-scrim" @click="sidebarOpen = false" />
      </Transition>

      <aside class="history-drawer" :class="{ 'is-closed': !sidebarOpen }" :aria-hidden="!sidebarOpen" aria-label="图片生成历史">
        <div class="drawer-brand">
          <div class="drawer-logo">AI</div>
          <div>
            <strong>照片生成</strong>
            <p>像聊天一样描述画面</p>
          </div>
        </div>

        <button class="new-chat-button" type="button" :disabled="chatStore.loading" @click="startNewConversation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span>清空历史</span>
        </button>

        <SidebarHistory :items="chatStore.combinedHistory" @select="reusePrompt" />
      </aside>

      <main class="chat-canvas">
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
      </main>
    </div>
  </AppLayout>
</template>

<style scoped>
.chat-workspace {
  --rail-width: 56px;
  --drawer-width: 0px;
  position: relative;
  display: grid;
  grid-template-columns: var(--rail-width) var(--drawer-width) minmax(0, 1fr);
  gap: 16px;
  min-height: calc(100dvh - 112px);
  transition: grid-template-columns 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.chat-workspace.history-open {
  --drawer-width: 292px;
}

.toggle-rail {
  position: sticky;
  top: 108px;
  align-self: start;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.history-toggle {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-card-strong);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-soft);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.history-toggle:hover,
.history-toggle.active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.history-toggle:hover {
  transform: translateY(-1px);
}

.history-toggle:active {
  transform: scale(0.96);
}

.toggle-icon-enter-active,
.toggle-icon-leave-active {
  transition: opacity 180ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.toggle-icon-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.8);
}

.toggle-icon-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.8);
}

.scrim-enter-active,
.scrim-leave-active {
  transition: opacity 240ms ease;
}

.scrim-enter-from,
.scrim-leave-to {
  opacity: 0;
}

.history-drawer {
  position: sticky;
  top: 108px;
  z-index: 20;
  height: calc(100dvh - 128px);
  min-height: 560px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 28px;
  background: linear-gradient(180deg, var(--color-card-strong), var(--color-card));
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--backdrop-blur);
  transform-origin: left center;
  transition:
    opacity 280ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 280ms ease;
}

.history-drawer.is-closed {
  pointer-events: none;
  opacity: 0;
  transform: translateX(-12px) scale(0.97);
  box-shadow: none;
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 2px 0;
}

.drawer-logo {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  font-weight: 800;
  letter-spacing: -0.03em;
  box-shadow: 0 14px 26px rgba(57, 168, 107, 0.22);
}

[data-theme='eye'] .drawer-logo {
  box-shadow: 0 14px 26px rgba(118, 168, 255, 0.2);
}

.drawer-brand strong {
  display: block;
  color: var(--color-text);
  font-size: 17px;
}

.drawer-brand p {
  margin: 3px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.new-chat-button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 12px 26px rgba(57, 168, 107, 0.2);
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.new-chat-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-primary-hover);
  box-shadow: 0 16px 30px rgba(57, 168, 107, 0.25);
}

.new-chat-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.chat-canvas {
  min-width: 0;
  min-height: calc(100dvh - 112px);
}

.history-scrim {
  display: none;
}

@media (max-width: 1024px) {
  .chat-workspace.history-open {
    --drawer-width: 270px;
  }

  .history-drawer {
    min-height: 520px;
  }
}

@media (max-width: 768px) {
  .chat-workspace,
  .chat-workspace.history-open {
    display: block;
    min-height: calc(100dvh - 96px);
  }

  .toggle-rail {
    position: fixed;
    top: 96px;
    left: 18px;
    z-index: 80;
    padding: 0;
  }

  .history-scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: block;
    background: rgba(2, 6, 18, 0.38);
    backdrop-filter: blur(3px);
  }

  .history-drawer {
    position: fixed;
    top: 90px;
    bottom: 12px;
    left: 10px;
    z-index: 70;
    width: min(320px, calc(100vw - 24px));
    height: auto;
    min-height: 0;
    transform-origin: left center;
  }

  .history-drawer.is-closed {
    transform: translateX(-110%);
  }

  .chat-canvas {
    min-height: calc(100dvh - 96px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-workspace,
  .history-drawer,
  .toggle-icon-enter-active,
  .toggle-icon-leave-active,
  .scrim-enter-active,
  .scrim-leave-active {
    transition: none;
  }

  .history-drawer.is-closed {
    transform: none;
  }
}
</style>
