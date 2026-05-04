import { Router } from 'express'
import multer from 'multer'
import os from 'os'
import path from 'path'
import { deleteImage, generate, getHistory } from '../controllers/imageController.js'
import { optionalUser } from '../middleware/auth.js'
import { rateLimitDaily } from '../middleware/rateLimit.js'
import { env } from '../config/env.js'

const router = Router()

const upload = multer({
  dest: path.join(os.tmpdir(), 'lcode-image-uploads'),
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

router.post('/generate', optionalUser, rateLimitDaily, upload.single('file'), generate)
router.get('/history', optionalUser, getHistory)
router.delete('/:id', optionalUser, deleteImage)

export default router
