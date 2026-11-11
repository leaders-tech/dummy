"""Persist one named, colored fruit per browser client."""

from __future__ import annotations

import aiosqlite

from backend.db.connection import utc_now_text


async def list_fruits(db: aiosqlite.Connection) -> list[dict[str, object]]:
    cursor = await db.execute("SELECT id, client_id, name, color FROM fruit_users ORDER BY id")
    return [dict(row) for row in await cursor.fetchall()]


async def save_fruit(db: aiosqlite.Connection, client_id: str, name: str, color: str) -> dict[str, object]:
    now = utc_now_text()
    cursor = await db.execute(
        """
        INSERT INTO fruit_users (client_id, name, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(client_id) DO UPDATE SET name=excluded.name, color=excluded.color, updated_at=excluded.updated_at
        RETURNING id, client_id, name, color
        """,
        (client_id, name, color, now, now),
    )
    row = await cursor.fetchone()
    await db.commit()
    return dict(row)
