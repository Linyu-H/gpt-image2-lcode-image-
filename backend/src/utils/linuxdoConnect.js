import axios from 'axios'
import { getLinuxdoConfig } from '../services/linuxdoConnectService.js'

const AUTH_URL = 'https://connect.linux.do/oauth2/authorize'
const TOKEN_URL = 'https://connect.linux.do/oauth2/token'
const USER_INFO_URL = 'https://connect.linux.do/api/user'
const REQUEST_TIMEOUT_MS = 15000
const TRANSIENT_ERROR_CODES = new Set(['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN'])

async function requestWithRetry(request) {
  try {
    return await request()
  } catch (error) {
    if (!TRANSIENT_ERROR_CODES.has(error?.code)) throw error
    return request()
  }
}

function requireConfig() {
  const config = getLinuxdoConfig()
  if (!config.hasConfig) {
    const error = new Error('管理员尚未配置 Linux.do 接入参数')
    error.status = 503
    throw error
  }
  return config
}

export function buildAuthUrl(state) {
  const { clientId, redirectUrl } = requireConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUrl,
    response_type: 'code',
    scope: 'user',
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  const { clientId, clientSecret, redirectUrl } = requireConfig()
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUrl,
    grant_type: 'authorization_code',
  }).toString()

  const { data } = await requestWithRetry(() => axios.post(TOKEN_URL, form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    timeout: REQUEST_TIMEOUT_MS,
  }))
  return data
}

export async function fetchLinuxdoUser(accessToken) {
  const { data } = await requestWithRetry(() => axios.get(USER_INFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: REQUEST_TIMEOUT_MS,
  }))
  return data
}
