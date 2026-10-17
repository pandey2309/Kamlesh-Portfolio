export function validateEnvironment() {
  const required = ['JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH']
  const missing = required.filter(name => !process.env[name])

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.')
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_ORIGINS?.trim()) {
    throw new Error('CLIENT_ORIGINS must list the deployed frontend origin(s) in production.')
  }

  if (!/^\$2[aby]\$\d{2}\$/.test(process.env.ADMIN_PASSWORD_HASH)) {
    throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash. Run npm run admin:hash to create one.')
  }
}

export function getAllowedOrigins() {
  const configured = process.env.CLIENT_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (configured?.length) return configured
  return ['http://localhost:5173', 'http://127.0.0.1:5173']
}
