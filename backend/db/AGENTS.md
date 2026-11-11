# DB Agent Notes

## Template lifecycle and current ownership

- This database layer is a starter template. No demo table, query, seed data, migration example, or helper must be kept merely because it came with the template.
- Replace or remove starter schema and queries as needed for the user's application. Preserve actual user data when changing an application database.
- With every database feature request, update the ownership inventory here and in the root and backend `AGENTS.md` files. Say which tables and modules are still examples and which now belong to the user's application.
- Remaining template: all of `backend/db/` and the example `users`, `refresh_sessions`, and `notes` schema in `backend/migrations/`.
- User application: none yet.
- When no template parts remain, remove all template inventories, wording, and template-only rules here. Keep only instructions for the application database.

## Working defaults

- Keep DB code easy enough for students to trace from route to SQL.
- Every table must be created by yoyo migrations in `backend/migrations`.
- Use `STRICT` tables whenever SQLite allows it.
- Store booleans as `INTEGER CHECK (... IN (0, 1))`.
- Keep queries small, named clearly, and close to the table they work with.
- Prefer explicit `INSERT`, `UPDATE`, `DELETE`, and careful `ON CONFLICT`.
- Add or update tests whenever DB schema or query behavior changes, including success paths and important failure paths.
- After every DB change, run `uv run pytest` and confirm all tests pass before calling the task done.
- Start each DB file with a short simple-English docstring that says what table or query group it owns, when to edit it, and whether it can be copied to add another table or query module.
- Usual pattern for a new table:
  - add a new migration file in `backend/migrations`;
  - add a new query module in `backend/db`;
  - call that module from the matching route file;
  - add backend tests that touch the new table through real routes or helpers.
- Copy an existing table query module when you add another table with CRUD-style queries.
- Extend an existing DB file only when the queries still belong to the same table or helper topic.

## Uploaded files and images

- Store uploaded files inside SQLite as `BLOB`, not as files on disk and never as base64 text. Then the whole app state is
  one SQLite file under `/data` that is easy to back up, download from https://files.tlfedu.tech, and move.
- Use a separate STRICT table, for example `files (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id)
  ON DELETE CASCADE, filename TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, data BLOB NOT NULL,
  created_at TEXT NOT NULL)`. Do not put the BLOB into a busy table like `users` or `notes`; list queries should not
  select `data`.
- Check the size and the content type on the backend before saving. Keep the limit small (a few MB). aiohttp rejects
  request bodies over 1 MiB by default; raise `client_max_size` in `backend/main.py` only as much as needed.
- Serve a file with `GET /api/files/<id>` returning the bytes with its `Content-Type`, so `<img src>` works. This GET
  route is the allowed exception to the POST-only JSON rule. Check that the logged-in user may see the file.
- Upload with a `multipart/form-data` POST (`request.multipart()` in aiohttp) and test both a good upload and a
  too-large or wrong-type upload.

