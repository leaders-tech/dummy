/*
This file tests the shared auth provider and its startup session-loading behavior.
Edit this file when auth bootstrap, login state loading, or shared auth context behavior changes.
Copy this file when you add tests for another shared frontend provider.
*/

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../shared/api";

const { postJson } = vi.hoisted(() => ({
  postJson: vi.fn(),
}));

vi.mock("../shared/api", async () => {
  const actual = await vi.importActual<typeof import("../shared/api")>("../shared/api");
  return {
    ...actual,
    postJson,
  };
});

import { AuthProvider, useAuth } from "./auth";

function AuthStatus() {
  const { loading, user } = useAuth();
  if (loading) {
    return <p>Loading</p>;
  }
  return <p>{user ? user.username : "Anonymous"}</p>;
}

describe("AuthProvider", () => {
  beforeEach(() => postJson.mockReset());

  it("loads the session only once during StrictMode startup", async () => {
    postJson.mockResolvedValueOnce({ user: null });

    render(
      <StrictMode>
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      </StrictMode>,
    );

    await waitFor(() => expect(screen.getByText("Anonymous")).toBeInTheDocument());
    expect(postJson).toHaveBeenCalledTimes(1);
    expect(postJson).toHaveBeenCalledWith("/auth/me");
  });

  it("shows a startup connection error and finishes loading", async () => {
    postJson.mockRejectedValueOnce(new ApiError(0, "network_error", "Could not reach the server. Please try again."));
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server.");
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("shows a refresh server error instead of silently treating it as an expired session", async () => {
    postJson
      .mockRejectedValueOnce(new ApiError(401, "not_authenticated", "Login is required."))
      .mockRejectedValueOnce(new ApiError(503, "server_error", "Server is unavailable."));
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Server is unavailable.");
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("loads the user after refreshing an expired access cookie", async () => {
    postJson
      .mockRejectedValueOnce(new ApiError(401, "not_authenticated", "Login is required."))
      .mockResolvedValueOnce({ user: { username: "user" } })
      .mockResolvedValueOnce({ user: { username: "user" } });
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    expect(await screen.findByText("user")).toBeInTheDocument();
    expect(postJson.mock.calls.map(([path]) => path)).toEqual(["/auth/me", "/auth/refresh", "/auth/me"]);
  });
});
