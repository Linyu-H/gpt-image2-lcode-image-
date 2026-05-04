import { Router } from 'express'
import multer from 'multer'
import os from 'os'
import path from 'path'
import {
  confirmAvatar,
  generateAvatarPreview,
  getMe,
  getProfile,
  getRegisterPolicy,
  login,
  register,
  resetPasswordWithEmailCode,
  saveProfile,
  sendPasswordResetEmailCode,
  sendRegisterEmailCode,
  testProfile,
  uploadAvatarPreview,
} from '../controllers/authController.js'
import { requireUser } from '../middleware/auth.js'
import { env } from '../config/env.js'

const router = Router()
const upload = multer({
  dest: path.join(os.tmpdir(), 'lcode-image-avatar-uploads'),
  limits: {
    fileSize: env.uploadMaxFileSize,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype?.startsWith('image/')) {
      callback(new Error('仅支持上传图片文件'))
      return
    }
    callback(null, true)
  },
})

router.get('/register-policy', getRegisterPolicy)
router.post('/email-code/send', sendRegisterEmailCode)
router.post('/password-reset/email-code/send', sendPasswordResetEmailCode)
router.post('/password-reset/confirm', resetPasswordWithEmailCode)
router.post('/register', register)
router.post('/login', login)
router.get('/me', requireUser, getMe)
router.get('/profile', requireUser, getProfile)
router.post('/profile', requireUser, saveProfile)
router.post('/profile/test', requireUser, testProfile)
router.post('/profile/avatar/upload-preview', requireUser, upload.single('file'), uploadAvatarPreview)
router.post('/profile/avatar/generate-preview', requireUser, generateAvatarPreview)
router.post('/profile/avatar/confirm', requireUser, confirmAvatar)

export default router
