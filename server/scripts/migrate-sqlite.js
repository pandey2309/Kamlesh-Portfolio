import 'dotenv/config'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDatabase, getDatabase, initializeDatabase } from '../database.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(process.cwd(), process.env.SQLITE_PATH)
  : path.join(projectRoot, 'data', 'portfolio.sqlite')

let sqlite
let client

try {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error(), { code: 'DATABASE_URL_MISSING' })
  if (!fs.existsSync(sqlitePath)) throw Object.assign(new Error(), { code: 'SQLITE_SOURCE_NOT_FOUND' })

  sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true })
  const projects = sqlite.prepare(`
    SELECT id, title, description, technologies, github_url, live_url,
           featured, created_at, updated_at
    FROM projects
    ORDER BY id ASC
  `).all()
  if (projects.length === 0) throw Object.assign(new Error(), { code: 'SQLITE_SOURCE_EMPTY' })

  await initializeDatabase({ seed: false })
  const database = getDatabase()
  client = await database.connect()
  await client.query('BEGIN')

  const existing = await client.query('SELECT COUNT(*)::integer AS total FROM projects')
  if (existing.rows[0].total > 0) throw Object.assign(new Error(), { code: 'POSTGRES_DESTINATION_NOT_EMPTY' })

  for (const project of projects) {
    const technologies = JSON.parse(project.technologies)
    if (!Array.isArray(technologies)) throw Object.assign(new Error(), { code: 'INVALID_SQLITE_PROJECT_DATA' })

    await client.query(`
      INSERT INTO projects
        (id, title, description, technologies, github_url, live_url, featured, created_at, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
    `, [
      project.id,
      project.title,
      project.description,
      JSON.stringify(technologies),
      project.github_url,
      project.live_url,
      Boolean(project.featured),
      new Date(project.created_at),
      new Date(project.updated_at),
    ])
  }

  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('projects', 'id'),
      COALESCE(MAX(id), 1),
      COUNT(*) > 0
    )
    FROM projects
  `)
  await client.query('COMMIT')
  console.log(`Imported ${projects.length} projects. The SQLite source file was left unchanged.`)
} catch (error) {
  if (client) await client.query('ROLLBACK').catch(() => {})
  const safeCode = typeof error?.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(error.code)
    ? error.code
    : 'UNKNOWN'
  console.error(`SQLite import failed (${safeCode}). Check the source file and PostgreSQL settings; no credentials were printed.`)
  process.exitCode = 1
} finally {
  client?.release()
  sqlite?.close()
  await closeDatabase()
}
