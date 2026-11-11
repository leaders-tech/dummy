"""Name the shared objects stored on the aiohttp app and on each request.

Edit this file when the backend needs another shared object, such as a new client or cache.
Copy one line here when you add another app-wide or request-wide value.
"""

from __future__ import annotations

from typing import Any

import aiosqlite
from aiohttp import web

from backend.config import Settings
from backend.ws.hub import WebSocketHub

# Use them like `request.app[DB]` instead of `request.app["db"]`. aiohttp then knows the type of each value.
SETTINGS = web.AppKey("settings", Settings)
DB = web.AppKey("db", aiosqlite.Connection)
WS_HUB = web.AppKey("ws_hub", WebSocketHub)
CURRENT_USER = web.RequestKey("current_user", dict[str, Any])
