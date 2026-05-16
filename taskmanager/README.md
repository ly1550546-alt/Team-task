# ✅ TaskFlow — Team Task Manager

A full-stack web app for managing teams, projects, and tasks with role-based access control.

**Stack:** HTML/CSS/JS frontend · FastAPI backend · SQLite (dev) / PostgreSQL (prod)

---

## 🚀 Features

- **Authentication** — JWT-based signup/login
- **Role-Based Access** — Admin & Member roles (global + per-project)
- **Projects** — Create, update, delete; manage team members per project
- **Tasks** — Create, assign, set status/priority/due date; filter & track
- **Dashboard** — Live stats: total tasks, in-progress, done, overdue
- **Responsive UI** — Works on desktop & mobile

---

## 🗂 Project Structure

```
taskmanager/
├── backend/
│   ├── main.py            # FastAPI app + static file serving
│   ├── database.py        # SQLAlchemy engine + session
│   ├── models.py          # DB models (User, Project, Task, ProjectMember)
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── auth_utils.py      # JWT + password hashing
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py        # /api/auth — signup, login, me
│       ├── users.py       # /api/users
│       ├── projects.py    # /api/projects + members + dashboard
│       └── tasks.py       # /api/tasks — CRUD + my/overdue
├── frontend/
│   ├── index.html
│   ├── css/main.css
│   └── js/
│       ├── api.js         # Fetch wrapper for all API calls
│       ├── auth.js        # Session management
│       ├── components.js  # Reusable UI (modal, badges, layout)
│       ├── router.js      # Hash-based SPA router
│       └── pages/
│           ├── login.js
│           ├── signup.js
│           ├── dashboard.js
│           ├── projects.js
│           ├── project-detail.js
│           └── tasks.js
├── Procfile
├── railway.toml
├── nixpacks.toml
└── README.md
```

---

## ⚙️ Local Development

### Prerequisites
- Python 3.11+

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd taskmanager

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run the server
cd backend
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000** in your browser.

The API docs are at **http://localhost:8000/docs** (Swagger UI).

---

## 🌐 Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskmanager.git
git push -u origin main
```

### Step 2 — Create Railway Project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose your repo
3. Railway auto-detects `nixpacks.toml` and builds

### Step 3 — Add PostgreSQL (optional but recommended)
1. In Railway dashboard → **+ New** → **Database** → **PostgreSQL**
2. Go to your app service → **Variables** → Add:
   ```
   DATABASE_URL  =  ${{Postgres.DATABASE_URL}}
   SECRET_KEY    =  your-random-secret-key-here
   ```
3. Railway will redeploy automatically

### Step 4 — Get your live URL
Railway assigns a public URL like `https://taskmanager-production.up.railway.app`

---

## 🔐 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user info |
| GET | `/api/users/` | ✅ | List all users |
| GET | `/api/projects/` | ✅ | My projects |
| POST | `/api/projects/` | ✅ | Create project |
| POST | `/api/projects/{id}/members` | ✅ Admin | Add member |
| DELETE | `/api/projects/{id}/members/{uid}` | ✅ Admin | Remove member |
| GET | `/api/tasks/` | ✅ | List tasks (filterable) |
| POST | `/api/tasks/` | ✅ | Create task |
| PUT | `/api/tasks/{id}` | ✅ | Update task |
| GET | `/api/tasks/my` | ✅ | Tasks assigned to me |
| GET | `/api/tasks/overdue` | ✅ | Overdue tasks |

Full Swagger docs at `/docs`.

---

## 🔒 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| See all projects | ✅ | Own/member only |
| Delete any project | ✅ | Own only |
| Add/remove project members | ✅ Project admins | ❌ |
| Update any task | ✅ | Creator/Assignee |
| Manage users | ✅ | Self only |

---

## 🛠 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./taskmanager.db` | DB connection string |
| `SECRET_KEY` | `changeme-super-secret-key...` | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token TTL (24h) |
