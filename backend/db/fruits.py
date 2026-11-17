"""Persist one named, colored fruit per browser client."""

from __future__ import annotations

import aiosqlite
import random
from datetime import UTC, datetime

from backend.db.connection import utc_now_text


async def list_fruits(db: aiosqlite.Connection) -> list[dict[str, object]]:
    cursor = await db.execute("SELECT id, client_id, name, color, health, x, y FROM fruit_users ORDER BY id")
    return [dict(row) for row in await cursor.fetchall()]


async def save_fruit(db: aiosqlite.Connection, client_id: str, name: str, color: str) -> dict[str, object]:
    now = utc_now_text()
    cursor = await db.execute(
        """
        INSERT INTO fruit_users (client_id, name, color, created_at, updated_at, health, x, y, shot_date)
        VALUES (?, ?, ?, ?, ?, 100, ?, ?, '')
        ON CONFLICT(client_id) DO UPDATE SET name=excluded.name, color=excluded.color, updated_at=excluded.updated_at
        RETURNING id, client_id, name, color, health, x, y
        """,
        (client_id, name, color, now, now),
    )
    row = await cursor.fetchone()
    await db.commit()
    return dict(row)


async def shoot_fruit(db: aiosqlite.Connection, shooter_client_id: str, target_id: int) -> tuple[dict[str, object], int] | None:
    today = datetime.now(tz=UTC).date().isoformat()
    cursor = await db.execute("SELECT id, shots_today, shot_date FROM fruit_users WHERE client_id = ?", (shooter_client_id,))
    shooter = await cursor.fetchone()
    if shooter is None:
        return None
    shots = shooter["shots_today"] if shooter["shot_date"] == today else 0
    if shots >= 10:
        return {"limited": True}, 0
    cursor = await db.execute("SELECT id, health, x, y FROM fruit_users WHERE id = ?", (target_id,))
    target = await cursor.fetchone()
    if target is None or target["id"] == shooter["id"]:
        return None
    health = max(0, target["health"] - 20)
    x = max(4, min(96, target["x"] + random.choice((-1, 1)) * random.uniform(8, 16)))
    y = max(8, min(84, target["y"] + random.choice((-1, 1)) * random.uniform(5, 12)))
    await db.execute("UPDATE fruit_users SET health=?, x=?, y=? WHERE id=?", (health, x, y, target_id))
    await db.execute("UPDATE fruit_users SET shots_today=?, shot_date=? WHERE id=?", (shots + 1, today, shooter["id"]))
    await db.commit()
    return {"limited": False}, 10 - shots - 1
