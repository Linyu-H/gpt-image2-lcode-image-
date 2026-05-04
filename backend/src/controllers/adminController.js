import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { db } from '../db/index.js'
import { encrypt, decrypt } from '../services/encryptionService.js'
import { createFeaturedPrompt, deleteFeaturedPrompt, listFeaturedPrompts } from '../services/featuredExampleService.js'
import { testImageApi } from '../services/chatgptSessionService.js'
import { runExpiredCleanup, startCleanupJob } from '../services/cleanupService.js'
import { getEmailConfig, saveEmailConfig } from '../services/emailConfigService.js'
import { generateInviteCodes, listInviteCodes } from '../services/inviteCodeService.js'
import { nowIso } from '../utils/time.js'

export function buildStatisticsPayload() {
  const totalImages = db.prepare(`SELECT COUNT(*) as total FROM generated_images`).get().total
  const activeImages = db.prepare(`SELECT COUNT(*) as total FROM generated_images WHERE status = 'active'`).get().total
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = db.prepare(`SELECT COUNT(*) as total FROM generated_images WHERE created_at >= ?`).get(`${today}T00:00:00.000Z`).total

  const recentTrend = db.prepare(`
    SELECT substr(created_at, 1, 10) as day, COUNT(*) as total
    FROM generated_images
    WHERE created_at >= datetime('now', '-6 days')
    GROUP BY substr(created_at, 1, 10)
    ORDER BY day ASC
  `).all()

  const sourceSplitRows = db.prepare(`
    SELECT source_type as sourceType, COUNT(*) as total
    FROM generated_images
    GROUP BY source_type
  `).all()

  const retentionRows = db.prepare(`
    SELECT
      CASE
        WHEN expires_at <= datetime('now') THEN 'expired'
        WHEN expires_at <= datetime('now', '+1 day') THEN 'within_1_day'
        WHEN expires_at <= datetime('now', '+2 day') THEN 'within_2_days'
        ELSE 'within_3_days'
      END as bucket,
      COUNT(*) as total
    FROM generated_images
    GROUP BY bucket
  `).all()

  return {
    totalImages,
    activeImages,
    todayCount,
    recentTrend,
    sourceSplit: sourceSplitRows,
    retention: retentionRows,
  }
}

export async function login(req, res) {
  const { username, password } = req.body

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return res.status(401).json({ message: '账号或密码错误' })
  }

  const token = jwt.sign({ username, role: 'admin' }, env.jwtSecret, { expiresIn: '7d' })
  res.json({ token })
}

function readSettings() {
  return db.prepare('SELECT * FROM admin_settings WHERE id = 1').get()
}

export function getConfigStatus(req, res) {
  const settings = readSettings()
  const sharedToken = decrypt(settings?.shared_token_encrypted || '')
  const emailConfig = getEmailConfig()
  res.json({
    imageApiBaseUrl: settings?.image_api_base_url || '',
    siteBaseUrl: settings?.site_base_url || '',
    sharedToken,
    hasSharedToken: Boolean(sharedToken),
    dailyLimit: settings?.daily_limit,
    cleanupCron: settings?.cleanup_cron,
    allowRegister: settings?.allow_register !== 0,
    requireInviteCode: settings?.require_invite_code === 1,
    emailAuthUser: emailConfig.authUser,
    hasEmailAuthPass: Boolean(emailConfig.authPass),
    updatedAt: settings?.updated_at,
  })
}

export async function saveUpstreamConfig(req, res) {
  const { accessToken = '', imageApiBaseUrl = '', siteBaseUrl = '' } = req.body
  db.prepare(`UPDATE admin_settings SET shared_token_encrypted = ?, image_api_base_url = ?, site_base_url = ?, updated_at = ? WHERE id = 1`)
    .run(encrypt(accessToken.trim()), imageApiBaseUrl.trim(), siteBaseUrl.trim(), nowIso())
  res.json({ message: '上游配置已保存' })
}

export function saveRegisterPolicy(req, res) {
  const allowRegister = req.body?.allowRegister === false ? 0 : 1
  const requireInviteCode = req.body?.requireInviteCode === true ? 1 : 0

  db.prepare(`
    UPDATE admin_settings
    SET allow_register = ?, require_invite_code = ?, updated_at = ?
    WHERE id = 1
  `).run(allowRegister, requireInviteCode, nowIso())

  res.json({ message: '注册策略已保存' })
}

