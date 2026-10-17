# Kamlesh Pandey | Portfolio

A React and Vite portfolio with an Express REST API and SQLite project storage. Public visitors can view projects without signing in. Only the authenticated administrator can create, edit, or delete projects.

## Requirements

- Node.js 20 or newer and npm
- VS Code (recommended for the steps below)

No MongoDB installation or external database account is needed. The SQLite database file is created locally at `data/portfolio.sqlite` by default.

## Windows and VS Code setup

1. Open this project folder in VS Code. Open **Terminal → New Terminal** and install dependencies:

   ```powershell
   npm install
   ```

2. Create the private environment file (this does not overwrite an existing `.env`):

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

3. Open `.env` in VS Code. Set a private administrator username. Generate a JWT secret in the terminal:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Copy the output into `JWT_SECRET` in `.env`. Do not put secrets in React files or commit `.env`.

4. Generate the administrator password hash:

   ```powershell
   npm run admin:hash
   ```

   Enter a password of at least 12 characters when prompted; input is hidden. Copy the printed `ADMIN_PASSWORD_HASH=...` value into `.env`.

5. Start the backend in this terminal:

   ```powershell
   npm run dev:server
   ```

   On first startup, the backend creates the SQLite directory and table. It inserts the two supplied sample projects only if the table is empty. Expect messages that the SQLite database is ready and the API is listening on port 5000.

6. Open **Terminal → New Terminal** for the frontend:

   ```powershell
   npm run dev
   ```

   Open the Vite URL shown in the terminal, usually `http://localhost:5173`. Vite proxies `/api` to the backend port from `PORT` in `.env` (5000 by default). You can set `API_PROXY_TARGET` to override that URL.

## Verify the API and database

With the backend running, use a third VS Code terminal:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/projects | ConvertTo-Json -Depth 5
```

The projects response should contain the two sample projects on a fresh database. If you deleted them and want the safe empty-database seed to run again, stop the backend and run `npm run seed:projects`; it does not overwrite or duplicate projects in a non-empty table.

Open `http://localhost:5173` and scroll to Projects to see the API data. The admin dashboard is at `http://localhost:5173/admin`; sign in with the username and password configured for the administrator to add or edit projects. Project URLs are optional and remain blank unless you enter real links.

## Environment variables

- `NODE_ENV`: `development` locally; use `production` for deployment.
- `PORT`: Express port, defaults to `5000`.
- `SQLITE_PATH`: optional database file path; defaults to `data/portfolio.sqlite` relative to the project.
- `CLIENT_ORIGINS`: exact comma-separated frontend origins allowed by the API.
- `JWT_SECRET`: random secret of at least 32 characters.
- `ADMIN_USERNAME`: administrator sign-in name.
- `ADMIN_PASSWORD_HASH`: bcrypt hash from `npm run admin:hash`.
- `VITE_API_BASE_URL`: leave empty locally; set the deployed API base URL when the frontend and API are hosted separately.
- `API_PROXY_TARGET`: optional full local API URL override for Vite's `/api` proxy.

## API routes

- `GET /api/projects` and `GET /api/projects/:id` — public project reads.
- `POST /api/projects`, `PUT /api/projects/:id`, and `DELETE /api/projects/:id` — administrator-only writes.
- `POST /api/admin/login`, `POST /api/admin/logout`, and `GET /api/admin/me` — administrator session.
- `GET /api/health` — API health check.

The project table stores title, description, technologies (as JSON text), GitHub URL, live URL, featured status, and timestamps. SQLite integer IDs are returned as strings in `_id` to preserve the existing admin interface.

## Production

Set the auth and origin environment variables in the hosting dashboard; do not deploy `.env`. The host must provide persistent disk storage for the SQLite file, or set `SQLITE_PATH` to a persistent mounted path. Publish the frontend `dist/` folder and configure the static host to rewrite `/admin` to `index.html`. Use HTTPS so the administrator cookie remains secure. Start the API with `npm start`.

## Checks

```powershell
npm run check:server
npm run build
```
