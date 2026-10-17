import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import adminRoutes from './routes/admin.js'
import projectRoutes from './routes/projects.js'
import { getAllowedOrigins } from './config/env.js'
import { errorHandler, notFound } from './middleware/errors.js'

const app = express()
const allowedOrigins = getAllowedOrigins()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(Object.assign(new Error('This origin is not allowed by CORS.'), { status: 403 }))
  },
  credentials: true,
}))
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers.origin && !allowedOrigins.includes(req.headers.origin)) {
    return res.status(403).json({ error: 'This origin is not allowed to make changes.' })
  }
  return next()
})
app.use(express.json({ limit: '20kb' }))
app.use((req, res, next) => {
  req.cookies = Object.create(null)
  for (const cookie of (req.headers.cookie || '').split(';').filter(Boolean)) {
    const separator = cookie.indexOf('=')
    const name = cookie.slice(0, separator).trim()
    const value = cookie.slice(separator + 1).trim()
    try {
      req.cookies[name] = decodeURIComponent(value)
    } catch {
      req.cookies[name] = ''
    }
  }
  next()
})
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/admin', adminRoutes)
app.use('/api/projects', projectRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
