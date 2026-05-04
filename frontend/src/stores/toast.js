import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useThemeStore } from './theme'

let toastId = 0

export const useToastStore = defineStore('toast', () => {
  const items = ref([])

  function remove(id) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function push(message, type = 'success') {
    const themeStore = useThemeStore()
    const id = `toast-${Date.now()}-${toastId += 1}`
    const item = {
      id,
      message,
      type,
      theme: themeStore.theme,
    }

    items.value.push(item)
    window.setTimeout(() => remove(id), 2600)
    return id
  }

  function success(message) {
    return push(message, 'success')
  }

  return {
    items,
    remove,
    push,
    success,
  }
})
