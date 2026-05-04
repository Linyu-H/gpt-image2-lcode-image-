import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { nowIso } from '../utils/time.js'

fs.mkdirSync(env.uploadsDir, { recursive: true })

const db = new Database(env.dbPath)
const schema = fs.readFileSync(path.join(env.backendDir, 'src', 'db', 'schema.sql'), 'utf8')
db.exec(schema)

function getColumns(tableName) {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
  if (!table) {
    return []
  }
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name)
}

const adminColumns = getColumns('admin_settings')
if (!adminColumns.includes('shared_tokens_encrypted')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN shared_tokens_encrypted TEXT DEFAULT ""').run()
  if (adminColumns.includes('api_key_encrypted')) {
    db.prepare('UPDATE admin_settings SET shared_tokens_encrypted = api_key_encrypted WHERE shared_tokens_encrypted = "" AND api_key_encrypted IS NOT NULL').run()
  }
}

const adminColumnsAfterSharedTokens = getColumns('admin_settings')
if (!adminColumnsAfterSharedTokens.includes('shared_token_encrypted')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN shared_token_encrypted TEXT DEFAULT ""').run()
  if (adminColumnsAfterSharedTokens.includes('shared_tokens_encrypted')) {
    db.prepare('UPDATE admin_settings SET shared_token_encrypted = shared_tokens_encrypted WHERE shared_token_encrypted = "" AND shared_tokens_encrypted IS NOT NULL').run()
  }
}

const adminColumnsFinal = getColumns('admin_settings')
if (!adminColumnsFinal.includes('site_base_url')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN site_base_url TEXT DEFAULT ""').run()
}

if (!adminColumnsFinal.includes('email_auth_user')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN email_auth_user TEXT DEFAULT ""').run()
}

if (!adminColumnsFinal.includes('email_auth_pass_encrypted')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN email_auth_pass_encrypted TEXT DEFAULT ""').run()
}

if (!adminColumnsFinal.includes('admin_password_hash')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN admin_password_hash TEXT NOT NULL DEFAULT ""').run()
}

if (!adminColumnsFinal.includes('allow_register')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN allow_register INTEGER NOT NULL DEFAULT 1').run()
}

if (!adminColumnsFinal.includes('require_invite_code')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN require_invite_code INTEGER NOT NULL DEFAULT 0').run()
}

if (!adminColumnsFinal.includes('force_admin_password_change')) {
  db.prepare('ALTER TABLE admin_settings ADD COLUMN force_admin_password_change INTEGER NOT NULL DEFAULT 1').run()
}

