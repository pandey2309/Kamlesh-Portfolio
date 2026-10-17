import test from 'node:test'
import assert from 'node:assert/strict'
import { validateEnvironment } from '../config/env.js'

const requiredValues = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test-user:test-password@localhost:5432/portfolio_test',
  JWT_SECRET: 'test-only-jwt-secret-with-at-least-thirty-two-characters',
  ADMIN_USERNAME: 'test-admin',
  ADMIN_PASSWORD_HASH: '$2b$12$test-hash-value',
}

function withEnvironment(values, callback) {
  const previous = Object.fromEntries(Object.keys(values).map(name => [name, process.env[name]]))
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
  try {
    callback()
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

test('requires a PostgreSQL connection string', () => {
  withEnvironment({ ...requiredValues, DATABASE_URL: undefined }, () => {
    assert.throws(() => validateEnvironment(), /DATABASE_URL/)
  })
})

test('rejects non-PostgreSQL database URLs without echoing their contents', () => {
  const sensitiveValue = 'mysql://private-user:private-password@example.test/database'
  withEnvironment({ ...requiredValues, DATABASE_URL: sensitiveValue }, () => {
    assert.throws(() => validateEnvironment(), error => {
      assert.match(error.message, /postgres/)
      assert.equal(error.message.includes('private-password'), false)
      return true
    })
  })
})

test('accepts a PostgreSQL URL with the required authentication settings', () => {
  withEnvironment(requiredValues, () => assert.doesNotThrow(() => validateEnvironment()))
})
