CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  admin_password_hash TEXT NOT NULL DEFAULT '',
  shared_token_encrypted TEXT DEFAULT '',
  image_api_base_url TEXT DEFAULT '',
  site_base_url TEXT DEFAULT '',
  email_auth_user TEXT DEFAULT '',
  email_auth_pass_encrypted TEXT DEFAULT '',
  daily_limit INTEGER NOT NULL DEFAULT 20,
  cleanup_cron TEXT NOT NULL DEFAULT '0 * * * *',
  allow_register INTEGER NOT NULL DEFAULT 1,
  require_invite_code INTEGER NOT NULL DEFAULT 0,
  force_admin_password_change INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 1,
  password_hash TEXT NOT NULL,
  is_banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  personal_token_encrypted TEXT DEFAULT '',
  personal_image_api_base_url TEXT DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  avatar_storage_path TEXT NOT NULL DEFAULT '',
  avatar_updated_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generated_images (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  prompt TEXT NOT NULL,
  agent TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  source_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL,
  request_ip TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  request_ip TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS featured_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS featured_examples (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  prompt_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES featured_prompts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS site_announcements (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS avatar_previews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  email TEXT NOT NULL,
  biz_type TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  PRIMARY KEY (email, biz_type)
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  used_at TEXT DEFAULT NULL,
  used_by_user_id TEXT DEFAULT NULL,
  used_by_email TEXT DEFAULT NULL,
  FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
