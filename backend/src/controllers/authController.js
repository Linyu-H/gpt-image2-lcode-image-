import fs from 'fs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'
import { db } from '../db/index.js'
import { encrypt, decrypt } from '../services/encryptionService.js'
import { testImageApi, generateImage } from '../services/chatgptSessionService.js'
import { sendEmailVerificationCode, verifyEmailVerificationCode } from '../services/emailVerificationService.js'
import { consumeInviteCode } from '../services/inviteCodeService.js'
import { nowIso, addDays } from '../utils/time.js'
import { normalizePublicImageUrl, removeStoredImage, saveImageFromUrl, saveUploadedFile } from '../services/imageStorageService.js'

function createAuthToken(user) {
  return jwt.sign({ userId: user.id, username: user.username, role: 'user' }, env.jwtSecret, { expiresIn: '30d' })
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.email_verified),
    isBanned: Boolean(user.is_banned),
  }
}

function ensureProfile(userId) {
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId)
  if (profile) return

  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO user_profiles (
      user_id,
      personal_token_encrypted,
      personal_image_api_base_url,
      avatar_url,
      avatar_storage_path,
      avatar_updated_at,
      created_at,
      updated_at
    )
    VALUES (?, '', '', '', '', '', ?, ?)
  `).run(userId, timestamp, timestamp)
}

function readProfile(userId) {
  ensureProfile(userId)
  return db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId)
}

function getGenerationCount(userId) {
  return db.prepare('SELECT COUNT(*) as total FROM generated_images WHERE user_id = ?').get(userId).total
}

function sanitizeProfile(profile, user) {
  return {
    username: user.username,
    personalToken: decrypt(profile?.personal_token_encrypted || ''),
    personalImageApiBaseUrl: profile?.personal_image_api_base_url || '',
    hasPersonalToken: Boolean(decrypt(profile?.personal_token_encrypted || '')),
    avatarUrl: normalizePublicImageUrl(profile?.avatar_url || '', profile?.avatar_storage_path || ''),
    avatarUpdatedAt: profile?.avatar_updated_at || '',
    generationCount: getGenerationCount(user.id),
    updatedAt: profile?.updated_at || '',
  }
}

function readRegisterPolicy() {
  const settings = db.prepare('SELECT allow_register, require_invite_code FROM admin_settings WHERE id = 1').get()
  return {
    allowRegister: settings?.allow_register !== 0,
    requireInviteCode: settings?.require_invite_code === 1,
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function removeUploadedTempFile(file) {
  if (!file?.path) return
  try {
    fs.unlinkSync(file.path)
  } catch {}
}

function createAvatarPreviewRecord(userId, stored) {
  const timestamp = nowIso()
  const expiresAt = addDays(new Date(), 1).toISOString()
  const previewId = uuidv4()

  db.prepare('DELETE FROM avatar_previews WHERE user_id = ?').run(userId)
  db.prepare(`
    INSERT INTO avatar_previews (id, user_id, image_url, storage_path, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(previewId, userId, stored.publicUrl, stored.absolutePath, timestamp, expiresAt)

  return {
    previewId,
    imageUrl: stored.publicUrl,
    expiresAt,
  }
}

function readAvatarPreview(userId, previewId) {
  return db.prepare('SELECT * FROM avatar_previews WHERE id = ? AND user_id = ?').get(previewId, userId)
}

function saveAvatarFromPreview(userId, previewId) {
  const preview = readAvatarPreview(userId, previewId)
  if (!preview) {
    const error = new Error('头像预览不存在或已失效')
    error.status = 404
    throw error
  }

  const profile = readProfile(userId)
  if (profile?.avatar_storage_path) {
    removeStoredImage(profile.avatar_storage_path)
  }

  const avatarUrl = normalizePublicImageUrl(preview.image_url, preview.storage_path)

  db.prepare(`
    UPDATE user_profiles
    SET avatar_url = ?, avatar_storage_path = ?, avatar_updated_at = ?, updated_at = ?
    WHERE user_id = ?
  `).run(avatarUrl, preview.storage_path, nowIso(), nowIso(), userId)

  db.prepare('DELETE FROM avatar_previews WHERE id = ?').run(previewId)

  return db.prepare('SELECT avatar_url as avatarUrl, avatar_storage_path as avatarStoragePath, avatar_updated_at as avatarUpdatedAt FROM user_profiles WHERE user_id = ?').get(userId)
}

