import 'dotenv/config'
import { closeDatabase, initializeDatabase } from '../database.js'

try {
  const { seeded } = await initializeDatabase()
  console.log(seeded
    ? 'PostgreSQL initialized and sample projects added.'
    : 'PostgreSQL already contains projects; no sample data was changed.')
} catch {
  console.error('PostgreSQL initialization failed. Check DATABASE_URL, SSL settings, and database availability.')
  process.exitCode = 1
} finally {
  await closeDatabase()
}
