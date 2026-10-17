export function notFound(req, res) {
  res.status(404).json({ error: `No API route found for ${req.method} ${req.originalUrl}.` })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error.code === '23505') {
    return res.status(409).json({ error: 'A project with this title already exists.' })
  }

  if (['23502', '23514', '22P02'].includes(error.code)) {
    return res.status(400).json({ error: 'Project data violates a database constraint.' })
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' })
  }

  if (!error.status || error.status >= 500) console.error('Request failed:', error.code || error.name || 'Error')
  return res.status(error.status || 500).json({
    error: error.status && error.status < 500 ? error.message : 'An unexpected server error occurred.',
  })
}
