import { getDatabase } from '../database.js'

function mapProject(row) {
  if (!row) return null
  return {
    _id: String(row.id),
    title: row.title,
    description: row.description,
    technologies: JSON.parse(row.technologies),
    githubUrl: row.github_url,
    liveUrl: row.live_url,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listProjects() {
  const rows = getDatabase().prepare(`
    SELECT * FROM projects
    ORDER BY featured DESC, created_at DESC, id ASC
  `).all()
  return rows.map(mapProject)
}

export function getProjectById(id) {
  const row = getDatabase().prepare('SELECT * FROM projects WHERE id = ?').get(id)
  return mapProject(row)
}

export function createProject(project) {
  const database = getDatabase()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO projects (title, description, technologies, github_url, live_url, featured, created_at, updated_at)
    VALUES (@title, @description, @technologies, @githubUrl, @liveUrl, @featured, @createdAt, @updatedAt)
  `).run({
    ...project,
    technologies: JSON.stringify(project.technologies),
    featured: project.featured ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  })
  return getProjectById(Number(result.lastInsertRowid))
}

export function updateProject(id, updates) {
  const current = getProjectById(id)
  if (!current) return null

  const project = { ...current, ...updates }
  const { title, description, technologies, githubUrl, liveUrl, featured } = project
  getDatabase().prepare(`
    UPDATE projects
    SET title = @title,
        description = @description,
        technologies = @technologies,
        github_url = @githubUrl,
        live_url = @liveUrl,
        featured = @featured,
        updated_at = @updatedAt
    WHERE id = @id
  `).run({
    title,
    description,
    technologies: JSON.stringify(technologies),
    githubUrl,
    liveUrl,
    featured: featured ? 1 : 0,
    updatedAt: new Date().toISOString(),
    id,
  })
  return getProjectById(id)
}

export function deleteProject(id) {
  const result = getDatabase().prepare('DELETE FROM projects WHERE id = ?').run(id)
  return result.changes > 0
}
