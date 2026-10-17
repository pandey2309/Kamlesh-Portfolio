import 'dotenv/config'
import app from './app.js'
import { validateEnvironment } from './config/env.js'
import { initializeDatabase } from './database.js'

const port = Number(process.env.PORT) || 5000

try {
  validateEnvironment()
} catch (error) {
  console.error(`Server configuration failed: ${error.message}`)
  process.exit(1)
}

try {
  const { seeded } = await initializeDatabase()
  console.log(`PostgreSQL database ready${seeded ? ' (sample projects added)' : ''}.`)
} catch {
  console.error('PostgreSQL startup failed. Check DATABASE_URL, Neon SSL settings, and database availability.')
  process.exit(1)
}

app.listen(port, () => console.log(`Portfolio API listening on port ${port}.`))
