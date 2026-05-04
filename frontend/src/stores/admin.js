import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminLogin, changeAdminPassword } from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('lcode_admin_token') || '')
  const username = ref(localStorage.getItem('lcode_admin_username') || '')
  const mustChangePassword = ref(localStorage.getItem('lcode_admin_must_change_password') === 'true')
  const isLoggedIn = computed(() => Boolean(token.value))

  async function login(inputUsername, password) {
    const result = await adminLogin({ username: inputUsername, password })
    token.value = result.token
    username.value = result.username || inputUsername
    mustChangePassword.value = result.mustChangePassword === true
    localStorage.setItem('lcode_admin_token', result.token)
    localStorage.setItem('lcode_admin_username', username.value)
    localStorage.setItem('lcode_admin_must_change_password', String(mustChangePassword.value))
  }

  async function updatePassword(currentPassword, newPassword) {
    const result = await changeAdminPassword({ currentPassword, newPassword })
    mustChangePassword.value = false
    localStorage.setItem('lcode_admin_must_change_password', 'false')
    return result
  }

  function markMustChangePassword(value) {
    mustChangePassword.value = value
    localStorage.setItem('lcode_admin_must_change_password', String(value))
  }

  function logout() {
    token.value = ''
    username.value = ''
    mustChangePassword.value = false
    localStorage.removeItem('lcode_admin_token')
    localStorage.removeItem('lcode_admin_username')
    localStorage.removeItem('lcode_admin_must_change_password')
  }

  return { token, username, mustChangePassword, isLoggedIn, login, updatePassword, markMustChangePassword, logout }
})
