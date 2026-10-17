import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-sqlite-test-'))
const previousSqlitePath = process.env.SQLITE_PATH
process.env.SQLITE_PATH = path.join(tempDirectory, 'test.sqlite')
const [{ default: app }, databaseModule] = await Promise.all([
  import('../app.js'),
  import('../database.js'),
])
const { closeDatabase, initializeDatabase } = databaseModule

let server
let baseUrl

before(async () => {
  initializeDatabase()
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  closeDatabase()
  fs.rmSync(tempDirectory, { recursive: true, force: true })
  if (previousSqlitePath === undefined) delete process.env.SQLITE_PATH
  else process.env.SQLITE_PATH = previousSqlitePath
})

test('health check and public project routes return seeded SQLite rows', async () => {
  const health = await fetch(`${baseUrl}/api/health`)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok' })

  const projectsResponse = await fetch(`${baseUrl}/api/projects`)
  assert.equal(projectsResponse.status, 200)
  const projects = await projectsResponse.json()
  assert.deepEqual(projects.map(project => project.title), ['Loan Prediction System', 'Typing Speed Tester'])
  assert.deepEqual(projects[0].technologies, ['Python', 'Machine Learning', 'Random Forest'])
  assert.equal(projects[0].githubUrl, '')

  const singleProject = await fetch(`${baseUrl}/api/projects/1`)
  assert.equal(singleProject.status, 200)
  assert.equal((await singleProject.json()).title, 'Loan Prediction System')

  initializeDatabase()
  const projectsAfterSecondInitialization = await (await fetch(`${baseUrl}/api/projects`)).json()
  assert.equal(projectsAfterSecondInitialization.length, 2, 'database initialization must not duplicate seed data')

  const project = await fetch(`${baseUrl}/api/projects/not-an-id`)
  assert.equal(project.status, 400)
  assert.match((await project.json()).error, /Project ID is invalid/)
})

test('project writes require an authenticated administrator', async () => {
  const paths = [
    ['/api/projects', 'POST'],
    ['/api/projects/1', 'PUT'],
    ['/api/projects/1', 'DELETE'],
  ]

  for (const [path, method] of paths) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: method === 'DELETE' ? {} : { 'Content-Type': 'application/json' },
      ...(method === 'DELETE' ? {} : { body: '{}' }),
    })
    assert.equal(response.status, 401, `${method} ${path} must be protected`)
  }
})

test('write requests from origins outside the allowlist are rejected', async () => {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.equal(response.status, 403)
})
