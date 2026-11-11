/*
This file tests the shared browser API helper and its path-based request contract.
Edit this file when API base paths or websocket URL rules change.
Copy this file when you add tests for another small shared browser helper.
*/

import { afterEach, describe, expect, it, vi } from "vitest";

describe("shared api helper", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("prefixes JSON requests with the configured API base path once", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "/api/");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { saved: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { postJson } = await import("./api");
    const data = await postJson<{ saved: boolean }>("/notes/list");

    expect(data).toEqual({ saved: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notes/list",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });

  it("builds websocket URLs from the current page origin and keeps the /ws path", async () => {
    const { getWsUrl } = await import("./api");
    const wsUrl = new URL(getWsUrl());

    expect(wsUrl.host).toBe(window.location.host);
    expect(wsUrl.pathname).toBe("/ws");
    expect(wsUrl.protocol).toBe(window.location.protocol === "https:" ? "wss:" : "ws:");
  });

  it("turns connection failures into a readable ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { postJson, ApiError } = await import("./api");
    await expect(postJson("/notes/list")).rejects.toBeInstanceOf(ApiError);
    await expect(postJson("/notes/list")).rejects.toMatchObject({
      status: 0,
      code: "network_error",
      message: "Could not reach the server. Please try again.",
    });
  });

  it.each([
    ["", "empty_response"],
    ["<html>Gateway error</html>", "invalid_json"],
  ])("reports invalid server responses without a JSON parsing crash", async (body, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 502 })));
    const { postJson } = await import("./api");
    await expect(postJson("/notes/list")).rejects.toMatchObject({ status: 502, code });
  });

  it("refreshes the login cookie once and repeats a request that got 401", async () => {
    const jsonResponse = (status: number, payload: unknown) =>
      new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: { code: "not_authenticated", message: "Login is required." } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { user: { id: 1 } } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { notes: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    const { postJson } = await import("./api");
    await expect(postJson("/notes/list")).resolves.toEqual({ notes: [] });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/notes/list", "/api/auth/refresh", "/api/notes/list"]);
  });

  it("does not try to refresh after a 401 from an auth endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: false, error: { code: "not_authenticated", message: "Login is required." } }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const { postJson } = await import("./api");
    await expect(postJson("/auth/me")).rejects.toMatchObject({ status: 401, code: "not_authenticated" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the original 401 error when the refresh also fails", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(
        async () => new Response(JSON.stringify({ ok: false, error: { code: "not_authenticated", message: "Login is required." } }), { status: 401 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { postJson } = await import("./api");
    await expect(postJson("/notes/list")).rejects.toMatchObject({ status: 401, message: "Login is required." });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
