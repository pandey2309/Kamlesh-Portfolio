import jwt from 'jsonwebtoken'

const cookieName = 'portfolio_admin'

export function createAdminCookie(res, token) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: 8 * 60 * 60 * 1000,
  })
}

export function clearAdminCookie(res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
  })
}

export function requireAdmin(req, res, next) {
  const token = req.cookies[cookieName]
  if (!token) return res.status(401).json({ error: 'Administrator sign-in is required.' })

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    if (claims.role !== 'admin' || claims.sub !== process.env.ADMIN_USERNAME) {
      clearAdminCookie(res)
      return res.status(401).json({ error: 'Administrator sign-in is required.' })
    }
    req.admin = claims
    return next()
  } catch {
    clearAdminCookie(res)
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}
