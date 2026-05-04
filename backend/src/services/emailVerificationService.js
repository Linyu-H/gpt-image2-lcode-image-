import nodemailer from 'nodemailer'
import { db } from '../db/index.js'
import { getEmailConfig } from './emailConfigService.js'
import { nowIso, isExpired } from '../utils/time.js'

const allowedBizTypes = new Set(['register', 'findPwd', 'bindEmail'])

function normalizeEmail(receiveEmail) {
  return String(receiveEmail || '').trim().toLowerCase()
}

function ensureBizType(bizType) {
  const normalized = String(bizType || '').trim()
  if (!allowedBizTypes.has(normalized)) {
    const error = new Error('不支持的验证码业务类型')
    error.status = 400
    throw error
  }
  return normalized
}

function ensureEmail(receiveEmail) {
  const email = normalizeEmail(receiveEmail)
  if (!email) {
    const error = new Error('邮箱不能为空')
    error.status = 400
    throw error
  }
  return email
}

function createVerificationCode() {
  return `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0')
}

function buildBizLabel(bizType) {
  if (bizType === 'register') return '注册'
  if (bizType === 'findPwd') return '找回密码'
  return '绑定邮箱'
}

function buildEmailText(code, bizType) {
  return `【Lcode-image 公益AI绘图平台】

您好！
您正在进行 ${buildBizLabel(bizType)} 安全验证

本次专属验证码：${code}

⏱ 有效时长：5分钟
🔒 请切勿将验证码泄露给他人
❗ 如非本人操作，请直接忽略本邮件

—— 免费公益AI绘图 · Lcode-image 团队`
}

function readVerificationRecord(email, bizType) {
  return db.prepare(`
    SELECT email, biz_type as bizType, code, expires_at as expiresAt, sent_at as sentAt
    FROM email_verification_codes
    WHERE email = ? AND biz_type = ?
  `).get(email, bizType)
}

function clearVerificationCode(email, bizType) {
  db.prepare('DELETE FROM email_verification_codes WHERE email = ? AND biz_type = ?').run(email, bizType)
}

export async function sendEmailVerificationCode({ receiveEmail, bizType }) {
  const email = ensureEmail(receiveEmail)
  const normalizedBizType = ensureBizType(bizType)
  const existing = readVerificationRecord(email, normalizedBizType)

  if (existing?.sentAt && Date.now() - new Date(existing.sentAt).getTime() < 60000) {
    const error = new Error('请求过于频繁，请1分钟后再试')
    error.status = 429
    throw error
  }

  const emailConfig = getEmailConfig()
  if (!emailConfig.configured) {
    const error = new Error('后台邮箱服务未配置，请联系管理员')
    error.status = 501
    throw error
  }

  const code = createVerificationCode()
  const sentAt = nowIso()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: emailConfig.authUser,
      pass: emailConfig.authPass,
    },
  })

  try {
    await transporter.sendMail({
      from: `Lcode-image <${emailConfig.sender}>`,
      to: email,
      subject: 'Lcode-image 邮箱验证码',
      text: buildEmailText(code, normalizedBizType),
    })
  } catch {
    const error = new Error('验证码发送失败，请稍后重试')
    error.status = 500
    throw error
  }

  db.prepare(`
    INSERT INTO email_verification_codes (email, biz_type, code, expires_at, sent_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email, biz_type) DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at,
      sent_at = excluded.sent_at
  `).run(email, normalizedBizType, code, expiresAt, sentAt)
}

export function verifyEmailVerificationCode({ receiveEmail, inputCode, bizType }) {
  const email = ensureEmail(receiveEmail)
  const normalizedBizType = ensureBizType(bizType)
  const code = String(inputCode || '').trim()
  const record = readVerificationRecord(email, normalizedBizType)

  if (!record) {
    const error = new Error('验证码已失效，请重新获取')
    error.status = 401
    throw error
  }

  if (isExpired(record.expiresAt)) {
    clearVerificationCode(email, normalizedBizType)
    const error = new Error('验证码已失效，请重新获取')
    error.status = 401
    throw error
  }

  if (record.code !== code) {
    const error = new Error('验证码错误，请重新输入')
    error.status = 400
    throw error
  }

  clearVerificationCode(email, normalizedBizType)
}
