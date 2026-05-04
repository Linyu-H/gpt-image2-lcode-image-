import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const storageKey = 'lcode_theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem(storageKey) || 'light')

  watch(theme, (value) => {
    localStorage.setItem(storageKey, value)
    document.documentElement.setAttribute('data-theme', value)
  }, { immediate: true })

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'eye' : 'light'
  }

  return { theme, toggleTheme }
})
