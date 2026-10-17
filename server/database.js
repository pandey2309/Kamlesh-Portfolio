import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultPath = path.join(projectRoot, 'data', 'portfolio.sqlite')
let connection

const seedProjects = [
  {
    title: 'Loan Prediction System',
    description: 'A Random Forest classification model predicts the Loan_Status outcome from applicant information. Its input features include Gender, Married, Dependents, Education, Self_Employed, ApplicantIncome, CoapplicantIncome, LoanAmount, Loan_Amount_Term, Credit_History, and Property_Area.',
    technologies: ['Python', 'Machine Learning', 'Random Forest'],
  },
  {
    title: 'Typing Speed Tester',
    description: 'Typing Speed Tester is a web application for practising typing and checking typing speed. It uses Python with Flask, alongside HTML, CSS, and JavaScript. The project brings typing practice and speed checking together in one browser-based tool.',
    technologies: ['Python', 'Flask', 'HTML', 'CSS', 'JavaScript'],
  },
]

export function getDatabase() {
  if (connection) return connection

  const databasePath = process.env.SQLITE_PATH
    ? path.resolve(process.cwd(), process.env.SQLITE_PATH)
    : defaultPath
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })
  connection = new Database(databasePath)
  connection.pragma('journal_mode = WAL')
  connection.pragma('foreign_keys = ON')
  connection.pragma('busy_timeout = 5000')
  return connection
}

export function initializeDatabase() {
  const database = getDatabase()
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE CHECK(length(trim(title)) BETWEEN 1 AND 120),
      description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 3000),
      technologies TEXT NOT NULL,
      github_url TEXT NOT NULL DEFAULT '',
      live_url TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  // Update the original loan project once without overwriting copy edited in the admin dashboard.
  database.prepare(`
    UPDATE projects SET title = ?, description = ?, technologies = ?, updated_at = ?
    WHERE title = 'Loan Prediction'
      AND description IN (?, ?)
  `).run(
    seedProjects[0].title,
    seedProjects[0].description,
    JSON.stringify(seedProjects[0].technologies),
    new Date().toISOString(),
    'A machine learning project that predicts loan approval using input data.',
    'Loan Prediction explores whether a loan can be approved based on input data. It is built with Python and machine learning, with Streamlit in the project stack. The application presents an approval prediction from the supplied input.',
  )
  database.prepare(`
    UPDATE projects SET description = ?, updated_at = ?
    WHERE title = 'Typing Speed Tester'
      AND description = 'A web application for practising typing and checking typing speed.'
  `).run(seedProjects[1].description, new Date().toISOString())

  const seedIfEmpty = database.transaction(() => {
    const { total } = database.prepare('SELECT COUNT(*) AS total FROM projects').get()
    if (total !== 0) return false

    const now = new Date().toISOString()
    const insert = database.prepare(`
      INSERT INTO projects (title, description, technologies, created_at, updated_at)
      VALUES (@title, @description, @technologies, @createdAt, @updatedAt)
    `)

    for (const project of seedProjects) {
      insert.run({
        ...project,
        technologies: JSON.stringify(project.technologies),
        createdAt: now,
        updatedAt: now,
      })
    }
    return true
  })

  return { database, seeded: seedIfEmpty.immediate() }
}

export function closeDatabase() {
  if (!connection) return
  connection.close()
  connection = undefined
}
