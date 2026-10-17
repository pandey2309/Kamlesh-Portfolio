# Kamlesh Pandey — Portfolio

A React and Vite portfolio with an Express REST API, PostgreSQL storage, and an authenticated admin dashboard. PostgreSQL connections use the `pg` pool. The backend creates the projects table when it starts; public visitors can read projects, while project changes require an administrator session.

## Requirements

- Node.js 22 or newer and npm
- VS Code is recommended for the Windows steps below
- A PostgreSQL database; this project can use a Neon connection string

## Local setup on Windows

Open this folder in VS Code. Use separate terminals for the API and frontend. In PowerShell, run `npm.cmd` if the execution policy prevents the `npm` command from running.

### 1. Install dependencies and create `.env`

Run in **Command Prompt (CMD)**:

```bat
npm install
if not exist .env copy .env.example .env
```

Run in **PowerShell**:

```powershell
npm.cmd install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

The copy command leaves an existing `.env` untouched. Open `.env` in your editor and set `DATABASE_URL` to the PostgreSQL connection string from Neon. Use the connection string with SSL enabled (`sslmode=require`). Do not paste it into source files or commit it.

### 2. Set up administrator credentials

Set a private value for `ADMIN_USERNAME` in `.env`. Generate a random `JWT_SECRET` with this command, which works in CMD and PowerShell:

```text
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the output to `JWT_SECRET`. The secret must be at least 32 characters. Do not print or share it.

Generate an administrator password hash in an interactive terminal. The password must be at least 12 characters; the prompt hides the input.

**CMD:**

```bat
npm run admin:hash
```

**PowerShell:**

```powershell
npm.cmd run admin:hash
```

Put the printed `ADMIN_PASSWORD_HASH=...` value in `.env`. The application stores the bcrypt hash, not the plain password.

### 3. Optionally copy existing SQLite projects to PostgreSQL

The SQLite database is not deleted or modified by the import. If you want to keep its project records in Neon, make sure the Neon `projects` table is empty and run this command **before starting the API**. The importer stops if the PostgreSQL table already contains projects, so it will not overwrite or duplicate destination data. It preserves project IDs and timestamps.

**CMD:**

```bat
npm run migrate:sqlite
```

**PowerShell:**

```powershell
npm.cmd run migrate:sqlite
```

The import reads `data/portfolio.sqlite` by default. Set `SQLITE_PATH` in `.env` only if your existing SQLite file is somewhere else. `better-sqlite3` remains installed for this one-time import tool; the running API uses PostgreSQL.

If you do not need to copy SQLite records, skip this step. On the first API startup, the app creates the PostgreSQL table and inserts the two default projects only when the table is empty.

### 4. Start the API and frontend

In one terminal, start the Express API:

**CMD:**

```bat
npm run dev:server
```

**PowerShell:**

```powershell
npm.cmd run dev:server
```

The API listens on port `5000` by default. It requires `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH`.

In a second terminal, start Vite:

**CMD:**

```bat
npm run dev
```

**PowerShell:**

```powershell
npm.cmd run dev
```

Open the Vite URL, usually `http://localhost:5173`. The portfolio is at `/`; the admin dashboard is at `http://localhost:5173/admin`.

## Check the API and test project management

With the backend running, check the health and public projects endpoints.

**CMD:**

```bat
curl.exe http://localhost:5000/api/health
curl.exe http://localhost:5000/api/projects
```

