import request from './request'

export async function adminLogin(payload) {
  const { data } = await request.post('/admin/login', payload)
  return data
}

export async function changeAdminPassword(payload) {
  const { data } = await request.post('/admin/change-password', payload)
  return data
}

export async function testUserApiKey(apiKey, baseUrl) {
  const { data } = await request.post('/admin/user-token/test', { apiKey, baseUrl })
  return data
}

export async function fetchAdminStatus() {
  const { data } = await request.get('/admin/config/status')
  return data
}

export async function fetchAnnouncementConfig() {
  const { data } = await request.get('/admin/announcement')
  return data
}

export async function saveUpstreamConfig(payload) {
  const { data } = await request.post('/admin/config/upstream', payload)
  return data
}

export async function saveRegisterPolicy(payload) {
  const { data } = await request.post('/admin/config/register-policy', payload)
  return data
}

export async function saveAnnouncement(payload) {
  const { data } = await request.post('/admin/announcement', payload)
  return data
}

export async function saveEmailServiceConfig(payload) {
  const { data } = await request.post('/admin/config/email-service', payload)
  return data
}

export async function testUpstreamConfig(payload) {
  const { data } = await request.post('/admin/config/upstream/test', payload)
  return data
}

export async function saveDailyLimit(dailyLimit) {
  const { data } = await request.post('/admin/config/limit', { dailyLimit })
  return data
}

export async function saveCleanupCron(cleanupCron) {
  const { data } = await request.post('/admin/config/cleanup-cron', { cleanupCron })
  return data
}

export async function fetchStatistics() {
  const { data } = await request.get('/admin/statistics')
  return data
}

export async function fetchFeaturedPrompts() {
  const { data } = await request.get('/admin/featured-prompts')
  return data
}

export async function createFeaturedPrompt(prompt) {
  const { data } = await request.post('/admin/featured-prompts', { prompt })
  return data
}

export async function deleteFeaturedPrompt(id) {
  const { data } = await request.delete(`/admin/featured-prompts/${id}`)
  return data
}

export async function fetchInviteCodes() {
  const { data } = await request.get('/admin/invite-codes')
  return data
}

export async function generateInviteCodes(count) {
  const { data } = await request.post('/admin/invite-codes/generate', { count })
  return data
}

export async function fetchUsers() {
  const { data } = await request.get('/admin/users')
  return data
}

export async function updateUserBanStatus(userId, isBanned) {
  const { data } = await request.post(`/admin/users/${userId}/ban`, { isBanned })
  return data
}

export async function resetUserPassword(userId, password) {
  const { data } = await request.post(`/admin/users/${userId}/reset-password`, { password })
  return data
}

export async function fetchAdminImages() {
  const { data } = await request.get('/admin/images')
  return data
}

export async function deleteAdminImage(id) {
  const { data } = await request.delete(`/admin/images/${id}`)
  return data
}

export async function clearAllAdminImages() {
  const { data } = await request.post('/admin/images/clear')
  return data
}

export async function cleanExpiredImages() {
  const { data } = await request.post('/admin/clean/expired')
  return data
}
