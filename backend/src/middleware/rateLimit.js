import { db } from '../db/index.js'
import { nowIso } from '../utils/time.js'

function getDayPrefix() {
  return new Date().toISOString().slice(0, 10)
}

export function rateLimitDaily(req, res, next) {
  const settings = db.prepare('SELECT daily_limit FROM admin_settings WHERE id = 1').get()
  const authenticatedLimit = settings?.daily_limit || 20
  const guestLimit = 5
  const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const dayStart = `${getDayPrefix()}T00:00:00.000Z`
  const isGuest = !req.user

  const count = db.prepare(`
    SELECT COUNT(*) as total
    FROM generation_logs
    WHERE request_ip = ?
      AND created_at >= ?
      AND status = 'success'
      AND user_id IS ?
  `).get(requestIp, dayStart, isGuest ? null : req.user.id)

  const currentLimit = isGuest ? guestLimit : authenticatedLimit
  if (count.total >= currentLimit) {
    db.prepare('INSERT INTO generation_logs (user_id, request_ip, prompt, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(req.user?.id || null, requestIp, req.body?.prompt || '', 'rate_limited', nowIso())
    return res.status(429).json({
      message: isGuest ? '未登录用户今日体验次数已用完，请登录后继续生成。' : '今日生成次数已用完，请明天再试。',
    })
  }

  next()
}
