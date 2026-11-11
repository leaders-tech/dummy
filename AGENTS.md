# Template PWA Agent Notes

## Template lifecycle

- This repository is a starter template, not the user's finished application. Nothing from the template must be preserved for its own sake.
- Replace or remove any starter code, demo feature, page, styling, branding, schema, dependency, tool, or documentation when the user's application needs something else.
- The rules below describe the current starting point. They do not require keeping template features or architecture after the user asks to change them.
- Once the user starts requesting application features, update every affected `AGENTS.md` in the same change. Keep a concrete inventory of what is still template material and what is now the user's application, using file paths or feature names.
- Review that inventory after each feature request. Move adapted or replaced parts into the application inventory and remove stale template instructions. Do not describe the user's completed features as demos.
- When no template material remains, remove all template-specific instructions, inventories, and template wording from every `AGENTS.md`. Keep useful application instructions and describe only the user's application.

## Current ownership

- Remaining template: the entire repository, including demo login/admin accounts, notes, pages, branding, PWA assets, migrations, tests, development helpers, and deployment examples.
- User application: none yet. Dependency maintenance and template instruction updates do not turn the starter into a user application.

## Working defaults

- The main user of this template is a school student who does not understand the technology deeply yet.
- Keep the template small and easy to read.
- Prefer the simplest working design over clever abstractions.
- Prefer explicit functions, explicit SQL, and explicit routes.
- Do not add heavy frameworks or hidden magic.
- Keep the current simplified web model unless the user asks for an architecture change:
  - production is same-origin behind nginx or Traefik;
  - dev-only CORS is for localhost splits;
  - browser API calls stay POST-based for this template.
- Keep production routing path-based for this template:
  - JSON endpoints live under `/api/...`;
  - websocket stays at `/ws`;
  - reverse proxy should send `/api` and `/ws` to backend and everything else to frontend.
- Keep all user-facing text in simple English.
- When adding backend DB code, place SQL only under `backend/db`.
- When adding frontend pages, keep routing and auth flow direct and beginner-friendly.
- Cover new behavior densely with tests: backend unit tests, frontend unit tests, and Playwright e2e tests where the
  feature crosses the browser boundary.
- Before calling any task done, run the full test suite (`make test`) and make sure every test passes.
  If a test breaks, fix it — do not skip or delete it.
- For auth, routing, cookies, WebSockets, startup, and other browser-sensitive flows, do not stop at tests. Also verify
  the real running app in a live browser session.
- After frontend, auth, routing, cookie, or WebSocket changes, verify the result in a live browser session, not only
  with tests.
- During that live check, look for browser console errors, failed network requests, cookie problems, and broken
  redirects before calling the task done.
- When local dev servers are already running, prefer checking the real dev app first and use tests as a second line of
  verification.
- For live checks, use the Playwright MCP server from the root `.mcp.json` (Claude Code and other MCP clients load it).
  Point it at the hidden agent runtime (`make aback` + `make afront`, URL from `.agent.env`). Use `make abrowser` for
  repeatable scripted checks. If the MCP browser cannot start, the student may need Google Chrome installed.
- The app icon lives in `frontend/public/icon.svg`. Once the student's app idea is clear, follow
  `frontend/icon/AGENTS.md` to draw a matching icon and regenerate favicon and phone icons.
- Every source file should start with a short plain-English header comment or docstring that explains what the file
  does.
- That file header should also say when the file should be edited, and whether it can be copied as a starting point for
  adding a new table, endpoint, page, test, or similar feature.
- Use module docstrings for Python files.
- Use short top-of-file comments for TS, TSX, JS, CJS, CSS, HTML, env examples, TOML, and the Makefile when the file
  format allows comments.
- If the file format does not support comments cleanly, skip the header instead of breaking the file.
- Keep every file header short. Answer only: what this file does, when to edit it, and when to copy it.
- When a student adds a new feature, prefer the pattern: route -> db/helper file -> page/component -> unit tests ->
  e2e test if the browser flow changed.
