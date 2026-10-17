import { getDatabase } from '../database.js'

function toISOString(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapProject(row) {
  if (!row) return null
  return {
    _id: String(row.id),
    title: row.title,
    description: row.description,
    technologies: Array.isArray(row.technologies) ? row.technologies : JSON.parse(row.technologies),
    githubUrl: row.github_url,
    liveUrl: row.live_url,
    featured: Boolean(row.featured),
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  }
}

export async function listProjects() {
  const { rows } = await getDatabase().query(`
    SELECT * FROM projects
    ORDER BY featured DESC, created_at DESC, id ASC
  `)
  return rows.map(mapProject)
}

export async function getProjectById(id) {
  const { rows } = await getDatabase().query('SELECT * FROM projects WHERE id = $1', [id])
  return mapProject(rows[0])
}

export async function createProject(project) {
  const { rows } = await getDatabase().query(`
    INSERT INTO projects (title, description, technologies, github_url, live_url, featured)
    VALUES ($1, $2, $3::jsonb, $4, $5, $6)
    RETURNING *
  `, [
    project.title,
    project.description,
    JSON.stringify(project.technologies),
    project.githubUrl || '',
    project.liveUrl || '',
    Boolean(project.featured),
  ])
  return mapProject(rows[0])
}

export async function updateProject(id, updates) {
  const current = await getProjectById(id)
  if (!current) return null

  const project = { ...current, ...updates }
  const { rows } = await getDatabase().query(`
    UPDATE projects
    SET title = $1,
        description = $2,
        technologies = $3::jsonb,
        github_url = $4,
        live_url = $5,
        featured = $6,
        updated_at = NOW()
    WHERE id = $7
    RETURNING *
  `, [
    project.title,
    project.description,
    JSON.stringify(project.technologies),
    project.githubUrl || '',
    project.liveUrl || '',
    Boolean(project.featured),
    id,
  ])
  return mapProject(rows[0])
}

export async function deleteProject(id) {
  const result = await getDatabase().query('DELETE FROM projects WHERE id = $1', [id])
  return result.rowCount > 0
}
