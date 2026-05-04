import crypto from 'crypto'
import { db } from '../db/index.js'
import { nowIso } from '../utils/time.js'

const inviteAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function createInviteCodeValue(length = 8) {
  return Array.from({ length }, () => inviteAlphabet[crypto.randomInt(0, inviteAlphabet.length)]).join('')
}

export function listInviteCodes() {
  return db.prepare(`
    SELECT
      id,
      code,
      created_at as createdAt,
      used_at as usedAt,
      used_by_user_id as usedByUserId,
      used_by_email as usedByEmail
    FROM invite_codes
    ORDER BY id DESC
  `).all().map((item) => ({
    ...item,
    used: Boolean(item.usedAt),
  }))
}

export function generateInviteCodes(count) {
  const total = Number(count)
  if (!Number.isInteger(total) || total < 1 || total > 200) {
    const error = new Error('邀请码数量必须是 1 到 200 之间的整数')
    error.status = 400
    throw error
  }

  const insert = db.prepare('INSERT INTO invite_codes (code, created_at) VALUES (?, ?)')
  const created = []

  const runInsert = db.transaction(() => {
    while (created.length < total) {
      const code = createInviteCodeValue()
      try {
        insert.run(code, nowIso())
        created.push(code)
      } catch (error) {
        if (String(error.message || '').includes('UNIQUE')) {
          continue
        }
        throw error
      }
    }
  })

  runInsert()
  return created
}

export function consumeInviteCode(code, userId, email) {
  const normalizedCode = String(code || '').trim().toUpperCase()
  const record = db.prepare(`
    SELECT id, code, used_at as usedAt
    FROM invite_codes
    WHERE code = ?
  `).get(normalizedCode)

  if (!record) {
    const error = new Error('邀请码不存在，请检查后重新输入')
    error.status = 400
    throw error
  }

  if (record.usedAt) {
    const error = new Error('邀请码已被使用，请更换后重试')
    error.status = 400
    throw error
  }

  db.prepare(`
    UPDATE invite_codes
    SET used_at = ?, used_by_user_id = ?, used_by_email = ?
    WHERE id = ?
  `).run(nowIso(), userId, email, record.id)
}
