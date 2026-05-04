import express from 'express'
import cors from 'cors'
import path from 'path'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import imageRoutes from './routes/image.js'
import { getStatistics } from './controllers/adminController.js'
import { getFeaturedExample } from './controllers/publicController.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env } from './config/env.js'

const allowedOrigins = env.corsOrigins
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('CORS origin not allowed'))
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

export function createApp() {
  const app = express()

  app.use(cors(corsOptions))
  app.options(/.*/, cors(corsOptions))
  app.use(express.json({ limit: '2mb' }))
  app.use('/uploads', express.static(path.join(env.backendDir, 'uploads')))

  app.get('/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/statistics', getStatistics)
  app.get('/api/featured-example', getFeaturedExample)

  app.use('/api/admin', adminRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/images', imageRoutes)
  app.use(errorHandler)

  return app
}
