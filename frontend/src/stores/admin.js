import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin } from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('lcode_admin_token') || '')

  async function login(username, password) {
    const result = await adminLogin({ username, password })
    token.value = result.token
    localStorage.setItem('lcode_admin_token', result.token)
  }

  function logout() {
    token.value = ''
    localStorage.removeItem('lcode_admin_token')
  }

  return { token, login, logout }
})
