# Template PWA

This is a teaching template for school projects. It has a frontend (the part users see in a browser) and a backend (the server that stores data).

**What is inside:**

- **Frontend** — React app with TypeScript, built with Vite, styled with Tailwind CSS.
- **Backend** — Python web server using aiohttp, stores data in a SQLite file.
- **Tests** — automated checks that verify the app works correctly.

This starter is meant to be replaced as you build your own app. You can remove any demo page, feature, branding, or tool you do not need. Keep each `AGENTS.md` up to date with what is still a template and what now belongs to your app. Remove the template-only instructions when that transition is complete.

---

## Words you will see in this guide

| Word | What it means |
|------|---------------|
| **terminal** | A text window where you type commands. On Mac it is called Terminal, on Windows it is called Command Prompt or PowerShell. |
| **git** | A tool that downloads and tracks code. Every command starts with `git`. |
| **npm** | Node Package Manager — downloads JavaScript libraries that the frontend needs. |
| **uv** | A tool that downloads Python libraries that the backend needs. |
| **make** | A shortcut tool. `make setup` is just a shorter way to run several commands at once. |
| **uv run** | Runs a Python command inside the project's own Python environment. |
| **localhost** | Your own computer. `http://localhost:5101` means "open port 5101 on my own machine". |

---

## Project folders

```
templatePWA/
├── backend/        ← Python server code
│   └── db/         ← Database (SQLite) code
└── frontend/       ← React app code
```

---

## Before you start — check your tools

Do this once on a new machine before cloning anything.

### Check uv (Python package manager)

```bash
uv -V
```

If you get "command not found", install it:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then install a fresh Python:

```bash
uv python install 3.14
```

### Check npm (JavaScript package manager)

```bash
npm -v
```

If you get "command not found", install Node.js via nvm:

```bash
# Install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
# Load nvm without restarting the terminal:
. "$HOME/.nvm/nvm.sh"
# Install Node.js:
nvm install 26
```

---

## First-time setup

Do this once when you first clone the project.

### Step 1 — Make your own copy and download it

1. Open https://github.com/leaders-tech/templatePWA and click **Use this template** → **Create a new repository**.
2. Name the repository after your project. Use only lowercase letters, numbers, and hyphens, for example
   `homework-planner`. Do not use underscores (`_`). This name becomes your app address on tlfpaas.
3. Open a terminal and download **your** repository (put your GitHub login and project name):

```bash
git clone https://github.com/your-login/your-project.git
cd your-project
```

`git clone` copies the project to your computer. `cd your-project` moves into that folder.
Now `git push` sends your changes to your own repository, not to the template.

### Step 2 — Install everything

The easiest way (one command does it all):

```bash
make setup
```

That is it. `make setup` installs the locked Python and JavaScript libraries, installs Chromium for tests, and creates the local config files `.env` and `.docker.env`. It also creates `.agent.env` for coding agents.

<details>
<summary>What does make setup do exactly? (click to expand)</summary>

If you are curious, it runs these steps one by one:

```bash
uv sync --all-groups       # installs Python libraries
cd frontend
npm ci                     # installs the locked JavaScript libraries
npx playwright install chromium # installs the browser for end-to-end tests
cd ..
cp .env.example .env
cp .docker.env.example .docker.env
cp .agent.env.example .agent.env
```

You do not need to run these yourself — `make setup` does it for you.
</details>

---

## Running the app in development

All local app settings live in the root `.env` file.
Change ports, hosts, local secrets, LAN settings, and local e2e settings there.
Do not edit the `Makefile` or frontend config files for that.

You need **two terminals** open at the same time — one for the backend, one for the frontend.

### Terminal 1 — start the backend (Python server)

```bash
make back
```

The backend will be available at `http://localhost:3101`.

> **With auto-reload:** `make back` already watches for file changes. If you want to run it without auto-reload, use `uv run python -m backend.main`.

### Terminal 2 — start the frontend (React app)

```bash
make front
```

The frontend will be available at `http://localhost:5101`.

Open `http://localhost:5101` in your browser to see the app.

### Backend logs

The backend prints useful startup, request, and websocket logs to the terminal.
If you want quieter backend logs, set this in `.env`:

```env
APP_DEBUG_LOGS=0
```

### Share the app on the same Wi-Fi

If you want to test the app from another phone, tablet, or laptop on the same Wi-Fi, use the LAN commands instead of the normal localhost commands.