export function saveEmailServiceConfig(req, res) {
  const authUser = String(req.body?.authUser || '').trim()
  const authPass = String(req.body?.authPass || '').trim()

  saveEmailConfig({ authUser, authPass })
  res.json({ message: '邮箱服务配置已保存' })
}

export async function testUpstreamConfig(req, res) {
  const { accessToken = '', imageApiBaseUrl = '' } = req.body
  const settings = readSettings()
  const token = accessToken.trim() || decrypt(settings?.shared_token_encrypted || '')
  const baseUrl = imageApiBaseUrl.trim() || settings?.image_api_base_url || ''

  if (!token) {
    return res.status(400).json({ message: '请先填写或保存共享身份令牌' })
  }

  if (!baseUrl) {
    return res.status(400).json({ message: '请先填写或保存图片 API 地址' })
  }

  const ok = await testImageApi({ accessToken: token, baseUrl })
  res.json({ ok })
}

export async function testUserKey(req, res) {
  const { apiKey = '', baseUrl = '' } = req.body
  if (!apiKey.trim()) {
    return res.status(400).json({ message: '请先输入个人身份令牌' })
  }

  const settings = readSettings()
  const resolvedBaseUrl = baseUrl.trim() || settings?.image_api_base_url || ''
  const ok = await testImageApi({ accessToken: apiKey.trim(), baseUrl: resolvedBaseUrl })
  res.json({ ok })
}

export function saveDailyLimit(req, res) {
  const { dailyLimit } = req.body
  db.prepare(`UPDATE admin_settings SET daily_limit = ?, updated_at = ? WHERE id = 1`)
    .run(Number(dailyLimit || env.defaultDailyLimit), nowIso())
  res.json({ message: '每日限流已更新' })
}

export function saveCleanupCron(req, res) {
  const { cleanupCron } = req.body
  db.prepare(`UPDATE admin_settings SET cleanup_cron = ?, updated_at = ? WHERE id = 1`)
    .run(cleanupCron || env.defaultCleanupCron, nowIso())
  startCleanupJob(cleanupCron || env.defaultCleanupCron)
  res.json({ message: '清理周期已更新' })
}

export function cleanExpired(req, res) {
  const cleaned = runExpiredCleanup()
  res.json({ message: '过期图片清理完成', cleaned })
}

export function getFeaturedPrompts(req, res) {
  res.json(listFeaturedPrompts())
}

export function addFeaturedPrompt(req, res) {
  const item = createFeaturedPrompt(req.body?.prompt || '')
  res.status(201).json(item)
}

export function removeFeaturedPrompt(req, res) {
  deleteFeaturedPrompt(Number(req.params.id))
  res.json({ message: '示例灵感已删除' })
}

export function getInviteCodes(req, res) {
  res.json(listInviteCodes())
}

export function createInviteCodes(req, res) {
  const created = generateInviteCodes(req.body?.count)
  res.status(201).json({ message: `已生成 ${created.length} 个邀请码`, codes: created })
}

export function getUsers(req, res) {
  const users = db.prepare(`
    SELECT
      id,
      username,
      email,
      email_verified as emailVerified,
      is_banned as isBanned,
      created_at as createdAt,
      updated_at as updatedAt
    FROM users
    ORDER BY created_at DESC
  `).all()

  res.json(users)
}

export function updateUserBanStatus(req, res) {
  const userId = String(req.params.id || '').trim()
  const isBanned = req.body?.isBanned === true ? 1 : 0

  if (!userId) {
    return res.status(400).json({ message: '用户不存在' })
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }

  db.prepare('UPDATE users SET is_banned = ?, updated_at = ? WHERE id = ?')
    .run(isBanned, nowIso(), userId)

  res.json({ message: isBanned ? '用户已封禁' : '用户已解除封禁' })
}

export function resetUserPassword(req, res) {
  const userId = String(req.params.id || '').trim()
  const password = String(req.body?.password || '')

  if (!userId) {
    return res.status(400).json({ message: '用户不存在' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码至少需要 6 个字符' })
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }

  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(bcrypt.hashSync(password, 10), nowIso(), userId)

  res.json({ message: '用户密码已重置' })
}

export function getStatistics(req, res) {
  res.json(buildStatisticsPayload())
}
