"""Test note endpoint behavior against a temporary backend test database.

Edit this file when note routes or note queries change.
Copy a test pattern here when you add tests for another small CRUD feature.
"""

from __future__ import annotations

import pytest

from backend.tests.conftest import login


@pytest.mark.asyncio
async def test_notes_crud(client, create_user, auth_headers) -> None:
    await create_user("user", "user")
    await login(client, "user", "user", auth_headers)

    save_response = await client.post("/api/notes/save", json={"text": "First note"}, headers=auth_headers)
    assert save_response.status == 200
    note = (await save_response.json())["data"]["note"]

    list_response = await client.post("/api/notes/list", json={})
    assert list_response.status == 200
    listed_notes = (await list_response.json())["data"]["notes"]
    assert listed_notes[0]["text"] == "First note"

    update_response = await client.post("/api/notes/save", json={"id": note["id"], "text": "Updated note"}, headers=auth_headers)
    assert update_response.status == 200
    assert (await update_response.json())["data"]["note"]["text"] == "Updated note"

    delete_response = await client.post("/api/notes/delete", json={"id": note["id"]}, headers=auth_headers)
    assert delete_response.status == 200


@pytest.mark.asyncio
async def test_notes_are_isolated_per_user(client, create_user, auth_headers) -> None:
    await create_user("user", "user")
    await create_user("second", "second")

    await login(client, "user", "user", auth_headers)
    save_response = await client.post("/api/notes/save", json={"text": "Private note"}, headers=auth_headers)
    note_id = (await save_response.json())["data"]["note"]["id"]

    await login(client, "second", "second", auth_headers)

    list_response = await client.post("/api/notes/list", json={})
    listed_notes = (await list_response.json())["data"]["notes"]
    assert listed_notes == []

    delete_response = await client.post("/api/notes/delete", json={"id": note_id}, headers=auth_headers)
    assert delete_response.status == 404


@pytest.mark.asyncio
async def test_cross_user_note_update_does_not_modify_original_note(client, create_user, auth_headers) -> None:
    await create_user("user", "user")
    await create_user("second", "second")

    await login(client, "user", "user", auth_headers)
    save_response = await client.post("/api/notes/save", json={"text": "Owner note"}, headers=auth_headers)
    note = (await save_response.json())["data"]["note"]

    await login(client, "second", "second", auth_headers)
    update_response = await client.post("/api/notes/save", json={"id": note["id"], "text": "Stolen update"}, headers=auth_headers)
    assert update_response.status == 404

    await login(client, "user", "user", auth_headers)
    list_response = await client.post("/api/notes/list", json={})
    listed_notes = (await list_response.json())["data"]["notes"]
    assert listed_notes[0]["text"] == "Owner note"


@pytest.mark.asyncio
async def test_updating_missing_note_does_not_create_it(client, create_user, auth_headers) -> None:
    await create_user("user", "user")
    await login(client, "user", "user", auth_headers)
    response = await client.post("/api/notes/save", json={"id": 999, "text": "Missing"}, headers=auth_headers)
    assert response.status == 404
    listed = await client.post("/api/notes/list", json={})
    assert (await listed.json())["data"]["notes"] == []


@pytest.mark.asyncio
@pytest.mark.parametrize("text", [None, False, 123, [], {}, " "])
async def test_note_text_must_be_a_nonempty_string(client, create_user, auth_headers, text) -> None:
    await create_user("user", "user")
    await login(client, "user", "user", auth_headers)
    response = await client.post("/api/notes/save", json={"text": text}, headers=auth_headers)
    assert response.status == 400


@pytest.mark.asyncio
@pytest.mark.parametrize("route", ["/api/notes/save", "/api/notes/delete"])
@pytest.mark.parametrize("note_id", [True, False, "1", 1.5])
async def test_note_id_must_be_an_integer(client, create_user, auth_headers, route, note_id) -> None:
    await create_user("user", "user")
    await login(client, "user", "user", auth_headers)
    response = await client.post(route, json={"id": note_id, "text": "Test"}, headers=auth_headers)
    assert response.status == 400