In one terminal:

```bash
make back-lan
```

In another terminal:

```bash
make front-lan
```

To open the correct Wi-Fi URL on this Mac:

```bash
make open-lan
```

In LAN mode, the app uses these ports:

- frontend: `http://<wifi-ip>:5104`
- backend: `http://<wifi-ip>:3104`

Important notes:

- Open the real Wi-Fi IP, not `0.0.0.0`.
- This helper is for macOS and expects the Wi-Fi interface to be `en0`.
- If the Wi-Fi IP cannot be found, use the normal localhost commands instead.
- Use this only on a trusted local network. The dev demo users can be reached from other devices on that Wi-Fi.

### Default login credentials (development only)

| Username | Password |
|----------|----------|
| user     | user     |
| admin    | the `ADMIN_PASSWORD` value from `.env` (`admin` by default) |

The `user` account exists only in development mode. The `admin` account exists everywhere: in production its password
comes from the `ADMIN_PASSWORD` secret (see "Deploy to tlfpaas" below).

---

## How the frontend talks to the backend

`make front` reads the backend URL from the root `.env` file and passes it to Vite automatically.

> **Important:** Use the root `.env` file as the single source of truth for local ports and local URLs. Do not switch to editing `frontend/.env.*`, `Makefile`, or Playwright config files.

In LAN mode, use the same Wi-Fi IP on both sides:

- frontend URL: `http://<wifi-ip>:5104`
- backend URL: `http://<wifi-ip>:3104`

---

## Adding a new library

### Python library (for the backend)

```bash
uv add package-name
```

For a library only used in development (like a testing tool):

```bash
uv add --dev package-name
```

### JavaScript library (for the frontend)

```bash
cd frontend
npm install package-name
```

For a library only used in development:

```bash
cd frontend
npm install -D package-name
```

> Do not edit the dependency files by hand. Use these commands instead — they also update the lock files automatically.

---

## Running tests

### Backend tests

```bash
uv run pytest
```

### Frontend unit tests

```bash
cd frontend
npm test
```

### End-to-end tests (browser automation)

```bash
cd frontend
npm run test:e2e
```

Playwright opens Chromium, clicks through the app, and checks login, cookie refresh, redirects, notes, live updates between tabs, and error messages.

### Run all tests at once

From the project root:

```bash
make test
```

This runs Ruff, backend tests, Oxlint, the production frontend build (including TypeScript checks), frontend unit tests, and browser tests.

---

## Formatting code

Formatting makes code look consistent (correct indentation, spacing, etc.).

Python:

```bash
uv run ruff format .
```

Frontend:

```bash
cd frontend
npm run format
```

Or both at once:

```bash
make format
```

---

## Useful make shortcuts

| Command | What it does |
|---------|--------------|
| `make setup` | First-time install of everything |
| `make back` | Start backend with auto-reload |
| `make back-once` | Start backend without auto-reload |
| `make front` | Start frontend dev server |
| `make open` | Open the app in the browser |
| `make format` | Format all code |
| `make test` | Run all tests |
| `make test-e2e-docker` | Run browser tests against Docker containers |

---

## Updating dependencies

Normal update (stays within the version ranges in `pyproject.toml` and `frontend/package.json`):

```bash
make deps-update-safe
```

To also move frontend libraries to their latest stable major versions:

```bash
make deps-update-latest
```

Both commands keep the explicit Python version bounds. To change a Python major version, use `uv add 'package-name>=new-version,<next-major'` (or `uv add --dev` for a development tool) and review the release notes.

The frontend uses TypeScript 7 and Oxlint. Oxlint has built-in TypeScript and React Hooks rules, so it does not need a separate ESLint parser. Prettier formats code. Run `cd frontend && npm run lint` for a quick lint check.

After updating, always run tests to make sure nothing broke:

```bash
make test
make test-e2e-docker
```

---

## Deploy to tlfpaas

