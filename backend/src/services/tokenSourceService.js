import { db } from '../db/index.js'
import { decrypt } from './encryptionService.js'
import { nowIso } from '../utils/time.js'

function readAdminSettings() {
  return db.prepare('SELECT shared_token_encrypted, image_api_base_url FROM admin_settings WHERE id = 1').get()
}

function readUserProfile(userId) {
  if (!userId) return null
  return db.prepare(`
    SELECT
      user_id as userId,
      personal_token_encrypted,
      personal_image_api_base_url as personalImageApiBaseUrl,
      share_personal_token as sharePersonalToken,
      share_disabled_reason as shareDisabledReason
    FROM user_profiles
    WHERE user_id = ?
  `).get(userId)
}

function buildOwnSource(userId) {
  if (!userId) return null
  const profile = readUserProfile(userId)
  if (!profile) return null
  const token = decrypt(profile.personal_token_encrypted || '')
  if (!token) return null
  const settings = readAdminSettings()
  const baseUrl = profile.personalImageApiBaseUrl || settings?.image_api_base_url || ''
  if (!baseUrl) return null
  return {
    kind: 'own',
    sourceType: 'private',
    contributorUserId: null,
    accessToken: token,
    baseUrl,
  }
}

function buildSharedSource() {
  const settings = readAdminSettings()
  const token = decrypt(settings?.shared_token_encrypted || '')
  const baseUrl = settings?.image_api_base_url || ''
  if (!token || !baseUrl) return null
  return {
    kind: 'shared',
    sourceType: 'shared',
    contributorUserId: null,
    accessToken: token,
    baseUrl,
  }
}

function listContributorSources({ excludeUserId } = {}) {
  const rows = db.prepare(`
    SELECT
      users.id as userId,
      users.username as username,
      users.is_banned as isBanned,
      user_profiles.personal_token_encrypted as personalTokenEncrypted,
      user_profiles.personal_image_api_base_url as personalImageApiBaseUrl,
      user_profiles.share_personal_token as sharePersonalToken
    FROM user_profiles
    JOIN users ON users.id = user_profiles.user_id
    WHERE user_profiles.share_personal_token = 1 AND users.is_banned = 0
    ORDER BY user_profiles.updated_at DESC
  `).all()

  const settings = readAdminSettings()

  return rows
    .filter((row) => row.userId !== excludeUserId)
    .map((row) => {
      const token = decrypt(row.personalTokenEncrypted || '')
      const baseUrl = row.personalImageApiBaseUrl || settings?.image_api_base_url || ''
      if (!token || !baseUrl) return null
      return {
        kind: 'contributor',
        sourceType: 'contributor',
        contributorUserId: row.userId,
        contributorUsername: row.username,
        accessToken: token,
        baseUrl,
      }
    })
    .filter(Boolean)
}

function buildContributorSource(contributorUserId, { excludeUserId } = {}) {
  if (!contributorUserId) return null
  if (contributorUserId === excludeUserId) return null
  const row = db.prepare(`
    SELECT
      users.id as userId,
      users.username as username,
      users.is_banned as isBanned,
      user_profiles.personal_token_encrypted as personalTokenEncrypted,
      user_profiles.personal_image_api_base_url as personalImageApiBaseUrl,
      user_profiles.share_personal_token as sharePersonalToken
    FROM user_profiles
    JOIN users ON users.id = user_profiles.user_id
    WHERE users.id = ?
  `).get(contributorUserId)
  if (!row || row.isBanned || row.sharePersonalToken !== 1) return null
  const token = decrypt(row.personalTokenEncrypted || '')
  if (!token) return null
  const settings = readAdminSettings()
  const baseUrl = row.personalImageApiBaseUrl || settings?.image_api_base_url || ''
  if (!baseUrl) return null
  return {
    kind: 'contributor',
    sourceType: 'contributor',
    contributorUserId: row.userId,
    contributorUsername: row.username,
    accessToken: token,
    baseUrl,
  }
}

export function listPublicContributors({ excludeUserId } = {}) {
  return listContributorSources({ excludeUserId }).map((source) => ({
    contributorUserId: source.contributorUserId,
    username: source.contributorUsername,
  }))
}

export function buildSourceCandidates({ requesterUserId, tokenSource }) {
  const normalized = String(tokenSource || '').trim()
  const excludeUserId = requesterUserId || null

  if (normalized === 'own') {
    const own = buildOwnSource(requesterUserId)
    return own ? [own] : []
  }
  if (normalized === 'shared') {
    const shared = buildSharedSource()
    return shared ? [shared] : []
  }
  if (normalized.startsWith('contributor:')) {
    const contributorUserId = normalized.slice('contributor:'.length)
    const source = buildContributorSource(contributorUserId, { excludeUserId })
    return source ? [source] : []
  }
  if (normalized === 'auto') {
    const own = buildOwnSource(requesterUserId)
    const contributors = listContributorSources({ excludeUserId })
    const shared = buildSharedSource()
    return [own, ...contributors, shared].filter(Boolean)
  }

  // 默认行为：保持原逻辑——优先个人，否则共享
  const own = buildOwnSource(requesterUserId)
  const shared = buildSharedSource()
  return [own || shared].filter(Boolean)
}

export function disableContributorShare(userId, reason) {
  if (!userId) return
  db.prepare(`
    UPDATE user_profiles
    SET share_personal_token = 0, share_disabled_reason = ?, share_disabled_at = ?, updated_at = ?
    WHERE user_id = ?
  `).run(String(reason || '').slice(0, 200), nowIso(), nowIso(), userId)
}
