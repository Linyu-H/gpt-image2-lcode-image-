import { Router } from 'express'
import {
  addFeaturedPrompt,
  cleanExpired,
  createInviteCodes,
  getConfigStatus,
  getFeaturedPrompts,
  getInviteCodes,
  getStatistics,
  getUsers,
  login,
  removeFeaturedPrompt,
  resetUserPassword,
  saveCleanupCron,
  saveDailyLimit,
  saveEmailServiceConfig,
  saveRegisterPolicy,
  saveUpstreamConfig,
  testUpstreamConfig,
  testUserKey,
  updateUserBanStatus,
} from '../controllers/adminController.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.post('/user-token/test', testUserKey)
router.get('/config/status', requireAdmin, getConfigStatus)
router.post('/config/upstream', requireAdmin, saveUpstreamConfig)
router.post('/config/upstream/test', requireAdmin, testUpstreamConfig)
router.post('/config/register-policy', requireAdmin, saveRegisterPolicy)
router.post('/config/email-service', requireAdmin, saveEmailServiceConfig)
router.post('/config/limit', requireAdmin, saveDailyLimit)
router.post('/config/cleanup-cron', requireAdmin, saveCleanupCron)
router.post('/clean/expired', requireAdmin, cleanExpired)
router.get('/featured-prompts', requireAdmin, getFeaturedPrompts)
router.post('/featured-prompts', requireAdmin, addFeaturedPrompt)
router.delete('/featured-prompts/:id', requireAdmin, removeFeaturedPrompt)
router.get('/invite-codes', requireAdmin, getInviteCodes)
router.post('/invite-codes/generate', requireAdmin, createInviteCodes)
router.get('/users', requireAdmin, getUsers)
router.post('/users/:id/ban', requireAdmin, updateUserBanStatus)
router.post('/users/:id/reset-password', requireAdmin, resetUserPassword)
router.get('/statistics', requireAdmin, getStatistics)

export default router
