import { db } from '../db/index.js'
import { encrypt, decrypt } from './encryptionService.js'
import { nowIso } from '../utils/time.js'

function readSettings() {
  return db.prepare('SELECT * FROM admin_settings WHERE id = 1').get()
}

export function getEmailConfig() {
  const settings = readSettings()
  const authUser = String(settings?.email_auth_user || '').trim()
  const authPass = decrypt(settings?.email_auth_pass_encrypted || '')
  return {
    authUser,
    authPass,
    sender: authUser,
    configured: Boolean(authUser && authPass),
  }
}

export function saveEmailConfig({ authUser, authPass }) {
  const normalizedUser = String(authUser || '').trim()
  const normalizedPass = String(authPass || '').trim()
  const current = readSettings()
  const encryptedPass = normalizedPass ? encrypt(normalizedPass) : current?.email_auth_pass_encrypted || ''

  db.prepare(`
    UPDATE admin_settings
    SET email_auth_user = ?, email_auth_pass_encrypted = ?, updated_at = ?
    WHERE id = 1
  `).run(normalizedUser, encryptedPass, nowIso())

  return getEmailConfig()
}
