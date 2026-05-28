import { db } from '../db/index.js'
import { encrypt, decrypt } from './encryptionService.js'

export function getLinuxdoConfig() {
  const row = db.prepare(`
    SELECT client_id as clientId, client_secret as clientSecret, redirect_url as redirectUrl
    FROM linuxdo_connect
    LIMIT 1
  `).get()

  if (!row?.clientId) {
    return { clientId: '', clientSecret: '', redirectUrl: '', hasConfig: false }
  }

  return {
    clientId: row.clientId,
    clientSecret: decrypt(row.clientSecret || ''),
    redirectUrl: row.redirectUrl,
    hasConfig: true,
  }
}

export function saveLinuxdoConfig({ clientId, clientSecret, redirectUrl }) {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM linuxdo_connect').run()
    db.prepare(`
      INSERT INTO linuxdo_connect (client_id, client_secret, redirect_url)
      VALUES (?, ?, ?)
    `).run(clientId, encrypt(clientSecret), redirectUrl)
  })
  tx()
}
