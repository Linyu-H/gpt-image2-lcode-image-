import { decrypt } from './encryptionService.js'

let sharedTokenIndex = 0

export function parseAccessTokens(rawText = '') {
  const seen = new Set()
  const tokens = []

  for (const line of rawText.split(/\r?\n/)) {
    const token = line.trim()
    if (!token || seen.has(token)) continue
    if (!looksLikeJwt(token)) continue
    seen.add(token)
    tokens.push(token)
  }

  return tokens
}

export function looksLikeJwt(token = '') {
  const parts = token.split('.')
  return parts.length === 3 && parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part) && part.length > 0)
}

export function serializeAccessTokens(tokens = []) {
  return JSON.stringify(tokens)
}

export function deserializeAccessTokens(payload = '') {
  if (!payload) return []

  try {
    const parsed = JSON.parse(payload)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && looksLikeJwt(item)) : []
  } catch {
    return []
  }
}

export function decryptAccessTokens(encryptedPayload = '') {
  return deserializeAccessTokens(decrypt(encryptedPayload))
}

export function pickSharedAccessToken(tokens = []) {
  if (!tokens.length) return ''
  const token = tokens[sharedTokenIndex % tokens.length]
  sharedTokenIndex = (sharedTokenIndex + 1) % tokens.length
  return token
}