- Extend an existing file only when the new code belongs to the same small feature block. Start a sibling file when the
  new code would make the old file feel crowded or mixed.
- Add Python packages with `uv add` for runtime deps and `uv add --dev` for dev-only deps.
- Add frontend packages with `npm install` for runtime deps and `npm install -D` for dev-only deps.
- Do not edit dependency lists by hand unless there is a strong reason and it is explained.
- Student-facing configuration belongs only in the root `.env` and `.docker.env` files.
- Do not add new user-tuned ports, URLs, secrets, modes, or project names to `Makefile`, compose files, Playwright configs, or Dockerfiles.
- Hidden agent-only configuration belongs in the root `.agent.env` file.
- Treat `.claude/launch.json` as a local generated preview file. If needed, generate it from `.agent.env` and use the hidden runtime commands; do not commit a second set of ports or URLs.
- When normal human local ports are busy, prefer the hidden agent runtime instead of changing the student-facing commands.
- Hidden agent runtime commands:
  - `make aback`, `make aback-once`, `make afront`, `make aopen`, `make astop`, `make aclean`
  - `make abrowser SCRIPT=path/to/scenario.mjs`
  - `make alogin USER=user PASS=user`
  - `make apost API_PATH=/api/... BODY='{}'`
  - `make ahealth`, `make asql SQL='select ...'`, `make adb-path`
- `aback` and `aback-once` must always recreate the hidden agent DB from the normal local DB before startup.
- Hidden agent runtime files live under `.agent/`.
- Keep `.docker.env` as the Docker config filename for this repo. Do not rename it to `.env.docker` unless the user explicitly asks.
- Keep the base `docker-compose.yml` platform-safe for `tlfpaas`:
  - no `ports:`
  - no local-only `build.args`
  - no Compose `user:`
  - no external networks or volumes
  - route-target services use `tlfpaas.route`
- Keep local Docker-only browser behavior in `docker-compose.local.yml`, not in the base compose file.
- Keep `frontend` on exposed port `8080`, `backend` on exposed port `8081`, backend APIs under `/api/...`, and WebSocket
  under `/ws` unless the routing model is intentionally changed everywhere.
- Keep runtime Docker images non-root by using `USER` in the final Dockerfile stage, not by adding Compose `user:`.
- Treat `COOKIE_SECRET` in `.docker.env.example` as a local placeholder only; real production secrets belong in the
  tlfpaas Secrets UI and require `Redeploy now`.
- Before changing Docker artefacts, read `docs/tlfpaas-autodeploy.md`.
- Keep LAN dev mode intentionally simple: prefer the explicit macOS Wi-Fi `en0` helper over generic network auto-detection.
- Keep LAN ports separate from the default localhost ports unless the user asks otherwise.
- Do not expand LAN mode into a multi-interface discovery system unless the user asks for broader network support.

## Deploy (tlfpaas)

- Students deploy with tlfpaas. Every push to GitHub starts a deploy through a GitHub webhook. There is no separate CI,
  so a push with broken code goes straight to the public app. Always run `make test` before `git push`.
- tlfpaas sets these runtime values itself: `APP_MODE=prod`, `DB_PATH=/data/app.sqlite3`,
  `FRONTEND_ORIGIN=https://<project host>`, `VITE_BACKEND_URL=/api`. Do not commit `.docker.env` to change them.
- Production needs two secrets in the tlfpaas Secrets page (https://deploy.tlfedu.tech/my/projects), followed by
  `Redeploy now`:
  - `COOKIE_SECRET` — a long random string (32+ characters);
  - `ADMIN_PASSWORD` — the password of user `admin` (12+ characters). The backend creates `admin` on startup and resets
    its password when this secret changes.
  The backend refuses to start in prod without good values. Never print, log, or commit secret values.
- Where to look when a deploy fails: the deploy log on the dashboard, runtime logs at https://logs.tlfedu.tech, and
  read-only files (including the SQLite file) at https://files.tlfedu.tech.
- Platform rules for Docker files: https://deploy.tlfedu.tech/guides/docker/agents and `docs/tlfpaas-autodeploy.md`.

