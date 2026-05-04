import request from './request'

export async function userLogin(payload) {
  const { data } = await request.post('/auth/login', payload)
  return data
}

export async function fetchRegisterPolicy() {
  const { data } = await request.get('/auth/register-policy')
  return data
}

export async function sendRegisterEmailCode(payload) {
  const { data } = await request.post('/auth/email-code/send', payload)
  return data
}

export async function sendPasswordResetEmailCode(payload) {
  const { data } = await request.post('/auth/password-reset/email-code/send', payload)
  return data
}

export async function resetPasswordWithEmailCode(payload) {
  const { data } = await request.post('/auth/password-reset/confirm', payload)
  return data
}

export async function userRegister(payload) {
  const { data } = await request.post('/auth/register', payload)
  return data
}

export async function fetchMe() {
  const { data } = await request.get('/auth/me')
  return data
}

export async function fetchUserProfile() {
  const { data } = await request.get('/auth/profile')
  return data
}

export async function saveUserProfile(payload) {
  const { data } = await request.post('/auth/profile', payload)
  return data
}

export async function testUserProfile(payload) {
  const { data } = await request.post('/auth/profile/test', payload)
  return data
}
