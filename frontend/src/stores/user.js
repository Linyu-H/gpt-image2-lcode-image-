import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMe, fetchUserProfile, userLogin, userRegister } from '../api/auth'
import { userTokenStorageKey } from '../api/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(userTokenStorageKey) || '')
  const user = ref(null)
  const profile = ref(null)
  const ready = ref(false)

  const isLoggedIn = computed(() => Boolean(token.value && user.value))

  function applyAuth(result) {
    token.value = result.token
    user.value = result.user
    localStorage.setItem(userTokenStorageKey, result.token)
  }

  async function login(username, password) {
    const result = await userLogin({ username, password })
    applyAuth(result)
    await loadMe()
    await loadProfile()
  }

  async function register(payload) {
    const result = await userRegister(payload)
    applyAuth(result)
    await loadMe()
    await loadProfile()
  }

  async function loadMe() {
    if (!token.value) {
      user.value = null
      return null
    }

    const result = await fetchMe()
    user.value = result.user
    return result.user
  }

  async function loadProfile() {
    if (!token.value) {
      profile.value = null
      return null
    }

    const result = await fetchUserProfile()
    profile.value = result
    return result
  }

  async function bootstrap() {
    if (!token.value) {
      ready.value = true
      return
    }

    try {
      await loadMe()
      await loadProfile()
    } catch {
      logout()
    } finally {
      ready.value = true
    }
  }

  function setProfile(nextProfile) {
    profile.value = nextProfile
  }

  function logout() {
    token.value = ''
    user.value = null
    profile.value = null
    localStorage.removeItem(userTokenStorageKey)
  }

  return {
    token,
    user,
    profile,
    ready,
    isLoggedIn,
    login,
    register,
    loadMe,
    loadProfile,
    bootstrap,
    setProfile,
    logout,
  }
})
