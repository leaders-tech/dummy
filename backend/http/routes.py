"""Handle non-auth JSON endpoints such as health, notes, and admin user list.

Edit this file when app endpoints outside the auth and websocket groups change.
Copy the route pattern here when you add another endpoint group backed by backend/db code.
"""

from __future__ import annotations

from aiohttp import web

from backend.app_keys import DB, WS_HUB
from backend.auth.access import require_admin, require_user
from backend.db.notes import delete_note, list_notes, save_note
from backend.db.users import list_users
from backend.db.fruits import list_fruits, save_fruit
from backend.http.json_api import AppError, ok, read_json
from backend.http.middleware import require_allowed_origin


async def health(request: web.Request) -> web.Response:
    return ok({"status": "ok"})


async def fruits_list(request: web.Request) -> web.Response:
    return ok({"fruits": await list_fruits(request.app[DB])})


async def fruits_save(request: web.Request) -> web.Response:
    require_allowed_origin(request)
    payload = await read_json(request)
    client_id = payload.get("client_id")
    name = payload.get("name")
    color = payload.get("color")
    if not isinstance(client_id, str) or not client_id.strip() or len(client_id) > 80:
        raise AppError(400, "bad_request", "A client id is required.")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 24:
        raise AppError(400, "bad_request", "A name of 1-24 characters is required.")
    if not isinstance(color, str) or not color.startswith("#") or len(color) != 7:
        raise AppError(400, "bad_request", "Choose a valid color.")
    fruit = await save_fruit(request.app[DB], client_id.strip(), name.strip(), color)
    return ok({"fruit": fruit, "fruits": await list_fruits(request.app[DB])})


async def notes_list(request: web.Request) -> web.Response:
    user = require_user(request)
    notes = await list_notes(request.app[DB], user["id"])
    return ok({"notes": notes})


async def notes_save(request: web.Request) -> web.Response:
    require_allowed_origin(request)
    user = require_user(request)
    payload = await read_json(request)
    note_id = payload.get("id")
    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        raise AppError(400, "bad_request", "Note text is required.")
    if note_id is not None and type(note_id) is not int:
        raise AppError(400, "bad_request", "Note id must be an integer.")
    note = await save_note(request.app[DB], user["id"], text.strip(), note_id)
    if note is None:
        raise AppError(404, "not_found", "Note does not exist.")
    await request.app[WS_HUB].send_to_user(user["id"], {"type": "notes.changed", "note": note})
    return ok({"note": note})


async def notes_delete(request: web.Request) -> web.Response:
    require_allowed_origin(request)
    user = require_user(request)
    payload = await read_json(request)
    note_id = payload.get("id")
    if type(note_id) is not int:
        raise AppError(400, "bad_request", "Note id must be an integer.")
    deleted = await delete_note(request.app[DB], user["id"], note_id)
    if not deleted:
        raise AppError(404, "not_found", "Note does not exist.")
    await request.app[WS_HUB].send_to_user(user["id"], {"type": "notes.changed", "note_id": note_id})
    return ok({"deleted": True, "id": note_id})


async def admin_users_list(request: web.Request) -> web.Response:
    require_admin(request)
    users = await list_users(request.app[DB])
    return ok({"users": users})


def setup_api_routes(app: web.Application) -> None:
    app.router.add_get("/api/health", health)
    app.router.add_post("/api/fruits/list", fruits_list)
    app.router.add_post("/api/fruits/save", fruits_save)
    app.router.add_post("/api/notes/list", notes_list)
    app.router.add_post("/api/notes/save", notes_save)
    app.router.add_post("/api/notes/delete", notes_delete)
    app.router.add_post("/api/admin/users/list", admin_users_list)
