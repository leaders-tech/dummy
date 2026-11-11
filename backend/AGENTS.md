# Backend Agent Notes

## Template lifecycle and current ownership

- This backend is starter template material. None of its code, demo behavior, tables, routes, dependencies, or architecture must be preserved for its own sake.
- Replace or remove starter parts as the user's requested application takes shape. The defaults below apply until the user needs a different design.
- With every application feature request, update this file and the root `AGENTS.md` to identify remaining template parts and actual user application parts. Update `backend/db/AGENTS.md` too when database ownership changes.
- Remaining template: all of `backend/`, including auth, demo users, notes, admin endpoints, WebSocket examples, migrations, and tests.
- User application: none yet.
- When the transition is complete, remove template inventories and all template-specific wording and instructions here; retain only instructions for the user's backend.

## Working defaults

- This backend is for students, so code should be obvious on first reading.
- Use `aiohttp`, plain functions, and small modules.
- Keep all SQLite access inside `backend/db`.
- Store uploaded files and images as SQLite `BLOB`s, as described in `backend/db/AGENTS.md`.
- The `admin` user is created and kept in sync with `ADMIN_PASSWORD` by `ensure_admin` in `backend/db/seed.py`.
- Store timestamps as UTC ISO strings and convert explicitly in Python.
- Use `STRICT` tables, `foreign_keys = ON`, and `journal_mode = WAL`.
- Return only the shared JSON envelope shape.
- Store shared app or request objects with the typed keys from `backend/app_keys.py` (`request.app[DB]`), not with plain string keys.
- Keep production same-origin for this template. Do not add cross-origin production CORS unless the architecture changes.
- Keep browser-facing JSON endpoints as POST routes in this template unless the user explicitly changes that rule.
- Keep browser-facing JSON endpoints under `/api/...` and keep websocket at `/ws` unless the user explicitly changes the routing model.
- In Docker/tlfpaas, keep the backend listening on `0.0.0.0:8081`.
- Persistent writable backend data belongs under `/data`, currently `/data/app.sqlite3`, backed by the `sqlite_data`
  named volume.
- Keep `backend/Dockerfile` final runtime stage non-root with `USER app`; do not add Compose `user:` to solve runtime
  permissions.
- Hidden backend agent commands:
  - `make aback`, `make aback-once`, `make astop`
  - `make alogin USER=user PASS=user`
  - `make apost API_PATH=/api/... BODY='{}'`
  - `make ahealth`, `make asql SQL='select ...'`, `make adb-path`
- Hidden backend agent runtime reads `.agent.env` and always uses a copied DB under `.agent/` instead of the student DB directly.
- Do not introduce ORM, DI, pydantic, or generic service layers.
- Add backend tests for each new endpoint, auth rule, DB branch, and error path that matters.
- After every change, run `uv run pytest` and make sure all tests pass before calling the task done.
- Do not skip or delete a failing test — fix the code or update the test to match the new correct behavior.
- If a backend change affects browser behavior, make sure frontend/e2e coverage exists too.
- Start each backend source file with a short simple-English docstring that says what the file does, when to edit it, and whether it can be copied for a similar backend feature.
- Normal backend growth pattern:
  - add or update a DB query module in `backend/db`;
  - add or update the route handler file;
  - register the route in `setup_*_routes`;
  - add backend tests;
  - add frontend and e2e coverage if the browser flow changed.
- Add a new backend file when the new block is a different feature group, a different table, or a different route group.
- Extend an existing backend file only when the new function clearly belongs to the same small topic.
- New table pattern:
  - create a new migration file;
  - create a new `backend/db/<table>.py` query module or extend the right one if the table already exists;
  - wire it into a route file;
  - test both success and important failure paths.
- Add backend Python packages with `uv add` for runtime deps and `uv add --dev` for dev-only deps.
