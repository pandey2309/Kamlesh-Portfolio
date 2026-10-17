import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { clearAdminCookie, createAdminCookie, requireAdmin } from '../middleware/auth.js'

const router = Router()
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
})

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {}
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'Enter both username and password.' })
    }

    const usernameMatches = username === process.env.ADMIN_USERNAME
    const passwordMatches = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
    if (!usernameMatches || !passwordMatches) {
      return res.status(401).json({ error: 'Username or password is incorrect.' })
    }

    const token = jwt.sign({ sub: process.env.ADMIN_USERNAME, role: 'admin' }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '8h',
    })
    createAdminCookie(res, token)
    return res.json({ authenticated: true, username: process.env.ADMIN_USERNAME })
  } catch (error) {
    return next(error)
  }
})

router.post('/logout', (req, res) => {
  clearAdminCookie(res)
  res.status(204).end()
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ authenticated: true, username: req.admin.sub })
})

export default router
