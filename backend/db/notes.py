"""Store and load note rows for the notes feature.

Edit this file when the notes table or note query behavior changes.
Copy this file as a starting point when you add queries for another table.
"""

from __future__ import annotations

from typing import Any

import aiosqlite

from backend.db.connection import utc_now_text


def row_to_note(row: aiosqlite.Row) -> dict[str, object]:
    return dict(row)


async def list_notes(db: aiosqlite.Connection, user_id: int) -> list[dict[str, Any]]:
    cursor = await db.execute(
        """
        SELECT id, user_id, text, created_at, updated_at
        FROM notes
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user_id,),
    )
    rows = await cursor.fetchall()
    return [row_to_note(row) for row in rows]


async def save_note(db: aiosqlite.Connection, user_id: int, text: str, note_id: int | None = None) -> dict[str, Any] | None:
    now = utc_now_text()
    if note_id is None:
        cursor = await db.execute(
            """
            INSERT INTO notes (user_id, text, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            RETURNING id, user_id, text, created_at, updated_at
            """,
            (user_id, text, now, now),
        )
    else:
        cursor = await db.execute(
            """
            UPDATE notes
            SET text = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
            RETURNING id, user_id, text, created_at, updated_at
            """,
            (text, now, note_id, user_id),
        )
    row = await cursor.fetchone()
    await db.commit()
    if row is None:
        return None
    return row_to_note(row)


async def delete_note(db: aiosqlite.Connection, user_id: int, note_id: int) -> bool:
    cursor = await db.execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id))
    await db.commit()
    return cursor.rowcount > 0
