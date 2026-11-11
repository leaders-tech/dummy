"""Create the shared fruit room table."""

from yoyo import step

steps = [step(
    """
    CREATE TABLE fruit_users (
        id INTEGER PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    ) STRICT
    """,
    "DROP TABLE fruit_users",
)]