**PowerShell:**

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/projects | ConvertTo-Json -Depth 5
```

Then open `/admin` and sign in with your configured username and password. Add a temporary project, edit it, confirm the updated project appears on the portfolio, then delete it. This checks the login session and the create, update, and delete API routes. Use a Neon development branch or another disposable database for these checks if you do not want to change your main project list.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL connection string. Use the Neon connection string with SSL enabled. The app never logs the connection string. |
| `NODE_ENV` | Use `development` locally and `production` on the API host. Production enables the secure admin cookie and requires `CLIENT_ORIGINS`. |
| `PORT` | Express port; defaults to `5000`. |
| `CLIENT_ORIGINS` | Comma-separated exact browser origins allowed by the API. In production this is required; do not include a path or trailing slash. Local defaults allow the Vite origins on port 5173. |
| `JWT_SECRET` | Required signing secret, at least 32 characters. Generate a private random value as described above. |
| `ADMIN_USERNAME` | Required administrator sign-in name. |
| `ADMIN_PASSWORD_HASH` | Required bcrypt hash generated with `npm run admin:hash`. |
| `VITE_API_BASE_URL` | Optional frontend API base path. Empty uses `/api`. For a separately hosted API, set at frontend build time to its URL including `/api`. This value is included in the public bundle; never put secrets in a `VITE_` variable. |
| `API_PROXY_TARGET` | Optional full target URL for Vite’s local `/api` development proxy. By default it uses `http://127.0.0.1:<PORT>`. It does not configure a deployed static frontend. |
| `SQLITE_PATH` | Optional source file path used only by `npm run migrate:sqlite`; defaults to `data/portfolio.sqlite`. It is not used by the running API. |
| `TEST_DATABASE_URL` | Optional dedicated PostgreSQL test database URL. Set this outside `.env` to enable the database-backed API CRUD integration test. Use an empty, disposable test database, never production. |

## REST API

The project response includes `_id`, `title`, `description`, `technologies`, `githubUrl`, `liveUrl`, `featured`, `createdAt`, and `updatedAt`.

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /api/health` | Public | Health check. |
| `GET /api/projects` | Public | List projects. |
| `GET /api/projects/:id` | Public | Read one project. |
| `POST /api/projects` | Administrator | Create a project. |
| `PUT /api/projects/:id` | Administrator | Update a project. |
| `DELETE /api/projects/:id` | Administrator | Delete a project. |
| `POST /api/admin/login` | Public sign-in endpoint | Authenticate and set the admin session cookie. |
| `POST /api/admin/logout` | Public | Clear the admin cookie. |
| `GET /api/admin/me` | Administrator | Return the signed-in administrator. |

Project writes accept `title`, `description`, `technologies` (array of strings), optional `githubUrl` and `liveUrl` strings, and optional `featured` (boolean). Invalid IDs and invalid fields return client errors; a duplicate title returns a conflict.

## Tests and production build

Run backend syntax checks and tests:

```text
npm run check:server
```

Without `TEST_DATABASE_URL`, the PostgreSQL API CRUD integration test is skipped; validation, health, authentication protection, and CORS tests still run. Set `TEST_DATABASE_URL` to a dedicated disposable database to run that integration test.

Build the frontend:

```text
npm run build
```

Vite writes production assets to `dist/`. `npm run preview` previews those assets locally; it does not start the API. `npm start` starts the Express API only.

## Secrets, GitHub, and deployment

The `.gitignore` excludes `.env`, `.env.*` (except `.env.example`), `node_modules/`, `dist/`, and `data/`. Keep `DATABASE_URL`, JWT secrets, password hashes, and local database files out of GitHub. Commit only placeholder values in `.env.example`. Before pushing, review `git status` and confirm no private files or credentials are staged.

Set API secrets in the hosting provider’s environment settings; do not upload `.env`. Build the frontend with `npm run build` and publish `dist/`. Run the Express API with `npm start`, and set `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `CLIENT_ORIGINS` in the API service. Configure the frontend host to rewrite `/admin` to `index.html`; route `/api/*` to the API for a same-origin setup. If frontend and API are hosted separately, set `VITE_API_BASE_URL` at build time and allow the exact frontend origin in `CLIENT_ORIGINS`.

The admin cookie is `HttpOnly`, `Secure` in production, and `SameSite=Strict`. A same-origin frontend/API setup is simplest. Separate HTTPS subdomains under the same site can also work; unrelated frontend and API domains may block the strict cookie. Decide your host and domain layout before deployment.