const userColumns = getColumns('users')
if (!userColumns.includes('is_banned')) {
  db.prepare('ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0').run()
}
if (!userColumns.includes('email')) {
  db.prepare('ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ""').run()
  db.prepare(`
    UPDATE users
    SET email = CASE
      WHEN trim(email) = '' THEN lower(username) || '@local.lcode-image'
      ELSE email
    END
  `).run()
}
if (!userColumns.includes('email_verified')) {
  db.prepare('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1').run()
}
if (!userColumns.includes('created_at')) {
  db.prepare('ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT ""').run()
}
if (!userColumns.includes('updated_at')) {
  db.prepare('ALTER TABLE users ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run()
}

const profileColumns = getColumns('user_profiles')
if (!profileColumns.includes('personal_token_encrypted')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN personal_token_encrypted TEXT DEFAULT ""').run()
}
if (!profileColumns.includes('personal_image_api_base_url')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN personal_image_api_base_url TEXT DEFAULT ""').run()
}
if (!profileColumns.includes('avatar_url')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ""').run()
}
if (!profileColumns.includes('avatar_storage_path')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN avatar_storage_path TEXT NOT NULL DEFAULT ""').run()
}
if (!profileColumns.includes('avatar_updated_at')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN avatar_updated_at TEXT NOT NULL DEFAULT ""').run()
}
if (!profileColumns.includes('created_at')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN created_at TEXT NOT NULL DEFAULT ""').run()
}
if (!profileColumns.includes('updated_at')) {
  db.prepare('ALTER TABLE user_profiles ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run()
}

const generatedColumns = getColumns('generated_images')
if (!generatedColumns.includes('user_id')) {
  db.prepare('ALTER TABLE generated_images ADD COLUMN user_id TEXT').run()
}

const logColumns = getColumns('generation_logs')
if (!logColumns.length) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      request_ip TEXT NOT NULL,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
} else if (!logColumns.includes('user_id')) {
  db.prepare('ALTER TABLE generation_logs ADD COLUMN user_id TEXT').run()
}

const featuredPromptColumns = getColumns('featured_prompts')
if (!featuredPromptColumns.includes('prompt')) {
  db.prepare('ALTER TABLE featured_prompts ADD COLUMN prompt TEXT NOT NULL DEFAULT ""').run()
}
if (!featuredPromptColumns.includes('sort_order')) {
  db.prepare('ALTER TABLE featured_prompts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0').run()
}
if (!featuredPromptColumns.includes('created_at')) {
  db.prepare('ALTER TABLE featured_prompts ADD COLUMN created_at TEXT NOT NULL DEFAULT ""').run()
}
if (!featuredPromptColumns.includes('updated_at')) {
  db.prepare('ALTER TABLE featured_prompts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run()
}

const featuredColumns = getColumns('featured_examples')
if (!featuredColumns.includes('prompt_id')) {
  db.prepare('ALTER TABLE featured_examples ADD COLUMN prompt_id INTEGER NOT NULL DEFAULT 1').run()
}
if (featuredColumns.includes('prompt_index')) {
  db.prepare(`
    UPDATE featured_examples
    SET prompt_id = CASE
      WHEN prompt_id = 1 AND prompt_index IS NOT NULL THEN prompt_index + 1
      ELSE prompt_id
    END
    WHERE prompt_index IS NOT NULL
  `).run()
}
if (!featuredColumns.includes('prompt')) {
  db.prepare('ALTER TABLE featured_examples ADD COLUMN prompt TEXT NOT NULL DEFAULT ""').run()
}
if (!featuredColumns.includes('image_url')) {
  db.prepare('ALTER TABLE featured_examples ADD COLUMN image_url TEXT NOT NULL DEFAULT ""').run()
}
if (!featuredColumns.includes('storage_path')) {
  db.prepare('ALTER TABLE featured_examples ADD COLUMN storage_path TEXT NOT NULL DEFAULT ""').run()
}
if (!featuredColumns.includes('created_at')) {
  db.prepare('ALTER TABLE featured_examples ADD COLUMN created_at TEXT NOT NULL DEFAULT ""').run()
}
if (!featuredColumns.includes('updated_at')) {
  db.prepare('ALTER TABLE featured_examples ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run()
}

const announcementColumns = getColumns('site_announcements')
if (!announcementColumns.includes('title')) {
  db.prepare('ALTER TABLE site_announcements ADD COLUMN title TEXT NOT NULL DEFAULT ""').run()
}
if (!announcementColumns.includes('content')) {
  db.prepare('ALTER TABLE site_announcements ADD COLUMN content TEXT NOT NULL DEFAULT ""').run()
}
if (!announcementColumns.includes('is_enabled')) {
  db.prepare('ALTER TABLE site_announcements ADD COLUMN is_enabled INTEGER NOT NULL DEFAULT 0').run()
}
if (!announcementColumns.includes('updated_at')) {
  db.prepare('ALTER TABLE site_announcements ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run()
}

const avatarPreviewColumns = getColumns('avatar_previews')
if (!avatarPreviewColumns.length) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS avatar_previews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
}

const communityPostColumns = getColumns('community_posts')
if (!communityPostColumns.length) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (image_id) REFERENCES generated_images(id) ON DELETE CASCADE
    )
  `)
}

const defaultFeaturedPrompts = [
  '薄雾清晨中的绿色玻璃温室，柔和侧光，安静、通透、治愈感。',
  '雨后石板路旁的小书店橱窗，暖黄色灯光，电影感构图，细腻反射。',
  '海边黄昏时分的白色露台，一杯热茶，一张木椅，风很轻，极简宁静。',
  '春日花园里的橘猫趴在长椅上打盹，空气湿润，画面柔焦，温柔插画感。',
  '山间木屋的夜晚窗景，屋内暖光映出植物剪影，安静、克制、富有呼吸感。',
]

const promptCount = db.prepare('SELECT COUNT(*) as total FROM featured_prompts').get().total
if (!promptCount) {
  const insertPrompt = db.prepare(`
    INSERT INTO featured_prompts (prompt, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `)
  const insertMany = db.transaction((prompts) => {
    prompts.forEach((prompt, index) => {
      const timestamp = nowIso()
      insertPrompt.run(prompt, index + 1, timestamp, timestamp)
    })
  })
  insertMany(defaultFeaturedPrompts)
}

const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get()
if (!settings) {
  db.prepare(`
    INSERT INTO admin_settings (
      id,
      admin_password_hash,
      shared_token_encrypted,
      image_api_base_url,
      site_base_url,
      email_auth_user,
      email_auth_pass_encrypted,
      daily_limit,
      cleanup_cron,
      allow_register,
      require_invite_code,
      force_admin_password_change,
      updated_at
    )
    VALUES (1, ?, '', '', '', '', '', ?, ?, 1, 0, 1, ?)
  `).run(bcrypt.hashSync(env.adminPassword, 10), env.defaultDailyLimit, env.defaultCleanupCron, nowIso())
} else {
  if (!settings.updated_at) {
    db.prepare('UPDATE admin_settings SET updated_at = ? WHERE id = 1').run(nowIso())
  }

  if (!settings.shared_token_encrypted && settings.shared_tokens_encrypted) {
    db.prepare('UPDATE admin_settings SET shared_token_encrypted = ? WHERE id = 1').run(settings.shared_tokens_encrypted)
  }

  if (!settings.admin_password_hash) {
    db.prepare('UPDATE admin_settings SET admin_password_hash = ? WHERE id = 1').run(bcrypt.hashSync(env.adminPassword, 10))
  }
}

const announcement = db.prepare('SELECT * FROM site_announcements WHERE id = 1').get()
if (!announcement) {
  db.prepare(`
    INSERT INTO site_announcements (id, title, content, is_enabled, updated_at)
    VALUES (1, '', '', 0, ?)
  `).run(nowIso())
}

export { db }