Your app goes online at `https://<project>.tlfedu.tech` through [tlfpaas](https://deploy.tlfedu.tech/guides/students/start).

1. Push your code to GitHub. **Every push starts a new deploy**, so run `make test` before `git push`.
2. Open https://deploy.tlfedu.tech/my/projects and wait until the deploy says `success`.
3. Open your project, click **Secrets**, and add two secrets:
   - `COOKIE_SECRET` — a long random string (at least 32 characters);
   - `ADMIN_PASSWORD` — the password for the `admin` user (at least 12 characters).
4. Click **Redeploy now**. The app does not start in production without these secrets.
5. Open your app and log in as `admin` with your `ADMIN_PASSWORD`.

Forgot the admin password? Change the `ADMIN_PASSWORD` secret and click **Redeploy now** again.
If something breaks, read the deploy log on the dashboard and the app logs at https://logs.tlfedu.tech.

---

## App icon

The app icon is `frontend/public/icon.svg`. When you know what your app is, ask your coding agent to draw a new icon
for it (the agent instructions are in `frontend/icon/AGENTS.md`), then make all phone and browser icons from it:

```bash
cd frontend
npm run icons
```

---

## Docker (optional, for deployment)

Docker packages the app into containers so it runs the same way everywhere.
You do not need Docker for local development. Use it when you want to test the production-style container setup or deploy to `tlfpaas`.

All Docker and Dokploy settings live in the root `.docker.env` file.
Change Docker ports, Docker URLs, Docker secrets, Docker project names, and Docker e2e settings there.
Do not edit `docker-compose.yml` or the Dockerfiles for normal student configuration.

Quick local browser test with Docker:

```bash
make front-docker
make open-docker
```

Open in browser:
- App: `http://localhost:5105`
- Health check through the local gateway: `http://localhost:5105/api/health`

`make front-docker` starts a small local gateway so the browser uses the same path-based contract as production:

- `/api/*` -> backend
- `/ws` -> backend
- everything else -> frontend

If you want only the backend container running for debugging, you can still use:

```bash
make back-docker
```

Stop and remove containers:

```bash
make stop-docker
make clean-docker
```

Run browser e2e tests against the Docker stack:

```bash
make test-e2e-docker
```

---

## Security notes (for learning)

- Passwords are stored as Argon2 hashes — not as plain text.
- Login uses `HttpOnly` cookies so JavaScript cannot read them.
- `SameSite=Lax` cookies protect against most cross-site request attacks.
- In production, the frontend should be served by nginx or Traefik behind a reverse proxy.

---

## Production deployment

This template is designed for [Dokploy](https://dokploy.com/) with Docker Compose.
The root `.docker.env.example` file shows the same variable set that Dokploy should provide.
Set these values in Dokploy instead of editing `docker-compose.yml`:

| Variable | What it is |
|----------|------------|
| `COMPOSE_PROJECT_NAME` | Docker Compose project name for the normal app stack |
| `COOKIE_SECRET` | Secret key for signing cookies — use a long random string |
| `DB_PATH` | SQLite path inside the backend container |
| `FRONTEND_ORIGIN` | Public URL of the app, e.g. `https://myapp.example.com` |
| `VITE_BACKEND_URL` | Frontend API base path for the built app; keep it at `/api` |
| `APP_MODE` | `prod` for production, `dev` to enable demo accounts |

Important notes:

- Production requires `APP_MODE=prod`, an HTTPS `FRONTEND_ORIGIN`, and a random `COOKIE_SECRET` with at least 32 characters. Example secrets are rejected in production. For tlfpaas, set the secret in the Secrets UI and choose `Redeploy now`.
- Use a fresh production database. Changing `APP_MODE` does not remove demo accounts already stored in a development database.
- The frontend API base path is still a build-time value. If `VITE_BACKEND_URL` changes, rebuild the frontend image.
- Internal container ports stay fixed at `8080` and `8081`.
- For this template, keep `VITE_BACKEND_URL=/api` in both local Docker testing and production.
- The base `docker-compose.yml` is intentionally platform-safe for `tlfpaas`: it uses `expose`, route labels, and no local-only port publishing.

### Start the Docker stack

With `.docker.env` filled in, this is enough to boot the stack:

```bash
docker compose --env-file .docker.env -f docker-compose.yml up -d --build
```

That starts the frontend and backend containers. It does not add public one-domain routing by itself.

For local same-origin browser testing, the repo also includes `docker-compose.local.yml`, which adds a small gateway service and the local frontend build arg. The visible `make front-docker` and `make test-e2e-docker` commands use that local overlay automatically.

### Recommended production routing

Use one public origin and route by path:

- `/api/*` -> backend
- `/ws` -> backend
- everything else -> frontend

This keeps the production app same-origin, so cookie auth and websocket auth stay simple.

In `tlfpaas`, the platform does this routing for you by looking at `tlfpaas.route` labels in the base `docker-compose.yml`.

If nginx or Traefik is on the same Docker network, it can route to:

- `frontend:8080`
- `backend:8081`

### Route roles for other app shapes

- Fullstack app: use `frontend` plus `backend`
- Single-service web app: one service with `tlfpaas.route=web`
- Backend-only public app: one service with `tlfpaas.route=backend`, serving only `/api` and `/ws`
- Worker or bot: no `tlfpaas.route` label

---

## Maintenance review — November 5, 2026

The current React + Vite + aiohttp + SQLite design is still a reasonable starting point for a small school app. Same-origin routing, plain SQL, cookie login, and a single backend process keep the project easy to follow. Larger apps may need a different design; the template does not need to be preserved.

The update uses these stable versions:

| Tool or library | Version |
|---|---|
| React / React DOM | 19.3.1 |
| React Router | 7.18.5 |
| Vite / React plugin | 8.3.6 / 6.2.1 |
| TypeScript / Oxlint | 7.0.2 / 1.91.0 |
| Tailwind CSS | 4.3.4 |
| Vitest / Playwright | 5.1.0 / 1.64.1 |
| aiohttp / aiosqlite | 3.14.5 / 0.22.1 |
| pytest / Ruff | 9.2.0 / 0.17.3 |

All direct libraries were checked against npm or PyPI, and both lock files were refreshed. Unchanged packages such as `argon2-cffi`, `itsdangerous`, and `yoyo-migrations` already use their latest stable releases.

Node 25 was replaced with [Node 26 LTS](https://nodejs.org/en/about/previous-releases). Python 3.14 still receives bug fixes and is supported until October 2030; Python 3.15 is newer but is not required by this template. See the [Python support table](https://devguide.python.org/versions/). Docker also uses uv 0.13.7, nginx 1.30.6 (stable), and Caddy 2.11.8, the latest [published official Docker version](https://raw.githubusercontent.com/docker-library/official-images/master/library/caddy) at review time. Use `docker compose build --pull` when refreshing base-image patches.

The review also fixed invalid JSON returning 500, missing/other users' note updates returning 500, startup with a new database directory, weak example secrets in production, unhandled browser errors, WebSocket cleanup during React StrictMode, and the service worker returning app HTML for API navigation. Generated JavaScript config copies were removed so the TypeScript configs are the source of truth. The old local Claude preview file with stale ports was removed from the template; generate a local preview file from `.agent.env` when needed. Local secrets and agent files are excluded from the Docker build context.

The `glob` override in `frontend/package.json` selects 14.0.3 for Workbox's build-time file scan. The older dependency has a [cancellation issue](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4). Remove this override once Workbox itself requires a fixed version and the build still passes.

One known dependency issue remains: [`deepmerge` has a low-severity advisory and no patched release](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). It is used by the PWA build tool through Workbox/Rollup. npm may count several parent packages for this one issue. Do not feed untrusted configuration into build tools; check for an upstream fix during future updates.

Validation passed: `make test` (75 backend tests, 28 frontend unit tests, 7 browser tests, Ruff, Oxlint, and the production build) and `make test-e2e-docker` (9 browser tests). A live browser check covered login, note creation/edit/delete, WebSocket connection, and logout with no unexpected console or network errors. npm reported no outdated direct packages; the production npm audit and Python production audit found no known vulnerabilities.

A second pass replaced string app/request keys with typed aiohttp keys in `backend/app_keys.py` (no more `NotAppKeyWarning`), made the browser refresh the short-lived login cookie automatically and repeat the request once, removed expired refresh sessions on login, compared refresh-token hashes in constant time, kept one broken WebSocket from failing a note save, type-checked frontend unit tests during the build, removed unused helpers, and stopped tracking the ignored `.idea/` folder.

A third pass added the required `ADMIN_PASSWORD` admin account, the tlfpaas deploy guide, setup through "Use this template", generated PNG/ICO icons from `frontend/public/icon.svg` (`npm run icons`), a 404 page, React 19 `useActionState` forms, a shared Playwright MCP config in `.mcp.json`, and rules for storing uploads as SQLite BLOBs.

Before turning this into a public app, decide how real users will sign up, add login rate limits, and choose the required session revocation rules. The current signed access cookie lasts up to two hours, and logout does not revoke a copied access cookie or other open WebSocket connections. The in-memory WebSocket hub assumes one backend process. Offline mode caches the app shell; it does not save notes without a server connection. These are application decisions to revisit as real features replace the demo.