function resolveAvatarGenerationConfig(userId) {
  const settings = db.prepare('SELECT shared_token_encrypted, image_api_base_url FROM admin_settings WHERE id = 1').get()
  const profile = readProfile(userId)
  const personalToken = decrypt(profile?.personal_token_encrypted || '')
  const personalBaseUrl = profile?.personal_image_api_base_url || ''
  const sharedToken = decrypt(settings?.shared_token_encrypted || '')
  const baseUrl = personalBaseUrl || settings?.image_api_base_url || ''
  const accessToken = personalToken || sharedToken

  if (!accessToken) {
    const error = new Error('请先配置个人身份令牌，或等待管理员配置共享身份令牌')
    error.status = 400
    throw error
  }

  if (!baseUrl) {
    const error = new Error('请先配置图片 API 地址')
    error.status = 400
    throw error
  }

  return { accessToken, baseUrl }
}

export function getRegisterPolicy(req, res) {
  res.json(readRegisterPolicy())
}

export async function sendRegisterEmailCode(req, res) {
  try {
    const policy = readRegisterPolicy()
    if (!policy.allowRegister) {
      return res.status(403).json({ message: '当前暂停新用户注册' })
    }

    await sendEmailVerificationCode({
      receiveEmail: req.body?.receiveEmail,
      bizType: 'register',
    })

    res.json({ message: '验证码发送成功，请查收邮件' })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || '验证码发送失败，请稍后重试' })
  }
}

export async function sendPasswordResetEmailCode(req, res) {
  try {
    const email = normalizeEmail(req.body?.receiveEmail)
    if (!email) {
      return res.status(400).json({ message: '邮箱不能为空' })
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (!user) {
      return res.status(404).json({ message: '这个邮箱还没有注册账号' })
    }

    await sendEmailVerificationCode({
      receiveEmail: email,
      bizType: 'findPwd',
    })

    res.json({ message: '验证码发送成功，请查收邮件' })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || '验证码发送失败，请稍后重试' })
  }
}

