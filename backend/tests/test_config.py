"""Test startup paths, production settings, the admin account, and development-only seed data.

Edit when startup or environment validation changes. Copy for another startup rule.
"""

from dataclasses import replace

import pytest

from backend.app_keys import DB
from backend.auth.passwords import verify_password
from backend.config import validate_settings
from backend.db.seed import ensure_admin
from backend.db.users import get_user_by_username, list_users
from backend.main import create_app, on_cleanup, on_startup

STRONG_ADMIN_PASSWORD = "a-long-admin-password"


@pytest.mark.parametrize(
    "secret", ["change-this-secret", "local-docker-secret", "agent-secret", "playwright-secret", "playwright-docker-secret", "", "short", " " * 32]
)
def test_prod_rejects_placeholder_or_short_secrets(test_settings, secret) -> None:
    settings = replace(test_settings, mode="prod", cookie_secret=secret, frontend_origin="https://school.example")
    with pytest.raises(ValueError, match="COOKIE_SECRET"):
        validate_settings(settings)


def test_prod_requires_https(test_settings) -> None:
    settings = replace(test_settings, mode="prod", cookie_secret="a-long-random-production-secret-for-tests", admin_password=STRONG_ADMIN_PASSWORD)
    with pytest.raises(ValueError, match="https"):
        validate_settings(settings)


@pytest.mark.parametrize("password", ["admin", "", "   ", "short-pass", "local-docker-admin", "playwright-admin"])
def test_prod_rejects_missing_or_weak_admin_password(test_settings, password) -> None:
    settings = replace(
        test_settings,
        mode="prod",
        cookie_secret="a-long-random-production-secret-for-tests",
        frontend_origin="https://school.example",
        admin_password=password,
    )
    with pytest.raises(ValueError, match="ADMIN_PASSWORD"):
        validate_settings(settings)


def test_unknown_mode_is_rejected(test_settings) -> None:
    with pytest.raises(ValueError, match="APP_MODE"):
        validate_settings(replace(test_settings, mode="production"))


@pytest.mark.asyncio
async def test_prod_starts_with_nested_database_and_only_the_admin(test_settings, tmp_path) -> None:
    settings = replace(
        test_settings,
        mode="prod",
        db_path=tmp_path / "new" / "nested" / "app.sqlite3",
        cookie_secret="a-long-random-production-secret-for-tests",
        frontend_origin="https://school.example",
        admin_password=STRONG_ADMIN_PASSWORD,
    )
    app = create_app(settings)
    try:
        await on_startup(app)
        assert settings.db_path.exists()
        users = await list_users(app[DB])
        assert [(user["username"], user["is_admin"]) for user in users] == [("admin", True)]
    finally:
        await on_cleanup(app)


@pytest.mark.asyncio
async def test_admin_password_and_role_are_synced_on_startup(test_settings) -> None:
    settings = replace(test_settings, mode="dev", admin_password="first-password")
    app = create_app(settings)
    try:
        await on_startup(app)
        db = app[DB]
        await db.execute("UPDATE users SET is_admin = 0 WHERE username = 'admin'")
        await db.commit()

        await ensure_admin(db, replace(settings, admin_password="second-password"))

        admin = await get_user_by_username(db, "admin")
        assert admin is not None
        assert admin["is_admin"] == 1
        assert verify_password(admin["password_hash"], "second-password") is True
        assert verify_password(admin["password_hash"], "first-password") is False
    finally:
        await on_cleanup(app)


@pytest.mark.asyncio
async def test_unchanged_admin_password_is_not_rehashed(test_settings, monkeypatch) -> None:
    settings = replace(test_settings, mode="dev")
    app = create_app(settings)
    try:
        await on_startup(app)
        monkeypatch.setattr("backend.db.seed.hash_password", lambda password: pytest.fail("admin password should not be rehashed"))
        await ensure_admin(app[DB], settings)
    finally:
        await on_cleanup(app)
