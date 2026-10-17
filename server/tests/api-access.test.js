import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const originalEnvironment = Object.fromEntries(
  ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'NODE_ENV'].map(name => [name, process.env[name]]),
)
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl
else delete process.env.DATABASE_URL
process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-for-hmac'
process.env.ADMIN_USERNAME = 'portfolio-test-admin'
process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('test-only-password-used-in-test', 4)
process.env.NODE_ENV = 'test'

const [{ default: app }, databaseModule] = await Promise.all([
  import('../app.js'),
  import('../database.js'),
])
const { closeDatabase, initializeDatabase } = databaseModule

let server
let baseUrl
const adminCookie = `portfolio_admin=${jwt.sign(
  { sub: process.env.ADMIN_USERNAME, role: 'admin' },
  process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '5m' },
)}`

before(async () => {
  if (testDatabaseUrl) await initializeDatabase()
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  await closeDatabase()
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test('health endpoint is public', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})

test('administrator login creates a session that can be checked and cleared', async () => {
  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: 'test-only-password-used-in-test' }),
  })
  assert.equal(login.status, 200)
  const cookieHeader = login.headers.get('set-cookie')
  assert.match(cookieHeader, /HttpOnly/i)
  assert.match(cookieHeader, /SameSite=Strict/i)
  const cookie = cookieHeader.split(';', 1)[0]

  const session = await fetch(`${baseUrl}/api/admin/me`, { headers: { Cookie: cookie } })
  assert.equal(session.status, 200)
  assert.equal((await session.json()).authenticated, true)

  const logout = await fetch(`${baseUrl}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie } })
  assert.equal(logout.status, 204)
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i)
})

test('public project reads and authenticated CRUD work with PostgreSQL', {
  skip: !testDatabaseUrl && 'Set TEST_DATABASE_URL to a dedicated PostgreSQL test database to run this integration check.',
}, async () => {
  const projectsResponse = await fetch(`${baseUrl}/api/projects`)
  assert.equal(projectsResponse.status, 200)
  const projects = await projectsResponse.json()
  assert.ok(projects.some(project => project.title === 'Loan Prediction System'))
  assert.ok(projects.some(project => project.title === 'Typing Speed Tester'))

  const singleProject = projects.find(project => project.title === 'Loan Prediction System')
  const singleResponse = await fetch(`${baseUrl}/api/projects/${singleProject._id}`)
  assert.equal(singleResponse.status, 200)
  assert.equal((await singleResponse.json()).title, 'Loan Prediction System')

  const title = `PostgreSQL CRUD test ${Date.now()}`
  const headers = { 'Content-Type': 'application/json', Cookie: adminCookie }
  let createdId
  try {
    const createdResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, description: 'Temporary API test project.', technologies: ['Node.js'] }),
    })
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    createdId = created._id

    const updatedResponse = await fetch(`${baseUrl}/api/projects/${createdId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ description: 'Updated temporary API test project.' }),
    })
    assert.equal(updatedResponse.status, 200)
    assert.equal((await updatedResponse.json()).description, 'Updated temporary API test project.')

    const deletedResponse = await fetch(`${baseUrl}/api/projects/${createdId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    })
    assert.equal(deletedResponse.status, 204)
    createdId = undefined
  } finally {
    if (createdId) {
      await fetch(`${baseUrl}/api/projects/${createdId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      }).catch(() => {})
    }
  }
})

test('project write endpoints reject requests without an administrator session', async () => {
  const paths = [
    ['/api/projects', 'POST'],
    ['/api/projects/1', 'PUT'],
    ['/api/projects/1', 'DELETE'],
  ]

  for (const [route, method] of paths) {
    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers: method === 'DELETE' ? {} : { 'Content-Type': 'application/json' },
      ...(method === 'DELETE' ? {} : { body: '{}' }),
    })
    assert.equal(response.status, 401, `${method} ${route} must require authentication`)
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
