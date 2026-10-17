import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidProjectId, validateProjectPayload } from '../routes/projects.js'

const validProject = {
  title: 'Loan Prediction',
  description: 'Predicts loan approval from input data.',
  technologies: ['Python', 'Machine Learning'],
}

test('accepts a valid project without optional links', () => {
  assert.equal(validateProjectPayload(validProject), null)
})

test('rejects missing required project fields and empty updates', () => {
  assert.match(validateProjectPayload({ ...validProject, title: ' ' }), /title must be/)
  assert.match(validateProjectPayload({ ...validProject, technologies: [] }), /technologies must be/)
  assert.match(validateProjectPayload({}, true), /at least one project field/)
})

test('rejects unsafe or malformed project URLs and unsupported fields', () => {
  assert.match(validateProjectPayload({ ...validProject, liveUrl: 'javascript:alert(1)' }), /HTTP or HTTPS/)
  assert.match(validateProjectPayload({ ...validProject, githubUrl: 'not a url' }), /valid HTTP or HTTPS URL/)
  assert.match(validateProjectPayload({ ...validProject, secret: 'ignored' }), /Unsupported project fields/)
})

test('accepts only positive integer project IDs', () => {
  assert.equal(isValidProjectId('1'), true)
  assert.equal(isValidProjectId('9007199254740991'), true)
  assert.equal(isValidProjectId('not-an-id'), false)
  assert.equal(isValidProjectId('0'), false)
  assert.equal(isValidProjectId('9007199254740992'), false)
})