export function register(req, res) {
  try {
    const policy = readRegisterPolicy()
    if (!policy.allowRegister) {
      return res.status(403).json({ message: '当前暂停新用户注册' })
    }

    const username = String(req.body?.username || '').trim()
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')
    const emailCode = String(req.body?.emailCode || '').trim()
    const inviteCode = String(req.body?.inviteCode || '').trim()

    if (username.length < 3) {
      return res.status(400).json({ message: '用户名至少需要 3 个字符' })
    }

    if (!email) {
      return res.status(400).json({ message: '邮箱不能为空' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要 6 个字符' })
    }

    if (!emailCode) {
      return res.status(400).json({ message: '验证码不能为空' })
    }

    if (policy.requireInviteCode && !inviteCode) {
      return res.status(400).json({ message: '当前注册需要邀请码' })
    }

    const usernameExisting = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (usernameExisting) {
      return res.status(409).json({ message: '这个用户名已经被使用了' })
    }

    const emailExisting = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (emailExisting) {
      return res.status(409).json({ message: '这个邮箱已经注册过账号' })
    }

    verifyEmailVerificationCode({ receiveEmail: email, inputCode: emailCode, bizType: 'register' })

    const timestamp = nowIso()
    const user = {
      id: uuidv4(),
      username,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
    }

    const runRegister = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, username, email, email_verified, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?)
      `).run(user.id, user.username, user.email, user.passwordHash, timestamp, timestamp)

      if (policy.requireInviteCode) {
        consumeInviteCode(inviteCode, user.id, user.email)
      }

      ensureProfile(user.id)
    })

    runRegister()

    res.status(201).json({
      token: createAuthToken(user),
      user: sanitizeUser({ ...user, email_verified: 1 }),
    })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || '注册失败，请稍后重试' })
  }
}

export function login(req, res) {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: '用户名或密码错误' })
  }

  if (user.is_banned) {
    return res.status(403).json({ message: '该账号已被封禁' })
  }

  ensureProfile(user.id)

  res.json({
    token: createAuthToken(user),
    user: sanitizeUser(user),
  })
}

export function resetPasswordWithEmailCode(req, res) {
  try {
    const email = normalizeEmail(req.body?.email)
    const emailCode = String(req.body?.emailCode || '').trim()
    const password = String(req.body?.password || '')

    if (!email) {
      return res.status(400).json({ message: '邮箱不能为空' })
    }

    if (!emailCode) {
      return res.status(400).json({ message: '验证码不能为空' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要 6 个字符' })
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (!user) {
      return res.status(404).json({ message: '这个邮箱还没有注册账号' })
    }

    verifyEmailVerificationCode({ receiveEmail: email, inputCode: emailCode, bizType: 'findPwd' })

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(bcrypt.hashSync(password, 10), nowIso(), user.id)

    res.json({ message: '密码已重置，请重新登录' })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || '密码重置失败，请稍后重试' })
  }
}

export function getMe(req, res) {
  res.json({ user: sanitizeUser(req.user) })
}

export function getProfile(req, res) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const profile = readProfile(req.user.id)
  res.json(sanitizeProfile(profile, user))
}

export async function testProfile(req, res) {
  const profile = readProfile(req.user.id)
  const personalToken = String(req.body?.personalToken || '').trim() || decrypt(profile?.personal_token_encrypted || '')
  const personalImageApiBaseUrl = String(req.body?.personalImageApiBaseUrl || '').trim() || profile?.personal_image_api_base_url || ''

  if (!personalToken) {
    return res.status(400).json({ message: '请先输入个人身份令牌' })
  }

  const ok = await testImageApi({ accessToken: personalToken, baseUrl: personalImageApiBaseUrl })
  res.json({ ok })
}

export function saveProfile(req, res) {
  const profile = readProfile(req.user.id)
  const nextToken = String(req.body?.personalToken || '').trim()
  const nextBaseUrl = String(req.body?.personalImageApiBaseUrl || '').trim()
  const savedToken = nextToken || decrypt(profile?.personal_token_encrypted || '')

  db.prepare(`
    UPDATE user_profiles
    SET personal_token_encrypted = ?, personal_image_api_base_url = ?, updated_at = ?
    WHERE user_id = ?
  `).run(encrypt(savedToken), nextBaseUrl, nowIso(), req.user.id)

  res.json({ message: '个人配置已保存' })
}

export function uploadAvatarPreview(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请先上传头像图片' })
    }

    const stored = saveUploadedFile(req.file, { subdir: 'avatars' })
    const preview = createAvatarPreviewRecord(req.user.id, stored)
    res.json(preview)
  } finally {
    removeUploadedTempFile(req.file)
  }
}

export async function generateAvatarPreview(req, res) {
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id)
  const style = String(req.body?.style || '').trim()
  const { accessToken, baseUrl } = resolveAvatarGenerationConfig(req.user.id)
  const prompt = `请生成一个适合作为网站用户头像的正方形头像插画，主体简洁清晰，构图聚焦单人头像，背景干净，风格友好精致，适合作为社区头像。用户名：${user?.username || '用户'}。附加要求：${style || '柔和、辨识度高、明亮。'}`
  const upstream = await generateImage({ prompt, agent: 'image', accessToken, baseUrl })
  const stored = await saveImageFromUrl(upstream.imageUrl, { subdir: 'avatars' })
  res.json(createAvatarPreviewRecord(req.user.id, stored))
}

export function confirmAvatar(req, res) {
  const previewId = String(req.body?.previewId || '').trim()
  if (!previewId) {
    return res.status(400).json({ message: '头像预览不存在' })
  }

  const saved = saveAvatarFromPreview(req.user.id, previewId)
  res.json({
    message: '头像已保存',
    avatarUrl: normalizePublicImageUrl(saved.avatarUrl, saved.avatarStoragePath),
    avatarUpdatedAt: saved.avatarUpdatedAt,
  })
}
