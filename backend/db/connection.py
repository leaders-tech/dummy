"""Open SQLite connections and provide a small UTC time helper.

Edit this file when DB connection setup, PRAGMA values, or shared time helpers change.
Copy the helper style here when you add another small DB-wide utility.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import aiosqlite


def utc_now_text() -> str:
    return datetime.now(tz=UTC).isoformat(timespec="seconds")


async def open_db(path: Path) -> aiosqlite.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON;")
    await db.execute("PRAGMA journal_mode = WAL;")
    await db.commit()
    return db
