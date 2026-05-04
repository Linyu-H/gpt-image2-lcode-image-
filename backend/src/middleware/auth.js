import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { db } from '../db/index.js'

function extractBearerToken(req) {
  const authHeader = req.headers.authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}

export function requireAdmin(req, res, next) {
  const token = extractBearerToken(req)

  if (!token) {
    return res.status(401).json({ message: '未登录或登录已失效' })
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: '无权访问管理员接口' })
    }

    const settings = db.prepare('SELECT force_admin_password_change FROM admin_settings WHERE id = 1').get()
    const allowDuringPasswordReset = ['/change-password', '/config/status', '/announcement'].includes(req.path)
    if (settings?.force_admin_password_change === 1 && !allowDuringPasswordReset) {
      return res.status(403).json({ message: '请先修改管理员密码', mustChangePassword: true })
    }

    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ message: '登录状态无效' })
  }
}

export function optionalUser(req, res, next) {
  const token = extractBearerToken(req)
  if (!token) {
    req.user = null
    return next()
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (payload.role !== 'user' || !payload.userId) {
      req.user = null
      return next()
    }

    const user = db.prepare('SELECT id, username, email, email_verified, is_banned FROM users WHERE id = ?').get(payload.userId)
    req.user = user || null
    next()
  } catch {
    req.user = null
    next()
  }
}

export function requireUser(req, res, next) {
  optionalUser(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: '请先登录你的账号' })
    }
    if (req.user.is_banned) {
      return res.status(403).json({ message: '该账号已被封禁' })
    }
    next()
  })
}
