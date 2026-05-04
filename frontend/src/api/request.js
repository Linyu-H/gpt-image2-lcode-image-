import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
export const adminTokenStorageKey = 'lcode_admin_token'
export const userTokenStorageKey = 'lcode_user_token'

const request = axios.create({
  baseURL,
  timeout: 120000,
})

request.interceptors.request.use((config) => {
  const isAdminRequest = config.url?.startsWith('/admin')
  const tokenKey = isAdminRequest ? adminTokenStorageKey : userTokenStorageKey
  const token = localStorage.getItem(tokenKey)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default request
