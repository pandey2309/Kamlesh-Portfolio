import 'dotenv/config'
import { closeDatabase, initializeDatabase } from '../database.js'

try {
  const { seeded } = initializeDatabase()
  console.log(seeded
    ? 'SQLite database initialized and sample projects added.'
    : 'SQLite database already contains projects; no sample data was changed.')
} catch (error) {
  console.error(`Database initialization failed: ${error.message}`)
  process.exitCode = 1
} finally {
  closeDatabase()
}
