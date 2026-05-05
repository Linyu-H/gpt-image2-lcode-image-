import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { db } from '../db/index.js'
import { encrypt, decrypt } from '../services/encryptionService.js'
import { createFeaturedPrompt, deleteFeaturedPrompt, getCurrentFeaturedExample, listFeaturedPrompts } from '../services/featuredExampleService.js'
import { clearAllActiveGeneratedImages, deleteGeneratedImageRecord, getGeneratedImageByIdForAdmin, listGeneratedImagesForAdmin } from '../services/generatedImageAdminService.js'
import { testImageApi } from '../services/chatgptSessionService.js'
import { runExpiredCleanup, startCleanupJob } from '../services/cleanupService.js'
import { getEmailConfig, saveEmailConfig } from '../services/emailConfigService.js'
import { generateInviteCodes, listInviteCodes } from '../services/inviteCodeService.js'
import { nowIso } from '../utils/time.js'
import { normalizePublicImageUrl } from '../services/imageStorageService.js'

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
  const settings = readSettings()

  if (username !== env.adminUsername || !bcrypt.compareSync(password, settings?.admin_password_hash || '')) {
    return res.status(401).json({ message: '账号或密码错误' })
  }

  const token = jwt.sign({ username, role: 'admin' }, env.jwtSecret, { expiresIn: '7d' })
  res.json({
    token,
    username,
    mustChangePassword: adminMustChangePassword(settings),
  })
}

function readSettings() {
  return db.prepare('SELECT * FROM admin_settings WHERE id = 1').get()
}

function adminMustChangePassword(settings = readSettings()) {
  return settings?.force_admin_password_change === 1
}

function buildAnnouncementPayload() {
  const announcement = db.prepare(`
    SELECT title, content, is_enabled as isEnabled, updated_at as updatedAt
    FROM site_announcements
    WHERE id = 1
  `).get()

  return {
    title: announcement?.title || '',
    content: announcement?.content || '',
    isEnabled: announcement?.isEnabled === 1,
    updatedAt: announcement?.updatedAt || '',
  }
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
    mustChangePassword: adminMustChangePassword(settings),
    emailAuthUser: emailConfig.authUser,
    hasEmailAuthPass: Boolean(emailConfig.authPass),
    updatedAt: settings?.updated_at,
  })
}

export function getAnnouncementConfig(req, res) {
  res.json(buildAnnouncementPayload())
}

export function saveAnnouncement(req, res) {
  const title = String(req.body?.title || '').trim()
  const content = String(req.body?.content || '').trim()
  const isEnabled = req.body?.isEnabled === true ? 1 : 0

  db.prepare(`
    UPDATE site_announcements
    SET title = ?, content = ?, is_enabled = ?, updated_at = ?
    WHERE id = 1
  `).run(title, content, isEnabled, nowIso())

  res.json({ message: '网站公告已保存' })
}

export function changePassword(req, res) {
  const settings = readSettings()
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')

  if (!bcrypt.compareSync(currentPassword, settings?.admin_password_hash || '')) {
    return res.status(400).json({ message: '当前密码错误' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码至少需要 6 个字符' })
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({ message: '新密码不能与当前密码相同' })
  }

  db.prepare(`
    UPDATE admin_settings
    SET admin_password_hash = ?, force_admin_password_change = 0, updated_at = ?
    WHERE id = 1
  `).run(bcrypt.hashSync(newPassword, 10), nowIso())

  res.json({ message: '管理员密码修改成功' })
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
      users.id,
      users.username,
      users.email,
      users.email_verified as emailVerified,
      users.is_banned as isBanned,
      users.created_at as createdAt,
      users.updated_at as updatedAt,
      user_profiles.avatar_url as avatarUrl,
      user_profiles.avatar_storage_path as avatarStoragePath
    FROM users
    LEFT JOIN user_profiles ON user_profiles.user_id = users.id
    ORDER BY users.created_at DESC
  `).all().map((user) => ({
    ...user,
    avatarUrl: normalizePublicImageUrl(user.avatarUrl || '', user.avatarStoragePath || ''),
  }))

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

export function getAdminImages(req, res) {
  const generatedImages = listGeneratedImagesForAdmin()
  const featuredExample = getCurrentFeaturedExample()

  const images = [
    ...generatedImages,
    ...(featuredExample?.imageUrl
      ? [{
          id: 'featured-example',
          userId: null,
          username: '首页示例',
          prompt: featuredExample.prompt,
          agent: 'image',
          imageUrl: featuredExample.imageUrl,
          sourceType: 'featured',
          createdAt: featuredExample.updatedAt,
          expiresAt: '-',
          status: 'active',
          resourceType: 'featured',
        }]
      : []),
  ].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))

  res.json(images)
}

export function deleteAdminImage(req, res) {
  const imageId = String(req.params.id || '').trim()
  const image = getGeneratedImageByIdForAdmin(imageId)

  if (!image) {
    return res.status(404).json({ message: '图片不存在' })
  }

  if (image.status !== 'active') {
    return res.status(400).json({ message: '图片已失效，无法重复删除' })
  }

  deleteGeneratedImageRecord(image)
  res.json({ message: '图片已删除' })
}

export function clearAllGeneratedImages(req, res) {
  const cleared = clearAllActiveGeneratedImages()
  res.json({ message: `已清空 ${cleared} 张图片`, cleared })
}

export function getStatistics(req, res) {
  res.json(buildStatisticsPayload())
}
