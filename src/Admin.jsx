import { useEffect, useState } from 'react'
import { apiRequest } from './api.js'

const emptyForm = { title: '', description: '', technologies: '', githubUrl: '', liveUrl: '', featured: false }

function projectToForm(project) {
  return {
    title: project.title,
    description: project.description,
    technologies: project.technologies.join(', '),
    githubUrl: project.githubUrl || '',
    liveUrl: project.liveUrl || '',
    featured: Boolean(project.featured),
  }
}

function toPayload(form) {
  return {
    ...form,
    technologies: form.technologies.split(',').map(item => item.trim()).filter(Boolean),
    githubUrl: form.githubUrl.trim(),
    liveUrl: form.liveUrl.trim(),
  }
}

export default function Admin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadProjects() {
    const data = await apiRequest('/projects')
    setProjects(data)
  }

  useEffect(() => {
    let active = true
    apiRequest('/admin/me')
      .then(async data => {
        if (!active) return
        setAuthenticated(true)
        setUsername(data.username)
        await loadProjects()
      })
      .catch(() => {})
      .finally(() => { if (active) setCheckingSession(false) })
    return () => { active = false }
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      setUsername(data.username)
      setPassword('')
      setAuthenticated(true)
      await loadProjects()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function startEdit(project) {
    setEditingId(project._id)
    setForm(projectToForm(project))
    setError('')
    setNotice('')
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await apiRequest(editingId ? `/projects/${editingId}` : '/projects', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(toPayload(form)),
      })
      await loadProjects()
      setNotice(editingId ? 'Project updated.' : 'Project created.')
      resetForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return
    setError('')
    setNotice('')
    try {
      await apiRequest(`/projects/${project._id}`, { method: 'DELETE' })
      await loadProjects()
      if (editingId === project._id) resetForm()
      setNotice('Project deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleLogout() {
    await apiRequest('/admin/logout', { method: 'POST' }).catch(() => {})
    setAuthenticated(false)
    setProjects([])
  }

  if (checkingSession) return <main className="admin-shell section-shell"><p role="status">Checking administrator session…</p></main>

  return (
    <main className="admin-shell section-shell">
      <div className="admin-heading">
        <div><a className="admin-back" href="/">← View portfolio</a><h1>Project management</h1></div>
        {authenticated && <button className="button button-secondary" type="button" onClick={handleLogout}>Sign out</button>}
      </div>

      {!authenticated ? (
        <form className="admin-form admin-login" onSubmit={handleLogin}>
          <h2>Administrator sign in</h2>
          <p className="section-copy">Sign in to manage the projects shown on the portfolio.</p>
          <label>Username<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          {error && <p className="form-message form-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      ) : (
        <div className="admin-grid">
          <section className="admin-panel" aria-labelledby="project-list-heading">
            <h2 id="project-list-heading">Projects</h2>
            {projects.length === 0 ? <p className="section-copy">No projects yet. Add one using the form.</p> : (
              <ul className="admin-project-list">
                {projects.map(project => (
                  <li key={project._id}>
                    <div><h3>{project.title}</h3><p>{project.technologies.join(' · ')}</p></div>
                    <div className="admin-row-actions">
                      <button type="button" className="text-button" onClick={() => startEdit(project)}>Edit</button>
                      <button type="button" className="text-button text-danger" onClick={() => handleDelete(project)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form className="admin-form" onSubmit={handleSave}>
            <h2>{editingId ? 'Edit project' : 'Add a project'}</h2>
            <label>Title<input maxLength="120" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /></label>
            <label>Description<textarea maxLength="3000" rows="4" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required /></label>
            <label>Technologies <span className="field-hint">Separate with commas</span><input value={form.technologies} onChange={event => setForm({ ...form, technologies: event.target.value })} placeholder="Python, Flask" required /></label>
            <label>GitHub URL <span className="field-hint">Optional</span><input type="url" value={form.githubUrl} onChange={event => setForm({ ...form, githubUrl: event.target.value })} /></label>
            <label>Live URL <span className="field-hint">Optional</span><input type="url" value={form.liveUrl} onChange={event => setForm({ ...form, liveUrl: event.target.value })} /></label>
            <label className="checkbox-label"><input type="checkbox" checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })} /> Featured project</label>
            {error && <p className="form-message form-error" role="alert">{error}</p>}
            {notice && <p className="form-message form-success" role="status">{notice}</p>}
            <div className="hero-actions">
              <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Create project'}</button>
              {editingId && <button className="button button-secondary" type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
