import 'dotenv/config'
import app from './app.js'
import { validateEnvironment } from './config/env.js'
import { initializeDatabase } from './database.js'

const port = Number(process.env.PORT) || 5000

try {
  validateEnvironment()
  const { seeded } = initializeDatabase()
  console.log(`SQLite database ready${seeded ? ' (sample projects added)' : ''}.`)
  app.listen(port, () => console.log(`Portfolio API listening on port ${port}.`))
} catch (error) {
  console.error(`Server startup failed: ${error.message}`)
  process.exit(1)
}
