import { Router } from 'express'
import { createProject, deleteProject, getProjectById, listProjects, updateProject } from '../models/Project.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const projectFields = ['title', 'description', 'technologies', 'githubUrl', 'liveUrl', 'featured']

export function validateProjectPayload(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a project object.'
  const unknown = Object.keys(body).filter(key => !projectFields.includes(key))
  if (unknown.length) return `Unsupported project fields: ${unknown.join(', ')}.`
  if (partial && Object.keys(body).length === 0) return 'Provide at least one project field to update.'

  for (const field of ['title', 'description']) {
    if (!partial || field in body) {
      if (typeof body[field] !== 'string' || !body[field].trim()) return `${field} must be a non-empty string.`
      const max = field === 'title' ? 120 : 3000
      if (body[field].trim().length > max) return `${field} must be ${max} characters or fewer.`
    }
  }

  if (!partial || 'technologies' in body) {
    if (!Array.isArray(body.technologies) || body.technologies.length < 1 || body.technologies.length > 20) {
      return 'technologies must be an array with 1 to 20 items.'
    }
    if (body.technologies.some(item => typeof item !== 'string' || !item.trim() || item.trim().length > 60)) {
      return 'Each technology must be a non-empty string of at most 60 characters.'
    }
  }

  for (const field of ['githubUrl', 'liveUrl']) {
    if (field in body && body[field] !== '') {
      if (typeof body[field] !== 'string' || body[field].length > 500) return `${field} must be a URL of at most 500 characters.`
      try {
        const url = new URL(body[field])
        if (!['http:', 'https:'].includes(url.protocol)) return `${field} must use HTTP or HTTPS.`
      } catch {
        return `${field} must be a valid HTTP or HTTPS URL.`
      }
    }
  }

  if ('featured' in body && typeof body.featured !== 'boolean') return 'featured must be true or false.'
  return null
}

export function isValidProjectId(id) {
  return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
}

router.get('/', (req, res) => {
  return res.json(listProjects())
})

router.get('/:id', (req, res) => {
  if (!isValidProjectId(req.params.id)) return res.status(400).json({ error: 'Project ID is invalid.' })
  const project = getProjectById(Number(req.params.id))
  if (!project) return res.status(404).json({ error: 'Project was not found.' })
  return res.json(project)
})

router.post('/', requireAdmin, (req, res, next) => {
  const validationError = validateProjectPayload(req.body)
  if (validationError) return res.status(400).json({ error: validationError })
  try {
    const project = createProject({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      technologies: req.body.technologies.map(item => item.trim()),
      githubUrl: req.body.githubUrl || '',
      liveUrl: req.body.liveUrl || '',
      featured: req.body.featured || false,
    })
    return res.status(201).json(project)
  } catch (error) {
    return next(error)
  }
})

router.put('/:id', requireAdmin, (req, res, next) => {
  if (!isValidProjectId(req.params.id)) return res.status(400).json({ error: 'Project ID is invalid.' })
  const validationError = validateProjectPayload(req.body, true)
  if (validationError) return res.status(400).json({ error: validationError })
  try {
    const updates = { ...req.body }
    if (updates.title) updates.title = updates.title.trim()
    if (updates.description) updates.description = updates.description.trim()
    if (updates.technologies) updates.technologies = updates.technologies.map(item => item.trim())
    const project = updateProject(Number(req.params.id), updates)
    if (!project) return res.status(404).json({ error: 'Project was not found.' })
    return res.json(project)
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', requireAdmin, (req, res, next) => {
  if (!isValidProjectId(req.params.id)) return res.status(400).json({ error: 'Project ID is invalid.' })
  try {
    if (!deleteProject(Number(req.params.id))) return res.status(404).json({ error: 'Project was not found.' })
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
})

export default router
