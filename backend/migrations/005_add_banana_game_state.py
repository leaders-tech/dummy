"""Add health, positions, and daily shot counters to the shared banana room."""

from yoyo import step

steps = [
    step("ALTER TABLE fruit_users ADD COLUMN health INTEGER NOT NULL DEFAULT 100", "ALTER TABLE fruit_users DROP COLUMN health"),
    step("ALTER TABLE fruit_users ADD COLUMN x REAL NOT NULL DEFAULT 50", "ALTER TABLE fruit_users DROP COLUMN x"),
    step("ALTER TABLE fruit_users ADD COLUMN y REAL NOT NULL DEFAULT 50", "ALTER TABLE fruit_users DROP COLUMN y"),
    step("ALTER TABLE fruit_users ADD COLUMN shots_today INTEGER NOT NULL DEFAULT 0", "ALTER TABLE fruit_users DROP COLUMN shots_today"),
    step("ALTER TABLE fruit_users ADD COLUMN shot_date TEXT NOT NULL DEFAULT ''", "ALTER TABLE fruit_users DROP COLUMN shot_date"),
]
