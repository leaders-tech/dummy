"""Create the main admin account and simple demo data for local development.

Edit this file when the admin account rules or dev-only starter users change.
Copy the small helper style here when you add another startup seed step.
"""

from __future__ import annotations

import aiosqlite

from backend.auth.passwords import hash_password, verify_password
from backend.config import Settings
from backend.db.users import create_user_if_missing, get_user_by_username, set_user_password_and_admin, user_exists

ADMIN_USERNAME = "admin"


async def ensure_admin(db: aiosqlite.Connection, settings: Settings) -> None:
    """Make sure user "admin" exists, is an admin, and uses ADMIN_PASSWORD.

    Changing ADMIN_PASSWORD and restarting the backend resets the admin password.
    Backend unit tests (mode "test") create their own users instead.
    """
    if settings.mode == "test":
        return
    row = await get_user_by_username(db, ADMIN_USERNAME)
    if row is None:
        await create_user_if_missing(db, ADMIN_USERNAME, hash_password(settings.admin_password), True)
        return
    if not row["is_admin"] or not verify_password(row["password_hash"], settings.admin_password):
        await set_user_password_and_admin(db, row["id"], hash_password(settings.admin_password), True)


async def seed_dev_data(db: aiosqlite.Connection, settings: Settings) -> None:
    if settings.mode != "dev":
        return
    if not await user_exists(db, "user"):
        await create_user_if_missing(db, "user", hash_password("user"), False)
