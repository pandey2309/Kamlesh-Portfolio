# Kamlesh Pandey | Personal Portfolio

A personal portfolio website built to showcase my projects, technical skills, and development journey. It includes a responsive frontend, a backend API, PostgreSQL database integration, and a secure admin dashboard for managing projects.

🔗 **Live Website:** [kamlesh-portfolio-xi.vercel.app](https://kamlesh-portfolio-xi.vercel.app/)

## ✨ Features

- **Personal Portfolio** — A central place to showcase projects and technical work.
- **Project Management** — Add, edit, and delete projects through the admin dashboard.
- **Admin Authentication** — Protected access to project management features.
- **Database Integration** — Stores project information in PostgreSQL.
- **REST API** — Handles project data and admin authentication.
- **Live Deployment** — Frontend hosted on Vercel, with the backend running on Render.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Frontend development and build |
| JavaScript | Application logic |
| Express.js | Backend and REST API |
| PostgreSQL | Database |
| Node.js | Backend runtime |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Neon | Hosted PostgreSQL database |

## 🚀 Getting Started

### Prerequisites

- Node.js 22 or newer
- npm
- A PostgreSQL database, such as Neon

### 1. Clone the repository

```bash
git clone https://github.com/pandey2309/Kamlesh-Portfolio.git
cd Kamlesh-Portfolio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file from the provided example:

**Windows CMD**
```bat
if not exist .env copy .env.example .env
```

Configure the required database connection and admin authentication variables in `.env`. Generate a private JWT secret and create the administrator password hash using the project's provided command.

**Important:** Never commit your `.env` file or publish database credentials, JWT secrets, or admin passwords.

### 4. Start the backend

```bash
npm run dev:server
```

### 5. Start the frontend

Open a second terminal and run:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

The admin page is available at `/admin`.

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API health |
| GET | `/api/projects` | Retrieve all projects |
| GET | `/api/projects/:id` | Retrieve a project |
| POST | `/api/projects` | Create a project (admin) |
| PUT | `/api/projects/:id` | Update a project (admin) |
| DELETE | `/api/projects/:id` | Delete a project (admin) |

Admin authentication endpoints are also available for login, logout, and session verification.

## 🧪 Run Checks

Run the project's backend checks and tests:

```bash
npm run check
```

Build the frontend for production:

```bash
npm run build
```

## 🌐 Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL

The production frontend uses the `/api` path to communicate with the backend through the Vercel rewrite configuration.

## 👨‍💻 About Me

I'm a BCA student interested in software development, problem-solving, and building practical applications. I use projects like this to strengthen my programming skills and gain hands-on experience with modern development tools.

- **GitHub:** [pandey2309](https://github.com/pandey2309)
- **Portfolio:** [Visit Website](https://kamlesh-portfolio-xi.vercel.app/)

---

*Built with React, Express.js, and PostgreSQL.*
