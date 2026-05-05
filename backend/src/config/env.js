import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendDir = path.resolve(__dirname, '../..')
const rootDir = path.resolve(backendDir, '..')
const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const corsOrigins = (process.env.CORS_ORIGINS || `${frontendBaseUrl},http://localhost:5173,http://127.0.0.1:5173,http://[::1]:5173`)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

export const env = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'lcode',
  encryptionSecret: (process.env.ENCRYPTION_SECRET || 'change-this-encryption-secret-32').padEnd(32, '0').slice(0, 32),
  chatgptSessionUrl: process.env.CHATGPT_SESSION_URL || 'https://chatgpt.com/api/auth/session',
  image2ApiBaseUrl: process.env.IMAGE2_API_BASE_URL || '',
  image2ApiGeneratePath: process.env.IMAGE2_API_GENERATE_PATH || '/v1/images/generations',
  image2ApiEditPath: process.env.IMAGE2_API_EDIT_PATH || '/v1/images/edits',
  image2ApiTestPath: process.env.IMAGE2_API_TEST_PATH || '/health',
  image2ApiModel: process.env.IMAGE2_API_MODEL || 'gpt-image-2',
  image2ApiSize: process.env.IMAGE2_API_SIZE || '1024x1024',
  image2ApiQuality: process.env.IMAGE2_API_QUALITY || 'hd',
  image2ApiCount: Number(process.env.IMAGE2_API_COUNT || 1),
  image2ApiStyle: process.env.IMAGE2_API_STYLE || '',
  image2ApiTimeout: Number(process.env.IMAGE2_API_TIMEOUT || 300000),
  uploadMaxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE || 10 * 1024 * 1024),
  defaultDailyLimit: Number(process.env.DEFAULT_DAILY_LIMIT || 20),
  defaultCleanupCron: process.env.DEFAULT_CLEANUP_CRON || '0 * * * *',
  emailSmtpHost: process.env.EMAIL_SMTP_HOST || 'smtp.qq.com',
  emailSmtpPort: Number(process.env.EMAIL_SMTP_PORT || 465),
  emailSmtpSecure: process.env.EMAIL_SMTP_SECURE !== 'false',
  emailSender: process.env.EMAIL_SENDER || '',
  emailAuthUser: process.env.EMAIL_AUTH_USER || '',
  emailAuthPass: process.env.EMAIL_AUTH_PASS || '',
  rootDir,
  backendDir,
  frontendBaseUrl,
  corsOrigins,
  uploadsDir: path.join(backendDir, 'uploads', 'images'),
  dbPath: path.join(backendDir, 'data.sqlite'),
}
