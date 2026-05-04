import { Router } from 'express'
import {
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
} from '../controllers/authController.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()

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

export default router
