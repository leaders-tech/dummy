"""Test websocket auth rules and websocket error handling.

Edit this file when websocket auth, message parsing, or websocket replies change.
Copy a test pattern here when you add tests for another realtime feature.
"""

from __future__ import annotations

import pytest
from aiohttp import WSMsgType, WSServerHandshakeError

from backend.tests.conftest import login
from backend.ws.hub import WebSocketHub


@pytest.mark.asyncio
async def test_websocket_requires_login(client) -> None:
    with pytest.raises(WSServerHandshakeError) as error:
        await client.ws_connect("/ws")
    assert error.value.status == 401


@pytest.mark.asyncio
async def test_websocket_rejects_wrong_origin(client, create_user, auth_headers) -> None:
    await create_user("user", "user")
    await login(client, "user", "user", auth_headers)

    with pytest.raises(WSServerHandshakeError) as error:
        await client.ws_connect("/ws", headers={"Origin": "http://evil.example"})
    assert error.value.status == 403


@pytest.mark.asyncio
async def test_websocket_bad_message_returns_json_error(client, create_user, auth_headers) -> None:
    await create_user("user", "user")
    await login(client, "user", "user", auth_headers)

    ws = await client.ws_connect("/ws")
    ready_message = await ws.receive_json()
    assert ready_message["type"] == "ws.ready"

    await ws.send_str("[]")
    error_message = await ws.receive_json()
    assert error_message == {"type": "error", "code": "bad_request", "message": "WebSocket message must be an object."}

    await ws.send_str('{"type":"ping"}')
    pong_message = await ws.receive_json()
    assert pong_message == {"type": "pong"}

    await ws.close()
    closed_message = await ws.receive()
    assert closed_message.type in {WSMsgType.CLOSE, WSMsgType.CLOSED, WSMsgType.CLOSING}


class BrokenSocket:
    closed = False

    async def send_json(self, message: dict[str, object]) -> None:
        raise ConnectionResetError("browser went away")


class GoodSocket:
    closed = False

    def __init__(self) -> None:
        self.messages: list[dict[str, object]] = []

    async def send_json(self, message: dict[str, object]) -> None:
        self.messages.append(message)


@pytest.mark.asyncio
async def test_hub_skips_broken_socket_and_still_sends_to_others() -> None:
    hub = WebSocketHub()
    broken = BrokenSocket()
    good = GoodSocket()
    hub.add(1, broken)
    hub.add(1, good)

    await hub.send_to_user(1, {"type": "notes.changed"})

    assert good.messages == [{"type": "notes.changed"}]
    assert hub.count_for_user(1) == 1
