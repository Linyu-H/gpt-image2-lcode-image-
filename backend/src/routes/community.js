import { Router } from 'express'
import { createPost, getCommunityFeed, getCommunityPostDetail, removeOwnPost } from '../controllers/communityController.js'
import { optionalUser, requireUser } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalUser, getCommunityFeed)
router.get('/:id', optionalUser, getCommunityPostDetail)
router.post('/', requireUser, createPost)
router.delete('/:id', requireUser, removeOwnPost)

export default router
